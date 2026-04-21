import React from "react"
import { Navbar } from "@/components/navbar"
import { WorldCupCountdownBanner } from "@/components/world-cup-countdown-banner"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <Navbar />
      <WorldCupCountdownBanner />
      <main className="mx-auto w-full max-w-2xl px-3 pb-24 pt-4 sm:px-4 md:max-w-5xl md:px-6 md:pb-8 md:pt-6">
        {children}
      </main>
    </div>
  )
}
