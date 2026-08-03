import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { nextDateForWeekday } from "@/utils/date";
import type {
  AttendanceStatus,
  Group,
  Match,
  MatchEvent,
  Player,
  Role,
} from "@/store/types";

type AppState = {
  session: Session | null;
  authLoading: boolean;
  currentUserId: string;
  players: Player[];
  group: Group | null;
  matches: Match[];

  initAuth: () => () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    position?: string
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  uploadAvatar: (localUri: string) => Promise<string | null>;
  createGroup: (values: Omit<Group, "id" | "inviteCode">) => Promise<void>;
  joinGroupByCode: (code: string) => Promise<{ error: string | null }>;

  setRole: (role: Role) => Promise<void>;
  setAttendance: (matchId: string, status: AttendanceStatus) => Promise<void>;
  addMatchEvent: (matchId: string, event: Omit<MatchEvent, "id" | "matchId" | "createdAt">) => Promise<void>;
  removeMatchEvent: (matchId: string, eventId: string) => Promise<void>;
  addMatch: (match: Omit<Match, "id" | "attendance" | "matchPositions" | "events">) => Promise<string>;
  removeMatch: (matchId: string) => Promise<void>;
  updateGroup: (patch: Partial<Group>) => Promise<void>;
  ensureUpcomingSedeMatches: () => Promise<void>;
  addPlayer: (name: string, position?: string) => Promise<void>;
  updatePlayer: (
    playerId: string,
    patch: Partial<Pick<Player, "name" | "position" | "role" | "avatarUrl" | "secondaryPositions">>
  ) => Promise<void>;
  removePlayer: (playerId: string) => Promise<void>;
  setMatchPosition: (matchId: string, position: string) => Promise<void>;
};

type SetFn = (partial: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void;
type GetFn = () => AppState;

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `FZ-${code}`;
}

function toPlayer(row: any): Player {
  return {
    id: row.id,
    name: row.name,
    position: row.position ?? undefined,
    secondaryPositions: row.secondary_positions ?? [],
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role,
  };
}

function toGroup(row: any): Group {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    weekdays: row.weekdays ?? [],
    time: row.time,
    maxPlayers: row.max_players,
    monthlyFee: row.monthly_fee,
    inviteCode: row.invite_code,
  };
}

function toMatchEvent(row: any): MatchEvent {
  return {
    id: row.id,
    matchId: row.match_id,
    side: row.side,
    minute: row.minute,
    scorerId: row.scorer_id,
    shotZone: row.shot_zone,
    finishType: row.finish_type,
    assistPlayerId: row.assist_player_id ?? undefined,
    assistZone: row.assist_zone ?? undefined,
    passType: row.pass_type ?? undefined,
    createdAt: row.created_at,
  };
}

function toMatch(row: any, attendanceRows: any[], eventRows: any[]): Match {
  const attendance: Record<string, AttendanceStatus> = {};
  const matchPositions: Record<string, string> = {};
  for (const a of attendanceRows) {
    if (a.match_id === row.id) {
      attendance[a.player_id] = a.status;
      if (a.position) matchPositions[a.player_id] = a.position;
    }
  }
  const events = eventRows
    .filter((e) => e.match_id === row.id)
    .map(toMatchEvent)
    .sort((a, b) => b.minute - a.minute);

  return {
    id: row.id,
    kind: row.kind,
    teamA: row.team_a,
    teamB: row.team_b,
    opponent: row.opponent ?? undefined,
    location: row.location,
    address: row.address,
    scheduledAt: row.scheduled_at,
    status: row.status,
    attendance,
    matchPositions,
    events,
  };
}

function upsertMatchRow(matches: Match[], row: any): Match[] {
  const incoming = toMatch(row, [], []);
  const idx = matches.findIndex((m) => m.id === row.id);
  if (idx === -1) return [...matches, incoming];
  const existing = matches[idx];
  const next = [...matches];
  next[idx] = {
    ...incoming,
    attendance: existing.attendance,
    matchPositions: existing.matchPositions,
    events: existing.events,
  };
  return next;
}

let realtimeUnsubscribe: (() => void) | null = null;

