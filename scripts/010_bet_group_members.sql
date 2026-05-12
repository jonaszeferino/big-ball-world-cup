-- Legado: membros em tabela separada. O app passou a usar profiles.bet_group_id (ver 011).
-- Podes ignorar este ficheiro em projetos novos.

-- Membros de grupos de apostas (para ranking por grupo).

create table if not exists public.bet_group_members (
  bet_group_id bigint not null references public.bet_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (bet_group_id, user_id)
);

create index if not exists bet_group_members_user_id_idx on public.bet_group_members (user_id);

alter table public.bet_group_members enable row level security;

drop policy if exists "bet_group_members_select_all" on public.bet_group_members;
create policy "bet_group_members_select_all" on public.bet_group_members for select using (true);

drop policy if exists "bet_group_members_insert_own" on public.bet_group_members;
create policy "bet_group_members_insert_own" on public.bet_group_members for insert with check (
  auth.uid() is not null and auth.uid() = user_id
);

drop policy if exists "bet_group_members_delete_own" on public.bet_group_members;
create policy "bet_group_members_delete_own" on public.bet_group_members for delete using (auth.uid() = user_id);
