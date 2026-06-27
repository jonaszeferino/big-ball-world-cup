import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays } from "lucide-react"
import {
  FIFA_KNOCKOUT_STAGE_LABELS,
  formatFifaKnockoutBrazil,
  getFifaKnockoutMatch,
  getFifaKnockoutScheduleForMatchesTab,
  sortFifaKnockoutSchedule,
  type FifaKnockoutMatchSchedule,
} from "@/lib/fifa-knockout-schedule"

type FifaKnockoutSchedulePanelProps = {
  /** Valor da sub-aba em Partidas (group, round_of_32, …). */
  matchesTab: string
  compact?: boolean
  /** Sem Card/título — para uso dentro de accordion. */
  embedded?: boolean
}

function ScheduleTable({ rows }: { rows: FifaKnockoutMatchSchedule[] }) {
  return (
    <div className="-mx-1 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[36rem] border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <th className="px-2 py-2 font-medium">FIFA</th>
            <th className="px-2 py-2 font-medium">Confronto</th>
            <th className="px-2 py-2 font-medium">Brasília</th>
            <th className="px-2 py-2 font-medium">Local</th>
            <th className="hidden px-2 py-2 font-medium sm:table-cell">Estádio</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => {
            const { whenBrazil, localTime } = formatFifaKnockoutBrazil(row)
            return (
              <tr key={row.fifaMatch} className="hover:bg-muted/20">
                <td className="whitespace-nowrap px-2 py-2 font-semibold tabular-nums text-primary">
                  {row.fifaMatch}
                </td>
                <td className="min-w-[10rem] px-2 py-2 text-foreground">{row.matchup}</td>
                <td className="whitespace-nowrap px-2 py-2 tabular-nums text-foreground">
                  {whenBrazil}
                  <span className="mt-0.5 block text-[10px] text-muted-foreground sm:text-xs">
                    {localTime} horário local
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">{row.city}</td>
                <td className="hidden px-2 py-2 text-muted-foreground sm:table-cell">{row.venue}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function FifaKnockoutSchedulePanel({
  matchesTab,
  compact = false,
  embedded = false,
}: FifaKnockoutSchedulePanelProps) {
  const rows = sortFifaKnockoutSchedule(getFifaKnockoutScheduleForMatchesTab(matchesTab))
  if (rows.length === 0) return null

  const title =
    matchesTab === "final"
      ? "Calendário FIFA — 3º lugar e final"
      : `Calendário FIFA — ${FIFA_KNOCKOUT_STAGE_LABELS[matchesTab as keyof typeof FIFA_KNOCKOUT_STAGE_LABELS] ?? "mata-mata"}`

  if (embedded) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Datas e horários oficiais da FIFA em{" "}
          <strong className="font-medium text-foreground">horário de Brasília</strong>. Sujeito a alteração pela
          FIFA.
        </p>
        {matchesTab === "round_of_32" ? (
          <Badge variant="outline" className="w-fit text-xs">
            Jogos 73 a 88 · 28/jun a 3/jul/2026
          </Badge>
        ) : null}
        <ScheduleTable rows={rows} />
      </div>
    )
  }

  if (compact) {
    return (
      <div className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{title}</p>
        <ul className="mt-2 space-y-1">
          {rows.map((row) => {
            const { whenBrazil } = formatFifaKnockoutBrazil(row)
            return (
              <li key={row.fifaMatch}>
                <span className="font-semibold text-primary">Jogo {row.fifaMatch}</span> · {whenBrazil} · {row.city}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
          <CalendarDays className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Datas e horários oficiais da FIFA. Exibição em <strong className="font-medium text-foreground">horário de Brasília</strong>{" "}
          (horário local do estádio entre parênteses). Sujeito a alteração pela FIFA.
        </p>
        {matchesTab === "round_of_32" ? (
          <Badge variant="outline" className="w-fit text-xs">
            Jogos 73 a 88 · 28/jun a 3/jul/2026
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="pt-0">
        <ScheduleTable rows={rows} />
      </CardContent>
    </Card>
  )
}

export function FifaKnockoutMatchDateLine({ fifaMatch }: { fifaMatch: number }) {
  const row = getFifaKnockoutMatch(fifaMatch)
  if (!row) return null
  const { whenBrazil, localTime } = formatFifaKnockoutBrazil(row)
  return (
    <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
      {whenBrazil} (Brasília) · {localTime} local · {row.city}
    </p>
  )
}
