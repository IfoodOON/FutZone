import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TopAppBar } from "@/components/TopAppBar";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";

const FILTERS = ["Geral", "Ano", "Mês"];

export default function ArtilhariaScreen() {
  const [filter, setFilter] = useState("Geral");
  const players = useAppStore((s) => s.players);
  const matches = useAppStore((s) => s.matches);

  const scorers = players
    .map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      avatarUrl: p.avatarUrl,
      goals: matches.reduce((sum, m) => sum + m.events.filter((e) => e.scorerId === p.id).length, 0),
    }))
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals);

  const [first, second, third, ...rest] = scorers;

  return (
    <View className="flex-1 bg-background">
      <TopAppBar />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View className="flex-row gap-2 mb-8">
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`px-md py-2 rounded-full border ${
                filter === f ? "bg-primary-container border-primary-container" : "border-outline"
              }`}
            >
              <Text
                className={`font-label-sm text-label-sm ${
                  filter === f ? "text-on-primary-container" : "text-on-surface"
                }`}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mb-6">
          <Text className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Artilharia</Text>
          <Text className="font-body-md text-body-md text-on-surface-variant">
            Quem balançou a rede mais vezes no grupo.
          </Text>
        </View>

        {scorers.length === 0 ? (
          <View className="items-center justify-center py-16 gap-3">
            <MaterialIcons name="sports-soccer" size={40} color={colors.onSurfaceVariant} />
            <Text className="font-body-md text-body-md text-on-surface-variant text-center max-w-[260px]">
              Nenhum gol registrado ainda. Marque os gols no Modo Juiz para o ranking aparecer aqui.
            </Text>
          </View>
        ) : (
          <>
            <View className="flex-row items-end justify-center gap-2 mb-12 h-56 mt-8">
              {second && (
                <View className="items-center w-1/3">
                  <View className="rounded-full border-2 border-silver mb-2">
                    <PlayerAvatar uri={second.avatarUrl} size={64} />
                  </View>
                  <View className="bg-surface-container-high w-full rounded-t-xl h-24 items-center justify-center">
                    <Text className="font-label-sm text-label-sm text-center" numberOfLines={1}>
                      {second.name}
                    </Text>
                    <Text className="font-stat-value text-stat-value text-silver">{second.goals}</Text>
                  </View>
                </View>
              )}

              {first && (
                <View className="items-center w-2/5 -mt-6 z-10">
                  <View className="rounded-full border-4 border-gold mb-2">
                    <PlayerAvatar uri={first.avatarUrl} size={72} />
                    <View className="absolute -top-2 -right-1 bg-surface-container-high rounded-full p-0.5">
                      <MaterialIcons name="workspace-premium" size={18} color={colors.gold} />
                    </View>
                  </View>
                  <View className="bg-primary-container w-full rounded-t-2xl h-32 items-center justify-center">
                    <Text className="font-title-md text-title-md text-on-primary-container text-center" numberOfLines={1}>
                      {first.name}
                    </Text>
                    <Text className="font-display-lg text-display-lg text-on-primary-container">{first.goals}</Text>
                  </View>
                </View>
              )}

              {third && (
                <View className="items-center w-1/3">
                  <View className="rounded-full border-2 border-bronze mb-2">
                    <PlayerAvatar uri={third.avatarUrl} size={64} />
                  </View>
                  <View className="bg-surface-container-high w-full rounded-t-xl h-20 items-center justify-center">
                    <Text className="font-label-sm text-label-sm text-center" numberOfLines={1}>
                      {third.name}
                    </Text>
                    <Text className="font-stat-value text-stat-value text-bronze">{third.goals}</Text>
                  </View>
                </View>
              )}
            </View>

            {rest.length > 0 && (
              <View className="gap-3">
                <View className="flex-row items-center px-4 py-2">
                  <Text className="w-8 font-label-sm text-label-sm text-on-surface-variant uppercase">Pos</Text>
                  <Text className="flex-1 ml-4 font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Jogador
                  </Text>
                  <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Gols</Text>
                </View>
                {rest.map((player, index) => (
                  <View
                    key={player.id}
                    className="flex-row items-center bg-surface-container p-3 rounded-xl border-l-2 border-outline-variant"
                  >
                    <Text className="w-8 font-stat-value text-stat-value text-on-surface-variant">{index + 4}</Text>
                    <View className="flex-1 flex-row items-center ml-4 gap-3">
                      <PlayerAvatar uri={player.avatarUrl} size={40} />
                      <View>
                        <Text className="font-title-md text-sm text-on-surface">{player.name}</Text>
                        {player.position && (
                          <Text className="font-label-sm text-label-sm text-on-surface-variant">{player.position}</Text>
                        )}
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="font-stat-value text-stat-value text-primary">{player.goals}</Text>
                      <Text className="font-label-sm text-[10px] text-on-surface-variant">GOLS</Text>
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
