-- Grupos de apostas: apenas o organizador (jonaszeferino@gmail.com) gere cadastro e membros.
-- Revoga insert aberto de 009_bet_groups_user_insert.sql.

drop policy if exists "bet_groups_insert_authenticated" on public.bet_groups;

drop policy if exists "bet_groups_select_admin" on public.bet_groups;
create policy "bet_groups_select_admin" on public.bet_groups for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.is_admin = true or p.email = 'jonaszeferino@gmail.com')
  )
);

drop policy if exists "bet_groups_insert_admin" on public.bet_groups;
create policy "bet_groups_insert_admin" on public.bet_groups for insert with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.is_admin = true or p.email = 'jonaszeferino@gmail.com')
  )
);

drop policy if exists "bet_groups_update_admin" on public.bet_groups;
create policy "bet_groups_update_admin" on public.bet_groups for update using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.is_admin = true or p.email = 'jonaszeferino@gmail.com')
  )
);

drop policy if exists "bet_groups_delete_admin" on public.bet_groups;
create policy "bet_groups_delete_admin" on public.bet_groups for delete using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.is_admin = true or p.email = 'jonaszeferino@gmail.com')
  )
);

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles for update using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.is_admin = true or p.email = 'jonaszeferino@gmail.com')
  )
);
