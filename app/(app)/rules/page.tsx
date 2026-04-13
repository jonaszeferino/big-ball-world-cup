export default function RulesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Regras do Bolão</h1>
        <p className="text-sm text-muted-foreground">
          Entenda como funciona a pontuação das apostas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Placar exato (tempo regular)</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Acertou os golos da casa e do visitante tal como no resultado oficial do tempo regular.
          </p>
          <div className="mt-3 rounded-md bg-primary/10 px-3 py-2 text-primary">
            <span className="text-xl font-bold">+3 pontos</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Quem passa (mata-mata)</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Se o palpite for empate nas fases eliminatórias (16-avos em diante), indica qual equipa passa. Acertar quem
            avança (vencedor no tempo ou após penáltis) vale 1 ponto quando o placar exato não acerta.
          </p>
          <div className="mt-3 rounded-md bg-accent/15 px-3 py-2 text-accent-foreground">
            <span className="text-xl font-bold">+1 ponto</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Resultado (vencedor ou empate)</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Acertou o vencedor ou o empate no tempo regular, sem acertar o placar exato (e sem contar o caso de empate
            no mata-mata em que só o &quot;quem passa&quot; conta).
          </p>
          <div className="mt-3 rounded-md bg-accent/15 px-3 py-2 text-accent-foreground">
            <span className="text-xl font-bold">+1 ponto</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Sem pontos</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Não acertou o placar nem o resultado útil acima. No mata-mata, empate no palpite sem escolher quem passa não
            pontua.
          </p>
          <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-muted-foreground">
            <span className="text-xl font-bold">0 pontos</span>
          </div>
        </div>
      </div>
    </div>
  )
}
