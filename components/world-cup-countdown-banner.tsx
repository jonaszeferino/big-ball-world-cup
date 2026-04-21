"use client"

import { useEffect, useState } from "react"

/** Abertura (1.º jogo): 11 jun 2026, 13h na Cidade do México = 19:00 UTC. */
const KICKOFF_MS = Date.UTC(2026, 5, 11, 19, 0, 0, 0)

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000

function splitCountdown(ms: number) {
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  const days = Math.floor(ms / DAY_MS)
  let rest = ms % DAY_MS
  const hours = Math.floor(rest / HOUR_MS)
  rest %= HOUR_MS
  const minutes = Math.floor(rest / MINUTE_MS)
  rest %= MINUTE_MS
  const seconds = Math.floor(rest / 1000)
  return { days, hours, minutes, seconds }
}

function pluralUnit(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural
}

export function WorldCupCountdownBanner() {
  const [remainingMs, setRemainingMs] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setRemainingMs(KICKOFF_MS - Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  if (remainingMs !== null && remainingMs <= 0) {
    return null
  }

  const { days, hours, minutes, seconds } =
    remainingMs !== null ? splitCountdown(remainingMs) : { days: 0, hours: 0, minutes: 0, seconds: 0 }

  const ariaSummary =
    remainingMs !== null
      ? `Faltam ${days} ${pluralUnit(days, "dia", "dias")}, ${hours} ${pluralUnit(hours, "hora", "horas")}, ${minutes} ${pluralUnit(minutes, "minuto", "minutos")} e ${seconds} ${pluralUnit(seconds, "segundo", "segundos")} para a abertura da Copa do Mundo 2026.`
      : "A carregar contagem regressiva."

  return (
    <div
      className="border-b border-primary/30 bg-gradient-to-r from-primary/20 via-primary/12 to-primary/20"
      role="timer"
      aria-label={ariaSummary}
      aria-live="off"
    >
      <div className="mx-auto max-w-5xl px-4 py-2.5 text-center md:px-6">
        {remainingMs === null ? (
          <p className="text-sm font-medium text-primary">Carregando contagem…</p>
        ) : (
          <p className="text-sm text-foreground">
            <span className="font-medium text-primary">Copa do Mundo 2026</span>
            {" — "}
            Faltam{" "}
            <strong className="tabular-nums text-foreground">{days}</strong>{" "}
            {pluralUnit(days, "dia", "dias")}
            {", "}
            <strong className="tabular-nums text-foreground">{hours}</strong>{" "}
            {pluralUnit(hours, "hora", "horas")}
            {", "}
            <strong className="tabular-nums text-foreground">{minutes}</strong>{" "}
            {pluralUnit(minutes, "minuto", "minutos")} e{" "}
            <strong className="tabular-nums text-foreground">{seconds}</strong>{" "}
            {pluralUnit(seconds, "segundo", "segundos")} para o início.
          </p>
        )}
      </div>
    </div>
  )
}
