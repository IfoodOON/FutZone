import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { TopAppBar } from "@/components/TopAppBar";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";
import { selectAttendanceCounts, selectNextMatch } from "@/store/selectors";
import { formatMatchDate, formatMatchTime } from "@/utils/date";
import { positionLabel } from "@/utils/positions";
import type { AttendanceStatus } from "@/store/types";

export default function ProximoJogoScreen() {
  const matches = useAppStore((s) => s.matches);
  const group = useAppStore((s) => s.group);
  const players = useAppStore((s) => s.players);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const setAttendance = useAppStore((s) => s.setAttendance);
  const setMatchPosition = useAppStore((s) => s.setMatchPosition);

  const nextMatch = selectNextMatch(matches);

  if (!nextMatch || !group) {
    return (
      <View className="flex-1 bg-background">
        <TopAppBar />
        <View className="flex-1 items-center justify-center px-margin-mobile">
          <Text className="font-title-md text-title-md text-on-surface-variant text-center">
            Nenhum jogo agendado ainda.
          </Text>
        </View>
      </View>
    );
  }

  const counts = selectAttendanceCounts(nextMatch);
  const total = group.maxPlayers;
  const progress = Math.round((counts.confirmado / total) * 100);
  const myStatus: AttendanceStatus | undefined = nextMatch.attendance[currentUserId];

  const me = players.find((p) => p.id === currentUserId);
  const positionOptions = me
    ? Array.from(new Set([me.position, ...me.secondaryPositions].filter((v): v is string => !!v)))
    : [];
  const myMatchPosition = nextMatch.matchPositions[currentUserId] ?? positionOptions[0];

  return (
    <View className="flex-1 bg-background">
      <TopAppBar />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
        <View className="bg-surface-container-high rounded-xl overflow-hidden">
          <View className="p-6">
            <View className="flex-row justify-between items-start mb-4">
              <View className="bg-primary px-3 py-1 rounded-full">
                <Text className="font-label-sm text-label-sm text-on-primary uppercase tracking-wider">
                  {nextMatch.kind === "sede" ? "PRÓXIMO JOGO" : "AMISTOSO"}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-title-md text-title-md text-primary">{formatMatchDate(nextMatch.scheduledAt)}</Text>
                <Text className="font-body-md text-body-md text-on-surface-variant">{formatMatchTime(nextMatch.scheduledAt)}</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2 mb-2">
              <MaterialIcons name="location-on" size={20} color={colors.primary} />
              <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                {nextMatch.location}
              </Text>
            </View>
            <Text className="font-body-md text-body-md text-on-surface-variant mb-6">{nextMatch.address}</Text>

            <View className="gap-2">
              <View className="flex-row justify-between items-end">
                <Text className="font-title-md text-title-md text-primary">
                  {counts.confirmado}/{total} Confirmados
                </Text>
                <Pressable onPress={() => router.push(`/partida/${nextMatch.id}`)}>
                  <Text className="font-label-sm text-label-sm text-primary underline">Ver detalhes</Text>
                </Pressable>
              </View>
              <View className="w-full bg-surface-container-highest rounded-full h-3">
                <View className="bg-primary h-3 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => setAttendance(nextMatch.id, "confirmado")}
            className={`flex-1 h-24 rounded-xl items-center justify-center gap-2 ${
              myStatus === "confirmado" ? "bg-primary" : "bg-surface-container-high"
            }`}
          >
            <MaterialIcons
              name="check-circle"
              size={22}
              color={myStatus === "confirmado" ? colors.onPrimary : colors.onSurfaceVariant}
            />
            <Text
              className={`font-title-md text-sm ${myStatus === "confirmado" ? "text-on-primary" : "text-on-surface-variant"}`}
            >
              VOU
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setAttendance(nextMatch.id, "duvida")}
            className={`flex-1 h-24 rounded-xl items-center justify-center gap-2 ${
              myStatus === "duvida" ? "bg-outline" : "bg-surface-container-high"
            }`}
          >
            <MaterialIcons
              name="help"
              size={22}
              color={myStatus === "duvida" ? colors.background : colors.onSurfaceVariant}
            />
            <Text
              className={`font-title-md text-sm ${myStatus === "duvida" ? "text-background" : "text-on-surface-variant"}`}
            >
              TALVEZ
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setAttendance(nextMatch.id, "ausente")}
            className={`flex-1 h-24 rounded-xl items-center justify-center gap-2 ${
              myStatus === "ausente" ? "bg-secondary-container" : "bg-surface-container-high"
            }`}
          >
            <MaterialIcons
              name="cancel"
              size={22}
              color={myStatus === "ausente" ? colors.onSecondaryContainer : colors.onSurfaceVariant}
            />
            <Text
              className={`font-title-md text-sm ${myStatus === "ausente" ? "text-on-secondary-container" : "text-on-surface-variant"}`}
            >
              NÃO VOU
            </Text>
          </Pressable>
        </View>

        {myStatus === "confirmado" && positionOptions.length > 0 && (
          <View className="gap-2">
            <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">
              Sua posição nesse jogo
            </Text>
            <View className="flex-row flex-wrap gap-sm">
              {positionOptions.map((value) => {
                const selected = myMatchPosition === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setMatchPosition(nextMatch.id, value)}
                    className={`px-md py-2 rounded-full border ${
                      selected ? "bg-primary-container border-primary-container" : "bg-surface-container-high border-outline-variant"
                    }`}
                  >
                    <Text
                      className={`font-label-sm text-label-sm ${
                        selected ? "text-on-primary-container" : "text-on-surface-variant"
                      }`}
                    >
                      {positionLabel(value)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