function subscribeRealtime(set: SetFn, get: GetFn, groupId: string): () => void {
  const channel = supabase
    .channel(`group-${groupId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "matches", filter: `group_id=eq.${groupId}` },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const oldId = (payload.old as any).id;
          set((s) => ({ matches: s.matches.filter((m) => m.id !== oldId) }));
          return;
        }
        set((s) => ({ matches: upsertMatchRow(s.matches, payload.new) }));
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "players", filter: `group_id=eq.${groupId}` },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const oldId = (payload.old as any).id;
          set((s) => ({ players: s.players.filter((p) => p.id !== oldId) }));
          return;
        }
        const player = toPlayer(payload.new);
        set((s) => ({
          players: s.players.some((p) => p.id === player.id)
            ? s.players.map((p) => (p.id === player.id ? player : p))
            : [...s.players, player],
        }));
      }
    )
    .on("postgres_changes", { event: "*", schema: "public", table: "match_events" }, (payload) => {
      if (payload.eventType === "DELETE") {
        const old = payload.old as any;
        set((s) => ({
          matches: s.matches.map((m) =>
            m.id === old.match_id ? { ...m, events: m.events.filter((e) => e.id !== old.id) } : m
          ),
        }));
        return;
      }
      const event = toMatchEvent(payload.new);
      set((s) => ({
        matches: s.matches.map((m) => {
          if (m.id !== event.matchId) return m;
          if (m.events.some((e) => e.id === event.id)) return m;
          return { ...m, events: [event, ...m.events].sort((a, b) => b.minute - a.minute) };
        }),
      }));
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, (payload) => {
      if (payload.eventType === "DELETE") {
        const old = payload.old as any;
        set((s) => ({
          matches: s.matches.map((m) => {
            if (m.id !== old.match_id) return m;
            const attendance = { ...m.attendance };
            delete attendance[old.player_id];
            const matchPositions = { ...m.matchPositions };
            delete matchPositions[old.player_id];
            return { ...m, attendance, matchPositions };
          }),
        }));
        return;
      }
      const row = payload.new as any;
      set((s) => ({
        matches: s.matches.map((m) => {
          if (m.id !== row.match_id) return m;
          const matchPositions = { ...m.matchPositions };
          if (row.position) matchPositions[row.player_id] = row.position;
          else delete matchPositions[row.player_id];
          return { ...m, attendance: { ...m.attendance, [row.player_id]: row.status }, matchPositions };
        }),
      }));
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

async function hydrateGroup(set: SetFn, get: GetFn, groupId: string) {
  const [{ data: groupRow }, { data: playerRows }, { data: matchRows }] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).single(),
    supabase.from("players").select("*").eq("group_id", groupId),
    supabase.from("matches").select("*").eq("group_id", groupId).order("scheduled_at"),
  ]);

  const matchIds = (matchRows ?? []).map((m: any) => m.id);
  const [attendanceResult, eventResult] = matchIds.length
    ? await Promise.all([
        supabase.from("attendance").select("*").in("match_id", matchIds),
        supabase.from("match_events").select("*").in("match_id", matchIds),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];

  set({
    group: groupRow ? toGroup(groupRow) : null,
    players: (playerRows ?? []).map(toPlayer),
    matches: (matchRows ?? []).map((m: any) => toMatch(m, attendanceResult.data ?? [], eventResult.data ?? [])),
  });
}

async function loadMe(set: SetFn, get: GetFn) {
  realtimeUnsubscribe?.();
  realtimeUnsubscribe = null;

  const session = get().session;
  if (!session) {
    set({ currentUserId: "", players: [], group: null, matches: [] });
    return;
  }

  const { data: me } = await supabase
    .from("players")
    .select("*")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (!me || !me.group_id) {
    set({
      currentUserId: me?.id ?? "",
      players: me ? [toPlayer(me)] : [],
      group: null,
      matches: [],
    });
    return;
  }

  await hydrateGroup(set, get, me.group_id);
  set({ currentUserId: me.id });
  realtimeUnsubscribe = subscribeRealtime(set, get, me.group_id);
}

export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  authLoading: true,
  currentUserId: "",
  players: [],
  group: null,
  matches: [],

  initAuth: () => {
    async function applySession(session: Session | null) {
      set({ session });
      await loadMe(set, get);
      set({ authLoading: false });
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
      realtimeUnsubscribe?.();
      realtimeUnsubscribe = null;
    };
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    set({ session: data.session });
    await loadMe(set, get);
    return { error: null };
  },

  signUp: async (email, password, name, position) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, position } },
    });
    if (error) return { error: error.message, needsEmailConfirmation: false };
    if (!data.session) return { error: null, needsEmailConfirmation: true };
    set({ session: data.session });
    await loadMe(set, get);
    return { error: null, needsEmailConfirmation: false };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
    await loadMe(set, get);
  },

  uploadAvatar: async (localUri) => {
    const session = get().session;
    if (!session) return null;

    const path = `${session.user.id}/avatar.jpg`;
    const arrayBuffer = await fetch(localUri).then((r) => r.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: true });
    if (uploadError) return null;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    set((s) =>
      s.session
        ? {
            session: {
              ...s.session,
              user: { ...s.session.user, user_metadata: { ...s.session.user.user_metadata, avatar_url: publicUrl } },
            },
          }
        : {}
    );

    return publicUrl;
  },

  createGroup: async (values) => {
    const session = get().session;
    if (!session) throw new Error("Not authenticated");

    const { data: groupRow, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: values.name,
        location: values.location,
        weekdays: values.weekdays,
        time: values.time,
        max_players: values.maxPlayers,
        monthly_fee: values.monthlyFee,
        invite_code: generateInviteCode(),
      })
      .select()
      .single();
    if (groupError || !groupRow) throw groupError ?? new Error("Failed to create group");

    const meta = session.user.user_metadata as { name?: string; position?: string; avatar_url?: string };
    const { error: playerError } = await supabase.from("players").insert({
      auth_user_id: session.user.id,
      group_id: groupRow.id,
      name: meta.name ?? "Jogador",
      position: meta.position ?? null,
      avatar_url: meta.avatar_url ?? null,
      role: "admin",
    });
    if (playerError) throw playerError;

    await loadMe(set, get);
    await get().ensureUpcomingSedeMatches();
  },

  joinGroupByCode: async (code) => {
    const session = get().session;
    if (!session) return { error: "Não autenticado" };

    const { data: groupRow } = await supabase
      .from("groups")
      .select("*")
      .eq("invite_code", code.trim())
      .maybeSingle();
    if (!groupRow) return { error: "Código inválido" };

    const meta = session.user.user_metadata as { name?: string; position?: string; avatar_url?: string };
    const { error: playerError } = await supabase.from("players").insert({
      auth_user_id: session.user.id,
      group_id: groupRow.id,
      name: meta.name ?? "Jogador",
      position: meta.position ?? null,
      avatar_url: meta.avatar_url ?? null,
      role: "jogador",
    });
    if (playerError) return { error: "Não foi possível entrar no grupo" };

    await loadMe(set, get);
    return { error: null };
  },

  setRole: async (role) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    await supabase.from("players").update({ role }).eq("id", currentUserId);
  },

  setAttendance: async (matchId, status) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    await supabase
      .from("attendance")
      .upsert({ match_id: matchId, player_id: currentUserId, status }, { onConflict: "match_id,player_id" });
  },

  addMatchEvent: async (matchId, event) => {
    await supabase.from("match_events").insert({
      match_id: matchId,
      side: event.side,
      minute: event.minute,
      scorer_id: event.scorerId,
      shot_zone: event.shotZone,
      finish_type: event.finishType,
      assist_player_id: event.assistPlayerId ?? null,
      assist_zone: event.assistZone ?? null,
      pass_type: event.passType ?? null,
    });
  },

  removeMatchEvent: async (_matchId, eventId) => {
    await supabase.from("match_events").delete().eq("id", eventId);
  },

  addMatch: async (match) => {
    const { group } = get();
    if (!group) throw new Error("No group");

    const { data, error } = await supabase
      .from("matches")
      .insert({
        group_id: group.id,
        kind: match.kind,
        team_a: match.teamA,
        team_b: match.teamB,
        opponent: match.opponent ?? null,
        location: match.location,
        address: match.address,
        scheduled_at: match.scheduledAt,
        status: match.status,
      })
      .select()
      .single();
    if (error || !data) throw error ?? new Error("Failed to create match");

    set((s) => (s.matches.some((m) => m.id === data.id) ? {} : { matches: [...s.matches, toMatch(data, [], [])] }));
    return data.id;
  },

  removeMatch: async (matchId) => {
    await supabase.from("matches").delete().eq("id", matchId);
    set((s) => ({ matches: s.matches.filter((m) => m.id !== matchId) }));
  },

  updateGroup: async (patch) => {
    const { group } = get();
    if (!group) return;
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.location !== undefined) dbPatch.location = patch.location;
    if (patch.weekdays !== undefined) dbPatch.weekdays = patch.weekdays;
    if (patch.time !== undefined) dbPatch.time = patch.time;
    if (patch.maxPlayers !== undefined) dbPatch.max_players = patch.maxPlayers;
    if (patch.monthlyFee !== undefined) dbPatch.monthly_fee = patch.monthlyFee;
    if (patch.inviteCode !== undefined) dbPatch.invite_code = patch.inviteCode;
    await supabase.from("groups").update(dbPatch).eq("id", group.id);
  },

  ensureUpcomingSedeMatches: async () => {
    const { group, matches } = get();
    if (!group) return;

    const toInsert = [];
    for (const weekday of group.weekdays) {
      const scheduledAt = nextDateForWeekday(weekday, group.time);
      const alreadyExists = matches.some(
        (m) => m.kind === "sede" && m.status === "agendada" && m.scheduledAt === scheduledAt
      );
      if (!alreadyExists) {
        toInsert.push({
          group_id: group.id,
          kind: "sede",
          team_a: group.name,
          team_b: group.name,
          location: group.location,
          address: group.location,
          scheduled_at: scheduledAt,
          status: "agendada",
        });
      }
    }
    if (toInsert.length === 0) return;
    await supabase
      .from("matches")
      .upsert(toInsert, { onConflict: "group_id,kind,scheduled_at", ignoreDuplicates: true });
  },

  addPlayer: async (name, position) => {
    const { group } = get();
    if (!group) return;
    await supabase.from("players").insert({
      group_id: group.id,
      name,
      position: position ?? null,
      role: "jogador",
    });
  },

  updatePlayer: async (playerId, patch) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.position !== undefined) dbPatch.position = patch.position;
    if (patch.role !== undefined) dbPatch.role = patch.role;
    if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;
    if (patch.secondaryPositions !== undefined) dbPatch.secondary_positions = patch.secondaryPositions;
    await supabase.from("players").update(dbPatch).eq("id", playerId);
  },

  removePlayer: async (playerId) => {
    await supabase.from("players").delete().eq("id", playerId);
  },

  setMatchPosition: async (matchId, position) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    await supabase.from("attendance").update({ position }).eq("match_id", matchId).eq("player_id", currentUserId);
  },
}));
