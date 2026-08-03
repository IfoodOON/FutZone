import type { AttendanceStatus, Match, Player } from "@/store/types";

export function selectScore(match: Match) {
  const scoreA = match.events.filter((e) => e.side === "A").length;
  const scoreB = match.events.filter((e) => e.side === "B").length;
  return { scoreA, scoreB };
}

export function selectAttendanceCounts(match: Match) {
  const counts: Record<AttendanceStatus, number> = { confirmado: 0, duvida: 0, ausente: 0 };
  for (const status of Object.values(match.attendance)) {
    counts[status] += 1;
  }
  return counts;
}

export function selectNextMatch(matches: Match[]) {
  const upcoming = matches
    .filter((m) => m.status !== "encerrada")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  return upcoming.find((m) => m.status === "ao_vivo") ?? upcoming[0];
}

export function selectPlayerName(players: Player[], playerId: string) {
  return players.find((p) => p.id === playerId)?.name ?? "Jogador";
}
