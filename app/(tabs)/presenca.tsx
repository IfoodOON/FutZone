import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TopAppBar } from "@/components/TopAppBar";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";

const TABS = ["Frequência", "Gols", "Assistências"];

export default function PresencaScreen() {
  const [tab, setTab] = useState("Frequência");
  const players = useAppStore((s) => s.players);
  const matches = useAppStore((s) => s.matches);

  const finishedMatches = matches.filter((m) => m.status === "encerrada");

  const ranking = players
    .map((p) => {
      const games = finishedMatches.filter((m) => m.attendance[p.id] === "confirmado").length;
      const frequency =
        finishedMatches.length > 0 ? `${Math.round((games / finishedMatches.length) * 100)}%` : undefined;
      return { id: p.id, name: p.name, avatarUrl: p.avatarUrl, games, frequency };
    })
    .filter((p) => p.games > 0)
    .sort((a, b) => b.games - a.games);

  const totalPossible = finishedMatches.length * players.length;
  const totalConfirmed = finishedMatches.reduce(
    (sum, m) => sum + Object.values(m.attendance).filter((s) => s === "confirmado").length,
    0
  );
  const averageRate = totalPossible > 0 ? `${Math.round((totalConfirmed / totalPossible) * 100)}%` : "—";

  const [first, second, third, ...rest] = ranking;

  return (
    <View className="flex-1 bg-background">
      <TopAppBar />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View className="flex-row gap-4 mb-6">
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={`px-4 py-2 rounded-full ${tab === t ? "bg-primary-container" : "bg-surface-container"}`}
            >
              <Text
                className={`font-title-md text-sm ${tab === t ? "text-on-primary-container" : "text-on-surface-variant"}`}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        {ranking.length === 0 ? (
          <View className="items-center justify-center py-16 gap-3">
            <MaterialIcons name="event-available" size={40} color={colors.onSurfaceVariant} />
            <Text className="font-body-md text-body-md text-on-surface-variant text-center max-w-[260px]">
              Nenhuma partida encerrada ainda. O ranking de presença aparece aqui depois do primeiro jogo.
            </Text>
          </View>
        ) : (
          <>
            <View className="rounded-3xl p-lg mb-6 bg-surface-container-low">
              <Text className="font-headline-lg-mobile text-headline-lg-mobile text-center mb-6 text-on-surface">
                Elite da Presença
              </Text>
              <View className="flex-row items-end justify-center gap-2 h-56">
                {second && (
                  <View className="items-center w-24">
                    <View className="rounded-full border-2 border-silver mb-2">
                      <PlayerAvatar uri={second.avatarUrl} size={64} />
                    </View>
                    <Text className="font-label-sm text-label-sm text-center mb-1" numberOfLines={1}>
                      {second.name}
                    </Text>
                    <View className="bg-surface-container-high w-full h-24 rounded-t-xl items-center pt-4">
                      <Text className="font-stat-value text-stat-value text-primary">{second.games}</Text>
                      <Text className="text-[10px] uppercase font-bold text-on-surface-variant">Jogos</Text>
                    </View>
                  </View>
                )}

                {first && (
                  <View className="items-center w-28 scale-105">
                    <View className="rounded-full border-4 border-gold mb-2">
                      <PlayerAvatar uri={first.avatarUrl} size={72} />
                      <View className="absolute -top-2 -right-1 bg-surface-container-high rounded-full p-0.5">
                        <MaterialIcons name="workspace-premium" size={18} color={colors.gold} />
                      </View>
                    </View>
                    <Text className="font-label-sm text-label-sm text-center mb-1 font-bold" numberOfLines={1}>
                      {first.name}
                    </Text>
                    <View className="bg-primary-container w-full h-32 rounded-t-xl items-center pt-4">
                      <Text className="font-stat-value text-stat-value text-on-primary-container">{first.games}</Text>
                      <Text className="text-[10px] uppercase font-bold text-on-primary-container opacity-70">
                        Jogos
                      </Text>
                    </View>
                  </View>
                )}

                {third && (
                  <View className="items-center w-24">
                    <View className="rounded-full border-2 border-bronze mb-2">
                      <PlayerAvatar uri={third.avatarUrl} size={64} />
                    </View>
                    <Text className="font-label-sm text-label-sm text-center mb-1" numberOfLines={1}>
                      {third.name}
                    </Text>
                    <View className="bg-surface-container-high w-full h-20 rounded-t-xl items-center pt-4">
                      <Text className="font-stat-value text-stat-value text-primary">{third.games}</Text>
                      <Text className="text-[10px] uppercase font-bold text-on-surface-variant">Jogos</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row gap-4 mb-6">
              <View className="flex-1 bg-surface-container-low rounded-2xl p-4">
                <Text className="text-on-surface-variant font-label-sm text-xs">Média Geral</Text>
                <Text className="text-3xl text-primary font-bold mt-2">{averageRate}</Text>
                <Text className="text-xs text-on-surface-variant mt-1">Presença por partida</Text>
              </View>
              <View className="flex-1 bg-surface-container-low rounded-2xl p-4">
                <Text className="text-on-surface-variant font-label-sm text-xs">Total de Jogos</Text>
                <Text className="text-3xl text-primary font-bold mt-2">{finishedMatches.length}</Text>
                <Text className="text-xs text-on-surface-variant mt-1">Encerrados no grupo</Text>
              </View>
            </View>

            {rest.length > 0 && (
              <View className="gap-3">
                <View className="flex-row items-center justify-between px-2 mb-2">
                  <Text className="font-title-md text-title-md text-on-surface">Ranking Geral</Text>
                </View>
                {rest.map((player, index) => (
                  <View
                    key={player.id}
                    className="bg-surface-container flex-row items-center p-md rounded-xl border-l-2 border-primary"
                  >
                    <Text className="w-8 font-stat-value text-on-surface-variant">{index + 4}</Text>
                    <View className="mr-md">
                      <PlayerAvatar uri={player.avatarUrl} size={40} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-title-md text-sm text-on-surface">{player.name}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-stat-value text-sm text-primary">
                        {player.games} <Text className="text-[10px] text-on-surface-variant font-normal">jogos</Text>
                      </Text>
                      <Text className="text-[10px] text-on-surface-variant font-bold">
                        {player.frequency ?? "—"} frequência
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
