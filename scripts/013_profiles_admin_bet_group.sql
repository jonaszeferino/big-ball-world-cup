-- Permite ao admin alterar perfis (ex.: bet_group_id) para gerir membros dos grupos de apostas.

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);
