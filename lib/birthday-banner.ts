/** Perfil do Jaime no bolão (display_name em profiles). */
export const BIRTHDAY_PROFILE_DISPLAY_NAME = "Jiame"

/** Aniversário: 2 de junho (horário local do navegador). */
export const BIRTHDAY_MONTH = 6
export const BIRTHDAY_DAY = 2

export function isBirthdayToday(now = new Date()): boolean {
  return now.getMonth() + 1 === BIRTHDAY_MONTH && now.getDate() === BIRTHDAY_DAY
}

export function isBirthdayProfile(displayName: string): boolean {
  return displayName.trim() === BIRTHDAY_PROFILE_DISPLAY_NAME
}

export function birthdayBannerDismissKey(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(BIRTHDAY_MONTH).padStart(2, "0")
  const d = String(BIRTHDAY_DAY).padStart(2, "0")
  return `bbwc-birthday-banner-${y}-${m}-${d}`
}
