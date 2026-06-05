const STORAGE_PREFIX = "bbwc-kickoff-reminder-shown"
const MAX_STORED = 80

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

export function isKickoffReminderShown(userId: string, matchId: string): boolean {
  if (!userId || !matchId) return true
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return false
    return (JSON.parse(raw) as string[]).includes(matchId)
  } catch {
    return false
  }
}

export function markKickoffReminderShown(userId: string, matchId: string) {
  if (typeof window === "undefined" || !userId || !matchId) return
  try {
    const raw = localStorage.getItem(storageKey(userId))
    const ids = raw ? (JSON.parse(raw) as string[]) : []
    if (ids.includes(matchId)) return
    ids.push(matchId)
    localStorage.setItem(storageKey(userId), JSON.stringify(ids.slice(-MAX_STORED)))
  } catch {
    /* ignore */
  }
}
