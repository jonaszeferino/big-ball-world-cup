"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getUserSafe } from "@/lib/supabase/auth-session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  BarChart2,
  Target,
  TrendingUp,
  Zap,
  Sparkles,
  Hash,
  Percent,
  Trophy,
  Flame,
  LayoutGrid,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ProfileNameWithStatus } from "@/components/profile-name-with-status"
import {
  BET_STAT_CATEGORIES,
  applyGroupQualificationStats,
  computePlayerBetStats,
  getCategoryMeta,
  oddsFromRow,
  RESULT_RATE_MIN_BETS,
  sortPlayersByStat,
  type BetStatCategory,
  type MatchOdds,
  type PlayerBetStats,
} from "@/lib/bet-stats"
import { computeGroupQualificationHits } from "@/lib/group-qualification-stats"
import type { SimTeam } from "@/lib/simulated-group-standings"

interface BetGroupOption {
  id: string
  name: string
}

const RANKING_SCOPE_GERAL = "__geral__"

const CATEGORY_ICONS: Record<BetStatCategory, typeof Target> = {
  exact: Target,
  result: TrendingUp,
  goalDiff: BarChart2,
  upset: Zap,
  totalGoals: Hash,
  resultRate: Percent,
  bestUpsetOdd: Flame,
  advance: Trophy,
  groupQualification: LayoutGrid,
}

function statSubline(player: PlayerBetStats, category: BetStatCategory): string | null {
  if (category === "groupQualification") {
    if (!player.groupQualificationReady) return "Aguardando fim da fase de grupos"
    return `${player.groupQualificationHits} de ${player.groupQualificationTotal} classificados certos`
  }
  const base = `${player.evaluatedBets} jogo${player.evaluatedBets === 1 ? "" : "s"} avaliado${player.evaluatedBets === 1 ? "" : "s"}`
  if (category === "upset" && player.upsetEligible > 0) {
    return `${base} · ${player.upsetEligible} contra favorito`
  }
  if (category === "resultRate" && player.evaluatedBets >= RESULT_RATE_MIN_BETS) {
    return `${player.resultHits}/${player.evaluatedBets} resultados certos`
  }
  if (category === "bestUpsetOdd" && player.upsetHits > 0) {
    return `${player.upsetHits} zebra${player.upsetHits === 1 ? "" : "s"} certa${player.upsetHits === 1 ? "" : "s"}`
  }
  return base
}

