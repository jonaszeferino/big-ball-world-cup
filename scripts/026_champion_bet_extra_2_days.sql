-- Prazo fixo do palpite do campeão: até 08/07/2026 23:59:59 (horário de Brasília).
-- Executar no SQL Editor do Supabase (obrigatório para liberar alterações).

create or replace function public.champion_bet_deadline_at()
returns timestamptz
language sql
stable
set search_path = public
as $$
  select timezone('America/Sao_Paulo', timestamp '2026-07-08 23:59:59');
$$;
