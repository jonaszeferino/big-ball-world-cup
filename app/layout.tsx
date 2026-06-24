import React from "react"
import type { Metadata } from "next"
import { Inter, Space_Mono } from "next/font/google"
import { AuthSessionRepair } from "@/components/auth-session-repair"
import { ThemeProvider } from "@/components/theme-provider"
import { THEME_STORAGE_KEY, themePrefBootstrapScript } from "@/lib/theme-pref"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const _spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" })

export const metadata: Metadata = {
  title: "Bolao Copa 2026",
  description: "Bolao da Copa do Mundo 2026 - Aposte nos resultados e dispute o ranking!",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themePrefBootstrapScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey={THEME_STORAGE_KEY}
          disableTransitionOnChange
        >
          <AuthSessionRepair />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
