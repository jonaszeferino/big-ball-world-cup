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
          <h2 className="text-lg font-semibold text-foreground">Placar Exato</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Acertou o placar exato do jogo.
          </p>
          <div className="mt-3 rounded-md bg-primary/10 px-3 py-2 text-primary">
            <span className="text-xl font-bold">+5 pontos</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Vencedor + Saldo/Placar Parcial</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Acertou o vencedor e o saldo ou um dos placares parciais.
          </p>
          <div className="mt-3 rounded-md bg-primary/10 px-3 py-2 text-primary">
            <span className="text-xl font-bold">+3 pontos</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Apenas Vencedor/Empate</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Acertou apenas o vencedor ou o empate.
          </p>
          <div className="mt-3 rounded-md bg-primary/10 px-3 py-2 text-primary">
            <span className="text-xl font-bold">+2 pontos</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Erro</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Não acertou o vencedor nem o placar.
          </p>
          <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-muted-foreground">
            <span className="text-xl font-bold">0 pontos</span>
          </div>
        </div>
      </div>
    </div>
  )
}
