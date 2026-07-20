"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserSafe } from "@/lib/supabase/auth-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { Loader2, Users, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ProfileNameWithStatus } from "@/components/profile-name-with-status"
import { RankingWinnersSection } from "@/components/ranking-winners"
import { BolaoChampionHero } from "@/components/bolao-champion-hero"
import { ChampionBetsRankingSection } from "@/components/champion-bets-ranking"
import { isGroupStage } from "@/lib/match-stage"
import {
  KO_POINTS_EXACT,
  KO_POINTS_EXACT_DRAW_CLASSIFIED,
  POINTS_EXACT,
  POINTS_RESULT,
} from "@/lib/match-result-scoring"
import { buildTotalRankings, sortPlayersByTotal, entriesAtRank } from "@/lib/ranking-display"
import { parseChampionBetRow, resolveCopaFinalResult, type ChampionBetPublicRow, type CopaFinalResult } from "@/lib/champion-bet-display"

interface RankedPlayer {
  id: string
  display_name: string
  status_message: string | null
  bet_group_id: string | null
  total_points: number
  group_points: number
  knockout_points: number
  exact_hits: number
  result_hits: number
  advance_hits: number
  settled_bets: number
}

interface BetGroupOption {
  id: string
  name: string
  observations: string | null
}

const RANKING_SCOPE_GERAL = "__geral__"

