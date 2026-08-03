export type Role = "jogador" | "admin";

export type Player = {
  id: string;
  name: string;
  position?: string;
  secondaryPositions: string[];
  avatarUrl?: string;
  role: Role;
};

export type AttendanceStatus = "confirmado" | "duvida" | "ausente";

export type MatchKind = "sede" | "amistoso";
export type MatchStatus = "agendada" | "ao_vivo" | "encerrada";

export type ShotZone = "meio_campo" | "dentro_area" | "grande_area";
export type FinishType = "perna_direita" | "perna_esquerda" | "cabeca" | "bicicleta";
export type AssistZone = "escanteio" | "lateral" | "linha_fundo";
export type PassType = "cruzamento_area" | "passe_rasteiro" | "lancamento";

export type MatchEvent = {
  id: string;
  matchId: string;
  side: "A" | "B";
  minute: number;
  scorerId: string;
  shotZone: ShotZone;
  finishType: FinishType;
  assistPlayerId?: string;
  assistZone?: AssistZone;
  passType?: PassType;
  createdAt: string;
};

export type Match = {
  id: string;
  kind: MatchKind;
  teamA: string;
  teamB: string;
  opponent?: string;
  location: string;
  address: string;
  scheduledAt: string;
  status: MatchStatus;
  attendance: Record<string, AttendanceStatus>;
  matchPositions: Record<string, string>;
  events: MatchEvent[];
};

export type Group = {
  id: string;
  name: string;
  location: string;
  weekdays: string[];
  time: string;
  maxPlayers: number;
  monthlyFee: string;
  inviteCode: string;
};
