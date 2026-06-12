import { cn } from "@/lib/utils"
import type { OfficialMatchResult } from "@/lib/match-bets-board"

interface MatchOfficialResultBannerProps {
  result: OfficialMatchResult
  homeCode: string
  awayCode: string
  className?: string
}

export function MatchOfficialResultBanner({
  result,
  homeCode,
  awayCode,
  className,
}: MatchOfficialResultBannerProps) {
  const showPenalties =
    result.homeScore === result.awayScore &&
    result.homePenalty != null &&
    result.awayPenalty != null

  return (
    <div
      className={cn(
        "rounded-lg border border-violet-500/45 bg-violet-500/10 px-3 py-2.5",
        className,
      )}
      role="status"
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-900 dark:text-violet-100">
        Placar oficial encerrado
      </p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
        {homeCode} {result.homeScore} x {result.awayScore} {awayCode}
        {showPenalties ? (
          <span className="ml-1.5 text-xs font-medium text-muted-foreground">
            (pen. {result.homePenalty}–{result.awayPenalty})
          </span>
        ) : null}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
        Resultado final confirmado no bolão — pontos já contabilizados.
      </p>
    </div>
  )
}
