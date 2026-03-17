"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { createContext, useContext, useEffect, useState } from "react"

// ── Daftar tema warna yang tersedia ──
export const COLOR_THEMES = [
  { id: "blue",   label: "Blue",   color: "#2563eb", darkColor: "#60a5fa" },
  { id: "purple", label: "Purple", color: "#7c3aed", darkColor: "#a78bfa" },
  { id: "green",  label: "Green",  color: "#16a34a", darkColor: "#4ade80" },
  { id: "orange", label: "Orange", color: "#ea580c", darkColor: "#fb923c" },
  { id: "rose",   label: "Rose",   color: "#e11d48", darkColor: "#fb7185" },
  { id: "teal",   label: "Teal",   color: "#0d9488", darkColor: "#2dd4bf" },
  { id: "slate",  label: "Slate",  color: "#475569", darkColor: "#94a3b8" },
] as const

export type ColorThemeId = typeof COLOR_THEMES[number]["id"]

// ── Context ──
interface ColorThemeContextType {
  colorTheme: ColorThemeId
  setColorTheme: (theme: ColorThemeId) => void
}

const ColorThemeContext = createContext<ColorThemeContextType>({
  colorTheme: "blue",
  setColorTheme: () => {},
})

export const useColorTheme = () => useContext(ColorThemeContext)

// ── Provider ──
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>("blue")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("dtc-color-theme") as ColorThemeId | null
    if (saved && COLOR_THEMES.find(t => t.id === saved)) {
      setColorThemeState(saved)
      document.documentElement.setAttribute("data-color-theme", saved)
    }
  }, [])

  const setColorTheme = (theme: ColorThemeId) => {
    setColorThemeState(theme)
    localStorage.setItem("dtc-color-theme", theme)
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
