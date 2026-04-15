/**
 * Resolve os confrontos dos 16-avos (rodada de 32) a partir das tabelas simuladas.
 * 1º/2º: posição na tabela do grupo.
 * 3º: escolhe-se uma combinação global de 8 terceiros (entre os 12 grupos) que encaixe nas 8 vagas
 * "3º de …" do chaveamento, minimizando a soma dos ranks (melhores terceiros possíveis).
 * Isto evita o erro da atribuição gananciosa (última vaga sem candidato).
 */

import { ROUND_OF_32_BRACKETS } from "@/lib/playoff-brackets"
import type { SimTeam, SimulatedTeamStats } from "@/lib/simulated-group-standings"

const GROUP_LETTERS = "ABCDEFGHIJKL".split("")

export type SimStandingRow = { team: SimTeam; stats: SimulatedTeamStats }

export interface ResolvedSlot {
  team: SimTeam | null
  /** Texto curto para mostrar ao lado: "1º do Grupo B", "2º do Grupo X", "3º do Grupo Y". */
  positionLabel: string
  /** Texto da regra quando não há equipa (ex.: falta de dados ou 3º não encaixa). */
  fallbackLabel: string
}

function compareStats(a: SimulatedTeamStats, b: SimulatedTeamStats): number {
  if (b.points !== a.points) return b.points - a.points
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
  return b.goalsFor - a.goalsFor
}

export function parseBracketLabel(
  label: string,
):
  | { kind: "first"; group: string }
  | { kind: "second"; group: string }
  | { kind: "third"; groups: string[] }
  | null {
  const m1 = label.match(/1º do Grupo ([A-L])/i)
  if (m1) return { kind: "first", group: m1[1].toUpperCase() }
  const m2 = label.match(/2º do Grupo ([A-L])/i)
  if (m2) return { kind: "second", group: m2[1].toUpperCase() }
  const m3 = label.match(/3º de ([A-Za-z]+(?:\/[A-Za-z]+)*)/i)
  if (m3) {
    const groups = m3[1].split("/").map((s) => s.toUpperCase())
    return { kind: "third", groups }
  }
  return null
}

type ThirdRanked = { group: string; row: SimStandingRow; rankIndex: number }

/** Ordem em que os vagos de 3º aparecem ao percorrer ROUND_OF_32_BRACKETS (tem de bater com resolveLabel). */
export function collectThirdSlotEligibles(): string[][] {
  const out: string[][] = []
  for (const b of ROUND_OF_32_BRACKETS) {
    const labels = [b.match1.team1, b.match1.team2]
    if (b.match2) {
      labels.push(b.match2.team1, b.match2.team2)
    }
    for (const label of labels) {
      const p = parseBracketLabel(label)
      if (p?.kind === "third") out.push(p.groups)
    }
  }
  return out
}

function buildAll12ThirdPlaces(standingsByGroup: Record<string, SimStandingRow[]>): ThirdRanked[] {
  const thirds: { group: string; row: SimStandingRow }[] = []
  for (const letter of GROUP_LETTERS) {
    const rows = standingsByGroup[letter]
    if (rows && rows.length >= 3) {
      thirds.push({ group: letter, row: rows[2] })
    }
  }
  thirds.sort((a, b) => compareStats(a.row.stats, b.row.stats))
  return thirds.map((t, rankIndex) => ({ ...t, rankIndex }))
}

/**
 * Encontra 8 terceiros distintos, um por vaga, respeitando os grupos elegíveis em cada vaga,
 * minimizando a soma dos rankIndex (melhores classificações globais).
 */
function findBestThirdAssignment(slots: string[][], allThirds: ThirdRanked[]): ThirdRanked[] | null {
  const n = slots.length
  if (n === 0) return []
  let best: ThirdRanked[] | null = null
  let bestSum = Infinity

  function dfs(i: number, used: Set<string>, current: ThirdRanked[]) {
    if (i === n) {
      const sum = current.reduce((s, t) => s + t.rankIndex, 0)
      if (sum < bestSum) {
        bestSum = sum
        best = [...current]
      }
      return
    }
    const eligible = slots[i]
    const candidates = allThirds.filter(
      (t) => !used.has(t.row.team.id) && eligible.includes(t.group),
    )
    for (const c of candidates) {
      used.add(c.row.team.id)
      current.push(c)
      dfs(i + 1, used, current)
      current.pop()
      used.delete(c.row.team.id)
    }
  }

  dfs(0, new Set(), [])
  return best
}

export interface SimulatedRoundOf32Bracket {
  key: number
  side: "A" | "B"
  fifaMatch1: number
  fifaMatch2: number
  match1: { team1: ResolvedSlot; team2: ResolvedSlot }
  match2?: { team1: ResolvedSlot; team2: ResolvedSlot }
}

export function resolveSimulatedRoundOf32(
  standingsByGroup: Record<string, SimStandingRow[]>,
): SimulatedRoundOf32Bracket[] {
  const thirdSlots = collectThirdSlotEligibles()
  const all12Thirds = buildAll12ThirdPlaces(standingsByGroup)
  const thirdAssignment = findBestThirdAssignment(thirdSlots, all12Thirds)
  let thirdSlotIndex = 0

  function slotFirst(group: string): ResolvedSlot {
    const pos = `1º do Grupo ${group}`
    const rows = standingsByGroup[group]
    if (!rows?.[0]) return { team: null, positionLabel: pos, fallbackLabel: `1º Grupo ${group}` }
    return { team: rows[0].team, positionLabel: pos, fallbackLabel: "" }
  }

  function slotSecond(group: string): ResolvedSlot {
    const pos = `2º do Grupo ${group}`
    const rows = standingsByGroup[group]
    if (!rows?.[1]) return { team: null, positionLabel: pos, fallbackLabel: `2º Grupo ${group}` }
    return { team: rows[1].team, positionLabel: pos, fallbackLabel: "" }
  }

  function slotThird(label: string): ResolvedSlot {
    const pick = thirdAssignment?.[thirdSlotIndex] ?? null
    thirdSlotIndex++
    const p = parseBracketLabel(label)
    const g = p?.kind === "third" ? p.groups : []
    const posFromBracket = `3º de ${g.join("/")}`
    if (!pick) {
      return {
        team: null,
        positionLabel: posFromBracket,
        fallbackLabel: `3º (${g.join("/")})`,
      }
    }
    return {
      team: pick.row.team,
      positionLabel: `3º do Grupo ${pick.group}`,
      fallbackLabel: "",
    }
  }

  function resolveLabel(label: string): ResolvedSlot {
    const p = parseBracketLabel(label)
    if (!p) return { team: null, positionLabel: label, fallbackLabel: label }
    if (p.kind === "first") return slotFirst(p.group)
    if (p.kind === "second") return slotSecond(p.group)
    return slotThird(label)
  }

  return ROUND_OF_32_BRACKETS.map((bracket) => ({
    key: bracket.key,
    side: bracket.side,
    fifaMatch1: bracket.fifaMatch1,
    fifaMatch2: bracket.fifaMatch2,
    match1: {
      team1: resolveLabel(bracket.match1.team1),
      team2: resolveLabel(bracket.match1.team2),
    },
    match2: bracket.match2
      ? {
          team1: resolveLabel(bracket.match2.team1),
          team2: resolveLabel(bracket.match2.team2),
        }
      : undefined,
  }))
}
