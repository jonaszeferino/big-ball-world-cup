"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { clearAuthSession, isInvalidRefreshTokenError } from "@/lib/supabase/auth-session"

const PROTECTED_PREFIXES = ["/matches", "/ranking", "/scorers", "/groups", "/admin"]

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/** Limpa cookies de sessão inválidos e redireciona para login quando necessário. */
export function AuthSessionRepair() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function repair() {
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.getUser()
        if (cancelled || !error || !isInvalidRefreshTokenError(error)) return

        await clearAuthSession(supabase)
        if (cancelled) return

        if (isProtectedPath(pathname)) {
          router.replace("/auth/login")
        } else {
          router.refresh()
        }
      } catch {
        /* env inválido ou Supabase indisponível */
      }
    }

    void repair()
    return () => {
      cancelled = true
    }
  }, [pathname, router])

  return null
}
