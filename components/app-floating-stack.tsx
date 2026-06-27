import { DiasporaCounterWidget } from "@/components/diaspora-counter-widget"
import { MatchesFloatingActions } from "@/components/matches-floating-actions"

export function AppFloatingStack() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end px-3 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] pt-2 md:bottom-0 md:pb-6 md:pt-0">
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <DiasporaCounterWidget />
        <MatchesFloatingActions />
      </div>
    </div>
  )
}
