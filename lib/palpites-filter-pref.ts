const STORAGE_KEY = "bbwc-palpites-filter"

export type PalpitesFilterPref = "upcoming" | "revealed" | "all"

const VALID: PalpitesFilterPref[] = ["upcoming", "revealed", "all"]

export function readPalpitesFilterPref(): PalpitesFilterPref {
  if (typeof window === "undefined") return "upcoming"
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && VALID.includes(raw as PalpitesFilterPref)) {
      return raw as PalpitesFilterPref
    }
  } catch {
    /* ignore */
  }
  return "upcoming"
}

export function writePalpitesFilterPref(filter: PalpitesFilterPref): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, filter)
  } catch {
    /* ignore */
  }
}
