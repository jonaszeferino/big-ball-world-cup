export const DIASPORA_COOLDOWN_MS = 60_000

export type DiasporaCounterRow = {
  count: number
  last_click_at: string | null
  last_click_user_id: string | null
  last_click_display_name?: string | null
}

export type DiasporaCounterState = {
  count: number
  lastClickAt: string | null
  lastClickUserId: string | null
  lastClickDisplayName: string | null
  canClick: boolean
  cooldownUntil: string | null
  cooldownRemainingMs: number
}

export function computeDiasporaClickAccess(
  userId: string | null,
  lastClickUserId: string | null,
  lastClickAt: string | null,
  nowMs = Date.now(),
): Pick<DiasporaCounterState, "canClick" | "cooldownUntil" | "cooldownRemainingMs"> {
  if (!userId) {
    return { canClick: false, cooldownUntil: null, cooldownRemainingMs: 0 }
  }
  if (!lastClickAt || !lastClickUserId) {
    return { canClick: true, cooldownUntil: null, cooldownRemainingMs: 0 }
  }
  if (lastClickUserId === userId) {
    return { canClick: true, cooldownUntil: null, cooldownRemainingMs: 0 }
  }

  const cooldownUntilMs = Date.parse(lastClickAt) + DIASPORA_COOLDOWN_MS
  if (nowMs >= cooldownUntilMs) {
    return { canClick: true, cooldownUntil: null, cooldownRemainingMs: 0 }
  }

  return {
    canClick: false,
    cooldownUntil: new Date(cooldownUntilMs).toISOString(),
    cooldownRemainingMs: cooldownUntilMs - nowMs,
  }
}

export function buildDiasporaCounterState(
  row: DiasporaCounterRow,
  userId: string | null,
  nowMs = Date.now(),
): DiasporaCounterState {
  const access = computeDiasporaClickAccess(userId, row.last_click_user_id, row.last_click_at, nowMs)
  return {
    count: row.count,
    lastClickAt: row.last_click_at,
    lastClickUserId: row.last_click_user_id,
    lastClickDisplayName: row.last_click_display_name ?? null,
    ...access,
  }
}

export function formatDiasporaCooldown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds))
  const m = Math.floor(s / 60)
  const rest = s % 60
  if (m <= 0) return `${rest}s`
  return `${m}:${String(rest).padStart(2, "0")}`
}

export type DiasporaRpcPayload = {
  ok?: boolean
  code?: string
  message?: string
  count?: number | string
  last_click_at?: string | null
  last_click_user_id?: string | null
  last_click_display_name?: string | null
  cooldown_until?: string | null
  cooldown_remaining_ms?: number | string
}

export function rowFromRpcPayload(payload: DiasporaRpcPayload): DiasporaCounterRow {
  return {
    count: Number(payload.count ?? 0),
    last_click_at: payload.last_click_at ?? null,
    last_click_user_id: payload.last_click_user_id ?? null,
    last_click_display_name: payload.last_click_display_name ?? null,
  }
}

export function stateFromRpcPayload(
  payload: DiasporaRpcPayload,
  userId: string | null,
  nowMs = Date.now(),
): DiasporaCounterState & { ok: boolean; message?: string } {
  const row = rowFromRpcPayload(payload)
  const state = buildDiasporaCounterState(row, userId, nowMs)
  const cooldownRemainingMs =
    payload.cooldown_remaining_ms != null ? Number(payload.cooldown_remaining_ms) : state.cooldownRemainingMs

  return {
    ...state,
    ok: payload.ok === true,
    message: payload.message,
    cooldownUntil: payload.cooldown_until ?? state.cooldownUntil,
    cooldownRemainingMs,
  }
}

export const EMPTY_DIASPORA_STATE: DiasporaCounterState = {
  count: 0,
  lastClickAt: null,
  lastClickUserId: null,
  lastClickDisplayName: null,
  canClick: true,
  cooldownUntil: null,
  cooldownRemainingMs: 0,
}
