import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";
import { selectPlayerName, selectScore } from "@/store/selectors";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { GoalModal, type GoalSubmitPayload } from "@/components/GoalModal";
import { PlayerAvatar } from "@/components/PlayerAvatar";

const SHOT_ZONE_LABEL: Record<string, string> = {
  meio_campo: "Meio de campo",
  dentro_area: "Dentro da área",
  grande_area: "Grande área",
};

const FINISH_TYPE_LABEL: Record<string, string> = {
  perna_direita: "Perna direita",
  perna_esquerda: "Perna esquerda",
  cabeca: "Cabeça",
  bicicleta: "Bicicleta",
};

export default function JuizScreen() {
  const isAdmin = useRequireAdmin();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const match = useAppStore((s) => s.matches.find((m) => m.id === matchId));
  const players = useAppStore((s) => s.players);
  const addMatchEvent = useAppStore((s) => s.addMatchEvent);
  const removeMatchEvent = useAppStore((s) => s.removeMatchEvent);
  const [modalTeam, setModalTeam] = useState<"A" | "B" | null>(null);

  if (!isAdmin || !match) return null;

  const { scoreA, scoreB } = selectScore(match);

  function handleGoalSubmit(payload: GoalSubmitPayload) {
    if (!modalTeam || !match) return;
    addMatchEvent(match.id, {
      side: modalTeam,
      minute: Math.floor(Math.random() * 45) + 1,
      ...payload,
    });
    setModalTeam(null);
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-margin-mobile h-16 bg-surface-container-low">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-2">
          <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
          <Text className="font-title-md text-title-md text-on-surface">Modo Juiz</Text>
        </Pressable>
        <Text className="font-label-sm text-label-sm text-on-surface-variant">
          {match.teamA} x {match.teamB}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 48 }}>
        <View className="bg-surface-container-low rounded-xl p-6">
          <View className="flex-row items-center justify-between">
            <View className="items-center gap-3 w-1/3">
              <View className="w-16 h-16 rounded-full bg-surface-container-high items-center justify-center border-2 border-primary/20">
                <MaterialIcons name="shield" size={28} color={colors.primary} />
              </View>
              <Text className="font-title-md text-title-md text-on-surface text-center">{match.teamA}</Text>
            </View>

            <View className="items-center gap-1">
              <View className="flex-row items-center gap-4">
                <Text className="font-stat-value text-display-lg text-primary">{scoreA}</Text>
                <Text className="text-on-surface-variant font-display-lg text-display-lg">:</Text>
                <Text className="font-stat-value text-display-lg text-on-surface">{scoreB}</Text>
              </View>
              <View className="bg-surface-container-highest px-3 py-1 rounded-full">
                <Text className="font-label-sm text-label-sm text-primary uppercase">{match.status.replace("_", " ")}</Text>
              </View>
            </View>

            <View className="items-center gap-3 w-1/3">
              <View className="w-16 h-16 rounded-full bg-surface-container-high items-center justify-center border-2 border-secondary/20">
                <MaterialIcons name="shield" size={28} color={colors.secondary} />
              </View>
              <Text className="font-title-md text-title-md text-on-surface text-center">{match.teamB}</Text>
            </View>
          </View>
        </View>

        <View className="gap-4">
          <Text className="font-title-md text-title-md text-on-surface">Registrar Placar</Text>
          <View className="flex-row gap-4">
            <Pressable
              onPress={() => setModalTeam("A")}
              className="flex-1 bg-primary-container h-16 rounded-full items-center justify-center flex-row gap-2 px-2 active:opacity-80"
            >
              <MaterialIcons name="sports-soccer" size={18} color={colors.onPrimaryContainer} />
              <Text
                className="font-title-md text-title-md text-on-primary-container flex-shrink"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Gol · {match.teamA}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setModalTeam("B")}
              className="flex-1 bg-secondary-container h-16 rounded-full items-center justify-center flex-row gap-2 px-2 active:opacity-80"
            >
              <MaterialIcons name="sports-soccer" size={18} color={colors.onSecondaryContainer} />
              <Text
                className="font-title-md text-title-md text-on-secondary-container flex-shrink"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Gol · {match.teamB}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="gap-4">
          <View className="flex-row justify-between items-center">
            <Text className="font-title-md text-title-md text-on-surface">Eventos da Partida</Text>
            <Text className="font-label-sm text-label-sm text-on-surface-variant">{match.events.length} eventos</Text>
          </View>
          <View className="gap-2">
            {match.events.map((event) => (
              <View
                key={event.id}
                className={`gap-2 bg-surface-container-low p-4 rounded-xl border-l-4 ${
                  event.side === "A" ? "border-primary" : "border-secondary"
                }`}
              >
                <View className="flex-row items-center gap-4">
                  <Text
                    className={`font-stat-value text-stat-value w-8 ${
                      event.side === "A" ? "text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {event.minute}'
                  </Text>
                  <View className="bg-surface-container-high p-2 rounded-lg">
                    <MaterialIcons
                      name="sports-soccer"
                      size={18}
                      color={event.side === "A" ? colors.primary : colors.secondary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-title-md text-title-md text-on-surface">
                      Gol de {selectPlayerName(players, event.scorerId)}
                    </Text>
                    <Text className="font-label-sm text-label-sm text-on-surface-variant">
                      {SHOT_ZONE_LABEL[event.shotZone]} · {FINISH_TYPE_LABEL[event.finishType]}
                      {event.assistPlayerId ? ` · Assist. ${selectPlayerName(players, event.assistPlayerId)}` : ""}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeMatchEvent(match.id, event.id)} className="p-2">
                    <MaterialIcons name="delete" size={20} color={colors.onSurfaceVariant} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-4">
          <Text className="font-title-md text-title-md text-on-surface px-1">Elenco</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {players.map((player) => {
              const goals = match.events.filter((e) => e.scorerId === player.id).length;
              return (
                <View key={player.id} className="w-[110px] bg-surface-container-high p-3 rounded-xl">
                  <View className="self-center mb-2">
                    <PlayerAvatar uri={player.avatarUrl} size={48} />
                  </View>
                  <Text className="font-label-sm text-label-sm text-on-surface text-center" numberOfLines={1}>
                    {player.name}
                  </Text>
                  <Text className={`text-[10px] text-center font-bold ${goals > 0 ? "text-primary" : "text-on-surface-variant"}`}>
                    {goals} GOLS
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      <GoalModal
        visible={modalTeam !== null}
        players={players}
        onClose={() => setModalTeam(null)}
        onSubmit={handleGoalSubmit}
      />
    </View>
  );
}
