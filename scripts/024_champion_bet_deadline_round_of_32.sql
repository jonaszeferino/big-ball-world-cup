-- Prazo do palpite do campeão: até 1 minuto antes da primeira partida dos 16-avos (round_of_32).
-- Executar no SQL Editor do Supabase (substitui champion_bet_deadline_at de scripts/022).

create or replace function public.champion_bet_deadline_at()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select min(match_date) - interval '1 minute'
  from public.matches
  where stage = 'round_of_32';
$$;
