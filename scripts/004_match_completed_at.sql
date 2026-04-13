-- Marca quando a partida foi concluida no bolao (placar oficial registado).
-- Usado com status = 'finished' para o ranking contar so apostas dessas partidas.

alter table public.matches
  add column if not exists completed_at timestamptz;

comment on column public.matches.completed_at is 'Preenchido quando o admin fecha o jogo (resultado oficial). Ranking usa partidas com status finished / completed_at.';

-- Partidas ja encerradas antes da migracao
update public.matches
set completed_at = coalesce(completed_at, created_at)
where status = 'finished'
  and completed_at is null;
