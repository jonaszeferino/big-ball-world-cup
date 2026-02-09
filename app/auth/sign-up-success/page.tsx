import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Mail } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="h-8 w-8" />
            <span className="text-2xl font-bold font-sans">Copa 2026</span>
          </div>
          <Card className="w-full text-center">
            <CardHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl text-card-foreground">Verifique seu email</CardTitle>
              <CardDescription>
                Enviamos um link de confirmacao para o seu email. Clique no link para ativar sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/login" className="text-sm text-primary underline underline-offset-4">
                Voltar para o login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
