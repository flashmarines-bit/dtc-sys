"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { createContext, useContext, useEffect, useState } from "react"
import Cookies from "js-cookie"

export const COLOR_THEMES = [
  { id: "blue",     label: "Blue",     color: "#2563eb" },
  { id: "purple",   label: "Purple",   color: "#7c3aed" },
  { id: "green",    label: "Green",    color: "#16a34a" },
  { id: "orange",   label: "Orange",   color: "#ea580c" },
  { id: "rose",     label: "Rose",     color: "#e11d48" },
  { id: "teal",     label: "Teal",     color: "#0d9488" },
  { id: "slate",    label: "Slate",    color: "#475569" },
  { id: "indigo",   label: "Indigo",   color: "#4f46e5" },
  { id: "cyan",     label: "Cyan",     color: "#0891b2" },
  { id: "amber",    label: "Amber",    color: "#d97706" },
  { id: "lime",     label: "Lime",     color: "#65a30d" },
  { id: "pink",     label: "Pink",     color: "#db2777" },
  { id: "red",      label: "Red",      color: "#dc2626" },
  { id: "emerald",  label: "Emerald",  color: "#059669" },
  { id: "violet",   label: "Violet",   color: "#7c3aed" },
  { id: "midnight", label: "Midnight", color: "#1d2d6b" },
  { id: "forest",   label: "Forest",   color: "#2d6a2f" },
] as const

export type ColorThemeId = typeof COLOR_THEMES[number]["id"]

interface ColorThemeContextType {
  colorTheme: ColorThemeId
  setColorTheme: (theme: ColorThemeId) => void
}

const ColorThemeContext = createContext<ColorThemeContextType>({
  colorTheme: "blue",
  setColorTheme: () => {},
})

export const useColorTheme = () => useContext(ColorThemeContext)

function getThemeKey() {
  // Pakai userId dari auth store (via cookie) agar tema per user
  try {
    const raw = localStorage.getItem("dtc-auth")
    if (raw) {
      const parsed = JSON.parse(raw)
      const userId = parsed?.state?.user?.id
      if (userId) return `dtc-color-theme-${userId}`
    }
  } catch {}
  return "dtc-color-theme"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>("blue")

  useEffect(() => {
    const key = getThemeKey()
    const saved = localStorage.getItem(key) as ColorThemeId | null
    if (saved && COLOR_THEMES.find(t => t.id === saved)) {
      setColorThemeState(saved)
      document.documentElement.setAttribute("data-color-theme", saved)
    }
  }, [])

  const setColorTheme = (theme: ColorThemeId) => {
    const key = getThemeKey()
    setColorThemeState(theme)
    localStorage.setItem(key, theme)
    document.documentElement.setAttribute("data-color-theme", theme)
  }

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        {children}
      </NextThemesProvider>
    </ColorThemeContext.Provider>
  )
}
