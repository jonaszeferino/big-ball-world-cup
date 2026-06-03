-- Activa Realtime na tabela de avisos (necessário para toast instantâneo).
-- O app também faz polling a cada 15s como fallback.

alter table public.match_score_banter replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.match_score_banter;
exception
  when duplicate_object then null;
end $$;

-- Permite insert pelo admin (email ou is_admin)
drop policy if exists "match_score_banter_insert_admin" on public.match_score_banter;
create policy "match_score_banter_insert_admin" on public.match_score_banter
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.is_admin = true or p.email = 'jonaszeferino@gmail.com')
    )
  );
