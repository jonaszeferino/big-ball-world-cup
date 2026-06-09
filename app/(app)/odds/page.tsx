"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, TrendingUp } from "lucide-react"
import { CountryFlag } from "@/components/country-flag"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMatchDateTimeBrazilWithYear } from "@/lib/match-datetime-brazil"
import { Odds1x2Line } from "@/components/odds-1x2-line"

interface PreMatchOddsRow {
  id: string
  odds_api_event_id: number
  match_id: string | null
  home_name_app: string | null
  away_name_app: string | null
  home_name_api: string
  away_name_api: string
  event_date: string
  status: string | null
  kto_home: string | null
  kto_draw: string | null
  kto_away: string | null
  kto_url: string | null
  bet365_home: string | null
  bet365_draw: string | null
  bet365_away: string | null
  bet365_url: string | null
  synced_at: string
}

interface OddsMeta {
  last_synced_at: string | null
  events_total: number | null
  events_with_odds: number | null
}

function OddsCell({
  home,
  draw,
  away,
  url,
}: {
  home: string | null
  draw: string | null
  away: string | null
  url: string | null
}) {
  if (!home && !draw && !away) {
    return <span className="text-muted-foreground">—</span>
  }

  const content = (
    <Odds1x2Line home={home} draw={draw} away={away} className="text-sm" />
  )

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm underline-offset-4 hover:text-primary hover:underline"
        title="Abrir na casa de apostas"
      >
        {content}
      </a>
    )
  }

  return <span className="text-sm">{content}</span>
}

export default function OddsPage() {
  const [rows, setRows] = useState<PreMatchOddsRow[]>([])
  const [meta, setMeta] = useState<OddsMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/odds", { cache: "no-store" })
        const data = (await res.json()) as {
          rows?: PreMatchOddsRow[]
          meta?: OddsMeta
          error?: string
        }
        if (!res.ok) throw new Error(data.error ?? "Erro ao carregar odds")
        setRows(data.rows ?? [])
        setMeta(data.meta ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const upcoming = useMemo(() => {
    const now = Date.now()
    return rows.filter((r) => {
      const ms = new Date(r.event_date).getTime()
      return (r.status === "pending" || !r.status) && Number.isFinite(ms) && ms >= now - 60 * 60 * 1000
    })
  }, [rows])

  const lastSync = meta?.last_synced_at
    ? new Date(meta.last_synced_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : null

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Odds pré-jogo</h1>
        <p className="text-sm text-muted-foreground">
          Cotações 1X2 (casa · empate · fora) da KTO e Bet365 na Copa 2026. Dados salvos no bolão — atualizados
          manualmente pelo admin.
        </p>
        {lastSync ? (
          <p className="mt-1 text-xs text-muted-foreground">Última atualização: {lastSync}</p>
        ) : (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            Ainda não há odds sincronizadas. O admin precisa sincronizar no painel.
          </p>
        )}
      </div>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16">
          <TrendingUp className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma odd disponível para jogos futuros</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {upcoming.map((row) => {
            const homeName = row.home_name_app ?? row.home_name_api
            const awayName = row.away_name_app ?? row.away_name_api
            return (
              <Card key={row.id} className="rounded-2xl border-border/80 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <CountryFlag countryName={homeName} size="sm" />
                        {homeName}
                      </span>
                      <span className="mx-2 text-muted-foreground font-normal">vs</span>
                      <span className="inline-flex items-center gap-2">
                        <CountryFlag countryName={awayName} size="sm" />
                        {awayName}
                      </span>
                    </CardTitle>
                    <Badge variant="outline">{formatMatchDateTimeBrazilWithYear(row.event_date)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">KTO</p>
                    <p className="mb-2 text-[10px] text-muted-foreground">Casa · Empate · Fora</p>
                    <OddsCell
                      home={row.kto_home}
                      draw={row.kto_draw}
                      away={row.kto_away}
                      url={row.kto_url}
                    />
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bet365</p>
                    <p className="mb-2 text-[10px] text-muted-foreground">Casa · Empate · Fora</p>
                    <OddsCell
                      home={row.bet365_home}
                      draw={row.bet365_draw}
                      away={row.bet365_away}
                      url={row.bet365_url}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
