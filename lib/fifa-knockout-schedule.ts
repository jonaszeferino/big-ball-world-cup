import { formatMatchDateTimeBrazilWithYear } from "@/lib/match-datetime-brazil"

export type FifaKnockoutStage =
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final"

export type FifaKnockoutMatchSchedule = {
  fifaMatch: number
  stage: FifaKnockoutStage
  /** Descrição curta do confronto (chaveamento oficial). */
  matchup: string
  date: string
  hour: number
  minute: number
  /** Horas a somar ao horário local para obter UTC (ex.: UTC−7 → 7). */
  utcOffsetHours: number
  venue: string
  city: string
}

/** Calendário oficial FIFA — mata-mata (jogos 73 a 104). Fonte: regulamento/cronograma FIFA 2026. */
export const FIFA_KNOCKOUT_SCHEDULE: FifaKnockoutMatchSchedule[] = [
  {
    fifaMatch: 73,
    stage: "round_of_32",
    matchup: "2º Grupo A x 2º Grupo B",
    date: "2026-06-28",
    hour: 12,
    minute: 0,
    utcOffsetHours: 7,
    venue: "SoFi Stadium",
    city: "Los Angeles",
  },
  {
    fifaMatch: 74,
    stage: "round_of_32",
    matchup: "1º Grupo E x 3º (A/B/C/D/F)",
    date: "2026-06-29",
    hour: 16,
    minute: 30,
    utcOffsetHours: 4,
    venue: "Gillette Stadium",
    city: "Boston",
  },
  {
    fifaMatch: 75,
    stage: "round_of_32",
    matchup: "1º Grupo F x 2º Grupo C",
    date: "2026-06-29",
    hour: 19,
    minute: 0,
    utcOffsetHours: 6,
    venue: "Estadio BBVA",
    city: "Monterrey",
  },
  {
    fifaMatch: 76,
    stage: "round_of_32",
    matchup: "1º Grupo C x 2º Grupo F",
    date: "2026-06-29",
    hour: 12,
    minute: 0,
    utcOffsetHours: 5,
    venue: "NRG Stadium",
    city: "Houston",
  },
  {
    fifaMatch: 77,
    stage: "round_of_32",
    matchup: "1º Grupo I x 3º (C/D/F/G/H)",
    date: "2026-06-30",
    hour: 17,
    minute: 0,
    utcOffsetHours: 4,
    venue: "MetLife Stadium",
    city: "New York / New Jersey",
  },
  {
    fifaMatch: 78,
    stage: "round_of_32",
    matchup: "2º Grupo E x 2º Grupo I",
    date: "2026-06-30",
    hour: 12,
    minute: 0,
    utcOffsetHours: 5,
    venue: "AT&T Stadium",
    city: "Dallas",
  },
  {
    fifaMatch: 79,
    stage: "round_of_32",
    matchup: "1º Grupo A x 3º (C/E/F/H/I)",
    date: "2026-06-30",
    hour: 19,
    minute: 0,
    utcOffsetHours: 6,
    venue: "Estadio Azteca",
    city: "Cidade do México",
  },
  {
    fifaMatch: 80,
    stage: "round_of_32",
    matchup: "1º Grupo L x 3º (E/H/I/J/K)",
    date: "2026-07-01",
    hour: 12,
    minute: 0,
    utcOffsetHours: 4,
    venue: "Mercedes-Benz Stadium",
    city: "Atlanta",
  },
  {
    fifaMatch: 81,
    stage: "round_of_32",
    matchup: "1º Grupo D x 3º (B/E/F/I/J)",
    date: "2026-07-01",
    hour: 17,
    minute: 0,
    utcOffsetHours: 7,
    venue: "Levi's Stadium",
    city: "San Francisco Bay Area",
  },
  {
    fifaMatch: 82,
    stage: "round_of_32",
    matchup: "1º Grupo G x 3º (A/E/H/I/J)",
    date: "2026-07-01",
    hour: 13,
    minute: 0,
    utcOffsetHours: 7,
    venue: "Lumen Field",
    city: "Seattle",
  },
  {
    fifaMatch: 83,
    stage: "round_of_32",
    matchup: "2º Grupo K x 2º Grupo L",
    date: "2026-07-02",
    hour: 19,
    minute: 0,
    utcOffsetHours: 4,
    venue: "BMO Field",
    city: "Toronto",
  },
  {
    fifaMatch: 84,
    stage: "round_of_32",
    matchup: "1º Grupo H x 2º Grupo J",
    date: "2026-07-02",
    hour: 12,
    minute: 0,
    utcOffsetHours: 7,
    venue: "SoFi Stadium",
    city: "Los Angeles",
  },
  {
    fifaMatch: 85,
    stage: "round_of_32",
    matchup: "1º Grupo B x 3º (E/F/G/I/J)",
    date: "2026-07-02",
    hour: 20,
    minute: 0,
    utcOffsetHours: 7,
    venue: "BC Place",
    city: "Vancouver",
  },
  {
    fifaMatch: 86,
    stage: "round_of_32",
    matchup: "1º Grupo J x 2º Grupo H",
    date: "2026-07-03",
    hour: 18,
    minute: 0,
    utcOffsetHours: 4,
    venue: "Hard Rock Stadium",
    city: "Miami",
  },
  {
    fifaMatch: 87,
    stage: "round_of_32",
    matchup: "1º Grupo K x 3º (D/E/I/J/L)",
    date: "2026-07-03",
    hour: 20,
    minute: 30,
    utcOffsetHours: 5,
    venue: "Arrowhead Stadium",
    city: "Kansas City",
  },
  {
    fifaMatch: 88,
    stage: "round_of_32",
    matchup: "2º Grupo D x 2º Grupo G",
    date: "2026-07-03",
    hour: 13,
    minute: 0,
    utcOffsetHours: 5,
    venue: "AT&T Stadium",
    city: "Dallas",
  },
  {
    fifaMatch: 89,
    stage: "round_of_16",
    matchup: "Vencedor jogo 74 x Vencedor jogo 77",
    date: "2026-07-04",
    hour: 17,
    minute: 0,
    utcOffsetHours: 4,
    venue: "Lincoln Financial Field",
    city: "Philadelphia",
  },
  {
    fifaMatch: 90,
    stage: "round_of_16",
    matchup: "Vencedor jogo 73 x Vencedor jogo 75",
    date: "2026-07-04",
    hour: 12,
    minute: 0,
    utcOffsetHours: 5,
    venue: "NRG Stadium",
    city: "Houston",
  },
  {
    fifaMatch: 91,
    stage: "round_of_16",
    matchup: "Vencedor jogo 76 x Vencedor jogo 78",
    date: "2026-07-05",
    hour: 16,
    minute: 0,
    utcOffsetHours: 4,
    venue: "MetLife Stadium",
    city: "New York / New Jersey",
  },
  {
    fifaMatch: 92,
    stage: "round_of_16",
    matchup: "Vencedor jogo 79 x Vencedor jogo 80",
    date: "2026-07-05",
    hour: 18,
    minute: 0,
    utcOffsetHours: 6,
    venue: "Estadio Azteca",
    city: "Cidade do México",
  },
  {
    fifaMatch: 93,
    stage: "round_of_16",
    matchup: "Vencedor jogo 83 x Vencedor jogo 84",
    date: "2026-07-06",
    hour: 14,
    minute: 0,
    utcOffsetHours: 5,
    venue: "AT&T Stadium",
    city: "Dallas",
  },
  {
    fifaMatch: 94,
    stage: "round_of_16",
    matchup: "Vencedor jogo 81 x Vencedor jogo 82",
    date: "2026-07-06",
    hour: 17,
    minute: 0,
    utcOffsetHours: 7,
    venue: "Lumen Field",
    city: "Seattle",
  },
  {
    fifaMatch: 95,
    stage: "round_of_16",
    matchup: "Vencedor jogo 86 x Vencedor jogo 88",
    date: "2026-07-07",
    hour: 12,
    minute: 0,
    utcOffsetHours: 4,
    venue: "Mercedes-Benz Stadium",
    city: "Atlanta",
  },
  {
    fifaMatch: 96,
    stage: "round_of_16",
    matchup: "Vencedor jogo 85 x Vencedor jogo 87",
    date: "2026-07-07",
    hour: 13,
    minute: 0,
    utcOffsetHours: 7,
    venue: "BC Place",
    city: "Vancouver",
  },
  {
    fifaMatch: 97,
    stage: "quarter_final",
    matchup: "Vencedor jogo 89 x Vencedor jogo 90",
    date: "2026-07-09",
    hour: 16,
    minute: 0,
    utcOffsetHours: 4,
    venue: "Gillette Stadium",
    city: "Boston",
  },
  {
    fifaMatch: 98,
    stage: "quarter_final",
    matchup: "Vencedor jogo 93 x Vencedor jogo 94",
    date: "2026-07-10",
    hour: 12,
    minute: 0,
    utcOffsetHours: 7,
    venue: "SoFi Stadium",
    city: "Los Angeles",
  },
  {
    fifaMatch: 99,
    stage: "quarter_final",
    matchup: "Vencedor jogo 91 x Vencedor jogo 92",
    date: "2026-07-11",
    hour: 17,
    minute: 0,
    utcOffsetHours: 4,
    venue: "Hard Rock Stadium",
    city: "Miami",
  },
  {
    fifaMatch: 100,
    stage: "quarter_final",
    matchup: "Vencedor jogo 95 x Vencedor jogo 96",
    date: "2026-07-11",
    hour: 20,
    minute: 0,
    utcOffsetHours: 5,
    venue: "Arrowhead Stadium",
    city: "Kansas City",
  },
  {
    fifaMatch: 101,
    stage: "semi_final",
    matchup: "Vencedor jogo 97 x Vencedor jogo 98",
    date: "2026-07-14",
    hour: 14,
    minute: 0,
    utcOffsetHours: 5,
    venue: "AT&T Stadium",
    city: "Dallas",
  },
  {
    fifaMatch: 102,
    stage: "semi_final",
    matchup: "Vencedor jogo 99 x Vencedor jogo 100",
    date: "2026-07-15",
    hour: 15,
    minute: 0,
    utcOffsetHours: 4,
    venue: "Mercedes-Benz Stadium",
    city: "Atlanta",
  },
  {
    fifaMatch: 103,
    stage: "third_place",
    matchup: "Perdedor jogo 101 x Perdedor jogo 102",
    date: "2026-07-18",
    hour: 17,
    minute: 0,
    utcOffsetHours: 4,
    venue: "Hard Rock Stadium",
    city: "Miami",
  },
  {
    fifaMatch: 104,
    stage: "final",
    matchup: "Vencedor jogo 101 x Vencedor jogo 102",
    date: "2026-07-19",
    hour: 15,
    minute: 0,
    utcOffsetHours: 4,
    venue: "MetLife Stadium",
    city: "New York / New Jersey",
  },
]

