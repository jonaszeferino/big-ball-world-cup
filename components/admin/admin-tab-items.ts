export const ADMIN_TAB_ITEMS = [
  { value: "teams", label: "Seleções" },
  { value: "matches", label: "Partidas" },
  { value: "bet-groups", label: "Grupos" },
  { value: "playoffs", label: "Playoffs" },
  { value: "official-results", label: "Resultados" },
  { value: "broadcasts", label: "Avisos" },
  { value: "odds", label: "Odds" },
  { value: "upcoming-bets", label: "Próx. apostas" },
] as const

export type AdminTabValue = (typeof ADMIN_TAB_ITEMS)[number]["value"]
