-- Comentários ao vivo quando o admin atualiza o placar oficial (teams_results).
-- Os clientes subscrevem via Supabase Realtime e mostram toast (Sonner).

create table if not exists public.match_score_banter (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches (id) on delete cascade,
  prev_home integer,
  prev_away integer,
  new_home integer,
  new_away integer,
  title text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists match_score_banter_match_id_idx on public.match_score_banter (match_id);
create index if not exists match_score_banter_created_at_idx on public.match_score_banter (created_at desc);

alter table public.match_score_banter enable row level security;

drop policy if exists "match_score_banter_select_authenticated" on public.match_score_banter;
create policy "match_score_banter_select_authenticated" on public.match_score_banter
  for select using (auth.uid() is not null);

drop policy if exists "match_score_banter_insert_admin" on public.match_score_banter;
create policy "match_score_banter_insert_admin" on public.match_score_banter
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Realtime (toast para todos): Supabase → Database → Publications → supabase_realtime → incluir match_score_banter
-- Ou no SQL Editor (uma vez): alter publication supabase_realtime add table public.match_score_banter;
