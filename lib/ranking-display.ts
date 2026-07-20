export type RankedPlayerBase = {
  id: string
  display_name: string
  status_message: string | null
  total_points: number
  group_points: number
  knockout_points: number
  exact_hits: number
  result_hits: number
}

export function sortPlayersByTotal<T extends RankedPlayerBase>(a: T, b: T): number {
  if (b.total_points !== a.total_points) return b.total_points - a.total_points
  if (b.exact_hits !== a.exact_hits) return b.exact_hits - a.exact_hits
  if (b.result_hits !== a.result_hits) return b.result_hits - a.result_hits
  return a.display_name.localeCompare(b.display_name, "pt")
}

export function sameTotalRank(a: RankedPlayerBase, b: RankedPlayerBase): boolean {
  return (
    a.total_points === b.total_points &&
    a.exact_hits === b.exact_hits &&
    a.result_hits === b.result_hits
  )
}

export type RankedEntry<T extends RankedPlayerBase> = {
  player: T
  rank: number
}

export function buildTotalRankings<T extends RankedPlayerBase>(players: T[]): RankedEntry<T>[] {
  const sorted = [...players].sort(sortPlayersByTotal)
  const out: RankedEntry<T>[] = []
  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i]!
    if (i === 0) {
      out.push({ player, rank: 1 })
      continue
    }
    const prev = out[i - 1]!
    out.push({
      player,
      rank: sameTotalRank(player, prev.player) ? prev.rank : i + 1,
    })
  }
  return out
}

export function entriesAtRank<T extends RankedPlayerBase>(
  entries: RankedEntry<T>[],
  rank: number,
): RankedEntry<T>[] {
  return entries.filter((e) => e.rank === rank)
}

export function findPlayerRank<T extends RankedPlayerBase>(
  entries: RankedEntry<T>[],
  playerId: string,
): RankedEntry<T> | null {
  return entries.find((e) => e.player.id === playerId) ?? null
}

export function sortByGroupPoints<T extends RankedPlayerBase>(a: T, b: T): number {
  if (b.group_points !== a.group_points) return b.group_points - a.group_points
  if (b.exact_hits !== a.exact_hits) return b.exact_hits - a.exact_hits
  return a.display_name.localeCompare(b.display_name, "pt")
}

export function sortByKnockoutPoints<T extends RankedPlayerBase>(a: T, b: T): number {
  if (b.knockout_points !== a.knockout_points) return b.knockout_points - a.knockout_points
  if (b.exact_hits !== a.exact_hits) return b.exact_hits - a.exact_hits
  return a.display_name.localeCompare(b.display_name, "pt")
}
