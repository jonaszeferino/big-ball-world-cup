export default function RulesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Regras do Bolão</h1>
        <p className="text-sm text-foreground/75">
          Pontuação por palpite em cada jogo (tempo regular de 90 minutos). No mata-mata, empate no 90&apos; exige
          escolher quem passa (prorrogação ou pênaltis).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 md:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Fase de grupos</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-primary/35 bg-primary/20 px-3 py-3 text-primary">
              <p className="text-sm font-medium">Placar exato no 90&apos;</p>
              <p className="mt-1 text-xl font-bold">+10 pontos</p>
            </div>
            <div className="rounded-md border border-primary/35 bg-primary/20 px-3 py-3 text-primary">
              <p className="text-sm font-medium">Vencedor ou empate (sem placar exato)</p>
              <p className="mt-1 text-xl font-bold">+7 pontos</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 md:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Mata-mata (16-avos em diante)</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Se o palpite for <strong className="font-medium text-foreground">empate no 90&apos;</strong>, você precisa
            escolher o <strong className="font-medium text-foreground">classificado</strong> (time que passa). Conta só
            uma faixa de pontos por jogo — a que se aplicar ao seu palpite.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-foreground/80">
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/35 bg-primary/20 px-3 py-2 text-primary">
              <span>Placar exato (vitória no 90&apos;)</span>
              <span className="text-lg font-bold">+20</span>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-primary">
              <span>Empate exato + classificado certo</span>
              <span className="text-lg font-bold">+18</span>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-primary">
              <span>Vencedor correto + placar errado</span>
              <span className="text-lg font-bold">+15</span>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-secondary-foreground">
              <span>Empate exato + classificado errado</span>
              <span className="text-lg font-bold">+10</span>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2 text-foreground">
              <span>Empate genérico + classificado certo</span>
              <span className="text-lg font-bold">+5</span>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2 text-foreground">
              <span>Empate genérico + classificado errado</span>
              <span className="text-lg font-bold">+3</span>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2 text-foreground">
              <span>Apenas classificado correto</span>
              <span className="text-lg font-bold">+3</span>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2 text-foreground">
              <span>Errou tudo</span>
              <span className="text-lg font-bold">0</span>
            </li>
          </ul>
          <p className="mt-3 text-sm text-foreground/80">
            <strong className="font-medium text-foreground">Empate genérico</strong> = palpitou empate no 90&apos;,
            mas errou os gols (ex.: 0×0 e saiu 1×1).{" "}
            <strong className="font-medium text-foreground">Classificado</strong> = time que passa (vitória no 90&apos;
            ou vencedor nos pênaltis).
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 md:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Mata-mata: exemplos</h2>
          <ul className="mt-2 space-y-2 text-sm text-foreground/80">
            <li>
              Palpite <strong>2×1</strong>, resultado <strong>2×1</strong> → <strong>+20</strong>
            </li>
            <li>
              Palpite <strong>2×1</strong>, resultado <strong>2×0</strong> → <strong>+15</strong>
            </li>
            <li>
              Palpite <strong>1×1</strong> + classificado certo, resultado <strong>1×1</strong> → <strong>+18</strong>
            </li>
            <li>
              Palpite <strong>1×1</strong> + classificado errado, resultado <strong>1×1</strong> → <strong>+10</strong>
            </li>
            <li>
              Palpite <strong>0×0</strong> + classificado certo, resultado <strong>1×1</strong> → <strong>+5</strong>
            </li>
            <li>
              Palpite <strong>0×0</strong> + classificado errado, resultado <strong>1×1</strong> → <strong>+3</strong>
            </li>
            <li>
              Palpite <strong>2×1</strong>, resultado <strong>1×1</strong> nos pênaltis → <strong>+3</strong> se acertou
              quem passa
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 md:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Palpite do campeão</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Escolha o <strong className="font-medium text-foreground">campeão</strong> e o{" "}
            <strong className="font-medium text-foreground">vice-campeão</strong> da Copa. Você pode alterar o palpite até{" "}
            <strong className="font-medium text-foreground">2 dias após a primeira partida dos 16-avos</strong>{" "}
            (horário de Brasília). A pontuação só é contabilizada depois da final.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-foreground/80">
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/35 bg-primary/20 px-3 py-2 text-primary">
              <span>Acertou o campeão</span>
              <span className="text-lg font-bold">+35 pontos</span>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-secondary-foreground">
              <span>Acertou o vice-campeão</span>
              <span className="text-lg font-bold">+15 pontos</span>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted px-3 py-2 text-foreground">
              <span>Acertou um time que chegou à final, mas na posição errada</span>
              <span className="text-lg font-bold">+10 pontos</span>
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 md:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Prazo das apostas</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Você pode criar ou alterar o palpite até o <strong className="font-medium text-foreground">instante exato do início</strong>{" "}
            de cada partida (horário de Brasília). Depois do apito, as apostas fecham.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 md:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Sem pontos</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Errou tudo ou, no mata-mata, palpitou empate sem escolher quem passa.
          </p>
          <div className="mt-3 rounded-md border border-border bg-muted px-3 py-2 text-foreground">
            <span className="text-xl font-bold">0 pontos</span>
          </div>
        </div>
      </div>
    </div>
  )
}
