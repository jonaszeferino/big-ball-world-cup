export const THEME_STORAGE_KEY = "bbwc-theme"

export type ThemePref = "light" | "dark"

export function readThemePref(): ThemePref {
  if (typeof window === "undefined") return "light"
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    return raw === "dark" ? "dark" : "light"
  } catch {
    return "light"
  }
}

export function writeThemePref(theme: ThemePref): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}

/** Aplica a classe `dark` no `<html>` antes da hidratação (evita flash). */
export const themePrefBootstrapScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`
