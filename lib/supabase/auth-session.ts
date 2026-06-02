import type { AuthError, Session, User } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

/** Erro comum quando cookies guardam um refresh token revogado ou expirado. */
export function isInvalidRefreshTokenError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false
  const message = "message" in err ? String((err as { message: unknown }).message) : ""
  const code = "code" in err ? String((err as { code: unknown }).code) : ""
  return (
    code === "refresh_token_not_found" ||
    message.includes("Refresh Token Not Found") ||
    message.includes("Invalid Refresh Token") ||
    message.includes("refresh_token")
  )
}

/** Remove sessão local (cookies) sem chamar o servidor — evita loop quando o token já é inválido. */
export async function clearAuthSession(supabase: SupabaseClient): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "local" })
  } catch {
    /* ignore */
  }
}

export async function getUserSafe(
  supabase: SupabaseClient,
): Promise<{ user: User | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getUser()
  if (error && isInvalidRefreshTokenError(error)) {
    await clearAuthSession(supabase)
    return { user: null, error: null }
  }
  return { user: data.user, error }
}

export async function getSessionSafe(
  supabase: SupabaseClient,
): Promise<{ session: Session | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getSession()
  if (error && isInvalidRefreshTokenError(error)) {
    await clearAuthSession(supabase)
    return { session: null, error: null }
  }
  return { session: data.session, error }
}
