-- Estende o prazo do palpite do campeão em mais 2 dias (após a referência da 1ª partida dos 16-avos).
-- Executar no SQL Editor se já rodou scripts/024 com o prazo antigo.

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
