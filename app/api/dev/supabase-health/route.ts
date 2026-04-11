import { NextResponse } from "next/server"

/**
 * Teste local: com `pnpm dev` ou `yarn dev`, abre
 * http://localhost:3000/api/dev/supabase-health
 *
 * Em `next build && next start` (NODE_ENV=production) esta rota responde 404
 * para nao expor em producao. Para forcar: SUPABASE_HEALTH=1
 */
export async function GET() {
  const allow =
    process.env.NODE_ENV !== "production" || process.env.SUPABASE_HEALTH === "1"
  if (!allow) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        step: "env",
        error: "Faltam NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY",
        hint: "Usa NOME=valor no .env.local (um = so), guarda o ficheiro e reinicia o dev server",
      },
      { status: 500 },
    )
  }

  try {
    const rest = await fetch(`${url}/rest/v1/teams?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    })

    const bodyText = await rest.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(bodyText)
    } catch {
      parsed = bodyText.slice(0, 200)
    }

    if (!rest.ok) {
      return NextResponse.json(
        {
          ok: false,
          step: "rest",
          status: rest.status,
          supabase: parsed,
          hint:
            rest.status === 401 || rest.status === 403
              ? "Chave anon invalida ou projeto pausado no Supabase"
              : rest.status === 404
                ? "Tabela teams inexistente — corre o SQL em scripts/ no SQL Editor"
                : "Ver mensagem em supabase acima",
        },
        { status: 200 },
      )
    }

    return NextResponse.json({
      ok: true,
      step: "rest",
      message: "Supabase acessivel: pedido anon a public.teams funcionou",
      sample: parsed,
    })
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        step: "network",
        error: e instanceof Error ? e.message : String(e),
        hint: "Firewall, URL errada, ou projeto Supabase offline",
      },
      { status: 500 },
    )
  }
}
