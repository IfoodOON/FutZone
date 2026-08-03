-- FutZone Mobile — schema + RLS policies
-- Run this once in the Supabase SQL Editor of your project (Database -> SQL Editor -> New query).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS.

-- ============================================================================
-- Tables
-- ============================================================================

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  weekdays text[] not null default '{}',
  time text not null default '20:00',
  max_players int not null default 14,
  monthly_fee text not null default '',
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

-- "players" mirrors src/store/types.ts Player, and is intentionally NOT the
-- same thing as auth.users: an admin can add a roster player who has never
-- signed up (matches the existing "Adicionar Jogador" flow in elenco.tsx).
-- auth_user_id is only set once that person actually creates an account.
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  group_id uuid references public.groups(id) on delete cascade,
  name text not null,
  position text,
  secondary_positions text[] not null default '{}',
  avatar_url text,
  role text not null default 'jogador' check (role in ('admin', 'jogador')),
  created_at timestamptz not null default now()
);

-- Migration for databases created before avatar/secondary-position support.
alter table public.players add column if not exists secondary_positions text[] not null default '{}';
alter table public.players add column if not exists avatar_url text;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  kind text not null check (kind in ('sede', 'amistoso')),
  team_a text not null,
  team_b text not null,
  opponent text,
  location text not null,
  address text not null,
  scheduled_at timestamptz not null,
  status text not null default 'agendada' check (status in ('agendada', 'ao_vivo', 'encerrada')),
  created_at timestamptz not null default now()
);

-- Prevents ensureUpcomingSedeMatches() from ever double-booking the same
-- recurring slot: ON CONFLICT DO NOTHING is enforced by the database
-- itself, so it's safe even if two calls race before either has round
-- -tripped back through realtime into local state.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'matches_group_kind_scheduled_at_key'
  ) then
    alter table public.matches
      add constraint matches_group_kind_scheduled_at_key unique (group_id, kind, scheduled_at);
  end if;
end $$;

create table if not exists public.attendance (
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null check (status in ('confirmado', 'duvida', 'ausente')),
  position text,
  primary key (match_id, player_id)
);

-- Migration for databases created before per-match position support.
alter table public.attendance add column if not exists position text;

