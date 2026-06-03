export interface ScoreBanterBet {
  displayName: string
  predHome: number
  predAway: number
}

export interface ScoreBanterInput {
  homeCode: string
  awayCode: string
  homeName: string
  awayName: string
  prevHome: number
  prevAway: number
  newHome: number
  newAway: number
  bets: ScoreBanterBet[]
}

function matchSign(h: number, a: number): "H" | "A" | "D" {
  if (h > a) return "H"
  if (a > h) return "A"
  return "D"
}

function formatNames(names: string[], max = 3): string {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))]
  if (unique.length === 0) return ""
  if (unique.length <= max) return unique.join(", ")
  return `${unique.slice(0, max).join(", ")} e mais ${unique.length - max}`
}

/** Gera título + mensagem “comentarista” a partir do placar e dos palpites. */
export function buildScoreBanter(input: ScoreBanterInput): { title: string; message: string } | null {
  const { prevHome, prevAway, newHome, newAway } = input
  if (prevHome === newHome && prevAway === newAway) return null

  const homeScored = newHome > prevHome
  const awayScored = newAway > prevAway
  const matchLabel = `${input.homeCode} ${newHome}×${newAway} ${input.awayCode}`

  const exactNow = input.bets.filter((b) => b.predHome === newHome && b.predAway === newAway)
  const resultNow = input.bets.filter((b) => {
    if (b.predHome === newHome && b.predAway === newAway) return false
    return matchSign(newHome, newAway) === matchSign(b.predHome, b.predAway)
  })
  const needsOneHome = input.bets.filter((b) => b.predHome === newHome + 1 && b.predAway === newAway)
  const needsOneAway = input.bets.filter((b) => b.predHome === newHome && b.predAway === newAway + 1)
  const overHome = input.bets.filter((b) => b.predHome < newHome && b.predAway === newAway)
  const overAway = input.bets.filter((b) => b.predHome === newHome && b.predAway < newAway)

  const lines: string[] = []

  if (homeScored && awayScored) {
    lines.push("Gols dos dois lados — o jogo esquentou!")
  } else if (homeScored) {
    lines.push(`Gol de ${input.homeName}! O placar oficial avançou.`)
  } else if (awayScored) {
    lines.push(`Gol de ${input.awayName}! O placar oficial avançou.`)
  } else if (newHome < prevHome || newAway < prevAway) {
    lines.push("Placar oficial corrigido — o comentarista recalculou os palpites.")
  }

  if (exactNow.length > 0) {
    const names = formatNames(exactNow.map((b) => b.displayName))
    lines.push(`🎯 Placar exato neste momento: ${names}!`)
  }

  if (resultNow.length > 0) {
    const names = formatNames(resultNow.map((b) => b.displayName))
    lines.push(`📊 ${names} já acertaram o resultado (vitória ou empate).`)
  }

  if (homeScored && needsOneHome.length > 0) {
    const names = formatNames(needsOneHome.map((b) => b.displayName), 2)
    lines.push(`👀 ${names} apostaram ${newHome + 1}×${newAway} — falta 1 gol da casa para cravar o exato!`)
  }

  if (awayScored && needsOneAway.length > 0) {
    const names = formatNames(needsOneAway.map((b) => b.displayName), 2)
    lines.push(`👀 ${names} precisa de mais 1 gol de ${input.awayCode} para bater o palpite ${newHome}×${newAway + 1}.`)
  }

  if (homeScored && overHome.length > 0 && exactNow.length === 0) {
    const names = formatNames(overHome.map((b) => b.displayName), 2)
    lines.push(`😅 ${names} apostou placar menor — já passou do palpite!`)
  }

  if (awayScored && overAway.length > 0 && exactNow.length === 0) {
    const names = formatNames(overAway.map((b) => b.displayName), 2)
    lines.push(`😅 ${names} já ficou para trás no placar visitante.`)
  }

  if (input.bets.length === 0) {
    lines.push("Ninguém palpitou neste jogo ainda — o bar está quieto.")
  } else if (lines.length === 1 && input.bets.length > 0) {
    lines.push("Confere os teus palpites em Partidas — ainda dá para sonhar!")
  }

  const title = `⚽ Ao vivo: ${matchLabel}`
  return { title, message: lines.join("\n") }
}
