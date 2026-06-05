const MAX_SCORE = 99

/**
 * Normaliza texto digitado no palpite: só inteiros ≥ 0, sem zeros à esquerda (ex.: "01" → 1).
 */
export function parsePalpiteScoreInput(raw: string): number {
  const digits = raw.trim().replace(/\D/g, "")
  if (digits === "") return 0

  const withoutLeadingZeros = digits.replace(/^0+/, "") || "0"
  const value = Number(withoutLeadingZeros)
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(Math.floor(value), MAX_SCORE)
}

/** Valor seguro para enviar à API (nunca string com zero à esquerda). */
export function palpiteScoreForSubmit(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(Math.floor(value), MAX_SCORE)
}

/** Exibição no input controlado — nunca "01", "007", etc. */
export function formatPalpiteScoreDisplay(value: number): string {
  return String(palpiteScoreForSubmit(value))
}
