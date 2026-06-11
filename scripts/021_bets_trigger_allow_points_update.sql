-- Permite atualizar points_earned (encerramento/reabertura no admin) após o apito.
-- Bloqueia apenas insert ou alteração de palpite depois de match_date.

create or replace function public.prevent_bet_after_match_start()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m timestamptz;
begin
  select match_date into m from public.matches where id = new.match_id;
  if m is null then
    raise exception 'Partida não encontrada';
  end if;

  if now() < m then
    return new;
  end if;

  if tg_op = 'UPDATE'
    and old.user_id is not distinct from new.user_id
    and old.match_id is not distinct from new.match_id
    and old.predicted_home_score is not distinct from new.predicted_home_score
    and old.predicted_away_score is not distinct from new.predicted_away_score
    and old.predicted_advances_team_id is not distinct from new.predicted_advances_team_id
  then
    return new;
  end if;

  raise exception 'Apostas encerradas após o início da partida.';
end;
$$;

drop trigger if exists trg_bets_prevent_after_kickoff on public.bets;

create trigger trg_bets_prevent_after_kickoff
before insert or update on public.bets
for each row execute function public.prevent_bet_after_match_start();
