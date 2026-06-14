"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { arePalpitesRevealed, isBeforeMatchKickoff, isDuringMatchScheduleWindow } from "@/lib/match-datetime-brazil"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Lock, RefreshCw, ClipboardList } from "lucide-react"
import { CountryFlag } from "@/components/country-flag"
import { ProfileNameWithStatus } from "@/components/profile-name-with-status"
import { PalpiteRowOddsCompare, SavedOddsSummary } from "@/components/palpite-odds-compare"
import { MatchPartialResultBanner } from "@/components/match-partial-result-banner"
import { MatchOfficialResultBanner } from "@/components/match-official-result-banner"
import { hasAnySavedOdds } from "@/lib/palpite-odds-compare"
import { matchStageLabel, type PalpitesApiGroup } from "@/lib/match-bets-board"
import {
  readPalpitesFilterPref,
  writePalpitesFilterPref,
  type PalpitesFilterPref,
} from "@/lib/palpites-filter-pref"
import { cn } from "@/lib/utils"

export default function PalpitesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<PalpitesApiGroup[]>([])
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [filter, setFilter] = useState<PalpitesFilterPref>("upcoming")

  useEffect(() => {
    setFilter(readPalpitesFilterPref())
  }, [])

  const setFilterAndSave = useCallback((next: PalpitesFilterPref) => {
    setFilter(next)
    writePalpitesFilterPref(next)
  }, [])

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const res = await fetch("/api/palpites", { cache: "no-store" })
      const data = (await res.json()) as {
        groups?: PalpitesApiGroup[]
        serverNow?: number
        error?: string
      }

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login")
          return
        }
        setError(data.error ?? "Erro ao carregar palpites")
        setGroups([])
        return
      }

      setGroups(data.groups ?? [])
      setNowMs(data.serverNow ?? Date.now())
    } catch {
      setError("Erro de rede ao carregar palpites")
      setGroups([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), 15_000)
    const refresh = setInterval(() => void load(true), 60_000)
    return () => {
      clearInterval(tick)
      clearInterval(refresh)
    }
  }, [load])

  const visibleGroups = useMemo(() => {
    const fresh = groups.map((g) => {
      const bettingOpen = g.match.status === "scheduled" && isBeforeMatchKickoff(g.match.match_date, nowMs)
      const palpitesRevealed = arePalpitesRevealed(g.match.match_date, nowMs)
      const betCount = g.betCount
      const rows = palpitesRevealed ? g.rows : []
      return {
        ...g,
        bettingOpen,
        palpitesRevealed,
        betCount,
        myRow: g.myRow ?? null,
        rows,
        savedOdds: palpitesRevealed ? g.savedOdds : null,
        partialResult: g.partialResult && isDuringMatchScheduleWindow(g.match.match_date, nowMs) ? g.partialResult : null,
        officialResult: palpitesRevealed ? g.officialResult : null,
      }
    })

    const byMatchDateAsc = (a: (typeof fresh)[number], b: (typeof fresh)[number]) =>
      new Date(a.match.match_date).getTime() - new Date(b.match.match_date).getTime()
    const byMatchDateDesc = (a: (typeof fresh)[number], b: (typeof fresh)[number]) =>
      new Date(b.match.match_date).getTime() - new Date(a.match.match_date).getTime()

    let filtered = fresh
    if (filter === "revealed") {
      filtered = fresh.filter((g) => g.palpitesRevealed && g.betCount > 0)
      return filtered.sort(byMatchDateDesc)
    }
    if (filter === "upcoming") {
      filtered = fresh.filter((g) => !g.palpitesRevealed)
      return filtered.sort(byMatchDateAsc)
    }

    return filtered.sort(byMatchDateAsc)
  }, [groups, filter, nowMs])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <ClipboardList className="h-7 w-7 text-primary" />
            Palpites feitos
          </h1>
          <p className="mt-1 text-sm text-foreground/75">
            <strong className="font-medium text-foreground">Só para visualizar</strong> — você sempre vê{" "}
            <strong className="font-medium text-foreground">seu palpite</strong>. Os palpites dos outros só aparecem
            depois do apito (horário de Brasília). Para{" "}
            <strong className="font-medium text-foreground">apostar ou mudar o seu</strong>, use{" "}
            <Link href="/matches" className="font-semibold text-primary underline-offset-2 hover:underline">
              Apostar
            </Link>
            .
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 self-start"
          disabled={refreshing}
          onClick={() => void load(true)}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === "upcoming" ? "default" : "outline"}
          onClick={() => setFilterAndSave("upcoming")}
        >
          Antes do apito
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === "revealed" ? "default" : "outline"}
          onClick={() => setFilterAndSave("revealed")}
        >
          Já revelados
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilterAndSave("all")}
        >
          Todas
        </Button>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {visibleGroups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {filter === "revealed"
              ? "Ainda não há palpites revelados. Volta depois do apito de alguma partida."
              : "Nenhuma partida neste filtro."}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleGroups.map((group) => (
            <Card key={group.match.id} className="overflow-hidden border-border/80 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/20 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base font-semibold">
                      {group.whenLabel}
                      <span className="mx-2 text-muted-foreground">·</span>
                      {group.match.home_team.code} x {group.match.away_team.code}
                    </CardTitle>
                    <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <CountryFlag countryName={group.match.home_team.name} size="sm" />
                        {group.match.home_team.name}
                      </span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="inline-flex items-center gap-1">
                        <CountryFlag countryName={group.match.away_team.name} size="sm" />
                        {group.match.away_team.name}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">{matchStageLabel(group.match.stage)}</Badge>
                    {group.match.group_name ? (
                      <Badge variant="secondary">Grupo {group.match.group_name}</Badge>
                    ) : null}
                    {group.match.status === "finished" ? (
                      <Badge className="bg-violet-500/15 text-violet-900 dark:text-violet-100">Encerrada no bolão</Badge>
                    ) : group.palpitesRevealed ? (
                      <Badge className="bg-sky-500/15 text-sky-900 dark:text-sky-100">Palpites revelados</Badge>
                    ) : group.bettingOpen ? (
                      <Badge className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-200">Apostas abertas</Badge>
                    ) : (
                      <Badge variant="secondary">Aguardando apito</Badge>
                    )}
                    {group.partialResult ? (
                      <Badge className="bg-amber-500/15 text-amber-900 dark:text-amber-100">Resultado parcial</Badge>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              {group.officialResult && group.match.status === "finished" ? (
                <div className="border-b border-border/50 px-4 py-3">
                  <MatchOfficialResultBanner
                    result={group.officialResult}
                    homeCode={group.match.home_team.code}
                    awayCode={group.match.away_team.code}
                  />
                </div>
              ) : group.partialResult ? (
                <div className="border-b border-border/50 px-4 py-3">
                  <MatchPartialResultBanner
                    result={group.partialResult}
                    homeCode={group.match.home_team.code}
                    awayCode={group.match.away_team.code}
                  />
                </div>
              ) : null}
              <CardContent className="p-0">
                {!group.palpitesRevealed ? (
                  <>
                    {group.myRow ? (
                      <div className="border-b border-primary/20 bg-primary/5 px-4 py-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Seu palpite</p>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <ProfileNameWithStatus
                            name={group.myRow.displayName}
                            status={group.myRow.statusMessage}
                          />
                          <div className="flex flex-col items-end gap-1">
                            <span className="rounded-md bg-primary/15 px-2.5 py-1 text-sm font-bold tabular-nums text-primary">
                              {group.myRow.homeScore} x {group.myRow.awayScore}
                            </span>
                            {group.myRow.advancesCode ? (
                              <span className="text-xs text-muted-foreground">passa: {group.myRow.advancesCode}</span>
                            ) : null}
                          </div>
                        </div>
                        {group.bettingOpen ? (
                          <p className="mt-3 text-xs text-foreground/80">
                            Deseja modificar o palpite?{" "}
                            <Link
                              href={`/matches?aposta=${group.match.id}`}
                              className="font-semibold text-primary underline-offset-2 hover:underline"
                            >
                              Vá até Apostar
                            </Link>
                            .
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                      <Lock className="h-8 w-8 text-muted-foreground/70" />
                      <p className="text-sm font-medium text-foreground">
                        {group.betCount === 0
                          ? "Ninguém apostou nesta partida ainda."
                          : group.myRow
                            ? group.betCount === 1
                              ? "Só você apostou nesta partida."
                              : `${group.betCount - 1} outro${group.betCount - 1 === 1 ? "" : "s"} palpite${group.betCount - 1 === 1 ? "" : "s"} registrado${group.betCount - 1 === 1 ? "" : "s"} (oculto${group.betCount - 1 === 1 ? "" : "s"})`
                            : `${group.betCount} palpite${group.betCount === 1 ? "" : "s"} registrado${group.betCount === 1 ? "" : "s"}`}
                      </p>
                      <p className="max-w-sm text-xs text-muted-foreground">
                        {group.myRow
                          ? "Palpites dos outros ficam ocultos até"
                          : "Placares ocultos até"}{" "}
                        {group.whenLabel} (início do jogo, horário de Brasília).
                      </p>
                    </div>
                  </>
                ) : group.rows.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">Ninguém apostou nesta partida.</p>
                ) : (
                  <>
                    {hasAnySavedOdds(group.savedOdds) && group.savedOdds ? (
                      <SavedOddsSummary odds={group.savedOdds} />
                    ) : null}
                    <ul className="divide-y divide-border/60">
                      {group.rows.map((row) => (
                        <li
                          key={`${group.match.id}-${row.userId}`}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <ProfileNameWithStatus name={row.displayName} status={row.statusMessage} />
                          </div>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            <div className="flex flex-col items-end gap-1">
                              <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-bold tabular-nums text-primary">
                                {row.homeScore} x {row.awayScore}
                              </span>
                              {row.advancesCode ? (
                                <span className="text-xs text-muted-foreground">passa: {row.advancesCode}</span>
                              ) : null}
                              {row.pointsEarned != null && group.officialResult ? (
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                  +{row.pointsEarned} pts
                                </span>
                              ) : null}
                            </div>
                            <PalpiteRowOddsCompare
                              homeScore={row.homeScore}
                              awayScore={row.awayScore}
                              homeCode={group.match.home_team.code}
                              awayCode={group.match.away_team.code}
                              odds={group.savedOdds}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="border-t border-border/50 bg-muted/10 px-4 py-2 text-xs text-muted-foreground">
                  {group.palpitesRevealed
                    ? `${group.betCount} palpite${group.betCount === 1 ? "" : "s"} revelado${group.betCount === 1 ? "" : "s"}`
                    : group.myRow
                      ? group.betCount > 1
                        ? "Seu palpite visível — dos outros, só após o apito"
                        : "Seu palpite visível — só você apostou nesta partida"
                      : group.betCount > 0
                        ? "Contagem visível — placares só após o apito"
                        : "Sem palpites"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
