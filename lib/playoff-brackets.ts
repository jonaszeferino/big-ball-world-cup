/**
 * Chaveamento dos 16-avos (rodada de 32 equipas) alinhado ao regulamento da
 * Copa do Mundo FIFA 2026: 24 classificados (1º e 2º de cada grupo) + 8 melhores 3º.
 * Os 16 jogos correspondem aos encontros oficiais 73–88 do regulamento (não são todos
 * "1º vs 2º": há 2º vs 2º, 1º vs 2º e 1º vs 3º, conforme tabela fixa).
 * @see https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
 */
export interface PlayoffRule {
  key: number
  side: "A" | "B"
  /** Número do jogo na fase eliminatória FIFA 2026 (16-avos = jogos 73 a 88). */
  fifaMatch1: number
  fifaMatch2: number
  match1: {
    team1: string
    team2: string
  }
  match2?: {
    team1: string
    team2: string
  }
}

export const ROUND_OF_32_BRACKETS: PlayoffRule[] = [
  {
    key: 1,
    side: "A",
    fifaMatch1: 74,
    fifaMatch2: 77,
    match1: {
      team1: "1º do Grupo E",
      team2: "3º de A/B/C/D/F"
    },
    match2: {
      team1: "1º do Grupo I",
      team2: "3º de C/D/F/G/H"
    }
  },
  {
    key: 2,
    side: "A",
    fifaMatch1: 73,
    fifaMatch2: 75,
    match1: {
      team1: "2º do Grupo A",
      team2: "2º do Grupo B"
    },
    match2: {
      team1: "1º do Grupo F",
      team2: "2º do Grupo C"
    }
  },
  {
    key: 3,
    side: "A",
    fifaMatch1: 83,
    fifaMatch2: 84,
    match1: {
      team1: "2º do Grupo K",
      team2: "2º do Grupo L"
    },
    match2: {
      team1: "1º do Grupo H",
      team2: "2º do Grupo J"
    }
  },
  {
    key: 4,
    side: "A",
    fifaMatch1: 81,
    fifaMatch2: 82,
    match1: {
      team1: "1º do Grupo D",
      team2: "3º de B/E/F/I/J"
    },
    match2: {
      team1: "1º do Grupo G",
      team2: "3º de A/E/H/I/J"
    }
  },
  {
    key: 5,
    side: "B",
    fifaMatch1: 76,
    fifaMatch2: 78,
    match1: {
      team1: "1º do Grupo C",
      team2: "2º do Grupo F"
    },
    match2: {
      team1: "2º do Grupo E",
      team2: "2º do Grupo I"
    }
  },
  {
    key: 6,
    side: "B",
    fifaMatch1: 79,
    fifaMatch2: 80,
    match1: {
      team1: "1º do Grupo A",
      team2: "3º de C/E/F/H/I"
    },
    match2: {
      team1: "1º do Grupo L",
      team2: "3º de E/H/I/J/K"
    }
  },
  {
    key: 7,
    side: "B",
    fifaMatch1: 86,
    fifaMatch2: 88,
    match1: {
      team1: "1º do Grupo J",
      team2: "2º do Grupo H"
    },
    match2: {
      team1: "2º do Grupo D",
      team2: "2º do Grupo G"
    }
  },
  {
    key: 8,
    side: "B",
    fifaMatch1: 85,
    fifaMatch2: 87,
    match1: {
      team1: "1º do Grupo B",
      team2: "3º de E/F/G/I/J"
    },
    match2: {
      team1: "1º do Grupo K",
      team2: "3º de D/E/I/J/L"
    }
  }
]
