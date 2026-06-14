-- Palpite do campeão (campeão + vice). Prazo: 10 min antes do fim estimado da última partida da fase de grupos.
-- Executar no SQL Editor do Supabase.

create table if not exists public.champion_bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  champion_team_id uuid not null references public.teams(id) on delete restrict,
  runner_up_team_id uuid not null references public.teams(id) on delete restrict,
  points_earned integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id),
  check (champion_team_id <> runner_up_team_id)
);

alter table public.champion_bets enable row level security;

create policy "champion_bets_select_all" on public.champion_bets for select using (true);
create policy "champion_bets_insert_own" on public.champion_bets for insert with check (auth.uid() = user_id);
create policy "champion_bets_update_own" on public.champion_bets for update using (auth.uid() = user_id);
create policy "champion_bets_delete_own" on public.champion_bets for delete using (auth.uid() = user_id);

create or replace function public.champion_bet_deadline_at()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select max(match_date) + interval '3 hours' - interval '10 minutes'
  from public.matches
  where stage = 'group';
$$;

create or replace function public.prevent_champion_bet_after_deadline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  deadline timestamptz;
begin
  select public.champion_bet_deadline_at() into deadline;

  if deadline is null then
    return new;
  end if;

  if now() <= deadline then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and old.user_id is not distinct from new.user_id
    and old.champion_team_id is not distinct from new.champion_team_id
    and old.runner_up_team_id is not distinct from new.runner_up_team_id
  then
    return new;
  end if;

  raise exception 'Palpite do campeão encerrado (prazo expirado).';
end;
$$;

drop trigger if exists trg_champion_bets_prevent_after_deadline on public.champion_bets;

create trigger trg_champion_bets_prevent_after_deadline
before insert or update on public.champion_bets
for each row execute function public.prevent_champion_bet_after_deadline();
