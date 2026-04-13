-- Placar de penáltis (após empate no tempo regular), fases eliminatórias.
-- O bolão continua a pontuar só com o resultado do tempo regular (home_score / away_score).

alter table public.matches
  add column if not exists home_penalty_score integer,
  add column if not exists away_penalty_score integer;

comment on column public.matches.home_penalty_score is 'Golos na série de penaltis (só se empate no tempo regular em mata-mata)';
comment on column public.matches.away_penalty_score is 'Golos na série de penaltis (só se empate no tempo regular em mata-mata)';
