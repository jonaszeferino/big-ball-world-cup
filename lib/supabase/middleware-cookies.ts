import type { NextRequest } from 'next/server'

/** Igual a `@supabase/ssr` cookies.ts — valor guardado como `base64-` + Base64URL (UTF-8). */
const BASE64_COOKIE_PREFIX = "base64-"

/** Chave do cookie de sessão SSR (`sb-<project-ref>-auth-token`). */
export function supabaseAuthCookieBaseKey(supabaseUrl: string): string | null {
  try {
    const host = new URL(supabaseUrl).hostname
    const ref = host.split('.')[0]
    if (!ref) return null
    return `sb-${ref}-auth-token`
  } catch {
    return null
  }
}

function readCookieJoined(request: NextRequest, baseKey: string): string | null {
  const direct = request.cookies.get(baseKey)?.value
  if (direct) return direct
  const chunks: string[] = []
  for (let i = 0; i < 20; i++) {
    const v = request.cookies.get(`${baseKey}.${i}`)?.value
    if (v === undefined) break
    chunks.push(v)
  }
  return chunks.length > 0 ? chunks.join('') : null
}

function base64DecodeUtf8(b64: string): string {
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/') + pad
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

type StoredAuth = {
  access_token?: string
  refresh_token?: string
  user?: { id?: string }
}

/** Reverte o encoding do `createBrowserClient` (prefixo + Base64URL). */
function decodeSupabaseStoredCookiePayload(raw: string): string | null {
  try {
    if (raw.startsWith(BASE64_COOKIE_PREFIX)) {
      const b64url = raw.slice(BASE64_COOKIE_PREFIX.length)
      return base64DecodeUtf8(b64url)
    }
    return raw
  } catch {
    return null
  }
}

function parseStoredAuth(raw: string): StoredAuth | null {
  const candidates: string[] = []
  const decoded = decodeSupabaseStoredCookiePayload(raw)
  if (decoded) candidates.push(decoded)
  candidates.push(raw)
  try {
    candidates.push(decodeURIComponent(raw))
  } catch {
    /* ignore */
  }

  for (const str of candidates) {
    try {
      const v = JSON.parse(str) as StoredAuth
      if (v && (v.access_token || v.refresh_token)) return v
    } catch {
      continue
    }
  }
  return null
}

function jwtSubAndExp(accessToken: string): { sub: string; exp: number } | null {
  try {
    const parts = accessToken.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(base64DecodeUtf8(parts[1])) as { sub?: string; exp?: number }
    if (!payload.sub || typeof payload.exp !== 'number') return null
    return { sub: payload.sub, exp: payload.exp }
  } catch {
    return null
  }
}

/**
 * Utilizador a partir dos cookies do Supabase, sem `fetch` (necessário na Edge do Next
 * quando o refresh ao servidor falha com "fetch failed").
 */
export function getSupabaseUserFromRequestCookies(
  request: NextRequest,
  supabaseUrl: string,
): { id: string } | null {
  const baseKey = supabaseAuthCookieBaseKey(supabaseUrl)
  if (!baseKey) return null

  const raw = readCookieJoined(request, baseKey)
  if (!raw) return null

  const stored = parseStoredAuth(raw)
  if (!stored) return null

  const nowSec = Math.floor(Date.now() / 1000)

  if (stored.access_token) {
    const claims = jwtSubAndExp(stored.access_token)
    if (claims && claims.exp >= nowSec - 90) {
      return { id: claims.sub }
    }
  }

  if (stored.refresh_token && stored.user?.id) {
    return { id: stored.user.id }
  }

  if (stored.access_token) {
    const claims = jwtSubAndExp(stored.access_token)
    if (claims) return { id: claims.sub }
  }

  return null
}
