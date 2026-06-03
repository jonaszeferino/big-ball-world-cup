const STORAGE_PREFIX = "bbwc-broadcast-shown"
const MAX_STORED = 120

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

export function getShownBroadcastIds(userId: string): Set<string> {
  if (typeof window === "undefined" || !userId) return new Set()
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function markBroadcastShown(userId: string, id: string) {
  if (typeof window === "undefined" || !userId || !id) return
  markBroadcastsShown(userId, [id])
}

export function markBroadcastsShown(userId: string, ids: string[]) {
  if (typeof window === "undefined" || !userId || ids.length === 0) return
  try {
    const set = getShownBroadcastIds(userId)
    for (const id of ids) set.add(id)
    const trimmed = [...set].slice(-MAX_STORED)
    localStorage.setItem(storageKey(userId), JSON.stringify(trimmed))
  } catch {
    /* ignore */
  }
}

export function isBroadcastShown(userId: string, id: string): boolean {
  if (!userId || !id) return true
  return getShownBroadcastIds(userId).has(id)
}
