import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nextDateForWeekday } from "@/utils/date";
import type {
  AttendanceStatus,
  Group,
  Match,
  MatchEvent,
  Player,
  Role,
} from "@/store/types";

// Fully offline/local store: everything lives on-device via AsyncStorage.
// No network calls. `src/lib/supabase.ts` is intentionally left unused here
// (not deleted) so a future session can re-wire a real backend without
// redesigning this state shape.

type LocalUser = { id: string; email: string; user_metadata: { name?: string; position?: string; avatar_url?: string } };
type LocalSession = { user: LocalUser } | null;

type Account = { id: string; email: string; password: string };
type StoredPlayer = Player & { authUserId: string | null; groupId: string | null };
type StoredMatch = Match & { groupId: string };

type AppState = {
  session: LocalSession;
  authLoading: boolean;
  currentUserId: string;
  players: Player[];
  group: Group | null;
  matches: Match[];

  // Raw local "tables" — everything ever created on this device.
  accounts: Account[];
  allPlayers: StoredPlayer[];
  allGroups: Group[];
  allMatches: StoredMatch[];

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

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `FZ-${code}`;
}

// Recomputes the "current view" (players/group/matches for the logged-in
// account's group) from the raw local tables. Mirrors what loadMe() used to
// do against Supabase, just synchronously against in-memory/persisted data.
function recomputeView(set: SetFn, get: GetFn) {
  const { session, allPlayers, allGroups, allMatches } = get();

  if (!session) {
    set({ currentUserId: "", players: [], group: null, matches: [] });
    return;
  }

  const me = allPlayers.find((p) => p.authUserId === session.user.id);
  if (!me || !me.groupId) {
    set({ currentUserId: me?.id ?? "", players: me ? [me] : [], group: null, matches: [] });
    return;
  }

  const group = allGroups.find((g) => g.id === me.groupId) ?? null;
  const players = allPlayers.filter((p) => p.groupId === me.groupId);
  const matches = allMatches.filter((m) => m.groupId === me.groupId);
  set({ currentUserId: me.id, group, players, matches });
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      session: null,
      authLoading: true,
      currentUserId: "",
      players: [],
      group: null,
      matches: [],

      accounts: [],
      allPlayers: [],
      allGroups: [],
      allMatches: [],

      initAuth: () => {
        return () => {};
      },

      signIn: async (email, password) => {
        const trimmedEmail = email.trim().toLowerCase();
        const account = get().accounts.find((a) => a.email === trimmedEmail);
        if (!account || account.password !== password) {
          return { error: "E-mail ou senha inválidos" };
        }
        const me = get().allPlayers.find((p) => p.authUserId === account.id);
        set({
          session: {
            user: {
              id: account.id,
              email: account.email,
              user_metadata: { name: me?.name, position: me?.position, avatar_url: me?.avatarUrl },
            },
          },
        });
        recomputeView(set, get);
        return { error: null };
      },

      signUp: async (email, password, name, position) => {
        const trimmedEmail = email.trim().toLowerCase();
        if (get().accounts.some((a) => a.email === trimmedEmail)) {
          return { error: "Já existe uma conta com esse e-mail.", needsEmailConfirmation: false };
        }

        const accountId = generateId();
        const newPlayer: StoredPlayer = {
          id: generateId(),
          authUserId: accountId,
          groupId: null,
          name,
          position,
          secondaryPositions: [],
          avatarUrl: undefined,
          role: "jogador",
        };

        set((s) => ({
          accounts: [...s.accounts, { id: accountId, email: trimmedEmail, password }],
          allPlayers: [...s.allPlayers, newPlayer],
          session: {
            user: { id: accountId, email: trimmedEmail, user_metadata: { name, position, avatar_url: undefined } },
          },
        }));
        recomputeView(set, get);
        return { error: null, needsEmailConfirmation: false };
      },

      signOut: async () => {
        set({ session: null });
        recomputeView(set, get);
      },

      uploadAvatar: async (localUri) => {
        const session = get().session;
        if (!session) return null;

        set((s) => ({
          allPlayers: s.allPlayers.map((p) =>
            p.authUserId === session.user.id ? { ...p, avatarUrl: localUri } : p
          ),
          session: {
            user: { ...session.user, user_metadata: { ...session.user.user_metadata, avatar_url: localUri } },
          },
        }));
        recomputeView(set, get);
        return localUri;
      },

      createGroup: async (values) => {
        const session = get().session;
        if (!session) throw new Error("Not authenticated");

        const groupId = generateId();
        const group: Group = {
          id: groupId,
          name: values.name,
          location: values.location,
          weekdays: values.weekdays,
          time: values.time,
          maxPlayers: values.maxPlayers,
          monthlyFee: values.monthlyFee,
          inviteCode: generateInviteCode(),
        };

        set((s) => ({
          allGroups: [...s.allGroups, group],
          allPlayers: s.allPlayers.map((p) =>
            p.authUserId === session.user.id ? { ...p, groupId, role: "admin" as Role } : p
          ),
        }));

        recomputeView(set, get);
        await get().ensureUpcomingSedeMatches();
      },

      joinGroupByCode: async (code) => {
        const session = get().session;
        if (!session) return { error: "Não autenticado" };

        const group = get().allGroups.find((g) => g.inviteCode === code.trim());
        if (!group) return { error: "Código inválido" };

        set((s) => ({
          allPlayers: s.allPlayers.map((p) =>
            p.authUserId === session.user.id ? { ...p, groupId: group.id, role: "jogador" as Role } : p
          ),
        }));
        recomputeView(set, get);
        return { error: null };
      },

      setRole: async (role) => {
        const { currentUserId } = get();
        if (!currentUserId) return;
        set((s) => ({ allPlayers: s.allPlayers.map((p) => (p.id === currentUserId ? { ...p, role } : p)) }));
        recomputeView(set, get);
      },

      setAttendance: async (matchId, status) => {
        const { currentUserId } = get();
        if (!currentUserId) return;
        set((s) => ({
          allMatches: s.allMatches.map((m) =>
            m.id === matchId ? { ...m, attendance: { ...m.attendance, [currentUserId]: status } } : m
          ),
        }));
        recomputeView(set, get);
      },

      addMatchEvent: async (matchId, event) => {
        const newEvent: MatchEvent = {
          id: generateId(),
          matchId,
          createdAt: new Date().toISOString(),
          ...event,
        };
        set((s) => ({
          allMatches: s.allMatches.map((m) =>
            m.id === matchId ? { ...m, events: [newEvent, ...m.events].sort((a, b) => b.minute - a.minute) } : m
          ),
        }));
        recomputeView(set, get);
      },

      removeMatchEvent: async (matchId, eventId) => {
        set((s) => ({
          allMatches: s.allMatches.map((m) =>
            m.id === matchId ? { ...m, events: m.events.filter((e) => e.id !== eventId) } : m
          ),
        }));
        recomputeView(set, get);
      },

      addMatch: async (match) => {
        const { group } = get();
        if (!group) throw new Error("No group");

        const id = generateId();
        const newMatch: StoredMatch = { ...match, id, groupId: group.id, attendance: {}, matchPositions: {}, events: [] };
        set((s) => ({ allMatches: [...s.allMatches, newMatch] }));
        recomputeView(set, get);
        return id;
      },

      removeMatch: async (matchId) => {
        set((s) => ({ allMatches: s.allMatches.filter((m) => m.id !== matchId) }));
        recomputeView(set, get);
      },

      updateGroup: async (patch) => {
        const { group } = get();
        if (!group) return;
        set((s) => ({ allGroups: s.allGroups.map((g) => (g.id === group.id ? { ...g, ...patch } : g)) }));
        recomputeView(set, get);
      },

      ensureUpcomingSedeMatches: async () => {
        const { group, matches } = get();
        if (!group) return;

        const toInsert: StoredMatch[] = [];
        for (const weekday of group.weekdays) {
          const scheduledAt = nextDateForWeekday(weekday, group.time);
          const alreadyExists = matches.some(
            (m) => m.kind === "sede" && m.status === "agendada" && m.scheduledAt === scheduledAt
          );
          if (!alreadyExists) {
            toInsert.push({
              id: generateId(),
              groupId: group.id,
              kind: "sede",
              teamA: group.name,
              teamB: group.name,
              location: group.location,
              address: group.location,
              scheduledAt,
              status: "agendada",
              attendance: {},
              matchPositions: {},
              events: [],
            });
          }
        }
        if (toInsert.length === 0) return;
        set((s) => ({ allMatches: [...s.allMatches, ...toInsert] }));
        recomputeView(set, get);
      },

      addPlayer: async (name, position) => {
        const { group } = get();
        if (!group) return;
        const newPlayer: StoredPlayer = {
          id: generateId(),
          authUserId: null,
          groupId: group.id,
          name,
          position,
          secondaryPositions: [],
          avatarUrl: undefined,
          role: "jogador",
        };
        set((s) => ({ allPlayers: [...s.allPlayers, newPlayer] }));
        recomputeView(set, get);
      },

      updatePlayer: async (playerId, patch) => {
        set((s) => ({
          allPlayers: s.allPlayers.map((p) => (p.id === playerId ? { ...p, ...patch } : p)),
        }));
        recomputeView(set, get);
      },

      removePlayer: async (playerId) => {
        set((s) => ({ allPlayers: s.allPlayers.filter((p) => p.id !== playerId) }));
        recomputeView(set, get);
      },

      setMatchPosition: async (matchId, position) => {
        const { currentUserId } = get();
        if (!currentUserId) return;
        set((s) => ({
          allMatches: s.allMatches.map((m) =>
            m.id === matchId ? { ...m, matchPositions: { ...m.matchPositions, [currentUserId]: position } } : m
          ),
        }));
        recomputeView(set, get);
      },
    }),
    {
      name: "futzone-local-db",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => () => {
        recomputeView(useAppStore.setState, useAppStore.getState);
        useAppStore.setState({ authLoading: false });
      },
    }
  )
);
