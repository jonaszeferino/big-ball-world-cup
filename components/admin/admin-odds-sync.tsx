"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw } from "lucide-react"

interface SyncMeta {
  last_synced_at: string | null
  events_total: number | null
  events_with_odds: number | null
  last_error: string | null
}

export function AdminOddsSync() {
  const [meta, setMeta] = useState<SyncMeta | null>(null)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [syncing, setSyncing] = useState(false)
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

  async function handleSync() {
    setSyncing(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch("/api/odds/sync", { method: "POST" })
      const data = (await res.json()) as {
        ok?: boolean
        eventsTotal?: number
        eventsWithOdds?: number
        upserted?: number
        errors?: string[]
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? "Falha na sincronização")

      setMessage(
        `Sincronizado: ${data.upserted ?? 0} jogos (${data.eventsWithOdds ?? 0}/${data.eventsTotal ?? 0} com odds KTO/Bet365).`,
      )
      if (data.errors?.length) {
        setError(`${data.errors.length} aviso(s): ${data.errors.slice(0, 2).join(" · ")}`)
      }
      await loadMeta()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao sincronizar")
    } finally {
      setSyncing(false)
    }
  }

  const lastSyncLabel = meta?.last_synced_at
    ? new Date(meta.last_synced_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "Nunca"

  return (
    <Card className="rounded-2xl border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>Odds pré-jogo (odds-api.io)</CardTitle>
        <CardDescription>
          Busca jogos da Copa no odds-api.io, grava odds 1X2 da <strong className="font-medium text-foreground">KTO</strong> e{" "}
          <strong className="font-medium text-foreground">Bet365</strong> no Supabase. Só actualiza quando carregares no botão
          (pode levar 1–2 minutos).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loadingMeta ? (
          <p className="text-sm text-muted-foreground">A carregar estado…</p>
        ) : (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Última sync</dt>
              <dd className="font-medium text-foreground">{lastSyncLabel}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Jogos com odds</dt>
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

        <div>
          <Button type="button" onClick={() => void handleSync()} disabled={syncing}>
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A sincronizar…
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar odds agora
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Requer <code className="rounded bg-muted px-1">ODDS_API_KEY</code> em .env.local e o script{" "}
          <code className="rounded bg-muted px-1">scripts/020_match_pre_odds.sql</code> no Supabase.
        </p>
      </CardContent>
    </Card>
  )
}
