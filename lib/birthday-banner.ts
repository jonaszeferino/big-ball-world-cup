export type BirthdayProfile = {
  /** display_name em profiles */
  displayName: string
  /** Nome na mensagem do banner */
  greetingName: string
  month: number
  day: number
}

export const BIRTHDAY_PROFILES: BirthdayProfile[] = [
  { displayName: "Jaime", greetingName: "Jaime", month: 6, day: 2 },
  { displayName: "Jonas", greetingName: "Jonas", month: 6, day: 2 },
]

export function getBirthdayProfileForToday(
  displayName: string,
  now = new Date(),
): BirthdayProfile | null {
  const trimmed = displayName.trim()
  const month = now.getMonth() + 1
  const day = now.getDate()
  return (
    BIRTHDAY_PROFILES.find(
      (p) => p.displayName === trimmed && p.month === month && p.day === day,
    ) ?? null
  )
}

export function birthdayBannerDismissKey(profile: BirthdayProfile, now = new Date()): string {
  const y = now.getFullYear()
  const m = String(profile.month).padStart(2, "0")
  const d = String(profile.day).padStart(2, "0")
  return `bbwc-birthday-banner-${profile.displayName}-${y}-${m}-${d}`
}
