"use client"

import { useTheme } from "next-themes"
import { useColorTheme, COLOR_THEMES, type ColorThemeId } from "@/components/ui/theme-provider"
import { Moon, Sun, Monitor, Palette, Check } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { colorTheme, setColorTheme } = useColorTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const modes = [
    { id: "light",  icon: <Sun className="w-3.5 h-3.5" />,     label: "Terang" },
    { id: "dark",   icon: <Moon className="w-3.5 h-3.5" />,    label: "Gelap" },
    { id: "system", icon: <Monitor className="w-3.5 h-3.5" />, label: "Sistem" },
  ]

  return (
    <div className="space-y-3">
      {/* Mode terang/gelap/sistem */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Sun className="w-3 h-3" /> Mode Tampilan
        </p>
        <div className="flex gap-1.5">
          {modes.map(m => (
            <button
              key={m.id}
              onClick={() => setTheme(m.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                theme === m.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pilihan warna tema */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Palette className="w-3 h-3" /> Warna Tema
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {COLOR_THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setColorTheme(t.id as ColorThemeId)}
              title={t.label}
              className={cn(
                "relative flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all hover:scale-105",
                colorTheme === t.id
                  ? "border-primary shadow-sm"
                  : "border-transparent hover:border-border"
              )}
            >
              <div
                className="w-6 h-6 rounded-full shadow-sm flex items-center justify-center"
                style={{ backgroundColor: t.color }}
              >
                {colorTheme === t.id && (
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground leading-none">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
