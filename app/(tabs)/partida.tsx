import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { TopAppBar } from "@/components/TopAppBar";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";
import { selectScore } from "@/store/selectors";
import { useIsAdmin } from "@/hooks/useRequireAdmin";
import { formatMatchDate, formatMatchTime } from "@/utils/date";
import type { Match } from "@/store/types";

function MatchRow({ match }: { match: Match }) {
  const { scoreA, scoreB } = selectScore(match);
  const isLive = match.status === "ao_vivo";

  return (
    <Pressable
      onPress={() => router.push(`/partida/${match.id}`)}
      className="bg-surface-container-low rounded-xl p-4 gap-2 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className={`px-2 py-0.5 rounded-full ${match.kind === "sede" ? "bg-primary-container" : "bg-secondary-container"}`}>
            <Text
              className={`font-label-sm text-[10px] uppercase ${
                match.kind === "sede" ? "text-on-primary-container" : "text-on-secondary"
              }`}
            >
              {match.kind === "sede" ? "Sede" : "Amistoso"}
            </Text>
          </View>
          {isLive && (
            <View className="bg-error/20 px-2 py-0.5 rounded-full">
              <Text className="font-label-sm text-[10px] text-error uppercase">Ao vivo</Text>
            </View>
          )}
        </View>
        <Text className="font-label-sm text-label-sm text-on-surface-variant">
          {formatMatchDate(match.scheduledAt)} · {formatMatchTime(match.scheduledAt)}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="font-title-md text-title-md text-on-surface flex-1" numberOfLines={1}>
          {match.teamA} x {match.teamB}
        </Text>
        {match.status !== "agendada" && (
          <Text className="font-stat-value text-stat-value text-primary">
            {scoreA} : {scoreB}
          </Text>
        )}
      </View>

      <Text className="font-label-sm text-label-sm text-on-surface-variant">{match.location}</Text>
    </Pressable>
  );
}

export default function PartidasScreen() {
  const matches = useAppStore((s) => s.matches);
  const isAdmin = useIsAdmin();

  const live = matches.filter((m) => m.status === "ao_vivo");
  const scheduled = matches.filter((m) => m.status === "agendada");
  const finished = matches.filter((m) => m.status === "encerrada");

  return (
    <View className="flex-1 bg-background">
      <TopAppBar
        rightIcon={isAdmin ? "add" : "notifications"}
        onRightPress={isAdmin ? () => router.push("/partida/novo") : undefined}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
        {live.length > 0 && (
          <View className="gap-3">
            <Text className="font-title-md text-title-md text-on-surface">Ao Vivo</Text>
            <View className="gap-3">
              {live.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </View>
          </View>
        )}

        <View className="gap-3">
          <Text className="font-title-md text-title-md text-on-surface">Agendadas</Text>
          {scheduled.length === 0 ? (
            <Text className="font-body-md text-body-md text-on-surface-variant">Nenhuma partida agendada.</Text>
          ) : (
            <View className="gap-3">
              {scheduled.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </View>
          )}
        </View>

        {finished.length > 0 && (
          <View className="gap-3">
            <Text className="font-title-md text-title-md text-on-surface">Encerradas</Text>
            <View className="gap-3">
              {finished.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {isAdmin && (
        <Pressable
          onPress={() => router.push("/partida/novo")}
          className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
        >
          <MaterialIcons name="add" size={28} color={colors.onPrimary} />
        </Pressable>
      )}
    </View>
  );
}
