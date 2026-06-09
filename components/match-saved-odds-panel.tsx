"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SavedMatchOdds } from "@/lib/match-bets-board"
import { hasAnySavedOdds } from "@/lib/palpite-odds-compare"
import { Odds1x2Line } from "@/components/odds-1x2-line"

interface MatchSavedOddsPanelProps {
  matchId: string
}

type SavedOddsResponse = SavedMatchOdds

function OddsBookmakerBlock({
  label,
  home,
  draw,
  away,
  url,
}: {
  label: string
  home: string | null
  draw: string | null
  away: string | null
  url?: string | null
}) {
  const content = (
    <Odds1x2Line home={home} draw={draw} away={away} className="text-sm" />
  )

  return (
    <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 block text-sm underline-offset-4 hover:text-primary hover:underline"
        >
          {content}
        </a>
      ) : (
        <p className="mt-0.5 text-sm">{content}</p>
      )}
      <p className="mt-0.5 text-[10px] text-muted-foreground">Casa · Empate · Fora</p>
    </div>
  )
}

export function MatchSavedOddsPanel({ matchId }: MatchSavedOddsPanelProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [odds, setOdds] = useState<SavedOddsResponse | null>(null)
  const [checked, setChecked] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  async function loadOdds() {
    if (checked || loading) return
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(`/api/odds?matchId=${encodeURIComponent(matchId)}`, { cache: "no-store" })
      const data = (await res.json()) as { row?: SavedOddsResponse | null; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar odds")
      setOdds(data.row ?? null)
      setChecked(true)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Erro ao carregar odds")
      setChecked(true)
    } finally {
      setLoading(false)
    }
  }

  function handleToggle() {
    const next = !open
    setOpen(next)
    if (next) void loadOdds()
  }

  const syncedLabel = odds?.syncedAt
    ? new Date(odds.syncedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : null

  return (
    <div className="mt-3 border-t border-border/50 pt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-full gap-2 text-muted-foreground hover:text-foreground"
        onClick={handleToggle}
        aria-expanded={open}
      >
        <TrendingUp className="h-4 w-4 shrink-0" />
        {open ? "Ocultar odds" : "Ver odds"}
        <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", open && "rotate-180")} />
      </Button>

      {open ? (
        <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 p-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando odds salvas…
            </div>
          ) : fetchError ? (
            <p className="text-sm text-destructive">{fetchError}</p>
          ) : !odds || !hasAnySavedOdds(odds) ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há odds salvas para este jogo. O admin pode sincronizar no{" "}
              <Link href="/admin" className="font-medium text-primary underline-offset-4 hover:underline">
                painel
              </Link>
              .
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                Cotações 1X2 salvas no bolão
                {syncedLabel ? ` · atualizadas em ${syncedLabel}` : ""}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <OddsBookmakerBlock
                  label="KTO"
                  home={odds.ktoHome}
                  draw={odds.ktoDraw}
                  away={odds.ktoAway}
                  url={odds.ktoUrl}
                />
                <OddsBookmakerBlock
                  label="Bet365"
                  home={odds.bet365Home}
                  draw={odds.bet365Draw}
                  away={odds.bet365Away}
                  url={odds.bet365Url}
                />
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