const FIFA_BY_MATCH = new Map(FIFA_KNOCKOUT_SCHEDULE.map((m) => [m.fifaMatch, m]))

export const FIFA_KNOCKOUT_STAGE_LABELS: Record<FifaKnockoutStage, string> = {
  round_of_32: "16-avos de final",
  round_of_16: "Oitavas de final",
  quarter_final: "Quartas de final",
  semi_final: "Semifinais",
  third_place: "Disputa de 3º lugar",
  final: "Final",
}

export function getFifaKnockoutMatch(fifaMatch: number): FifaKnockoutMatchSchedule | undefined {
  return FIFA_BY_MATCH.get(fifaMatch)
}

function scheduleToUtcIso(entry: FifaKnockoutMatchSchedule): string {
  const [y, m, d] = entry.date.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d, entry.hour + entry.utcOffsetHours, entry.minute)).toISOString()
}

export function formatFifaKnockoutBrazil(entry: FifaKnockoutMatchSchedule): {
  whenBrazil: string
  localTime: string
} {
  const whenBrazil = formatMatchDateTimeBrazilWithYear(scheduleToUtcIso(entry))
  const localTime = `${String(entry.hour).padStart(2, "0")}:${String(entry.minute).padStart(2, "0")}`
  return { whenBrazil, localTime }
}

export function getFifaKnockoutScheduleForMatchesTab(tab: string): FifaKnockoutMatchSchedule[] {
  if (tab === "final") {
    return FIFA_KNOCKOUT_SCHEDULE.filter((m) => m.stage === "third_place" || m.stage === "final")
  }
  if (tab === "group") return []
  return FIFA_KNOCKOUT_SCHEDULE.filter((m) => m.stage === tab).sort(
    (a, b) => scheduleToUtcIso(a).localeCompare(scheduleToUtcIso(b)) || a.fifaMatch - b.fifaMatch,
  )
}

export function sortFifaKnockoutSchedule(
  rows: FifaKnockoutMatchSchedule[],
): FifaKnockoutMatchSchedule[] {
  return [...rows].sort(
    (a, b) => scheduleToUtcIso(a).localeCompare(scheduleToUtcIso(b)) || a.fifaMatch - b.fifaMatch,
  )
}
