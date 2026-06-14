"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CountryFlag } from "@/components/country-flag"
import { Crown, Loader2, Save, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChampionBetApiResponse } from "@/lib/champion-bet-types"

export const CHAMPION_BET_UPDATED_EVENT = "bbwc-champion-bet-updated"

function dispatchChampionBetUpdated() {
  window.dispatchEvent(new CustomEvent(CHAMPION_BET_UPDATED_EVENT))
}

export function useChampionBetStatus() {
  const [data, setData] = useState<ChampionBetApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/champion-bet", { cache: "no-store" })
      if (res.status === 401) {
        setData(null)
        return
      }
      const json = (await res.json()) as ChampionBetApiResponse
      if (res.ok) setData(json)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const onUpdate = () => void refresh()
    window.addEventListener(CHAMPION_BET_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(CHAMPION_BET_UPDATED_EVENT, onUpdate)
  }, [refresh])

  return {
    loading,
    isOpen: data?.isOpen ?? false,
    hasBet: !!data?.bet,
    bet: data?.bet ?? null,
    deadlineLabel: data?.deadlineLabel ?? null,
    needsBet: !!data && data.isOpen && !data.bet,
  }
}

export function ChampionBetBar() {
  const [data, setData] = useState<ChampionBetApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [championTeamId, setChampionTeamId] = useState("")
  const [runnerUpTeamId, setRunnerUpTeamId] = useState("")

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch("/api/champion-bet", { cache: "no-store" })
      if (res.status === 401) {
        setData(null)
        return
      }
      const json = (await res.json()) as ChampionBetApiResponse
      if (!res.ok) {
        setError(json.error ?? "Erro ao carregar palpite do campeão")
        setData(null)
        return
      }
      setData(json)
      if (json.bet) {
        setChampionTeamId(json.bet.championTeamId)
        setRunnerUpTeamId(json.bet.runnerUpTeamId)
      }
    } catch {
      setError("Erro de rede")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async () => {
    if (!championTeamId || !runnerUpTeamId) {
      setError("Escolha campeão e vice-campeão.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/champion-bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ championTeamId, runnerUpTeamId }),
      })
      const json = (await res.json()) as ChampionBetApiResponse & { error?: string }
      if (!res.ok) {
        setError(json.error ?? "Erro ao salvar")
        return
      }
      setData(json)
      setEditing(false)
      dispatchChampionBetUpdated()
    } catch {
      setError("Erro de rede ao salvar")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !data) return null

  const { bet, isOpen, teams, deadlineLabel } = data

  if (bet && !editing) {
    return (
      <div
        id="palpite-campeao"
        className="border-b border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-2.5 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-100">
              <Crown className="h-4 w-4 shrink-0" />
              Teu palpite do campeão
            </span>
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <Trophy className="h-3.5 w-3.5 text-amber-600" />
              <CountryFlag countryName={bet.championTeam.name} size="sm" />
              <strong>{bet.championTeam.code}</strong>
              <span className="text-muted-foreground">campeão</span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <CountryFlag countryName={bet.runnerUpTeam.name} size="sm" />
              <strong>{bet.runnerUpTeam.code}</strong>
              <span className="text-muted-foreground">vice</span>
            </span>
            {bet.pointsEarned > 0 ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                +{bet.pointsEarned} pts
              </span>
            ) : null}
          </div>
          {isOpen ? (
            <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={() => setEditing(true)}>
              Alterar
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  if (!isOpen && !bet) return null

  return (
    <div
      id="palpite-campeao"
      className={cn(
        "border-b",
        bet ? "border-amber-500/25 bg-amber-500/5" : "border-amber-500/35 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15",
      )}
    >
      <div className="mx-auto max-w-5xl px-4 py-3 md:px-6">
        <div className="flex flex-col gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-950 dark:text-amber-50">
              <Crown className="h-4 w-4" />
              {bet ? "Alterar palpite do campeão" : "Falta o teu palpite do campeão"}
            </p>
            <p className="mt-1 text-xs text-foreground/80">
              Escolhe campeão e vice-campeão da Copa. Prazo:{" "}
              <strong className="font-medium text-foreground">
                10 minutos antes do fim da última partida da fase de grupos
              </strong>
              {deadlineLabel ? ` (até ${deadlineLabel}, Brasília)` : ""}.{" "}
              <Link href="/rules" className="font-medium text-primary underline-offset-2 hover:underline">
                Ver regras
              </Link>
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="champion-team" className="text-xs text-muted-foreground">
                Campeão (+35 pts)
              </Label>
              <Select value={championTeamId || undefined} onValueChange={setChampionTeamId}>
                <SelectTrigger id="champion-team" className="w-full">
                  <SelectValue placeholder="Selecionar time" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id} disabled={team.id === runnerUpTeamId}>
                      {team.code} — {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="runner-up-team" className="text-xs text-muted-foreground">
                Vice-campeão (+15 pts)
              </Label>
              <Select value={runnerUpTeamId || undefined} onValueChange={setRunnerUpTeamId}>
                <SelectTrigger id="runner-up-team" className="w-full">
                  <SelectValue placeholder="Selecionar time" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id} disabled={team.id === championTeamId}>
                      {team.code} — {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="gap-2"
              disabled={saving || !championTeamId || !runnerUpTeamId}
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar palpite
            </Button>
            {bet && editing ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function NavbarChampionBetAlert() {
  const { loading, needsBet } = useChampionBetStatus()

  if (loading || !needsBet) return null

  return (
    <Link
      href="#palpite-campeao"
      className="hidden items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-950 transition-colors hover:bg-amber-500/25 dark:text-amber-50 sm:inline-flex"
    >
      <Crown className="h-3.5 w-3.5" />
      Palpite campeão
    </Link>
  )
}

export function NavbarChampionBetAlertMobile() {
  const { loading, needsBet } = useChampionBetStatus()

  if (loading || !needsBet) return null

  return (
    <Link
      href="#palpite-campeao"
      className="mb-1 flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/35 bg-amber-500/12 px-2 py-1.5 text-[10px] font-semibold text-amber-950 dark:text-amber-50"
    >
      <Crown className="h-3.5 w-3.5 shrink-0" />
      Falta palpite do campeão
    </Link>
  )
}
