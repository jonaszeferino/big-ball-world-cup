/** Mensagem legivel para erros de auth no browser (incl. TypeError "Failed to fetch"). */
export function formatAuthError(err: unknown): string {
  if (err instanceof TypeError && err.message === "Failed to fetch") {
    return (
      "Nao foi possivel ligar ao Supabase. Possiveis causas: projeto pausado no dashboard; " +
      "URL errada em .env.local; extensao ou bloqueador de anuncios a bloquear *.supabase.co; " +
      "firewall/VPN. Abre o separador Rede (Network) e confirma se o pedido a …supabase.co falha."
    )
  }
  if (err instanceof Error) return err.message
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message
  }
  return String(err) || "Ocorreu um erro"
}
