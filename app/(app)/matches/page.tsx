"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { MatchCard } from "@/components/match-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Trophy, Calendar, Sparkles, ArrowUp, RefreshCw } from "lucide-react"
import { getCountryFlag } from "@/lib/country-flags"
import { PlayoffBrackets } from "@/components/playoff-brackets"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  computeSimulatedGroupStandings,
  sortSimulatedStandings,
  countGroupStageMatchesWithBet,
  type SimulatedTeamStats,
} from "@/lib/simulated-group-standings"
import { resolveSimulatedRoundOf32 } from "@/lib/simulated-round-of-32"
import { SimulatedRoundOf32 } from "@/components/simulated-round-of-32"
import { Button } from "@/components/ui/button"

interface Team {
  id: string
  name: string
  code: string
  group_name: string | null
}

interface Match {
  id: string
  home_team: Team
  away_team: Team
  home_score: number | null
  away_score: number | null
  home_penalty_score: number | null
  away_penalty_score: number | null
  match_date: string
  stage: string
  group_name: string | null
  status: string
}

interface Bet {
  id: string
  match_id: string
  predicted_home_score: number
  predicted_away_score: number
  predicted_advances_team_id: string | null
  points_earned: number
}

interface TeamStats {
  played: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

interface OfficialResult {
  team_home: string
  team_away: string
  goals_home: number
  goals_away: number
  match_result_home: string
  match_result_away: string
  group: string | null
}

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

function sortMatchesByDate(matches: Match[], order: "asc" | "desc"): Match[] {
  const sorted = [...matches].sort(
    (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
  )
  return order === "asc" ? sorted : sorted.reverse()
}

function matchesForStage(matches: Match[], stageValue: string): Match[] {
  return matches.filter((m) => {
    if (stageValue === "final") return m.stage === "final" || m.stage === "third_place"
    return m.stage === stageValue
  })
}

function groupMatchesByGroupName(matches: Match[]): Record<string, Match[]> {
  return matches.reduce<Record<string, Match[]>>((acc, m) => {
    const g = m.group_name ?? "?"
    if (!acc[g]) acc[g] = []
    acc[g].push(m)
    return acc
  }, {})
}

function sortGroupKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const ia = GROUPS.indexOf(a)
    const ib = GROUPS.indexOf(b)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.localeCompare(b)
  })
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [officialResults, setOfficialResults] = useState<OfficialResult[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mainView, setMainView] = useState<"partidas" | "classificacao" | "simulacao">("partidas")
  const [activeTab, setActiveTab] = useState("group")
  /** Fase de grupos: lista por letra de grupo ou lista única por data. */
  const [groupLayout, setGroupLayout] = useState<"group" | "date">("date")
  /** Ordenação por data do jogo (só aplica em lista por data). */
  const [dateOrder, setDateOrder] = useState<"asc" | "desc">("asc")

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name, code, group_name")
      .order("group_name", { ascending: true })
      .order("name", { ascending: true })

    if (teamData) setTeams(teamData)

    const matchSelectFull =
      "id, home_score, away_score, home_penalty_score, away_penalty_score, match_date, stage, group_name, status, home_team:home_team_id(id, name, code), away_team:away_team_id(id, name, code)"
    const matchSelectBase =
      "id, home_score, away_score, match_date, stage, group_name, status, home_team:home_team_id(id, name, code), away_team:away_team_id(id, name, code)"

    const matchRes = await supabase.from("matches").select(matchSelectFull).order("match_date", { ascending: true })
    const matchData =
      matchRes.error != null
        ? (await supabase.from("matches").select(matchSelectBase).order("match_date", { ascending: true })).data
        : matchRes.data

    if (matchData) {
      const mapped = matchData.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        home_team: m.home_team as Team,
        away_team: m.away_team as Team,
        home_score: m.home_score as number | null,
        away_score: m.away_score as number | null,
        home_penalty_score: (m.home_penalty_score as number | null | undefined) ?? null,
        away_penalty_score: (m.away_penalty_score as number | null | undefined) ?? null,
        match_date: m.match_date as string,
        stage: m.stage as string,
        group_name: m.group_name as string | null,
        status: m.status as string,
      }))
      setMatches(mapped)
    }

    const betSelectFull =
      "id, match_id, predicted_home_score, predicted_away_score, predicted_advances_team_id, points_earned"
    const betSelectBase = "id, match_id, predicted_home_score, predicted_away_score, points_earned"

    const betRes = await supabase.from("bets").select(betSelectFull).eq("user_id", user.id)
    const betData =
      betRes.error != null
        ? (await supabase.from("bets").select(betSelectBase).eq("user_id", user.id)).data
        : betRes.data

    if (betData) {
      setBets(
        betData.map((b) => ({
          ...b,
          predicted_advances_team_id:
            (b as { predicted_advances_team_id?: string | null }).predicted_advances_team_id ?? null,
        })) as Bet[],
      )
    }

    const { data: resultsData } = await supabase
      .from("teams_results")
      .select("team_home, team_away, goals_home, goals_away, match_result_home, match_result_away, group")

    if (resultsData) setOfficialResults(resultsData as OfficialResult[])

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const teamsByGroup = useMemo(
    () =>
      teams.reduce<Record<string, Team[]>>((acc, team) => {
        if (team.group_name) {
          if (!acc[team.group_name]) acc[team.group_name] = []
          acc[team.group_name].push(team)
        }
        return acc
      }, {}),
    [teams],
  )

  const simulatedStandingsByGroup = useMemo(() => {
    const standingsMap = computeSimulatedGroupStandings(teams, matches, bets)
    const out: Record<
      string,
      { team: Team; stats: SimulatedTeamStats }[]
    > = {}
    for (const letter of GROUPS) {
      const groupTeams = teamsByGroup[letter]
      if (!groupTeams?.length) continue
      const statsForGroup = standingsMap.get(letter)
      if (!statsForGroup) continue
      const rows = groupTeams.map((team) => ({
        team,
        stats: statsForGroup.get(team.id) ?? {
          played: 0,
          won: 0,
          draw: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDiff: 0,
          points: 0,
        },
      }))
      out[letter] = sortSimulatedStandings(rows)
    }
    return out
  }, [teams, matches, bets, teamsByGroup])

  const groupStageBetCounts = useMemo(
    () =>
      countGroupStageMatchesWithBet(
        matches.filter((m) => m.stage === "group"),
        bets,
      ),
    [matches, bets],
  )

  const simulatedRoundOf32 = useMemo(
    () => resolveSimulatedRoundOf32(simulatedStandingsByGroup),
    [simulatedStandingsByGroup],
  )

  const calculateTeamStats = useCallback(
    (teamName: string, groupName: string): TeamStats => {
      const stats: TeamStats = {
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      }

      const teamResults = officialResults.filter(
        (r) => r.group === groupName && (r.team_home === teamName || r.team_away === teamName),
      )

      teamResults.forEach((result) => {
        stats.played++

        if (result.team_home === teamName) {
          stats.goalsFor += result.goals_home
          stats.goalsAgainst += result.goals_away
          if (result.match_result_home === "W") {
            stats.won++
            stats.points += 3
          } else if (result.match_result_home === "T") {
            stats.draw++
            stats.points += 1
          } else {
            stats.lost++
          }
        } else {
          stats.goalsFor += result.goals_away
          stats.goalsAgainst += result.goals_home
          if (result.match_result_away === "W") {
            stats.won++
            stats.points += 3
          } else if (result.match_result_away === "T") {
            stats.draw++
            stats.points += 1
          } else {
            stats.lost++
          }
        }
      })

      stats.goalDiff = stats.goalsFor - stats.goalsAgainst
      return stats
    },
    [officialResults],
  )

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const stages = [
    { value: "group", label: "Fase de grupos" },
    { value: "round_of_32", label: "16-avos" },
    { value: "round_of_16", label: "Oitavas" },
    { value: "quarter_final", label: "Quartas" },
    { value: "semi_final", label: "Semi" },
    { value: "final", label: "Finais" },
  ]

  const standingsSection =
    Object.keys(teamsByGroup).length > 0 ? (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tabela dos grupos</h2>
          <p className="text-sm text-muted-foreground">
            Pontos, saldo de gols e estatisticas por grupo (com base nos resultados oficiais cadastrados).
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {GROUPS.map((groupLetter) => {
            const groupTeams = teamsByGroup[groupLetter]
            if (!groupTeams || groupTeams.length === 0) return null

            const teamsWithStats = groupTeams
              .map((team) => ({
                ...team,
                stats: calculateTeamStats(team.name, groupLetter),
              }))
              .sort((a, b) => {
                if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points
                if (b.stats.goalDiff !== a.stats.goalDiff) return b.stats.goalDiff - a.stats.goalDiff
                return b.stats.goalsFor - a.stats.goalsFor
              })

            return (
              <Card key={groupLetter} className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Grupo {groupLetter}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="-mx-1 overflow-x-auto rounded-xl border border-border sm:mx-0">
                    <table className="w-full min-w-[32rem] border-collapse text-[11px] sm:min-w-0 sm:text-xs md:text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="w-8 whitespace-nowrap px-1.5 py-2 text-center font-medium text-muted-foreground sm:px-2 sm:py-2.5">
                            #
                          </th>
                          <th className="min-w-[6.5rem] whitespace-nowrap px-1.5 py-2 text-left font-medium text-muted-foreground sm:min-w-[7.5rem] sm:px-2">
                            Time
                          </th>
                          <th className="w-8 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-9 sm:px-1.5">
                            PG
                          </th>
                          <th className="w-7 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-8">
                            V
                          </th>
                          <th className="w-7 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-8">
                            E
                          </th>
                          <th className="w-7 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-8">
                            D
                          </th>
                          <th className="w-8 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-9">
                            GP
                          </th>
                          <th className="w-8 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-9">
                            GC
                          </th>
                          <th className="w-9 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-10">
                            SG
                          </th>
                          <th className="w-10 whitespace-nowrap px-1.5 py-2 text-center font-medium text-muted-foreground sm:w-11 sm:px-2">
                            Pts
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {teamsWithStats.map((team, index) => (
                          <tr key={team.id} className="hover:bg-muted/30">
                            <td className="whitespace-nowrap px-1.5 py-2 text-center font-medium text-muted-foreground sm:px-2 sm:py-2.5">
                              {index + 1}
                            </td>
                            <td className="min-w-[6.5rem] px-1.5 py-1.5 sm:min-w-[7.5rem] sm:px-2 sm:py-2">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span
                                  className="shrink-0 text-lg leading-none sm:text-xl md:text-2xl"
                                  title={team.name}
                                >
                                  {getCountryFlag(team.name)}
                                </span>
                                <span className="whitespace-nowrap font-semibold text-foreground">{team.code}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-center text-muted-foreground sm:px-1.5 sm:py-2.5">
                              {team.stats.played}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-center text-muted-foreground sm:py-2.5">
                              {team.stats.won}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-center text-muted-foreground sm:py-2.5">
                              {team.stats.draw}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-center text-muted-foreground sm:py-2.5">
                              {team.stats.lost}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-center text-muted-foreground sm:py-2.5">
                              {team.stats.goalsFor}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-center text-muted-foreground sm:py-2.5">
                              {team.stats.goalsAgainst}
                            </td>
                            <td
                              className={`whitespace-nowrap px-1.5 py-2.5 text-center font-medium ${
                                team.stats.goalDiff > 0
                                  ? "text-green-600"
                                  : team.stats.goalDiff < 0
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {team.stats.goalDiff > 0 ? "+" : ""}
                              {team.stats.goalDiff}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2.5 text-center font-bold text-foreground">
                              {team.stats.points}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16">
        <Trophy className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhum time em grupo cadastrado ainda</p>
      </div>
    )

  const simulationSection =
    Object.keys(simulatedStandingsByGroup).length > 0 ? (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Simulacao dos grupos (os seus palpites)</h2>
          <p className="text-sm text-muted-foreground">
            Classificacao calculada só com os jogos da fase de grupos em que já tem placar apostado. Jogos sem palpite não
            entram na tabela ({groupStageBetCounts.withBet} de {groupStageBetCounts.total} jogos com aposta).
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {GROUPS.map((groupLetter) => {
            const rows = simulatedStandingsByGroup[groupLetter]
            if (!rows?.length) return null

            return (
              <Card key={`sim-${groupLetter}`} className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Grupo {groupLetter}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="-mx-1 overflow-x-auto rounded-xl border border-border sm:mx-0">
                    <table className="w-full min-w-[32rem] border-collapse text-[11px] sm:min-w-0 sm:text-xs md:text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="w-8 whitespace-nowrap px-1.5 py-2 text-center font-medium text-muted-foreground sm:px-2 sm:py-2.5">
                            #
                          </th>
                          <th className="min-w-[6.5rem] whitespace-nowrap px-1.5 py-2 text-left font-medium text-muted-foreground sm:min-w-[7.5rem] sm:px-2">
                            Time
                          </th>
                          <th className="w-8 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-9 sm:px-1.5">
                            PG
                          </th>
                          <th className="w-7 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-8">
                            V
                          </th>
                          <th className="w-7 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-8">
                            E
                          </th>
                          <th className="w-7 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-8">
                            D
                          </th>
                          <th className="w-8 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-9">
                            GP
                          </th>
                          <th className="w-8 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-9">
                            GC
                          </th>
                          <th className="w-9 whitespace-nowrap px-1 py-2 text-center font-medium text-muted-foreground sm:w-10">
                            SG
                          </th>
                          <th className="w-10 whitespace-nowrap px-1.5 py-2 text-center font-medium text-muted-foreground sm:w-11 sm:px-2">
                            Pts
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rows.map(({ team, stats }, index) => (
                          <tr key={team.id} className="hover:bg-muted/30">
                            <td className="whitespace-nowrap px-1.5 py-2 text-center font-medium text-muted-foreground sm:px-2 sm:py-2.5">
                              {index + 1}
                            </td>
                            <td className="min-w-[6.5rem] px-1.5 py-1.5 sm:min-w-[7.5rem] sm:px-2 sm:py-2">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span
                                  className="shrink-0 text-lg leading-none sm:text-xl md:text-2xl"
                                  title={team.name}
                                >
                                  {getCountryFlag(team.name)}
                                </span>
                                <span className="whitespace-nowrap font-semibold text-foreground">{team.code}</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-center text-muted-foreground sm:px-1.5 sm:py-2.5">
                              {stats.played}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-center text-muted-foreground sm:py-2.5">
                              {stats.won}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-center text-muted-foreground sm:py-2.5">
                              {stats.draw}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-center text-muted-foreground sm:py-2.5">
                              {stats.lost}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-center text-muted-foreground sm:py-2.5">
                              {stats.goalsFor}
                            </td>
                            <td className="whitespace-nowrap px-1 py-2 text-center text-muted-foreground sm:py-2.5">
                              {stats.goalsAgainst}
                            </td>
                            <td
                              className={`whitespace-nowrap px-1.5 py-2.5 text-center font-medium ${
                                stats.goalDiff > 0
                                  ? "text-green-600"
                                  : stats.goalDiff < 0
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {stats.goalDiff > 0 ? "+" : ""}
                              {stats.goalDiff}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2.5 text-center font-bold text-foreground">
                              {stats.points}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <SimulatedRoundOf32 brackets={simulatedRoundOf32} />
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16">
        <Sparkles className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhum time em grupo cadastrado ainda</p>
      </div>
    )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Partidas</h1>
        <p className="text-sm text-muted-foreground">
          Classificacao dos grupos e apostas por fase. Na fase de grupos, escolha entre ver os jogos agrupados por letra ou
          uma lista única ordenada por data.
        </p>
      </div>

      <Tabs value={mainView} onValueChange={(v) => setMainView(v as "partidas" | "classificacao" | "simulacao")}>
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl p-1 sm:max-w-2xl">
          <TabsTrigger value="partidas" className="gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm">
            <Calendar className="h-4 w-4 shrink-0" />
            Partidas
          </TabsTrigger>
          <TabsTrigger value="classificacao" className="gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm">
            <Trophy className="h-4 w-4 shrink-0" />
            Grupos
          </TabsTrigger>
          <TabsTrigger value="simulacao" className="gap-1.5 rounded-lg py-2.5 text-xs sm:text-sm">
            <Sparkles className="h-4 w-4 shrink-0" />
            Simulacao
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classificacao" className="mt-6">
          {standingsSection}
        </TabsContent>

        <TabsContent value="simulacao" className="mt-6">
          {simulationSection}
        </TabsContent>

        <TabsContent value="partidas" className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start overflow-x-auto rounded-xl p-1">
              {stages.map((stage) => (
                <TabsTrigger key={stage.value} value={stage.value} className="rounded-lg text-xs sm:text-sm">
                  {stage.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              {activeTab === "group" ? (
                <>
                  <div className="grid gap-1.5">
                    <Label htmlFor="filter-group-layout" className="text-xs text-muted-foreground">
                      Fase de grupos
                    </Label>
                    <Select
                      value={groupLayout}
                      onValueChange={(v) => setGroupLayout(v as "group" | "date")}
                    >
                      <SelectTrigger id="filter-group-layout" className="w-full min-w-[200px] sm:w-[280px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Ordenar por data</SelectItem>
                        <SelectItem value="group">Mostrar por grupo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="filter-date" className="text-xs text-muted-foreground">
                      Ordem da data
                    </Label>
                    <Select
                      value={dateOrder}
                      onValueChange={(v) => setDateOrder(v as "asc" | "desc")}
                      disabled={groupLayout === "group"}
                    >
                      <SelectTrigger id="filter-date" className="w-full min-w-[200px] sm:w-[280px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Crescente (mais cedo primeiro)</SelectItem>
                        <SelectItem value="desc">Decrescente (mais tarde primeiro)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="grid gap-1.5">
                  <Label htmlFor="filter-date" className="text-xs text-muted-foreground">
                    Ordem da data
                  </Label>
                  <Select value={dateOrder} onValueChange={(v) => setDateOrder(v as "asc" | "desc")}>
                    <SelectTrigger id="filter-date" className="w-full min-w-[200px] sm:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Crescente (mais cedo primeiro)</SelectItem>
                      <SelectItem value="desc">Decrescente (mais tarde primeiro)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {stages.map((stage) => {
              const rawStageMatches = matchesForStage(matches, stage.value)
              const stageList =
                stage.value === "group" && groupLayout === "group"
                  ? rawStageMatches
                  : sortMatchesByDate(rawStageMatches, dateOrder)
              const groupedForStage =
                stage.value === "group" && groupLayout === "group"
                  ? groupMatchesByGroupName(rawStageMatches)
                  : null

              const emptyPhase = (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 shadow-sm">
                  <p className="text-muted-foreground">Nenhuma partida nesta fase ainda</p>
                </div>
              )

              return (
                <TabsContent key={stage.value} value={stage.value} className="mt-4">
                  {stage.value === "round_of_32" ? (
                    <div className="flex flex-col gap-6">
                      <PlayoffBrackets />
                      {stageList.length === 0 ? (
                        emptyPhase
                      ) : (
                        <>
                          <h2 className="text-xl font-semibold text-foreground">Apostas</h2>
                          <p className="-mt-2 text-sm text-muted-foreground">
                            Ordem por data conforme o filtro acima.
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {stageList.map((match) => (
                              <MatchCard
                                key={match.id}
                                match={match}
                                bet={bets.find((b) => b.match_id === match.id) || null}
                                userId={userId!}
                                onBetPlaced={loadData}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : rawStageMatches.length === 0 ? (
                    emptyPhase
                  ) : stage.value === "group" && groupLayout === "group" && groupedForStage ? (
                    <div className="flex flex-col gap-8">
                      <p className="text-sm text-muted-foreground">
                        Em cada grupo, os jogos seguem ordem cronológica (mais cedo primeiro).
                      </p>
                      {sortGroupKeys(Object.keys(groupedForStage)).map((g) => {
                        const groupMatches = sortMatchesByDate(groupedForStage[g] ?? [], "asc")
                        return (
                          <div key={g}>
                            <h2 className="mb-3 text-lg font-semibold text-foreground">Grupo {g}</h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {groupMatches.map((match) => (
                                <MatchCard
                                  key={match.id}
                                  match={match}
                                  bet={bets.find((b) => b.match_id === match.id) || null}
                                  userId={userId!}
                                  onBetPlaced={loadData}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : stage.value === "group" ? (
                    <div className="flex flex-col gap-4">
                      <p className="text-sm text-muted-foreground">
                        Lista única ordenada pela data; o grupo de cada jogo aparece no cartão.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {stageList.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            bet={bets.find((b) => b.match_id === match.id) || null}
                            userId={userId!}
                            onBetPlaced={loadData}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-muted-foreground">Ordem por data conforme o filtro acima.</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {stageList.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            bet={bets.find((b) => b.match_id === match.id) || null}
                            userId={userId!}
                            onBetPlaced={loadData}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        </TabsContent>
      </Tabs>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end px-3 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] pt-2 md:bottom-0 md:pb-6 md:pt-0">
        <div className="pointer-events-auto flex flex-col gap-2">
          <Button
            id="backToTheTop"
            type="button"
            variant="secondary"
            size="icon"
            className="h-11 w-11 rounded-full border border-border bg-card shadow-md"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Voltar ao topo"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-11 w-11 rounded-full border border-border bg-card shadow-md"
            onClick={() => void loadData()}
            aria-label="Atualizar partidas e apostas"
            title="Atualizar"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
