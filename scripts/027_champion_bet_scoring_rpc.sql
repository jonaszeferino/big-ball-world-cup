-- Pontua palpites do campeão (SECURITY DEFINER — contorna RLS de update só do próprio user).
-- Executar no SQL Editor do Supabase. Depois use o botão no admin ou reencerre a final.

create or replace function public.apply_champion_bet_scoring_for_final(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
  champion_id uuid;
  runner_up_id uuid;
  bet record;
  old_pts integer;
  new_pts integer;
  delta integer;
  bets_processed integer := 0;
begin
  if auth.uid() is not null then
    if not exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.is_admin = true or p.email = 'jonaszeferino@gmail.com')
    ) then
      raise exception 'Sem permissão';
    end if;
  end if;

  select
    id,
    stage,
    status,
    home_team_id,
    away_team_id,
    home_score,
    away_score,
    home_penalty_score,
    away_penalty_score
  into m
  from public.matches
  where id = p_match_id;

  if m.id is null then
    raise exception 'Partida não encontrada.';
  end if;

  if m.stage <> 'final' then
    return jsonb_build_object('skipped', true, 'reason', 'not_final');
  end if;

  if m.status <> 'finished' or m.home_score is null or m.away_score is null then
    raise exception 'Final ainda não encerrada no bolão.';
  end if;

  if m.home_score > m.away_score then
    champion_id := m.home_team_id;
  elsif m.away_score > m.home_score then
    champion_id := m.away_team_id;
  elsif m.home_penalty_score is not null
    and m.away_penalty_score is not null
    and m.home_penalty_score <> m.away_penalty_score then
    if m.home_penalty_score > m.away_penalty_score then
      champion_id := m.home_team_id;
    else
      champion_id := m.away_team_id;
    end if;
  else
    raise exception 'Não foi possível determinar o campeão (penáltis?).';
  end if;

  runner_up_id := case when champion_id = m.home_team_id then m.away_team_id else m.home_team_id end;

  for bet in select * from public.champion_bets loop
    old_pts := coalesce(bet.points_earned, 0);
    new_pts := 0;

    if bet.champion_team_id = champion_id then
      new_pts := new_pts + 35;
    elsif bet.champion_team_id in (champion_id, runner_up_id) then
      new_pts := new_pts + 10;
    end if;

    if bet.runner_up_team_id = runner_up_id then
      new_pts := new_pts + 15;
    elsif bet.runner_up_team_id in (champion_id, runner_up_id) then
      new_pts := new_pts + 10;
    end if;

    delta := new_pts - old_pts;

    update public.champion_bets
    set points_earned = new_pts, updated_at = now()
    where id = bet.id;

    if delta <> 0 then
      update public.profiles
      set total_points = coalesce(total_points, 0) + delta
      where id = bet.user_id;
    end if;

    bets_processed := bets_processed + 1;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'match_id', p_match_id,
    'champion_team_id', champion_id,
    'runner_up_team_id', runner_up_id,
    'bets_processed', bets_processed
  );
end;
$$;

create or replace function public.reapply_champion_bet_scoring_for_finished_final()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
begin
  select id into v_match_id
  from public.matches
  where stage = 'final'
    and status = 'finished'
    and home_score is not null
    and away_score is not null
  order by match_date desc
  limit 1;

  if v_match_id is null then
    raise exception 'Nenhuma final encerrada no bolão.';
  end if;

  return public.apply_champion_bet_scoring_for_final(v_match_id);
end;
$$;

revoke all on function public.apply_champion_bet_scoring_for_final(uuid) from public;
grant execute on function public.apply_champion_bet_scoring_for_final(uuid) to authenticated;

revoke all on function public.reapply_champion_bet_scoring_for_finished_final() from public;
grant execute on function public.reapply_champion_bet_scoring_for_finished_final() to authenticated;

-- Aplica agora (idempotente — recalcula delta corretamente).
select public.reapply_champion_bet_scoring_for_finished_final();