export default function RankingPage() {
  const [players, setPlayers] = useState<RankedPlayer[]>([])
  const [groups, setGroups] = useState<BetGroupOption[]>([])
  const [rankingScope, setRankingScope] = useState<string>(RANKING_SCOPE_GERAL)
  const [myBetGroupId, setMyBetGroupId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [championBetRows, setChampionBetRows] = useState<ChampionBetPublicRow[]>([])
  const [copaFinalResult, setCopaFinalResult] = useState<CopaFinalResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRanking() {
      const supabase = createClient()
      const { user } = await getUserSafe(supabase)
      if (user) setCurrentUserId(user.id)

      let userBetGroupId: string | null = null
      if (user) {
        const { data: prof } = await supabase.from("profiles").select("bet_group_id").eq("id", user.id).single()
        const raw = prof?.bet_group_id
        if (raw != null && String(raw) !== "") userBetGroupId = String(raw)
      }
      setMyBetGroupId(userBetGroupId)

      const [profilesRes, finishedRes, groupsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, bet_group_id, status_message")
          .order("display_name", { ascending: true }),
        supabase
          .from("matches")
          .select("id, stage")
          .eq("status", "finished")
          .not("home_score", "is", null)
          .not("away_score", "is", null),
        supabase.from("bet_groups").select("id, name, observations").eq("is_deleted", false).order("name", { ascending: true }),
      ])

      let profiles = profilesRes.data
      if (profilesRes.error?.message.includes("status_message")) {
        const fallback = await supabase
          .from("profiles")
          .select("id, display_name, bet_group_id")
          .order("display_name", { ascending: true })
        profiles = (fallback.data ?? []).map((p) => ({ ...p, status_message: null }))
      }

      const finishedMatches = finishedRes.data
      const groupsData = groupsRes.data

      const groupList = (groupsData ?? []).map((g) => ({
        id: String(g.id),
        name: g.name as string,
        observations: (g.observations as string | null) ?? null,
      }))
      setGroups(groupList)

      const urlGrupo =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("grupo") : null
      const wantsGeral = urlGrupo === RANKING_SCOPE_GERAL || urlGrupo === "geral"
      if (wantsGeral) {
        setRankingScope(RANKING_SCOPE_GERAL)
      } else if (urlGrupo && /^\d+$/.test(urlGrupo) && urlGrupo === userBetGroupId) {
        setRankingScope(urlGrupo)
      } else if (userBetGroupId) {
        setRankingScope(userBetGroupId)
      } else {
        setRankingScope(RANKING_SCOPE_GERAL)
      }

      if (!profiles?.length) {
        setPlayers([])
        setChampionBetRows([])
        setCopaFinalResult(null)
        setLoading(false)
        return
      }

      const finishedIds = new Set((finishedMatches ?? []).map((m) => m.id))
      const stageByMatch = new Map((finishedMatches ?? []).map((m) => [m.id, m.stage as string]))

      let settledBets: {
        user_id: string
        points_earned: number | null
        match_id: string
      }[] = []
      if (finishedIds.size > 0) {
        const { data: bets } = await supabase
          .from("bets")
          .select("user_id, points_earned, match_id")
          .in("match_id", [...finishedIds])

        settledBets = (bets ?? []).filter((b) => finishedIds.has(b.match_id))
      }

      let championPointsByUser = new Map<string, number>()
      let championBetRowsBuilt: ChampionBetPublicRow[] = []

      const [championBetsRes, finalMatchRes] = await Promise.all([
        supabase
          .from("champion_bets")
          .select(
            "user_id, points_earned, champion_team:champion_team_id(id, name, code), runner_up_team:runner_up_team_id(id, name, code)",
          ),
        supabase
          .from("matches")
          .select(
            "status, stage, home_score, away_score, home_penalty_score, away_penalty_score, home_team:home_team_id(id, name, code), away_team:away_team_id(id, name, code)",
          )
          .eq("stage", "final")
          .maybeSingle(),
      ])

      const championBets = championBetsRes.data
      const championErr = championBetsRes.error
      let finalMatchRow = finalMatchRes.data

      if (finalMatchRes.error?.message.includes("penalty_score")) {
        const fallbackFinal = await supabase
          .from("matches")
          .select(
            "status, stage, home_score, away_score, home_team:home_team_id(id, name, code), away_team:away_team_id(id, name, code)",
          )
          .eq("stage", "final")
          .maybeSingle()
        finalMatchRow = fallbackFinal.data
      }

      setCopaFinalResult(resolveCopaFinalResult(finalMatchRow))

      if (!championErr && championBets) {
        championPointsByUser = new Map(
          championBets.map((b) => [b.user_id as string, (b.points_earned as number) ?? 0]),
        )

        const profileById = new Map(profiles.map((p) => [p.id, p]))
        for (const raw of championBets) {
          const parsed = parseChampionBetRow(raw as Record<string, unknown>)
          if (!parsed) continue
          const profile = profileById.get(raw.user_id as string)
          if (!profile) continue
          championBetRowsBuilt.push({
            userId: profile.id,
            displayName: profile.display_name,
            statusMessage: (profile as { status_message?: string | null }).status_message ?? null,
            ...parsed,
          })
        }
      }
      setChampionBetRows(championBetRowsBuilt)

      const agg = new Map<
        string,
        {
          pts: number
          groupPts: number
          koPts: number
          exact: number
          res: number
          adv: number
          settled: number
        }
      >()
      for (const p of profiles) {
        agg.set(p.id, { pts: 0, groupPts: 0, koPts: 0, exact: 0, res: 0, adv: 0, settled: 0 })
      }

      for (const b of settledBets) {
        const row = agg.get(b.user_id)
        if (!row) continue
        const pts = b.points_earned ?? 0
        const stage = stageByMatch.get(b.match_id) ?? "group"
        row.pts += pts
        row.settled += 1
        if (isGroupStage(stage)) row.groupPts += pts
        else row.koPts += pts

        if (isGroupStage(stage)) {
          if (pts === POINTS_EXACT) row.exact += 1
          else if (pts === POINTS_RESULT) row.res += 1
        } else if (pts > 0) {
          if (pts === KO_POINTS_EXACT || pts === KO_POINTS_EXACT_DRAW_CLASSIFIED) {
            row.exact += 1
          } else {
            row.adv += 1
          }
        }
      }

      for (const [userId, champPts] of championPointsByUser) {
        const row = agg.get(userId)
        if (!row || champPts <= 0) continue
        row.pts += champPts
        row.koPts += champPts
      }

      const playerStats: RankedPlayer[] = profiles.map((p) => {
        const a = agg.get(p.id) ?? {
          pts: 0,
          groupPts: 0,
          koPts: 0,
          exact: 0,
          res: 0,
          adv: 0,
          settled: 0,
        }
        const bgRaw = (p as { bet_group_id?: number | string | null }).bet_group_id
        return {
          id: p.id,
          display_name: p.display_name,
          status_message: (p as { status_message?: string | null }).status_message ?? null,
          bet_group_id:
            bgRaw !== undefined && bgRaw !== null && String(bgRaw) !== "" ? String(bgRaw) : null,
          total_points: a.pts,
          group_points: a.groupPts,
          knockout_points: a.koPts,
          exact_hits: a.exact,
          result_hits: a.res,
          advance_hits: a.adv,
          settled_bets: a.settled,
        }
      })

      playerStats.sort(sortPlayersByTotal)
      setPlayers(playerStats)
      setLoading(false)
    }
    void loadRanking()
  }, [])

  const displayPlayers = useMemo(() => {
    if (rankingScope === RANKING_SCOPE_GERAL) return players
    return players.filter((p) => p.bet_group_id === rankingScope).sort(sortPlayersByTotal)
  }, [players, rankingScope])

  const rankedEntries = useMemo(() => buildTotalRankings(displayPlayers), [displayPlayers])

  const myGroup = useMemo(
    () => (myBetGroupId ? groups.find((g) => g.id === myBetGroupId) ?? null : null),
    [groups, myBetGroupId],
  )

  const selectedGroup = useMemo(() => {
    if (rankingScope === RANKING_SCOPE_GERAL) return null
    return groups.find((g) => g.id === rankingScope) ?? null
  }, [groups, rankingScope])

  const selectedGroupName = selectedGroup?.name ?? null

  const scopeLabel =
    rankingScope === RANKING_SCOPE_GERAL
      ? "Ranking geral"
      : `Grupo ${selectedGroupName ?? "bolão"}`

  const rankByPlayerId = useMemo(
    () => new Map(rankedEntries.map((e) => [e.player.id, e.rank])),
    [rankedEntries],
  )

  const playerIdsInScope = useMemo(() => new Set(displayPlayers.map((p) => p.id)), [displayPlayers])

  const firstPlaceEntries = useMemo(() => entriesAtRank(rankedEntries, 1), [rankedEntries])
  const bolaoChampion = firstPlaceEntries[0]?.player ?? null
  const showBolaoChampionHero = bolaoChampion != null && bolaoChampion.total_points > 0

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const scopeEmpty =
    rankingScope !== RANKING_SCOPE_GERAL && !players.some((p) => p.bet_group_id === rankingScope)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ranking</h1>
          <p className="text-sm text-muted-foreground">
            Grupos: +{POINTS_EXACT} exato, +{POINTS_RESULT} resultado. Mata-mata: +20 a +3 conforme placar e
            classificado (ver Regras).
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 gap-2 self-start">
          <Link href="/scorers">
            <Target className="h-4 w-4" />
            Artilheiros da Copa
          </Link>
        </Button>
      </div>

      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Tipo de ranking
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div
            className={cn(
              "grid gap-6",
              rankingScope !== RANKING_SCOPE_GERAL && "lg:grid-cols-2 lg:items-stretch lg:gap-8",
            )}
          >
            <div className="flex min-w-0 flex-col gap-2 lg:max-w-md">
              <Label htmlFor="ranking-scope" className="text-muted-foreground">
                {myGroup
                  ? "Por defeito vês o teu grupo; podes alternar para o ranking geral de todos."
                  : "Ainda não estás num grupo — vê o ranking geral ou pede ao organizador para te incluir."}
              </Label>
              <Select value={rankingScope} onValueChange={setRankingScope}>
                <SelectTrigger id="ranking-scope" className="w-full">
                  <SelectValue placeholder="Escolher…" />
                </SelectTrigger>
                <SelectContent>
                  {myGroup ? (
                    <SelectItem value={myGroup.id}>Grupo: {myGroup.name}</SelectItem>
                  ) : null}
                  <SelectItem value={RANKING_SCOPE_GERAL}>Ranking geral (todos os jogadores)</SelectItem>
                </SelectContent>
              </Select>
              {rankingScope !== RANKING_SCOPE_GERAL && selectedGroupName && (
                <p className="text-xs text-muted-foreground">
                  Contam só apostadores com este grupo no perfil.
                </p>
              )}
            </div>

            {rankingScope !== RANKING_SCOPE_GERAL && selectedGroup ? (
              <div className="flex min-h-[8rem] flex-col rounded-xl border border-border/80 bg-muted/25 p-4 lg:min-h-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Grupo:
                </p>
                {selectedGroup.observations?.trim() ? (
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {selectedGroup.observations}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Este grupo ainda não tem texto de descrição. Podes editá-lo no admin ou na página Grupos (criador).
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {scopeEmpty ? (
        <Card className="border-dashed border-border bg-muted/20">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum apostador tem este grupo no perfil. O organizador pode atribuir membros na área de grupos.
          </CardContent>
        </Card>
      ) : (
        <>
          {showBolaoChampionHero && bolaoChampion ? (
            <BolaoChampionHero winner={bolaoChampion} scopeLabel={scopeLabel} />
          ) : null}

          <RankingWinnersSection
            players={displayPlayers}
            scopeLabel={scopeLabel}
            currentUserId={currentUserId}
          />

          <ChampionBetsRankingSection
            rows={championBetRows}
            playerIdsInScope={playerIdsInScope}
            currentUserId={currentUserId}
            officialResult={copaFinalResult}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-card-foreground">
                {rankingScope === RANKING_SCOPE_GERAL
                  ? "Classificação geral"
                  : `Classificação — ${selectedGroupName ?? "grupo"}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayPlayers.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">Nenhum participante neste âmbito</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[32rem] text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-3 text-left font-medium text-muted-foreground">#</th>
                        <th className="pb-3 text-left font-medium text-muted-foreground">Jogador</th>
                        <th
                          className="pb-3 text-center font-medium text-muted-foreground"
                          title="Apostas em partidas concluidas"
                        >
                          Apostas*
                        </th>
                        <th className="pb-3 text-center font-medium text-muted-foreground">Grupos</th>
                        <th className="pb-3 text-center font-medium text-muted-foreground">Mata-mata</th>
                        <th className="pb-3 text-center font-medium text-muted-foreground">Exatos</th>
                        <th className="pb-3 text-center font-medium text-muted-foreground">+7</th>
                        <th
                          className="pb-3 text-center font-medium text-muted-foreground"
                          title="Outros acertos no mata-mata (não exatos)"
                        >
                          MM
                        </th>
                        <th className="pb-3 text-right font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayPlayers.map((player) => {
                        const rank = rankByPlayerId.get(player.id) ?? 0
                        return (
                        <tr
                          key={player.id}
                          className={cn(
                            "border-b border-border last:border-0",
                            player.id === currentUserId && "bg-primary/5",
                            rank === 1 && "bg-amber-500/5",
                          )}
                        >
                          <td className="py-3 text-left font-medium text-foreground">
                            <span className="inline-flex items-center gap-1.5 tabular-nums">
                              {rank}º
                              {rank <= 3 ? (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "px-1 py-0 text-[9px] font-semibold uppercase",
                                    rank === 1 && "border-amber-400/60 text-amber-800 dark:text-amber-200",
                                  )}
                                >
                                  pódio
                                </Badge>
                              ) : null}
                            </span>
                          </td>
                          <td className="py-3 text-left">
                            <ProfileNameWithStatus
                              name={player.display_name}
                              status={player.status_message}
                              nameClassName={player.id === currentUserId ? "text-primary" : undefined}
                              suffix={
                                player.id === currentUserId ? (
                                  <span className="text-xs font-normal text-muted-foreground">(você)</span>
                                ) : undefined
                              }
                            />
                          </td>
                          <td className="py-3 text-center text-muted-foreground">{player.settled_bets}</td>
                          <td className="py-3 text-center text-muted-foreground">{player.group_points}</td>
                          <td className="py-3 text-center text-muted-foreground">{player.knockout_points}</td>
                          <td className="py-3 text-center text-muted-foreground">{player.exact_hits}</td>
                          <td className="py-3 text-center text-muted-foreground">{player.result_hits}</td>
                          <td className="py-3 text-center text-muted-foreground">{player.advance_hits}</td>
                          <td className="py-3 text-right font-bold text-primary">{player.total_points}</td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                  <p className="mt-3 text-xs text-muted-foreground">
                    * Apostas em jogos com resultado oficial. +7 = acerto de resultado na fase de grupos; MM = outros
                    acertos no mata-mata (não exatos).
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
