"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw } from "lucide-react"
import type { OddsSyncBookmaker } from "@/lib/odds-api"

interface SyncMeta {
  last_synced_at: string | null
  events_total: number | null
  events_with_odds: number | null
  last_error: string | null
}

const BOOKMAKER_LABEL: Record<OddsSyncBookmaker, string> = {
  KTO: "KTO",
  Bet365: "Bet365",
  both: "KTO + Bet365",
}

export function AdminOddsSync() {
  const [meta, setMeta] = useState<SyncMeta | null>(null)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [syncing, setSyncing] = useState<OddsSyncBookmaker | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true)
    try {
      const res = await fetch("/api/odds", { cache: "no-store" })
      const data = (await res.json()) as { meta?: SyncMeta; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar meta")
      setMeta(data.meta ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar")
    } finally {
      setLoadingMeta(false)
    }
  }, [])

  useEffect(() => {
    void loadMeta()
  }, [loadMeta])

  async function handleSync(bookmaker: OddsSyncBookmaker) {
    setSyncing(bookmaker)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch("/api/odds/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmaker }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        bookmaker?: OddsSyncBookmaker
        eventsTotal?: number
        eventsWithOdds?: number
        eventsMissingOdds?: number
        upserted?: number
        apiCalls?: number
        errors?: string[]
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? "Falha na sincronização")

      const label = BOOKMAKER_LABEL[data.bookmaker ?? bookmaker]
      const missing = data.eventsMissingOdds ?? 0
      setMessage(
        `${label}: ${data.upserted ?? 0} jogos atualizados (${data.eventsWithOdds ?? 0}/${data.eventsTotal ?? 0} com odds). ${missing} sem odds foram sincronizados primeiro. ~${data.apiCalls ?? "?"} chamadas à API.`,
      )
      if (data.errors?.length) {
        setError(`${data.errors.length} aviso(s): ${data.errors.slice(0, 2).join(" · ")}`)
      }
      await loadMeta()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao sincronizar")
    } finally {
      setSyncing(null)
    }
  }

  const lastSyncLabel = meta?.last_synced_at
    ? new Date(meta.last_synced_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "Nunca"

  const busy = syncing !== null

  return (
    <Card className="rounded-2xl border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>Odds pré-jogo (odds-api.io)</CardTitle>
        <CardDescription>
          A API gratuita tem limite diário de chamadas. Jogos ainda sem odds são sincronizados primeiro; os demais vêm
          depois. Sincronize uma casa por vez para economizar crédito — os dados da outra casa já salvos no banco são
          preservados.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loadingMeta ? (
          <p className="text-sm text-muted-foreground">Carregando estado…</p>
        ) : (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Última sync</dt>
              <dd className="font-medium text-foreground">{lastSyncLabel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Jogos com odds (última sync)</dt>
              <dd className="font-medium text-foreground">
                {meta?.events_with_odds ?? 0} / {meta?.events_total ?? 0}
              </dd>
            </div>
          </dl>
        )}

        {meta?.last_error ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">Último aviso: {meta.last_error}</p>
        ) : null}

        {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" variant="default" disabled={busy} onClick={() => void handleSync("Bet365")}>
            {syncing === "Bet365" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bet365…
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar Bet365
              </>
            )}
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void handleSync("KTO")}>
            {syncing === "KTO" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                KTO…
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar KTO
              </>
            )}
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void handleSync("both")}>
            {syncing === "both" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ambas…
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar KTO + Bet365
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Cada execução usa ~105 chamadas (1 para listar jogos + 1 por partida). Sincronizar só Bet365 ou só KTO consome
          o mesmo número de chamadas, mas você pode dividir em dias diferentes e preencher uma casa por vez — os dados da
          outra casa já salvos no banco não são apagados.
        </p>
      </CardContent>
    </Card>
  )
}
