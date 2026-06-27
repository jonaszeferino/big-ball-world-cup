-- Contador de Diáspora: contador global com cooldown de 1 minuto para quem não clicou por último.

create table if not exists public.diaspora_counter (
  id smallint primary key default 1 check (id = 1),
  count bigint not null default 0,
  last_click_user_id uuid references auth.users (id) on delete set null,
  last_click_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.diaspora_counter (id, count)
values (1, 0)
on conflict (id) do nothing;

alter table public.diaspora_counter enable row level security;

drop policy if exists "diaspora_counter_select_authenticated" on public.diaspora_counter;
create policy "diaspora_counter_select_authenticated" on public.diaspora_counter
  for select using (auth.uid() is not null);

create or replace function public.increment_diaspora_counter()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row diaspora_counter%rowtype;
  cooldown interval := interval '1 minute';
  cooldown_end timestamptz;
  clicker_name text;
begin
  if uid is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'unauthenticated',
      'message', 'Não autenticado'
    );
  end if;

  select * into row from diaspora_counter where id = 1 for update;

  if not found then
    insert into diaspora_counter (id, count) values (1, 0)
    returning * into row;
  end if;

  if row.last_click_at is not null
     and row.last_click_user_id is distinct from uid
     and now() < row.last_click_at + cooldown then
    cooldown_end := row.last_click_at + cooldown;
    select display_name into clicker_name from profiles where id = row.last_click_user_id;

    return jsonb_build_object(
      'ok', false,
      'code', 'cooldown',
      'message',
      format(
        'Aguarde 1 minuto — %s gerou o último +1. Só quem clicou pode somar de novo nesse intervalo.',
        coalesce(clicker_name, 'Alguém')
      ),
      'count', row.count,
      'last_click_at', row.last_click_at,
      'last_click_user_id', row.last_click_user_id,
      'last_click_display_name', clicker_name,
      'cooldown_until', cooldown_end,
      'cooldown_remaining_ms',
      greatest(0, (extract(epoch from (cooldown_end - now())) * 1000)::bigint)
    );
  end if;

  update diaspora_counter
  set
    count = count + 1,
    last_click_user_id = uid,
    last_click_at = now(),
    updated_at = now()
  where id = 1
  returning * into row;

  select display_name into clicker_name from profiles where id = uid;

  return jsonb_build_object(
    'ok', true,
    'count', row.count,
    'last_click_at', row.last_click_at,
    'last_click_user_id', row.last_click_user_id,
    'last_click_display_name', clicker_name,
    'cooldown_until', null,
    'cooldown_remaining_ms', 0
  );
end;
$$;

revoke all on function public.increment_diaspora_counter() from public;
grant execute on function public.increment_diaspora_counter() to authenticated;

alter table public.diaspora_counter replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.diaspora_counter;
exception
  when duplicate_object then null;
end $$;
