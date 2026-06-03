-- DESATIVADO: insert aberto para qualquer utilizador autenticado.
-- Grupos de apostas são só do organizador — corre scripts/018_bet_groups_app_admin_only.sql

drop policy if exists "bet_groups_insert_authenticated" on public.bet_groups;
