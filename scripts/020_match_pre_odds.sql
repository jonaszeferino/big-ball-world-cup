-- Odds pré-jogo (odds-api.io) — actualização manual pelo admin.

create table if not exists public.match_pre_odds (
  id uuid primary key default gen_random_uuid(),
  odds_api_event_id bigint not null unique,
  match_id uuid references public.matches(id) on delete set null,
  home_name_api text not null,
  away_name_api text not null,
  home_name_app text,
  away_name_app text,
  event_date timestamptz not null,
  status text,
  kto_home text,
  kto_draw text,
  kto_away text,
  kto_ml_updated_at timestamptz,
  kto_url text,
  bet365_home text,
  bet365_draw text,
  bet365_away text,
  bet365_ml_updated_at timestamptz,
  bet365_url text,
  kto_raw jsonb,
  bet365_raw jsonb,
  synced_at timestamptz not null default now()
);

create index if not exists match_pre_odds_event_date_idx on public.match_pre_odds (event_date);
create index if not exists match_pre_odds_match_id_idx on public.match_pre_odds (match_id);

create table if not exists public.odds_sync_meta (
  id int primary key default 1 check (id = 1),
  last_synced_at timestamptz,
  last_synced_by uuid references public.profiles(id) on delete set null,
  events_total int default 0,
  events_with_odds int default 0,
  last_error text
);

insert into public.odds_sync_meta (id) values (1) on conflict (id) do nothing;

alter table public.match_pre_odds enable row level security;
alter table public.odds_sync_meta enable row level security;

create policy "match_pre_odds_select_all" on public.match_pre_odds for select using (true);

create policy "match_pre_odds_admin_insert" on public.match_pre_odds for insert with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.email = 'jonaszeferino@gmail.com')
  )
);

create policy "match_pre_odds_admin_update" on public.match_pre_odds for update using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.email = 'jonaszeferino@gmail.com')
  )
);

create policy "match_pre_odds_admin_delete" on public.match_pre_odds for delete using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.email = 'jonaszeferino@gmail.com')
  )
);

create policy "odds_sync_meta_select_all" on public.odds_sync_meta for select using (true);

create policy "odds_sync_meta_admin_update" on public.odds_sync_meta for update using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.is_admin = true or p.email = 'jonaszeferino@gmail.com')
  )
);
