-- Palpite do campeão (campeão + vice). Prazo fixo: até 08/07/2026 23:59 (Brasília).
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
  select timezone('America/Sao_Paulo', timestamp '2026-07-08 23:59:59');
$$;

create or replace function public.upsert_champion_bet(
  p_champion_team_id uuid,
  p_runner_up_team_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deadline timestamptz;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Não autenticado';
  end if;

  if p_champion_team_id = p_runner_up_team_id then
    raise exception 'Campeão e vice devem ser times diferentes.';
  end if;

  if not exists (select 1 from public.teams where id = p_champion_team_id) then
    raise exception 'Time inválido.';
  end if;
  if not exists (select 1 from public.teams where id = p_runner_up_team_id) then
    raise exception 'Time inválido.';
  end if;

  select public.champion_bet_deadline_at() into deadline;
  if deadline is not null and now() > deadline then
    raise exception 'Palpite do campeão encerrado (prazo expirado).';
  end if;

  insert into public.champion_bets (user_id, champion_team_id, runner_up_team_id, updated_at)
  values (uid, p_champion_team_id, p_runner_up_team_id, now())
  on conflict (user_id) do update set
    champion_team_id = excluded.champion_team_id,
    runner_up_team_id = excluded.runner_up_team_id,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.upsert_champion_bet(uuid, uuid) from public;
grant execute on function public.upsert_champion_bet(uuid, uuid) to authenticated;

drop trigger if exists trg_champion_bets_prevent_after_deadline on public.champion_bets;
