-- Correção rápida se aparecer "column match_score_banter.kind does not exist"
-- ou se avisos manuais falharem por match_id NOT NULL.
-- Corre uma vez no SQL Editor do Supabase.

alter table public.match_score_banter add column if not exists kind text;

alter table public.match_score_banter alter column match_id drop not null;
alter table public.match_score_banter alter column prev_home drop not null;
alter table public.match_score_banter alter column prev_away drop not null;
alter table public.match_score_banter alter column new_home drop not null;
alter table public.match_score_banter alter column new_away drop not null;

update public.match_score_banter set kind = 'score' where kind is null and match_id is not null;
update public.match_score_banter set kind = 'manual' where kind is null and match_id is null;
