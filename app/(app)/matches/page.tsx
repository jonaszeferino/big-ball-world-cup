"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { MatchCard } from "@/components/match-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

interface Team {
  id: string
  name: string
  code: string
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

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("group")

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

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
            {filteredMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16">
                <p className="text-muted-foreground">Nenhuma partida nesta fase ainda</p>
              </div>
            ) : activeTab === "group" ? (
              <div className="flex flex-col gap-6">
                {Object.entries(groupedByGroup)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([groupName, groupMatches]) => (
                    <div key={groupName}>
                      <h2 className="mb-3 text-lg font-semibold text-foreground">
                        Grupo {groupName}
                      </h2>
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
