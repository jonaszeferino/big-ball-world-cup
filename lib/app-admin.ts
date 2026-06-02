export const APP_ADMIN_EMAIL = "jonaszeferino@gmail.com"

export function isAppAdminEmail(email: string | null | undefined): boolean {
  return email === APP_ADMIN_EMAIL
}
