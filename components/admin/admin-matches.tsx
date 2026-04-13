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
import { Plus, RotateCcw, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { reopenMatchAndResetBets } from "@/lib/match-result-scoring"

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

const STAGES = [
  { value: "group", label: "Fase de Grupos" },
  { value: "round_of_32", label: "16-avos de Final" },
  { value: "round_of_16", label: "Oitavas de Final" },
  { value: "quarter_final", label: "Quartas de Final" },
  { value: "semi_final", label: "Semifinal" },
  { value: "third_place", label: "Disputa 3o Lugar" },
  { value: "final", label: "Final" },
]

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function matchOfficialCode(m: Match) {
  return `${m.home_team.code}-${m.away_team.code}`
}

function RegisteredMatchRow({
  match,
  hasOfficialResult,
  bolaoEncerrado,
  stageLabelFn,
  disabled,
  onSaveDate,
  onReopenBolao,
  onDelete,
}: {
  match: Match
  /** Linha em teams_results (resultado oficial para tabela de grupos). */
  hasOfficialResult: boolean
  /** Partida fechada no bolão (pontos/ranking); só após "Encerrar partida" em Resultados Oficiais. */
  bolaoEncerrado: boolean
  stageLabelFn: (s: string) => string
  disabled: boolean
  onSaveDate: (matchId: string, datetimeLocal: string) => void | Promise<void>
  onReopenBolao: (match: Match) => void | Promise<void>
  onDelete: (id: string) => void
}) {
  const [dateValue, setDateValue] = useState(() => toDatetimeLocalValue(match.match_date))

  useEffect(() => {
    setDateValue(toDatetimeLocalValue(match.match_date))
  }, [match.id, match.match_date])

  const bolaoFechadoSemOficial =
    bolaoEncerrado && !hasOfficialResult && match.home_score !== null && match.away_score !== null
  const resultadoOficialBolaoAberto = hasOfficialResult && !bolaoEncerrado

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {match.home_team.name} <span className="text-muted-foreground">vs</span> {match.away_team.name}
          </span>
          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
            {stageLabelFn(match.stage)}
            {match.group_name ? ` - ${match.group_name}` : ""}
          </Badge>
          <Badge
            variant="secondary"
            className={
              bolaoEncerrado
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 text-xs"
                : resultadoOficialBolaoAberto
                  ? "bg-sky-500/15 text-sky-900 dark:text-sky-100 text-xs"
                  : bolaoFechadoSemOficial
                    ? "bg-amber-500/15 text-amber-900 dark:text-amber-100 text-xs"
                    : match.status === "live"
                      ? "bg-destructive/10 text-destructive text-xs"
                      : "text-xs"
            }
          >
            {bolaoEncerrado
              ? "Encerrada no bolão"
              : resultadoOficialBolaoAberto
                ? "Resultado oficial (bolão aberto)"
                : bolaoFechadoSemOficial
                  ? "Bolão fechado — sem resultado oficial"
                  : match.status === "scheduled"
                    ? "Agendada"
                    : match.status === "live"
                      ? "Ao Vivo"
                      : "Em aberto"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {format(new Date(match.match_date), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Placar oficial e encerramento: aba <span className="font-medium text-foreground">Resultados Oficiais</span>.
          {bolaoEncerrado ? " Para testes, usa Reabrir bolão ao lado." : ""}
        </p>
        <div className="grid w-full max-w-xs gap-1.5">
          <Label className="text-xs">Alterar data e hora</Label>
          <Input
            type="datetime-local"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {bolaoEncerrado && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={disabled}
            onClick={() => void onReopenBolao(match)}
          >
            <RotateCcw className="h-4 w-4" />
            Reabrir bolão
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          disabled={disabled || !dateValue}
          onClick={() => void onSaveDate(match.id, dateValue)}
        >
          Guardar data
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-destructive"
          disabled={disabled}
          onClick={() => onDelete(match.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function AdminMatches() {
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  /** Códigos `home-away` presentes em teams_results (aba Resultados Oficiais). */
  const [officialMatchCodes, setOfficialMatchCodes] = useState<Set<string>>(() => new Set())
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
      .select(
        "id, home_score, away_score, match_date, stage, group_name, status, home_team:home_team_id(id, name, code, group_name), away_team:away_team_id(id, name, code, group_name)",
      )
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

    const { data: officialRows } = await supabase.from("teams_results").select("code")
    setOfficialMatchCodes(new Set((officialRows ?? []).map((r) => r.code as string)))
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (homeTeamId === awayTeamId) {
      setError("Selecione times diferentes")
      return
    }
    if (stage === "group" && !groupName) {
      setError("Selecione o grupo da partida")
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

  const handleUpdateMatchDate = async (matchId: string, datetimeLocal: string) => {
    setIsSubmitting(true)
    setError(null)
    const supabase = createClient()
    const { error: updateErr } = await supabase
      .from("matches")
      .update({ match_date: new Date(datetimeLocal).toISOString() })
      .eq("id", matchId)
    if (updateErr) {
      setError(updateErr.message)
    } else {
      await loadData()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("matches").delete().eq("id", id)
    loadData()
  }

  const handleReopenBolao = async (match: Match) => {
    if (
      !window.confirm(
        "Reabrir esta partida no bolão? Os pontos deste jogo nas apostas são zerados, o placar sai da partida (matches) e a linha em teams_results é removida, se existir.",
      )
    ) {
      return
    }
    setIsSubmitting(true)
    setError(null)
    const supabase = createClient()
    const code = matchOfficialCode(match)

    const { error: reopenErr } = await reopenMatchAndResetBets(supabase, match.id)
    if (reopenErr) {
      setError(reopenErr)
      setIsSubmitting(false)
      return
    }

    await supabase.from("teams_results").delete().eq("code", code)
    await loadData()
    setIsSubmitting(false)
  }

  const stageLabel = (s: string) => STAGES.find((st) => st.value === s)?.label || s

  const matchesByStage = matches.reduce<Record<string, Match[]>>((acc, match) => {
    if (!acc[match.stage]) acc[match.stage] = []
    acc[match.stage].push(match)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2" role="alert">
          {error}
        </p>
      )}
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
                      <SelectItem key={t.id} value={t.id}>
                        {t.code} - {t.name}
                      </SelectItem>
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
                      <SelectItem key={t.id} value={t.id}>
                        {t.code} - {t.name}
                      </SelectItem>
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
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
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
                      {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].map((g) => (
                        <SelectItem key={g} value={g}>
                          Grupo {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
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
          <p className="text-sm text-muted-foreground">
            Aqui apenas <strong className="font-medium text-foreground">crias e geres datas</strong>. Na aba{" "}
            <strong className="font-medium text-foreground">Resultados Oficiais</strong> podes <strong className="font-medium text-foreground">salvar o
            resultado</strong> (tabela de grupos) e, quando quiseres, <strong className="font-medium text-foreground">encerrar a partida no bolão</strong>{" "}
            para contar pontos e ranking.
          </p>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Nenhuma partida cadastrada</p>
          ) : (
            <div className="flex flex-col gap-6">
              {STAGES.map((stageItem) => {
                const stageMatches = matchesByStage[stageItem.value] || []
                if (stageMatches.length === 0) return null

                if (stageItem.value === "group") {
                  const groupedByGroup = stageMatches.reduce<Record<string, Match[]>>((acc, match) => {
                    const key = match.group_name || "Sem Grupo"
                    if (!acc[key]) acc[key] = []
                    acc[key].push(match)
                    return acc
                  }, {})

                  return (
                    <div key={stageItem.value} className="flex flex-col gap-4">
                      <h3 className="text-sm font-semibold text-foreground">{stageItem.label}</h3>
                      {Object.entries(groupedByGroup)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([group, groupMatches]) => (
                          <div key={group} className="flex flex-col gap-2">
                            <div className="text-xs font-medium text-muted-foreground">
                              {group === "Sem Grupo" ? group : `Grupo ${group}`}
                            </div>
                            {groupMatches.map((match) => (
                              <RegisteredMatchRow
                                key={match.id}
                                match={match}
                                hasOfficialResult={officialMatchCodes.has(matchOfficialCode(match))}
                                bolaoEncerrado={match.status === "finished"}
                                stageLabelFn={stageLabel}
                                disabled={isSubmitting}
                                onSaveDate={handleUpdateMatchDate}
                                onReopenBolao={handleReopenBolao}
                                onDelete={handleDelete}
                              />
                            ))}
                          </div>
                        ))}
                    </div>
                  )
                }

                return (
                  <div key={stageItem.value} className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{stageItem.label}</h3>
                    {stageMatches.map((match) => (
                      <RegisteredMatchRow
                        key={match.id}
                        match={match}
                        hasOfficialResult={officialMatchCodes.has(matchOfficialCode(match))}
                        bolaoEncerrado={match.status === "finished"}
                        stageLabelFn={stageLabel}
                        disabled={isSubmitting}
                        onSaveDate={handleUpdateMatchDate}
                        onReopenBolao={handleReopenBolao}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
