"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ROUND_OF_32_BRACKETS } from "@/lib/playoff-brackets"

export function PlayoffBrackets() {
  const sideA = ROUND_OF_32_BRACKETS.filter(b => b.side === "A")
  const sideB = ROUND_OF_32_BRACKETS.filter(b => b.side === "B")

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Estrutura dos 16-avos de Final (Rodada de 32)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Os confrontos dos 16-avos são definidos pela classificação na fase de grupos. 
            Os 3º colocados que avançam dependem dos resultados de todos os grupos.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Lado A */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">Lado A</Badge>
                <span className="text-sm font-medium text-muted-foreground">
                  4 Chaves
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {sideA.map((bracket) => (
                  <Card key={bracket.key} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-card-foreground">
                        Chave {bracket.key}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm">
                      <div className="rounded-md bg-muted/50 p-2">
                        <div className="font-medium text-foreground">{bracket.match1.team1}</div>
                        <div className="text-xs text-muted-foreground">vs</div>
                        <div className="font-medium text-foreground">{bracket.match1.team2}</div>
                      </div>
                      {bracket.match2 && (
                        <div className="rounded-md bg-muted/50 p-2">
                          <div className="font-medium text-foreground">{bracket.match2.team1}</div>
                          <div className="text-xs text-muted-foreground">vs</div>
                          <div className="font-medium text-foreground">{bracket.match2.team2}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Lado B */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Lado B</Badge>
                <span className="text-sm font-medium text-muted-foreground">
                  4 Chaves
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {sideB.map((bracket) => (
                  <Card key={bracket.key} className="border-l-4 border-l-secondary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-card-foreground">
                        Chave {bracket.key}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 text-sm">
                      <div className="rounded-md bg-muted/50 p-2">
                        <div className="font-medium text-foreground">{bracket.match1.team1}</div>
                        <div className="text-xs text-muted-foreground">vs</div>
                        <div className="font-medium text-foreground">{bracket.match1.team2}</div>
                      </div>
                      {bracket.match2 && (
                        <div className="rounded-md bg-muted/50 p-2">
                          <div className="font-medium text-foreground">{bracket.match2.team1}</div>
                          <div className="text-xs text-muted-foreground">vs</div>
                          <div className="font-medium text-foreground">{bracket.match2.team2}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
