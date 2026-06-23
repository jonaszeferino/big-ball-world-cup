import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Flag, ListChecks } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GroupStageProgress } from "@/lib/palpites-progress"

type PalpitesProgressSummaryProps = {
  groupProgress: GroupStageProgress
  championLoading: boolean
  championHasBet: boolean
  championIsOpen: boolean
  championDeadlineLabel: string | null
}

export function PalpitesProgressSummary({
  groupProgress,
  championLoading,
  championHasBet,
  championIsOpen,
  championDeadlineLabel,
}: PalpitesProgressSummaryProps) {
  const { total, remaining, missingBets, missingBetsOpen } = groupProgress

  return (
    <Card className="border-border/80 bg-muted/15">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ListChecks className="h-5 w-5 text-primary" />
          Seu progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border/70 bg-background/80 px-3 py-3">
          <div className="flex items-start gap-2">
            <Flag className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">Fase de grupos</p>
              {total === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma partida cadastrada ainda.</p>
              ) : (
                <>
                  <p className="text-sm text-foreground/85">
                    <strong className="font-semibold text-foreground">{remaining}</strong> partida
                    {remaining === 1 ? "" : "s"} restante{remaining === 1 ? "" : "s"}
                    {total > 0 ? (
                      <span className="text-muted-foreground"> (de {total} no total)</span>
                    ) : null}
                  </p>
                  {remaining > 0 ? (
                    <p className="text-sm text-foreground/85">
                      Sem seu palpite:{" "}
                      <strong
                        className={cn(
                          "font-semibold",
                          missingBets > 0 ? "text-amber-800 dark:text-amber-200" : "text-emerald-700 dark:text-emerald-300",
                        )}
                      >
                        {missingBets}
                      </strong>
                      {missingBetsOpen > 0 ? (
                        <span className="text-muted-foreground">
                          {" "}
                          ·{" "}
                          <Link href="/matches" className="font-medium text-primary underline-offset-2 hover:underline">
                            {missingBetsOpen} ainda dá para apostar
                          </Link>
                        </span>
                      ) : missingBets === 0 ? (
                        <span className="text-muted-foreground"> — você palpitou em todas as restantes</span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Fase de grupos encerrada no bolão.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-background/80 px-3 py-3">
          <div className="flex items-start gap-2">
            <Crown className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">Palpite do campeão</p>
              {championLoading ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : championHasBet ? (
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Palpite registrado
                  {championIsOpen ? (
                    <span className="text-muted-foreground"> — ainda pode alterar até o prazo</span>
                  ) : null}
                </p>
              ) : championIsOpen ? (
                <>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Você ainda não escolheu campeão e vice
                  </p>
                  <Link
                    href="#palpite-campeao"
                    className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Escolher agora
                  </Link>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Prazo encerrado — sem palpite registrado</p>
              )}
              {championIsOpen && championDeadlineLabel ? (
                <p className="text-xs text-muted-foreground">Prazo: {championDeadlineLabel}</p>
              ) : null}
              {!championLoading && championHasBet ? (
                <Badge variant="outline" className="mt-1 border-emerald-500/40 text-emerald-800 dark:text-emerald-200">
                  Feito
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
