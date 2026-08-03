import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";
import { selectPlayerName, selectScore } from "@/store/selectors";
import { useIsAdmin } from "@/hooks/useRequireAdmin";
import { formatMatchDate, formatMatchTime } from "@/utils/date";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import type { AttendanceStatus } from "@/store/types";

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

const TABS: { key: AttendanceStatus; label: string }[] = [
  { key: "confirmado", label: "Confirmados" },
  { key: "duvida", label: "Dúvida" },
  { key: "ausente", label: "Ausentes" },
];

export default function PartidaDetalheScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const match = useAppStore((s) => s.matches.find((m) => m.id === matchId));
  const players = useAppStore((s) => s.players);
  const removeMatch = useAppStore((s) => s.removeMatch);
  const isAdmin = useIsAdmin();
  const [activeTab, setActiveTab] = useState<AttendanceStatus>("confirmado");

  function confirmDelete() {
    if (!match) return;
    Alert.alert("Excluir partida", "Tem certeza que quer excluir esta partida? Essa ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await removeMatch(match.id);
          router.back();
        },
      },
    ]);
  }

  if (!match) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-on-surface-variant">Partida não encontrada.</Text>
      </View>
    );
  }

  const { scoreA, scoreB } = selectScore(match);
  const playersByStatus = players.filter((p) => (match.attendance[p.id] ?? "ausente") === activeTab);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-margin-mobile h-16 bg-surface-container-low">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-2 flex-1">
          <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
          <Text className="font-title-md text-title-md text-on-surface" numberOfLines={1}>
            {match.kind === "sede" ? "Jogo na Sede" : `Amistoso vs ${match.opponent}`}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 48 }}>
        <View className="bg-surface-container-low rounded-xl p-6 gap-4">
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
                <Text className="font-label-sm text-label-sm text-primary uppercase">
                  {match.status.replace("_", " ")}
                </Text>
              </View>
            </View>

            <View className="items-center gap-3 w-1/3">
              <View className="w-16 h-16 rounded-full bg-surface-container-high items-center justify-center border-2 border-secondary/20">
                <MaterialIcons name="shield" size={28} color={colors.secondary} />
              </View>
              <Text className="font-title-md text-title-md text-on-surface text-center">{match.teamB}</Text>
            </View>
          </View>

          <View className="border-t border-outline-variant/20 pt-4 gap-1">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="location-on" size={16} color={colors.onSurfaceVariant} />
              <Text className="font-body-md text-body-md text-on-surface-variant">{match.location}</Text>
            </View>
            <Text className="font-label-sm text-label-sm text-on-surface-variant">
              {formatMatchDate(match.scheduledAt)} · {formatMatchTime(match.scheduledAt)}
            </Text>
          </View>
        </View>

        {isAdmin && (
          <View className="gap-3">
            <Pressable
              onPress={() => router.push(`/partida/${match.id}/juiz`)}
              className="flex-row items-center justify-center gap-2 bg-primary-container py-3 rounded-full active:opacity-80"
            >
              <MaterialIcons name="edit" size={18} color={colors.onPrimaryContainer} />
              <Text className="font-title-md text-title-md text-on-primary-container">Abrir Modo Juiz</Text>
            </Pressable>

            {match.status !== "encerrada" && (
              <Pressable
                onPress={confirmDelete}
                className="flex-row items-center justify-center gap-2 border border-error py-3 rounded-full active:opacity-80"
              >
                <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                <Text className="font-title-md text-title-md text-error">Excluir Partida</Text>
              </Pressable>
            )}
          </View>
        )}

        <View className="gap-4">
          <Text className="font-title-md text-title-md text-on-surface">Eventos da Partida</Text>
          {match.events.length === 0 ? (
            <Text className="font-body-md text-body-md text-on-surface-variant">Nenhum evento ainda.</Text>
          ) : (
            <View className="gap-2">
              {match.events.map((event) => (
                <View
                  key={event.id}
                  className={`gap-1 bg-surface-container-low p-4 rounded-xl border-l-4 ${
                    event.side === "A" ? "border-primary" : "border-secondary"
                  }`}
                >
                  <Text className="font-title-md text-title-md text-on-surface">
                    {event.minute}' — Gol de {selectPlayerName(players, event.scorerId)}
                  </Text>
                  <Text className="font-label-sm text-label-sm text-on-surface-variant">
                    {SHOT_ZONE_LABEL[event.shotZone]} · {FINISH_TYPE_LABEL[event.finishType]}
                    {event.assistPlayerId ? ` · Assist. ${selectPlayerName(players, event.assistPlayerId)}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="gap-4">
          <View className="flex-row bg-surface-container rounded-xl p-1">
            {TABS.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 items-center rounded-lg ${activeTab === tab.key ? "bg-primary-container" : ""}`}
              >
                <Text
                  className={`font-label-sm text-label-sm ${
                    activeTab === tab.key ? "text-on-primary-container" : "text-on-surface-variant"
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="gap-3">
            {playersByStatus.length === 0 ? (
              <Text className="font-body-md text-body-md text-on-surface-variant">Ninguém aqui ainda.</Text>
            ) : (
              playersByStatus.map((player) => (
                <View
                  key={player.id}
                  className={`flex-row items-center gap-4 p-4 bg-surface-container rounded-lg border-l-4 ${
                    activeTab === "confirmado"
                      ? "border-primary"
                      : activeTab === "duvida"
                        ? "border-outline"
                        : "border-secondary-container"
                  }`}
                >
                  <PlayerAvatar uri={player.avatarUrl} size={40} />
                  <View className="flex-1">
                    <Text className="font-title-md text-title-md text-on-surface">{player.name}</Text>
                    {player.position && (
                      <Text className="font-label-sm text-label-sm text-on-surface-variant">{player.position}</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
