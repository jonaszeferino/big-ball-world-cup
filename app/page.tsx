import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trophy, Target, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
          <Trophy className="h-10 w-10 text-primary-foreground" />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Bolao Copa 2026
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            Aposte nos resultados das partidas da Copa do Mundo e dispute o ranking com seus amigos.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/auth/sign-up">Criar Conta</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="bg-transparent text-foreground border-border">
            <Link href="/auth/login">Entrar</Link>
          </Button>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2">
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-6">
            <Target className="h-8 w-8 text-primary" />
            <h3 className="font-semibold text-card-foreground">Placar Exato</h3>
            <p className="text-sm text-muted-foreground">
              Acerte o placar exato e ganhe 3 pontos por partida
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-6">
            <BarChart3 className="h-8 w-8 text-accent" />
            <h3 className="font-semibold text-card-foreground">Resultado Certo</h3>
            <p className="text-sm text-muted-foreground">
              Acerte quem venceu ou empatou e ganhe 1 ponto
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
