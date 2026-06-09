import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAppAdminEmail } from "@/lib/app-admin"
import type { OddsSyncBookmaker } from "@/lib/odds-api"
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

function parseBookmaker(body: unknown): OddsSyncBookmaker | null {
  if (!body || typeof body !== "object") return "both"
  const value = (body as { bookmaker?: unknown }).bookmaker
  if (value === "KTO" || value === "Bet365" || value === "both") return value
  return null
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const bookmaker = parseBookmaker(body)
  if (!bookmaker) {
    return NextResponse.json({ error: "bookmaker inválido (KTO, Bet365 ou both)" }, { status: 400 })
  }

  try {
    const result = await syncPreMatchOdds(auth.supabase, auth.user!.id, bookmaker)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao sincronizar odds"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
