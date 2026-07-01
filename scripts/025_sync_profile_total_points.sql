-- Recalcula profiles.total_points a partir de bets.points_earned (jogos encerrados) + champion_bets.
-- O ranking na app usa essa mesma fórmula; este script alinha a coluna total_points do perfil.
-- Executar no SQL Editor do Supabase quando houver divergência.

update public.profiles p
set total_points = coalesce(t.computed_total, 0)
from (
  select
    pr.id as user_id,
    coalesce(bet_pts.points, 0) + coalesce(champ_pts.points, 0) as computed_total
  from public.profiles pr
  left join (
    select
      bt.user_id,
      sum(coalesce(bt.points_earned, 0)) as points
    from public.bets bt
    inner join public.matches m on m.id = bt.match_id
    where m.status = 'finished'
      and m.home_score is not null
      and m.away_score is not null
    group by bt.user_id
  ) bet_pts on bet_pts.user_id = pr.id
  left join (
    select user_id, sum(coalesce(points_earned, 0)) as points
    from public.champion_bets
    group by user_id
  ) champ_pts on champ_pts.user_id = pr.id
) t
where p.id = t.user_id
  and p.total_points is distinct from coalesce(t.computed_total, 0);
