import { getCountryFlagEmoji, getCountryFlagSrc } from "@/lib/country-flags"
import { cn } from "@/lib/utils"

const sizeClasses = {
  xs: "h-3.5 w-5",
  sm: "h-4 w-6",
  md: "h-5 w-7",
  lg: "h-8 w-11",
  xl: "h-12 w-16 sm:h-14 sm:w-20",
} as const

interface CountryFlagProps {
  countryName: string
  size?: keyof typeof sizeClasses
  className?: string
  title?: string
}

/** Bandeira do país — imagem em /public ou emoji de fallback. */
export function CountryFlag({ countryName, size = "md", className, title }: CountryFlagProps) {
  const src = getCountryFlagSrc(countryName)
  const label = title ?? countryName

  if (src) {
    return (
      <img
        src={src}
        alt=""
        title={label}
        aria-hidden
        loading="lazy"
        decoding="async"
        className={cn("inline-block shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/10", sizeClasses[size], className)}
      />
    )
  }

  const emoji = getCountryFlagEmoji(countryName)
  const emojiSize =
    size === "xl" ? "text-4xl sm:text-5xl leading-none" : size === "lg" ? "text-2xl leading-none" : "text-base leading-none"

  return (
    <span className={cn("inline-block shrink-0", emojiSize, className)} title={label} aria-hidden>
      {emoji}
    </span>
  )
}
