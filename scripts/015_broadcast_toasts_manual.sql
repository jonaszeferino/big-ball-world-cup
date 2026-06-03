-- Corrige avisos manuais: match_id e placares podem ser NULL (avisos sem partida).
-- Idempotente — podes correr mesmo que já tenhas corrido 014.

alter table public.match_score_banter alter column match_id drop not null;
alter table public.match_score_banter alter column prev_home drop not null;
alter table public.match_score_banter alter column prev_away drop not null;
alter table public.match_score_banter alter column new_home drop not null;
alter table public.match_score_banter alter column new_away drop not null;

-- Opcional (não usado pelo app): coluna kind para relatórios
alter table public.match_score_banter add column if not exists kind text;

update public.match_score_banter set kind = 'score' where kind is null and match_id is not null;
update public.match_score_banter set kind = 'manual' where kind is null and match_id is null;

-- Realtime: Database → Replication → supabase_realtime → match_score_banter
