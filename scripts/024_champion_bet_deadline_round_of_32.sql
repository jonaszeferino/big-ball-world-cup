-- Prazo do palpite do campeão: 2 dias após a referência da 1ª partida dos 16-avos (round_of_32).
-- Executar no SQL Editor do Supabase (corrige "Palpite do campeão encerrado (prazo expirado).").

create or replace function public.champion_bet_deadline_at()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select min(match_date) - interval '1 minute' + interval '2 days'
  from public.matches
  where stage = 'round_of_32';
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

-- O trigger antigo usa o prazo da fase de grupos; removemos para evitar conflito com a API/RPC.
drop trigger if exists trg_champion_bets_prevent_after_deadline on public.champion_bets;
