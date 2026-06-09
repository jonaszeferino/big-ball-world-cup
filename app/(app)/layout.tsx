import React from "react"
import { Navbar } from "@/components/navbar"
import { WorldCupCountdownBanner } from "@/components/world-cup-countdown-banner"
import { BroadcastToastGate } from "@/components/broadcast-toast-gate"
import { NextMatchBetReminder } from "@/components/next-match-bet-reminder"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <BroadcastToastGate />
      <NextMatchBetReminder />
      <Navbar />
      <WorldCupCountdownBanner />
      <main className="mx-auto w-full max-w-2xl px-3 pb-32 pt-4 sm:px-4 md:max-w-5xl md:px-6 md:pb-8 md:pt-6">
        {children}
      </main>
    </div>
  )
}
