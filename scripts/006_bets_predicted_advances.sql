-- Quem passa à seguinte fase quando a aposta é empate (mata-mata).

alter table public.bets
  add column if not exists predicted_advances_team_id uuid references public.teams(id) on delete set null;

comment on column public.bets.predicted_advances_team_id is 'Se o palpite for empate no mata-mata, equipa que o apostador acha que passa (penaltis).';
