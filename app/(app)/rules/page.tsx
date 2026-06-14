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
          <h2 className="text-lg font-semibold text-foreground">Palpite do campeão</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Antes do fim da fase de grupos, escolhes <strong className="font-medium text-foreground">campeão</strong> e{" "}
            <strong className="font-medium text-foreground">vice-campeão</strong> da Copa. Podes alterar o palpite até{" "}
            <strong className="font-medium text-foreground">10 minutos antes do fim estimado da última partida da fase de grupos</strong>{" "}
            (horário de Brasília). A pontuação só é contada depois da final.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/35 bg-primary/20 px-3 py-2 text-primary">
              <span>Acertaste o campeão</span>
              <span className="text-lg font-bold">+35 pontos</span>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-secondary-foreground">
              <span>Acertaste o vice-campeão</span>
              <span className="text-lg font-bold">+15 pontos</span>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2 text-foreground">
              <span>
                Acertaste um time que chegou à final, mas na posição errada (campeão ou vice)
              </span>
              <span className="text-lg font-bold">+10 pontos</span>
            </li>
          </ul>
          <p className="mt-3 text-sm text-foreground/80">
            Cada escolha (campeão e vice) pontua de forma independente. Se acertares as duas posições exactas, somas{" "}
            <strong className="font-medium text-foreground">35 + 15 = 50 pontos</strong>.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 md:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Prazo das apostas</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Podes criar ou alterar o palpite até o <strong className="font-medium text-foreground">instante exacto do início</strong>{" "}
            de cada partida. O horário que aparece no cartão do jogo está em{" "}
            <strong className="font-medium text-foreground">horário de Brasília</strong>.
          </p>
          <p className="mt-2 text-sm text-foreground/80">
            Quando o jogo começa, as apostas fecham automaticamente — não dá para enviar palpite depois do apito.
          </p>
          <p className="mt-2 text-sm text-foreground/80">
            O organizador pode encerrar a partida no bolão antes do apito; nesse caso as apostas também fecham na hora.
          </p>
          <p className="mt-2 text-sm text-foreground/80">
            Com sessão aberta no site, recebes um aviso cerca de{" "}
            <strong className="font-medium text-foreground">10 minutos antes</strong> de cada jogo para te lembrares de
            confirmar o palpite.
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
