import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trophy, Target, BarChart3 } from "lucide-react"

export default function HomePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] p-[3px] shadow-lg shadow-black/10">
            <div className="flex h-full w-full items-center justify-center rounded-[25px] bg-card">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Bolao Copa 2026
            </h1>
            <p className="text-pretty text-base leading-relaxed text-muted-foreground">
              Aposte nos resultados e dispute o ranking com seus amigos.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button asChild size="lg" className="h-12 rounded-xl text-base font-semibold shadow-sm">
            <Link href="/auth/sign-up">Criar conta</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-xl border-border bg-card text-base font-semibold text-foreground hover:bg-secondary"
          >
            <Link href="/auth/login">Entrar</Link>
          </Button>
        </div>

        <div className="grid w-full gap-3">
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 text-left shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-card-foreground">Placar exato</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Acerte o placar exato do tempo regular (90 minutos) e ganhe <strong className="font-semibold text-foreground">10 pontos</strong> por
              partida.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 text-left shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-card-foreground">Vencedor ou empate</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sem placar exato: acerte quem vence ou o empate e ganhe <strong className="font-semibold text-foreground">7 pontos</strong>. No
              mata-mata há regras extra —{" "}
              <Link href="/rules" className="font-medium text-primary underline-offset-4 hover:underline">
                vê as regras completas
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
