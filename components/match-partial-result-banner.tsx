import { cn } from "@/lib/utils"
import type { PartialMatchResult } from "@/lib/match-partial-result"

interface MatchPartialResultBannerProps {
  result: PartialMatchResult
  homeCode: string
  awayCode: string
  className?: string
  compact?: boolean
}

export function MatchPartialResultBanner({
  result,
  homeCode,
  awayCode,
  className,
  compact = false,
}: MatchPartialResultBannerProps) {
  const showPenalties =
    result.homeScore === result.awayScore &&
    result.homePenalty != null &&
    result.awayPenalty != null

  return (
    <div
      className={cn(
        "rounded-lg border border-amber-500/45 bg-amber-500/10",
        compact ? "px-3 py-2" : "px-3 py-2.5",
        className,
      )}
      role="status"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
        Resultado parcial
      </p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
        {homeCode} {result.homeScore} x {result.awayScore} {awayCode}
        {showPenalties ? (
          <span className="ml-1.5 text-xs font-medium text-muted-foreground">
            (pen. {result.homePenalty}–{result.awayPenalty})
          </span>
        ) : null}
      </p>
      {!compact ? (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          Placar provisório — pode mudar até o admin encerrar a partida no bolão. Pontos com sufixo{" "}
          <strong className="font-medium text-foreground/90">prov.</strong> usam este placar.
        </p>
      ) : null}
    </div>
  )
}
