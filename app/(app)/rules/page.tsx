export default function RulesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Regras do Bolão</h1>
        <p className="text-sm text-foreground/75">
          Pontuação por palpite em cada jogo (tempo regular, salvo nota abaixo)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Placar exato</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Acertou os golos da casa e do visitante tal como no resultado oficial do tempo regular (90 minutos).
          </p>
          <div className="mt-3 rounded-md border border-primary/35 bg-primary/20 px-3 py-2 text-primary">
            <span className="text-xl font-bold">+10 pontos</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Vencedor ou empate (sem placar exato)</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Acertou se ganha a casa, o visitante ou empate, mas não o marcador certo. Vale na fase de grupos e no
            mata-mata.
          </p>
          <div className="mt-3 rounded-md border border-primary/35 bg-primary/20 px-3 py-2 text-primary">
            <span className="text-xl font-bold">+7 pontos</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Quem passa (só mata-mata)</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Nos jogos eliminatórios, se o palpite for empate no 90&apos;, tens de dizer qual equipe passa (tempo extra ou
            penáltis). Se não acertaste o resultado nem o empate no 90&apos;, mas acertaste a equipe que avança, contas
            estes pontos — <strong className="font-medium text-foreground">não se somam</strong> com o exato nem com o +7:
            conta só a melhor regra que se aplicar ao teu palpite.
          </p>
          <div className="mt-3 rounded-md border border-border bg-secondary px-3 py-2 text-secondary-foreground">
            <span className="text-xl font-bold">+5 pontos</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Empate no mata-mata: exato vs quem passa</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Se acertares o placar exato do 90&apos; (incluindo empate), recebes <strong className="font-medium text-foreground">+10</strong>{" "}
            e não recebes mais +5 pela escolha &quot;quem passa&quot; — o exato já cobre o teu palpite. Só quando{" "}
            <strong className="font-medium text-foreground">não</strong> há +10 nem +7 é que o +5 por acertar quem
            passa pode contar.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 md:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Sem pontos</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Não acertaste placar, nem resultado (7), nem quem passa (5). No mata-mata, empate no palpite sem escolher quem
            passa não pontua.
          </p>
          <div className="mt-3 rounded-md border border-border bg-muted px-3 py-2 text-foreground">
            <span className="text-xl font-bold">0 pontos</span>
          </div>
        </div>
      </div>
    </div>
  )
}
