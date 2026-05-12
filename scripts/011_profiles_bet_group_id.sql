-- Liga cada perfil a um grupo de apostas (um grupo por apostador).
-- Idempotente se a coluna já existir.

alter table public.profiles
  add column if not exists bet_group_id bigint references public.bet_groups (id) on delete set null;

create index if not exists profiles_bet_group_id_idx on public.profiles (bet_group_id);

-- Opcional: migrar membros antigos da tabela bet_group_members (se a usaste antes).
-- insert into public.profiles (id, bet_group_id)
-- select user_id, bet_group_id from public.bet_group_members b
-- on conflict (id) do update set bet_group_id = excluded.bet_group_id;
-- (Comentado — só descomenta se tiveres dados em bet_group_members e quiseres importar.)
