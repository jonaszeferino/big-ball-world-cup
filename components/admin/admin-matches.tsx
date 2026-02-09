"use client"

import React from "react"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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
  match_date: string
  stage: string
  group_name: string | null
  status: string
}

const STAGES = [
  { value: "group", label: "Fase de Grupos" },
  { value: "round_of_16", label: "Oitavas de Final" },
  { value: "quarter_final", label: "Quartas de Final" },
  { value: "semi_final", label: "Semifinal" },
  { value: "third_place", label: "Disputa 3o Lugar" },
  { value: "final", label: "Final" },
]

export function AdminMatches() {
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [homeTeamId, setHomeTeamId] = useState("")
  const [awayTeamId, setAwayTeamId] = useState("")
  const [matchDate, setMatchDate] = useState("")
  const [stage, setStage] = useState("group")
  const [groupName, setGroupName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name, code, group_name")
      .order("name")
    if (teamData) setTeams(teamData)

    const { data: matchData } = await supabase
      .from("matches")
      .select("id, match_date, stage, group_name, status, home_team:home_team_id(id, name, code, group_name), away_team:away_team_id(id, name, code, group_name)")
      .order("match_date", { ascending: true })

    if (matchData) {
      const mapped = matchData.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        home_team: m.home_team as Team,
        away_team: m.away_team as Team,
        match_date: m.match_date as string,
        stage: m.stage as string,
        group_name: m.group_name as string | null,
        status: m.status as string,
      }))
      setMatches(mapped)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (homeTeamId === awayTeamId) {
      setError("Selecione times diferentes")
      return
    }
    setIsSubmitting(true)
    setError(null)
    const supabase = createClient()

    const { error: insertErr } = await supabase.from("matches").insert({
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      match_date: new Date(matchDate).toISOString(),
      stage,
      group_name: stage === "group" ? groupName : null,
      status: "scheduled",
    })

    if (insertErr) {
      setError(insertErr.message)
    } else {
      setHomeTeamId("")
      setAwayTeamId("")
      setMatchDate("")
      setGroupName("")
      loadData()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("matches").delete().eq("id", id)
    loadData()
  }

  const stageLabel = (s: string) => STAGES.find((st) => st.value === s)?.label || s

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">Criar Partida</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Time da Casa</Label>
                <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.code} - {t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Time Visitante</Label>
                <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.code} - {t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Data e Hora</Label>
                <Input
                  type="datetime-local"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Fase</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {stage === "group" && (
                <div className="grid gap-2">
                  <Label>Grupo</Label>
                  <Select value={groupName} onValueChange={setGroupName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A","B","C","D","E","F","G","H","I","J","K","L"].map((g) => (
                        <SelectItem key={g} value={g}>Grupo {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isSubmitting || !homeTeamId || !awayTeamId} className="w-fit">
              <Plus className="mr-1 h-4 w-4" />
              {isSubmitting ? "Criando..." : "Criar Partida"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">Partidas Cadastradas ({matches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Nenhuma partida cadastrada</p>
          ) : (
            <div className="flex flex-col gap-2">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {match.home_team.code} vs {match.away_team.code}
                      </span>
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        {stageLabel(match.stage)}
                        {match.group_name ? ` - ${match.group_name}` : ""}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={
                          match.status === "finished"
                            ? "bg-primary/10 text-primary text-xs"
                            : match.status === "live"
                            ? "bg-destructive/10 text-destructive text-xs"
                            : "text-xs"
                        }
                      >
                        {match.status === "scheduled" ? "Agendada" : match.status === "live" ? "Ao Vivo" : "Encerrada"}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(match.match_date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(match.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
