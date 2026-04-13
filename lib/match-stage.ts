/** Fases eliminatórias (16-avos em diante): pode haver desempate por penáltis após empate no tempo regular. */
export const KNOCKOUT_ELIMINATION_STAGES = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
] as const

export type KnockoutEliminationStage = (typeof KNOCKOUT_ELIMINATION_STAGES)[number]

export function isKnockoutEliminationStage(stage: string): boolean {
  return (KNOCKOUT_ELIMINATION_STAGES as readonly string[]).includes(stage)
}

/** Empate no marcador que, nesta fase, obriga a registar penáltis com vencedor. */
export function requiresPenaltyScores(stage: string, homeGoals: number, awayGoals: number): boolean {
  return isKnockoutEliminationStage(stage) && homeGoals === awayGoals
}

export function validatePenaltyPair(
  homePens: number | null | undefined,
  awayPens: number | null | undefined,
): { ok: true } | { ok: false; message: string } {
  if (homePens == null || awayPens == null) {
    return { ok: false, message: "Indique o resultado dos penáltis (dois valores)." }
  }
  if (homePens < 0 || awayPens < 0) {
    return { ok: false, message: "Penáltis não podem ser negativos." }
  }
  if (homePens === awayPens) {
    return { ok: false, message: "Nos penáltis tem de haver um vencedor (valores diferentes)." }
  }
  return { ok: true }
}

/** W / L / T para tabela oficial (empate no tempo + penáltis define vencedor no mata-mata). */
export function getOfficialResultLetters(
  homeGoals: number,
  awayGoals: number,
  stage: string,
  homePens?: number | null,
  awayPens?: number | null,
): { home: string; away: string } {
  if (homeGoals > awayGoals) return { home: "W", away: "L" }
  if (homeGoals < awayGoals) return { home: "L", away: "W" }
  if (requiresPenaltyScores(stage, homeGoals, awayGoals)) {
    const v = validatePenaltyPair(homePens, awayPens)
    if (v.ok) {
      return (homePens as number) > (awayPens as number)
        ? { home: "W", away: "L" }
        : { home: "L", away: "W" }
    }
  }
  return { home: "T", away: "T" }
}

