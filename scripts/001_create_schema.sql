-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  is_admin boolean default false,
  total_points integer default 0,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Teams table
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  flag_url text,
  group_name text,
  created_at timestamptz default now()
);

alter table public.teams enable row level security;
create policy "teams_select_all" on public.teams for select using (true);
create policy "teams_insert_admin" on public.teams for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "teams_update_admin" on public.teams for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "teams_delete_admin" on public.teams for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Matches table
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team_id uuid references public.teams(id),
  away_team_id uuid references public.teams(id),
  home_score integer,
  away_score integer,
  match_date timestamptz not null,
  stage text not null default 'group',
  group_name text,
  status text not null default 'scheduled',
  created_at timestamptz default now()
);

alter table public.matches enable row level security;
create policy "matches_select_all" on public.matches for select using (true);
create policy "matches_insert_admin" on public.matches for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "matches_update_admin" on public.matches for update using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
create policy "matches_delete_admin" on public.matches for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Bets table
create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  predicted_home_score integer not null,
  predicted_away_score integer not null,
  points_earned integer default 0,
  created_at timestamptz default now(),
  unique(user_id, match_id)
);

alter table public.bets enable row level security;
create policy "bets_select_all" on public.bets for select using (true);
create policy "bets_insert_own" on public.bets for insert with check (auth.uid() = user_id);
create policy "bets_update_own" on public.bets for update using (auth.uid() = user_id);
create policy "bets_delete_own" on public.bets for delete using (auth.uid() = user_id);
