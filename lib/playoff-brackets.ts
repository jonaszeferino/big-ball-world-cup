export interface PlayoffRule {
  key: number
  side: "A" | "B"
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
