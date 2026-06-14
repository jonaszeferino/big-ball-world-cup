const STORAGE_KEY = "bbwc-matches-hide-finished"

export function readMatchesHideFinishedPref(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

export function writeMatchesHideFinishedPref(hideFinished: boolean): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, hideFinished ? "1" : "0")
  } catch {
    /* ignore */
  }
}
