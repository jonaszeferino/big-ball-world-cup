-- Grupos de apostas (reunir amigos no bolão).
-- Se a tabela já existir na base, o CREATE é ignorado; executar políticas na mesma.

create table if not exists public.bet_groups (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  observations text,
  is_deleted boolean not null default false
);

alter table public.bet_groups enable row level security;

drop policy if exists "bet_groups_select_active" on public.bet_groups;
create policy "bet_groups_select_active" on public.bet_groups for select using (is_deleted = false);

drop policy if exists "bet_groups_select_admin" on public.bet_groups;
create policy "bet_groups_select_admin" on public.bet_groups for select
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists "bet_groups_insert_admin" on public.bet_groups;
create policy "bet_groups_insert_admin" on public.bet_groups for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists "bet_groups_update_admin" on public.bet_groups;
create policy "bet_groups_update_admin" on public.bet_groups for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);

drop policy if exists "bet_groups_delete_admin" on public.bet_groups;
create policy "bet_groups_delete_admin" on public.bet_groups for delete using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
);
