-- Permitir que qualquer utilizador autenticado crie um grupo na página /groups.
-- Complementa 008_bet_groups.sql (mantém insert admin para redundância).

drop policy if exists "bet_groups_insert_authenticated" on public.bet_groups;
create policy "bet_groups_insert_authenticated" on public.bet_groups for insert with check (auth.uid() is not null);
