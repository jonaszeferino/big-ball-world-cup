-- Marcadores por partida (apenas golos que entram no placar do jogo: tempo normal + prolongamento).
-- Os golos da série de penáltis de decisão ficam em matches.home_penalty_score / away_penalty_score e NÃO entram aqui.

create table if not exists public.match_goal_scorers (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete restrict,
  scorer_name text not null,
  goals integer not null default 1,
  created_at timestamptz default now(),
  constraint match_goal_scorers_scorer_name_trim check (length(trim(scorer_name)) > 0),
  constraint match_goal_scorers_goals_positive check (goals >= 1)
);

create unique index if not exists match_goal_scorers_match_team_scorer_unique
  on public.match_goal_scorers (match_id, team_id, scorer_name);

comment on table public.match_goal_scorers is 'Quem marcou em cada jogo (para ranking de artilheiros). Exclui penáltis da decisão.';

alter table public.match_goal_scorers enable row level security;

create policy "match_goal_scorers_select_all"
  on public.match_goal_scorers for select
  using (true);

create policy "match_goal_scorers_insert_admin"
  on public.match_goal_scorers for insert
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "match_goal_scorers_update_admin"
  on public.match_goal_scorers for update
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

create policy "match_goal_scorers_delete_admin"
  on public.match_goal_scorers for delete
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );
