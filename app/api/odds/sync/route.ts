import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAppAdminEmail } from "@/lib/app-admin"
import { syncPreMatchOdds } from "@/lib/odds-sync"

export const maxDuration = 300

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) }
  if (!isAppAdminEmail(user.email)) {
    return { supabase, user: null, error: NextResponse.json({ error: "Sem permissão" }, { status: 403 }) }
  }
  return { supabase, user, error: null }
}

export async function POST() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const result = await syncPreMatchOdds(auth.supabase, auth.user!.id)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao sincronizar odds"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
