/** Organizador único: cadastro de grupos, membros, painel admin e avisos. */
export const APP_ADMIN_EMAIL = "jonaszeferino@gmail.com"

export function isAppAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === APP_ADMIN_EMAIL
}