function StatLeaderboard({
  players,
  category,
  currentUserId,
  emptyMessage,
}: {
  players: PlayerBetStats[]
  category: BetStatCategory
  currentUserId: string | null
  emptyMessage?: string
}) {
  const meta = getCategoryMeta(category)
  const sorted = sortPlayersByStat(players, category)
  const top = sorted.filter((p) => meta.qualifies(p)).slice(0, 15)
  const leaderPick = top[0] ? meta.pick(top[0]) : 0

  if (top.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage ?? "Ainda não há palpites certos nesta categoria em jogos encerrados."}
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {top.map((player, index) => {
        const valueLabel = meta.formatValue(player)
        const Icon = CATEGORY_ICONS[category]
        const isMe = player.userId === currentUserId
        const tied = leaderPick > 0 && meta.pick(player) === leaderPick && index > 0
        return (
          <li
            key={player.userId}
            className={cn(
              "flex items-center gap-3 py-3 first:pt-0 last:pb-0",
              isMe && "rounded-lg bg-primary/5 px-2 -mx-2",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                index === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <ProfileNameWithStatus
                name={player.displayName}
                status={player.statusMessage}
                nameClassName="font-medium text-foreground"
              />
              <p className="text-xs text-muted-foreground">{statSubline(player, category)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
              <span className="text-lg font-bold tabular-nums text-foreground">{valueLabel}</span>
              {tied ? (
                <Badge variant="outline" className="text-[10px]">
                  empatado
                </Badge>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default function EstatisticasPage() {
  const [players, setPlayers] = useState<PlayerBetStats[]>([])
  const [groups, setGroups] = useState<BetGroupOption[]>([])
  const [scope, setScope] = useState(RANKING_SCOPE_GERAL)
  const [myBetGroupId, setMyBetGroupId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [finishedCount, setFinishedCount] = useState(0)
  const [groupQualificationReady, setGroupQualificationReady] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
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
      if (userBetGroupId) setScope(userBetGroupId)

      const matchSelectFull =
        "id, home_score, away_score, home_penalty_score, away_penalty_score, home_team_id, away_team_id, stage"
      const matchSelectBase =
        "id, home_score, away_score, home_team_id, away_team_id, stage"

      const [profilesRes, matchesRes, groupsRes, teamsRes, groupMatchesRes, officialRes] =
        await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, bet_group_id, status_message")
          .order("display_name", { ascending: true }),
        supabase
          .from("matches")
          .select(matchSelectFull)
          .eq("status", "finished")
          .not("home_score", "is", null)
          .not("away_score", "is", null),
        supabase.from("bet_groups").select("id, name").eq("is_deleted", false).order("name", { ascending: true }),
        supabase
          .from("teams")
          .select("id, name, code, group_name")
          .order("group_name", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("matches")
          .select(
            "id, stage, group_name, status, home_score, away_score, home_team:home_team_id(id, name, code, group_name), away_team:away_team_id(id, name, code, group_name)",
          )
          .eq("stage", "group")
          .order("match_date", { ascending: true }),
        supabase
          .from("teams_results")
          .select("team_home, team_away, goals_home, goals_away"),
      ])

      let profiles = profilesRes.data
      if (profilesRes.error?.message.includes("status_message")) {
        const fallback = await supabase
          .from("profiles")
          .select("id, display_name, bet_group_id")
          .order("display_name", { ascending: true })
        profiles = (fallback.data ?? []).map((p) => ({ ...p, status_message: null }))
      }

      let matchRows = matchesRes.data
      if (matchesRes.error != null) {
        const fallback = await supabase
          .from("matches")
          .select(matchSelectBase)
          .eq("status", "finished")
          .not("home_score", "is", null)
          .not("away_score", "is", null)
        matchRows = fallback.data
      }

      const finishedMatches = (matchRows ?? []).map((m) => ({
        id: m.id as string,
        home_score: m.home_score as number,
        away_score: m.away_score as number,
        home_team_id: m.home_team_id as string,
        away_team_id: m.away_team_id as string,
        stage: m.stage as string,
        home_penalty_score: (m as { home_penalty_score?: number | null }).home_penalty_score ?? null,
        away_penalty_score: (m as { away_penalty_score?: number | null }).away_penalty_score ?? null,
      }))

      setFinishedCount(finishedMatches.length)
      setGroups((groupsRes.data ?? []).map((g) => ({ id: String(g.id), name: g.name as string })))

      const finishedIds = finishedMatches.map((m) => m.id)
      let bets: {
        user_id: string
        match_id: string
        predicted_home_score: number
        predicted_away_score: number
        predicted_advances_team_id: string | null
      }[] = []

      if (finishedIds.length > 0) {
        const betSelectFull =
          "user_id, match_id, predicted_home_score, predicted_away_score, predicted_advances_team_id"
        const betSelectBase = "user_id, match_id, predicted_home_score, predicted_away_score"

        const betRes = await supabase.from("bets").select(betSelectFull).in("match_id", finishedIds)
        const betData =
          betRes.error != null
            ? (await supabase.from("bets").select(betSelectBase).in("match_id", finishedIds)).data
            : betRes.data

        bets = (betData ?? []).map((b) => ({
          user_id: b.user_id as string,
          match_id: b.match_id as string,
          predicted_home_score: b.predicted_home_score as number,
          predicted_away_score: b.predicted_away_score as number,
          predicted_advances_team_id:
            (b as { predicted_advances_team_id?: string | null }).predicted_advances_team_id ?? null,
        }))
      }

      const oddsByMatchId = new Map<string, MatchOdds>()
      if (finishedIds.length > 0) {
        const { data: oddsRows } = await supabase
          .from("match_pre_odds")
          .select("match_id, kto_home, kto_draw, kto_away, bet365_home, bet365_draw, bet365_away")
          .in("match_id", finishedIds)

        for (const row of oddsRows ?? []) {
          const matchId = row.match_id as string
          const odds = oddsFromRow(row as Record<string, string | null>)
          if (odds) oddsByMatchId.set(matchId, odds)
        }
      }

      if (!profiles?.length) {
        setPlayers([])
        setGroupQualificationReady(false)
        setLoading(false)
        return
      }

      const profileIds = profiles.map((p) => p.id as string)
      const teams = (teamsRes.data ?? []) as SimTeam[]
      const groupMatches = (groupMatchesRes.data ?? []).map((row) => {
        const m = row as Record<string, unknown>
        return {
          id: m.id as string,
          stage: m.stage as string,
          group_name: m.group_name as string | null,
          status: m.status as string,
          home_score: m.home_score as number | null,
          away_score: m.away_score as number | null,
          home_team: m.home_team as SimTeam,
          away_team: m.away_team as SimTeam,
        }
      })
      const groupMatchIds = groupMatches.map((m) => m.id)

      let groupBets: {
        user_id: string
        match_id: string
        predicted_home_score: number
        predicted_away_score: number
      }[] = []

      if (groupMatchIds.length > 0) {
        const { data: groupBetRows } = await supabase
          .from("bets")
          .select("user_id, match_id, predicted_home_score, predicted_away_score")
          .in("match_id", groupMatchIds)
        groupBets = (groupBetRows ?? []).map((b) => ({
          user_id: b.user_id as string,
          match_id: b.match_id as string,
          predicted_home_score: b.predicted_home_score as number,
          predicted_away_score: b.predicted_away_score as number,
        }))
      }

      const groupQualification = computeGroupQualificationHits({
        teams,
        groupMatches,
        officialResults: officialRes.data ?? [],
        bets: groupBets,
        profileIds,
      })
      setGroupQualificationReady(groupQualification.ready)

      setPlayers(
        applyGroupQualificationStats(
          computePlayerBetStats({
            profiles: profiles as Parameters<typeof computePlayerBetStats>[0]["profiles"],
            finishedMatches,
            bets,
            oddsByMatchId,
          }),
          groupQualification.hitsByUserId,
          groupQualification.ready,
          groupQualification.totalSlots,
        ),
      )
      setLoading(false)
    }

    void load()
  }, [])

  const displayPlayers = useMemo(() => {
    if (scope === RANKING_SCOPE_GERAL) return players
    return players.filter((p) => p.betGroupId === scope)
  }, [players, scope])

  const myStats = useMemo(
    () => (currentUserId ? players.find((p) => p.userId === currentUserId) ?? null : null),
    [players, currentUserId],
  )

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
        <h1 className="text-2xl font-bold text-foreground">Estatísticas dos palpites</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rankings parciais com base em{" "}
          <strong className="font-medium text-foreground">{finishedCount}</strong> partida
          {finishedCount === 1 ? "" : "s"} encerrada{finishedCount === 1 ? "" : "s"}. Improváveis e maior zebra usam
          odds Bet365 ou KTO (favorito = menor odd).
        </p>
      </div>

      {myStats && myStats.evaluatedBets > 0 ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Seu resumo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BET_STAT_CATEGORIES.map((cat) => (
              <div key={cat.key} className="rounded-xl border border-border/60 bg-card/80 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {cat.title}
                </p>
                <p className="text-xl font-bold tabular-nums text-primary">{cat.formatValue(myStats)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1.5">
          <Label htmlFor="stats-scope" className="text-xs text-muted-foreground">
            Ver ranking
          </Label>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger id="stats-scope" className="w-full min-w-[220px] sm:w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={RANKING_SCOPE_GERAL}>Geral — todos</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  Grupo {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link href="/ranking" className="text-sm font-medium text-primary underline-offset-2 hover:underline">
          Ver ranking por pontos
        </Link>
      </div>

      <Tabs defaultValue="exact" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl p-1 sm:grid-cols-3 lg:grid-cols-5">
          {BET_STAT_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.key]
            return (
              <TabsTrigger key={cat.key} value={cat.key} className="gap-1.5 rounded-lg py-2 text-xs sm:text-sm">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{cat.title}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {BET_STAT_CATEGORIES.map((cat) => (
          <TabsContent key={cat.key} value={cat.key} className="mt-4">
            <Card className="rounded-2xl border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {cat.title}
                </CardTitle>
                <CardDescription>{cat.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <StatLeaderboard
                  players={displayPlayers}
                  category={cat.key}
                  currentUserId={currentUserId}
                  emptyMessage={
                    cat.key === "groupQualification" && !groupQualificationReady
                      ? "O ranking de classificados da fase de grupos aparece quando todos os jogos de grupos estiverem encerrados."
                      : undefined
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
