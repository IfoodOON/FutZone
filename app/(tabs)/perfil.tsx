import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { TopAppBar } from "@/components/TopAppBar";
import { colors } from "@/theme/colors";
import { useAppStore } from "@/store/useAppStore";
import { useIsAdmin } from "@/hooks/useRequireAdmin";
import { formatMatchDate } from "@/utils/date";
import { positionLabel } from "@/utils/positions";
import { PlayerAvatar } from "@/components/PlayerAvatar";

export default function PerfilScreen() {
  const isAdmin = useIsAdmin();
  const setRole = useAppStore((s) => s.setRole);
  const signOut = useAppStore((s) => s.signOut);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const players = useAppStore((s) => s.players);
  const matches = useAppStore((s) => s.matches);

  const me = players.find((p) => p.id === currentUserId);

  const goalsInMatch = (matchEvents: { scorerId: string }[]) =>
    matchEvents.filter((e) => e.scorerId === currentUserId).length;

  const totalGoals = matches.reduce((sum, m) => sum + goalsInMatch(m.events), 0);
  const finishedMatches = matches
    .filter((m) => m.status === "encerrada")
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  const matchesPlayed = finishedMatches.filter((m) => m.attendance[currentUserId] === "confirmado").length;
  const goalsPerGame = matchesPlayed > 0 ? (totalGoals / matchesPlayed).toFixed(1) : "0.0";
  const recentActivity = finishedMatches.slice(0, 5).map((m) => ({
    place: m.location,
    when: formatMatchDate(m.scheduledAt),
    goals: goalsInMatch(m.events),
  }));

  const statsByPositionMap = new Map<string, { games: number; goals: number; assists: number }>();
  for (const m of finishedMatches) {
    const pos = m.matchPositions[currentUserId];
    if (!pos) continue;
    const entry = statsByPositionMap.get(pos) ?? { games: 0, goals: 0, assists: 0 };
    entry.games += 1;
    entry.goals += m.events.filter((e) => e.scorerId === currentUserId).length;
    entry.assists += m.events.filter((e) => e.assistPlayerId === currentUserId).length;
    statsByPositionMap.set(pos, entry);
  }
  const statsByPosition = Array.from(statsByPositionMap.entries())
    .map(([position, stats]) => ({ position, ...stats }))
    .sort((a, b) => b.games - a.games);

  function confirmSignOut() {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => signOut() },
    ]);
  }

  return (
    <View className="flex-1 bg-background">
      <TopAppBar
        rightIcon={isAdmin ? "settings" : "notifications"}
        onRightPress={isAdmin ? () => router.push("/grupo/configuracoes") : undefined}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {__DEV__ && (
          <View className="flex-row bg-surface-container rounded-xl p-1 mb-6">
            <Pressable
              onPress={() => setRole("jogador")}
              className={`flex-1 py-2 items-center rounded-lg ${!isAdmin ? "bg-primary-container" : ""}`}
            >
              <Text
                className={`font-label-sm text-label-sm ${!isAdmin ? "text-on-primary-container" : "text-on-surface-variant"}`}
              >
                DEV: Jogador
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRole("admin")}
              className={`flex-1 py-2 items-center rounded-lg ${isAdmin ? "bg-primary-container" : ""}`}
            >
              <Text
                className={`font-label-sm text-label-sm ${isAdmin ? "text-on-primary-container" : "text-on-surface-variant"}`}
              >
                DEV: Admin
              </Text>
            </Pressable>
          </View>
        )}
        <View className="items-center mb-6">
          <View className="border-4 border-primary/30 rounded-full mb-2">
            <PlayerAvatar uri={me?.avatarUrl} size={120} />
          </View>
          <Text className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            {me?.name ?? "Jogador"}
          </Text>
          {me?.position && (
            <View className="flex-row items-center gap-1 mb-sm">
              <MaterialIcons name="sports-handball" size={16} color={colors.onSurfaceVariant} />
              <Text className="font-title-md text-title-md text-on-surface-variant">{positionLabel(me.position)}</Text>
            </View>
          )}
          <Pressable
            onPress={() => router.push("/perfil/editar")}
            className="flex-row items-center gap-1 px-md py-1.5 rounded-full bg-surface-container-low mt-sm"
          >
            <MaterialIcons name="edit" size={14} color={colors.primary} />
            <Text className="font-label-sm text-label-sm text-primary">Editar Perfil</Text>
          </Pressable>
        </View>

        {isAdmin && (
          <View className="flex-row gap-sm mb-6">
            <Pressable
              onPress={() => router.push("/grupo/elenco")}
              className="flex-1 bg-surface-container-low rounded-xl py-4 items-center gap-1"
            >
              <MaterialIcons name="groups" size={20} color={colors.primary} />
              <Text className="font-label-sm text-[11px] text-on-surface-variant text-center">Elenco</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/grupo/convidar")}
              className="flex-1 bg-surface-container-low rounded-xl py-4 items-center gap-1"
            >
              <MaterialIcons name="person-add-alt" size={20} color={colors.primary} />
              <Text className="font-label-sm text-[11px] text-on-surface-variant text-center">Convidar</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/grupo/configuracoes")}
              className="flex-1 bg-surface-container-low rounded-xl py-4 items-center gap-1"
            >
              <MaterialIcons name="settings" size={20} color={colors.primary} />
              <Text className="font-label-sm text-[11px] text-on-surface-variant text-center">Grupo</Text>
            </Pressable>
          </View>
        )}

        <View className="flex-row flex-wrap gap-gutter mb-6">
          <View className="w-full bg-surface-container-low rounded-2xl py-6 items-center border-l-4 border-primary">
            <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase mb-1">
              Média de Gols
            </Text>
            <Text className="font-stat-value text-display-lg text-primary">
              {goalsPerGame}
              <Text className="text-title-md">/jogo</Text>
            </Text>
          </View>
          <View className="flex-1 bg-surface-container-low rounded-2xl py-4 items-center border-l-4 border-tertiary-container">
            <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Total Gols</Text>
            <Text className="font-stat-value text-stat-value text-on-surface">{totalGoals}</Text>
          </View>
          <View className="flex-1 bg-surface-container-low rounded-2xl py-4 items-center border-l-4 border-secondary-container">
            <Text className="font-label-sm text-label-sm text-on-surface-variant uppercase">Partidas</Text>
            <Text className="font-stat-value text-stat-value text-on-surface">{matchesPlayed}</Text>
          </View>
        </View>

        {statsByPosition.length > 0 && (
          <View className="mb-6">
            <Text className="font-title-md text-title-md text-on-surface mb-md">Estatísticas por Posição</Text>
            <View className="gap-2">
              {statsByPosition.map((stat) => (
                <View
                  key={stat.position}
                  className="flex-row items-center justify-between bg-surface-container-low rounded-xl p-4"
                >
                  <Text className="font-title-md text-title-md text-on-surface">{positionLabel(stat.position)}</Text>
                  <View className="flex-row gap-md">
                    <Text className="font-label-sm text-label-sm text-on-surface-variant">{stat.games} jogos</Text>
                    <Text className="font-label-sm text-label-sm text-primary">{stat.goals} gols</Text>
                    <Text className="font-label-sm text-label-sm text-on-surface-variant">{stat.assists} assist.</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View>
          <Text className="font-title-md text-title-md text-on-surface mb-md">Atividade Recente</Text>
          {recentActivity.length === 0 ? (
            <Text className="font-body-md text-body-md text-on-surface-variant">
              Nenhuma partida encerrada ainda.
            </Text>
          ) : (
            <View className="gap-sm">
              {recentActivity.map((activity) => (
                <View
                  key={activity.place + activity.when}
                  className="flex-row items-center justify-between bg-surface-container-low rounded-2xl p-4"
                >
                  <View className="flex-row items-center gap-md">
                    <View className="w-10 h-10 rounded-lg bg-surface-container-highest items-center justify-center">
                      <MaterialIcons name="stadium" size={20} color={colors.primary} />
                    </View>
                    <View>
                      <Text className="font-body-md text-body-md text-on-surface font-semibold">{activity.place}</Text>
                      <Text className="font-label-sm text-label-sm text-on-surface-variant">{activity.when}</Text>
                    </View>
                  </View>
                  <Text className="font-stat-value text-stat-value text-primary">{activity.goals} gols</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Pressable
          onPress={confirmSignOut}
          className="flex-row items-center justify-center gap-2 py-4 mt-2 rounded-xl bg-surface-container-low active:opacity-80"
        >
          <MaterialIcons name="logout" size={18} color={colors.error} />
          <Text className="font-title-md text-title-md text-error">Sair</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
