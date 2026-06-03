import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAppAdminEmail } from "@/lib/app-admin"
import { insertBroadcastToast } from "@/lib/broadcast-toast"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) }
  if (!isAppAdminEmail(user.email)) {
    return { supabase, error: NextResponse.json({ error: "Sem permissão" }, { status: 403 }) }
  }
  return { supabase, error: null }
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase
    .from("match_score_banter")
    .select("id, match_id, title, message, created_at")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rows: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error
  const supabase = auth.supabase

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { title, message } = body as Record<string, unknown>
  const t = typeof title === "string" ? title.trim() : ""
  const m = typeof message === "string" ? message.trim() : ""

  if (!t || !m) {
    return NextResponse.json({ error: "Título e mensagem são obrigatórios" }, { status: 400 })
  }
  if (t.length > 120) {
    return NextResponse.json({ error: "Título demasiado longo (máx. 120)" }, { status: 400 })
  }
  if (m.length > 800) {
    return NextResponse.json({ error: "Mensagem demasiado longa (máx. 800)" }, { status: 400 })
  }

  const { id, error } = await insertBroadcastToast(supabase, {
    kind: "manual",
    title: t,
    message: m,
  })

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id })
}
