"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    // Apply saved accent color from localStorage
    const applyAccentColor = (color: string) => {
      let hue, saturation, lightness

      switch (color) {
        case "teal":
          hue = 173
          saturation = 80
          lightness = 40
          break
        case "blue":
          hue = 221
          saturation = 83
          lightness = 53
          break
        case "violet":
          hue = 262
          saturation = 83
          lightness = 58
          break
        case "pink":
          hue = 330
          saturation = 81
          lightness = 60
          break
        case "orange":
          hue = 25
          saturation = 95
          lightness = 53
          break
        case "green":
          hue = 142
          saturation = 76
          lightness = 36
          break
        default:
          hue = 173
          saturation = 80
          lightness = 40
      }

      document.documentElement.style.setProperty("--primary", `${hue} ${saturation}% ${lightness}%`)
    }

    const savedAccentColor = localStorage.getItem("accentColor")
    if (savedAccentColor) {
      applyAccentColor(savedAccentColor)
    }
  }, [])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