create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  side text not null check (side in ('A', 'B')),
  minute int not null,
  scorer_id uuid not null references public.players(id),
  shot_zone text not null check (shot_zone in ('meio_campo', 'dentro_area', 'grande_area')),
  finish_type text not null check (finish_type in ('perna_direita', 'perna_esquerda', 'cabeca', 'bicicleta')),
  assist_player_id uuid references public.players(id),
  assist_zone text check (assist_zone in ('escanteio', 'lateral', 'linha_fundo')),
  pass_type text check (pass_type in ('cruzamento_area', 'passe_rasteiro', 'lancamento')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Helper functions (SECURITY DEFINER so RLS policies can look up the
-- caller's own group/role without recursing into the players table's own
-- RLS policy — the standard Supabase pattern for self-referential checks).
-- ============================================================================

create or replace function public.current_player_id()
returns uuid
language sql security definer stable set search_path = public
as $$
  select id from public.players where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.current_group_id()
returns uuid
language sql security definer stable set search_path = public
as $$
  select group_id from public.players where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.current_role()
returns text
language sql security definer stable set search_path = public
as $$
  select role from public.players where auth_user_id = auth.uid() limit 1;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.groups enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.attendance enable row level security;
alter table public.match_events enable row level security;

-- groups: any authenticated user can read (needed to look up a group by
-- invite code before joining); only a member with no group yet can create
-- one; only the group's admin can update it.
drop policy if exists "groups_select" on public.groups;
create policy "groups_select" on public.groups
  for select to authenticated using (true);

drop policy if exists "groups_insert" on public.groups;
create policy "groups_insert" on public.groups
  for insert to authenticated with check (public.current_group_id() is null);

drop policy if exists "groups_update" on public.groups;
create policy "groups_update" on public.groups
  for update to authenticated
  using (id = public.current_group_id() and public.current_role() = 'admin')
  with check (id = public.current_group_id() and public.current_role() = 'admin');

-- players: see your own row plus every player in your group; self-insert
-- when joining/creating a group, or admin-insert for a roster-only player;
-- self-update or admin-update; admin-only delete.
drop policy if exists "players_select" on public.players;
create policy "players_select" on public.players
  for select to authenticated
  using (auth_user_id = auth.uid() or group_id = public.current_group_id());

drop policy if exists "players_insert" on public.players;
create policy "players_insert" on public.players
  for insert to authenticated
  with check (
    auth_user_id = auth.uid()
    or (auth_user_id is null and group_id = public.current_group_id() and public.current_role() = 'admin')
  );

drop policy if exists "players_update" on public.players;
create policy "players_update" on public.players
  for update to authenticated
  using (auth_user_id = auth.uid() or (group_id = public.current_group_id() and public.current_role() = 'admin'))
  with check (auth_user_id = auth.uid() or (group_id = public.current_group_id() and public.current_role() = 'admin'));

drop policy if exists "players_delete" on public.players;
create policy "players_delete" on public.players
  for delete to authenticated
  using (group_id = public.current_group_id() and public.current_role() = 'admin');

-- matches: readable by the group, writable only by the group's admin.
drop policy if exists "matches_select" on public.matches;
create policy "matches_select" on public.matches
  for select to authenticated using (group_id = public.current_group_id());

drop policy if exists "matches_insert" on public.matches;
create policy "matches_insert" on public.matches
  for insert to authenticated
  with check (group_id = public.current_group_id() and public.current_role() = 'admin');

drop policy if exists "matches_update" on public.matches;
create policy "matches_update" on public.matches
  for update to authenticated
  using (group_id = public.current_group_id() and public.current_role() = 'admin')
  with check (group_id = public.current_group_id() and public.current_role() = 'admin');

drop policy if exists "matches_delete" on public.matches;
create policy "matches_delete" on public.matches
  for delete to authenticated
  using (group_id = public.current_group_id() and public.current_role() = 'admin');

-- attendance: readable by the group; each player can only write their own
-- attendance row for a match in their group.
drop policy if exists "attendance_select" on public.attendance;
create policy "attendance_select" on public.attendance
  for select to authenticated
  using (match_id in (select id from public.matches where group_id = public.current_group_id()));

drop policy if exists "attendance_upsert" on public.attendance;
create policy "attendance_upsert" on public.attendance
  for insert to authenticated
  with check (
    player_id = public.current_player_id()
    and match_id in (select id from public.matches where group_id = public.current_group_id())
  );

drop policy if exists "attendance_update" on public.attendance;
create policy "attendance_update" on public.attendance
  for update to authenticated
  using (player_id = public.current_player_id())
  with check (player_id = public.current_player_id());

-- match_events: readable by the group; only the group's admin can log or
-- remove a goal (mirrors useRequireAdmin on the juiz.tsx screen).
drop policy if exists "match_events_select" on public.match_events;
create policy "match_events_select" on public.match_events
  for select to authenticated
  using (match_id in (select id from public.matches where group_id = public.current_group_id()));

drop policy if exists "match_events_insert" on public.match_events;
create policy "match_events_insert" on public.match_events
  for insert to authenticated
  with check (
    public.current_role() = 'admin'
    and match_id in (select id from public.matches where group_id = public.current_group_id())
  );

drop policy if exists "match_events_delete" on public.match_events;
create policy "match_events_delete" on public.match_events
  for delete to authenticated
  using (
    public.current_role() = 'admin'
    and match_id in (select id from public.matches where group_id = public.current_group_id())
  );

-- ============================================================================
-- Storage — public "avatars" bucket for player profile photos. Uploaded as
-- "{auth_user_id}/avatar.jpg" so storage.foldername(name)[1] identifies the
-- owner for the write policies below (read is public, per user's choice).
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_select" on storage.objects;
create policy "avatars_select" on storage.objects
  for select to public using (bucket_id = 'avatars');

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- Realtime — the judge's live scoreboard depends on these being broadcast.
-- FULL replica identity is required so DELETE/UPDATE payloads include every
-- column (not just the primary key) — e.g. match_events' "old" row needs
-- match_id to know which match's local event list to update, and match_id
-- is not part of that table's primary key.
-- ============================================================================

alter table public.matches replica identity full;
alter table public.players replica identity full;
alter table public.attendance replica identity full;
alter table public.match_events replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array['matches', 'match_events', 'attendance', 'players'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
