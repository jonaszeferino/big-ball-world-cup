-- Impede insert/update de apostas depois do instante de início da partida (match_date em timestamptz).
-- Executar o ficheiro inteiro no SQL Editor (não só uma linha).

create or replace function public.prevent_bet_after_match_start()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m timestamptz;
begin
  select match_date into m from public.matches where id = new.match_id;
  if m is null then
    raise exception 'Partida não encontrada';
  end if;
  if now() >= m then
    raise exception 'Apostas encerradas após o início da partida.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bets_prevent_after_kickoff on public.bets;

-- Uma única instrução (PG 14+): EXECUTE FUNCTION …
create trigger trg_bets_prevent_after_kickoff
before insert or update on public.bets
for each row execute function public.prevent_bet_after_match_start();
