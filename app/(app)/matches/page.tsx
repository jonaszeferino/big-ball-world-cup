"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { MatchCard } from "@/components/match-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { getCountryFlag } from "@/lib/country-flags"
import { PlayoffBrackets } from "@/components/playoff-brackets"

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

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [officialResults, setOfficialResults] = useState<OfficialResult[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("group")

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

    const { data: matchData } = await supabase
      .from("matches")
      .select("id, home_score, away_score, match_date, stage, group_name, status, home_team:home_team_id(id, name, code), away_team:away_team_id(id, name, code)")
      .order("match_date", { ascending: true })

    if (matchData) {
      const mapped = matchData.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        home_team: m.home_team as Team,
        away_team: m.away_team as Team,
        home_score: m.home_score as number | null,
        away_score: m.away_score as number | null,
        match_date: m.match_date as string,
        stage: m.stage as string,
        group_name: m.group_name as string | null,
        status: m.status as string,
      }))
      setMatches(mapped)
    }

    const { data: betData } = await supabase
      .from("bets")
      .select("id, match_id, predicted_home_score, predicted_away_score, points_earned")
      .eq("user_id", user.id)

    if (betData) setBets(betData)

    const { data: resultsData } = await supabase
      .from("teams_results")
      .select("team_home, team_away, goals_home, goals_away, match_result_home, match_result_away, group")

    if (resultsData) setOfficialResults(resultsData as OfficialResult[])

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const stages = [
    { value: "group", label: "Grupos" },
    { value: "round_of_32", label: "16-avos" },
    { value: "round_of_16", label: "Oitavas" },
    { value: "quarter_final", label: "Quartas" },
    { value: "semi_final", label: "Semi" },
    { value: "final", label: "Finais" },
  ]

  const filteredMatches = matches.filter((m) => {
    if (activeTab === "final") return m.stage === "final" || m.stage === "third_place"
    return m.stage === activeTab
  })

  const groupedByGroup = filteredMatches.reduce<Record<string, Match[]>>((acc, match) => {
    const key = match.group_name || "Playoff"
    if (!acc[key]) acc[key] = []
    acc[key].push(match)
    return acc
  }, {})

  const teamsByGroup = teams.reduce<Record<string, Team[]>>((acc, team) => {
    if (team.group_name) {
      if (!acc[team.group_name]) acc[team.group_name] = []
      acc[team.group_name].push(team)
    }
    return acc
  }, {})

  const calculateTeamStats = (teamName: string, groupName: string): TeamStats => {
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
      (r) => r.group === groupName && (r.team_home === teamName || r.team_away === teamName)
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
  }

  const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Partidas</h1>
        <p className="text-sm text-muted-foreground">
          Selecione o placar e confirme sua aposta antes do inicio da partida
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {stages.map((stage) => (
            <TabsTrigger key={stage.value} value={stage.value} className="text-xs sm:text-sm">
              {stage.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {stages.map((stage) => (
          <TabsContent key={stage.value} value={stage.value} className="mt-4">
            {stage.value === "group" && Object.keys(teamsByGroup).length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 text-xl font-semibold text-foreground">Grupos da Copa</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {GROUPS.map((groupLetter) => {
                    const groupTeams = teamsByGroup[groupLetter]
                    if (!groupTeams || groupTeams.length === 0) return null

                    const teamsWithStats = groupTeams.map((team) => ({
                      ...team,
                      stats: calculateTeamStats(team.name, groupLetter),
                    })).sort((a, b) => {
                      if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points
                      if (b.stats.goalDiff !== a.stats.goalDiff) return b.stats.goalDiff - a.stats.goalDiff
                      return b.stats.goalsFor - a.stats.goalsFor
                    })

                    return (
                      <Card key={groupLetter}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Grupo {groupLetter}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-xs">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">#</th>
                                  <th className="px-2 py-2 text-left font-medium text-muted-foreground">Time</th>
                                  <th className="px-2 py-2 text-center font-medium text-muted-foreground">PG</th>
                                  <th className="px-2 py-2 text-center font-medium text-muted-foreground">V</th>
                                  <th className="px-2 py-2 text-center font-medium text-muted-foreground">E</th>
                                  <th className="px-2 py-2 text-center font-medium text-muted-foreground">D</th>
                                  <th className="px-2 py-2 text-center font-medium text-muted-foreground">GP</th>
                                  <th className="px-2 py-2 text-center font-medium text-muted-foreground">GC</th>
                                  <th className="px-2 py-2 text-center font-medium text-muted-foreground">SG</th>
                                  <th className="px-2 py-2 text-center font-medium text-muted-foreground">Pts</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {teamsWithStats.map((team, index) => (
                                  <tr key={team.id} className="hover:bg-muted/30">
                                    <td className="px-2 py-2.5 font-medium text-muted-foreground">
                                      {index + 1}
                                    </td>
                                    <td className="px-2 py-2.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-lg" title={team.name}>{getCountryFlag(team.name)}</span>
                                        <span className="font-semibold text-foreground">{team.code}</span>
                                      </div>
                                    </td>
                                    <td className="px-2 py-2.5 text-center text-muted-foreground">{team.stats.played}</td>
                                    <td className="px-2 py-2.5 text-center text-muted-foreground">{team.stats.won}</td>
                                    <td className="px-2 py-2.5 text-center text-muted-foreground">{team.stats.draw}</td>
                                    <td className="px-2 py-2.5 text-center text-muted-foreground">{team.stats.lost}</td>
                                    <td className="px-2 py-2.5 text-center text-muted-foreground">{team.stats.goalsFor}</td>
                                    <td className="px-2 py-2.5 text-center text-muted-foreground">{team.stats.goalsAgainst}</td>
                                    <td className={`px-2 py-2.5 text-center font-medium ${team.stats.goalDiff > 0 ? 'text-green-600' : team.stats.goalDiff < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                      {team.stats.goalDiff > 0 ? '+' : ''}{team.stats.goalDiff}
                                    </td>
                                    <td className="px-2 py-2.5 text-center font-bold text-foreground">{team.stats.points}</td>
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
            )}

            {filteredMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16">
                <p className="text-muted-foreground">Nenhuma partida nesta fase ainda</p>
              </div>
            ) : activeTab === "group" ? (
              <div className="flex flex-col gap-6">
                <h2 className="text-xl font-semibold text-foreground">Apostas nas Partidas</h2>
                {Object.entries(groupedByGroup)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([groupName, groupMatches]) => (
                    <div key={groupName}>
                      <h3 className="mb-3 text-lg font-medium text-foreground">
                        Grupo {groupName}
                      </h3>
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
                  ))}
              </div>
            ) : activeTab === "round_of_32" ? (
              <div className="flex flex-col gap-6">
                <PlayoffBrackets />
                {filteredMatches.length > 0 && (
                  <>
                    <h2 className="text-xl font-semibold text-foreground">Apostas nas Partidas</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredMatches.map((match) => (
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
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    bet={bets.find((b) => b.match_id === match.id) || null}
                    userId={userId!}
                    onBetPlaced={loadData}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
