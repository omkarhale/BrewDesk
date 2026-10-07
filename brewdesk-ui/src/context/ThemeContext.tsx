'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { AuthContext } from '@/context/AuthContext'
import { getStoredUser } from '@/lib/auth'

export type Theme = 'light' | 'dark' | 'system'

export interface ColorPreset {
  id: string
  name: string
  description: string
  primaryHex: string
  primaryHsl: string
  darkPrimaryHsl: string
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'teal',
    name: 'Rippling Teal',
    description: 'Clean, balanced default brand identity',
    primaryHex: '#009B77',
    primaryHsl: '173 100% 30%',
    darkPrimaryHsl: '173 80% 42%',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    description: 'Organic, deep botanical green',
    primaryHex: '#059669',
    primaryHsl: '160 84% 39%',
    darkPrimaryHsl: '160 75% 45%',
  },
  {
    id: 'ocean',
    name: 'Ocean Sapphire',
    description: 'Vibrant, corporate sea blue',
    primaryHex: '#0284C7',
    primaryHsl: '200 98% 39%',
    darkPrimaryHsl: '200 90% 50%',
  },
  {
    id: 'indigo',
    name: 'Electric Indigo',
    description: 'Modern, high-velocity tech aesthetic',
    primaryHex: '#6366F1',
    primaryHsl: '239 84% 67%',
    darkPrimaryHsl: '239 84% 67%',
  },
  {
    id: 'amber',
    name: 'Warm Brew',
    description: 'Rich coffee, espresso & cafe tones',
    primaryHex: '#D97706',
    primaryHsl: '38 92% 50%',
    darkPrimaryHsl: '38 92% 52%',
  },
  {
    id: 'rose',
    name: 'Crimson Rose',
    description: 'Bold, energetic modern pink-red',
    primaryHex: '#E11D48',
    primaryHsl: '347 77% 50%',
    darkPrimaryHsl: '347 80% 58%',
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    description: 'Elegant, premium purple styling',
    primaryHex: '#7C3AED',
    primaryHsl: '263 70% 50%',
    darkPrimaryHsl: '263 75% 62%',
  },
  {
    id: 'slate',
    name: 'Modern Slate',
    description: 'Understated, neutral monochrome',
    primaryHex: '#475569',
    primaryHsl: '215 19% 35%',
    darkPrimaryHsl: '215 20% 55%',
  },
]

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let cleaned = hex.replace('#', '')
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('')
  }
  const r = parseInt(cleaned.substring(0, 2), 16) / 255
  const g = parseInt(cleaned.substring(2, 4), 16) / 255
  const b = parseInt(cleaned.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  colorTheme: string
  setColorTheme: (presetId: string) => void
  customHex: string
  setCustomHex: (hex: string) => void
  resetToDefault: () => void
  presets: ColorPreset[]
  userEmail: string | null
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyBaseTheme(theme: Theme): 'light' | 'dark' {
  const resolved = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme

  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    document.documentElement.style.colorScheme = resolved
  }
  return resolved
}

function setPaletteStyles(
  root: HTMLElement,
  primaryHsl: string,
  accentHsl: string,
  accentFgHsl: string,
  ringHsl: string,
  primaryFgHsl = '0 0% 100%'
) {
  // Set raw HSL token variables
  root.style.setProperty('--primary', primaryHsl)
  root.style.setProperty('--primary-foreground', primaryFgHsl)
  root.style.setProperty('--ring', ringHsl)
  root.style.setProperty('--accent', accentHsl)
  root.style.setProperty('--accent-foreground', accentFgHsl)
  root.style.setProperty('--chart-1', primaryHsl)

  // Explicitly set Tailwind v4 color variables for instant DOM-wide re-skinning
  root.style.setProperty('--color-primary', `hsl(${primaryHsl})`)
  root.style.setProperty('--color-primary-foreground', `hsl(${primaryFgHsl})`)
  root.style.setProperty('--color-ring', `hsl(${ringHsl})`)
  root.style.setProperty('--color-accent', `hsl(${accentHsl})`)
  root.style.setProperty('--color-accent-foreground', `hsl(${accentFgHsl})`)
  root.style.setProperty('--color-chart-1', `hsl(${primaryHsl})`)
}

function applyPalette(
  mode: 'light' | 'dark',
  presetId: string,
  customHex: string
) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  if (presetId === 'custom' && customHex) {
    const { h, s, l } = hexToHsl(customHex)
    if (mode === 'dark') {
      const darkL = Math.max(l, 46)
      const darkS = Math.min(s, 85)
      const primaryHsl = `${h} ${darkS}% ${darkL}%`
      const accentHsl = `${h} 40% 18%`
      const accentFgHsl = `${h} 80% 70%`
      const fgHsl = darkL > 72 ? '220 15% 15%' : '0 0% 100%'
      setPaletteStyles(root, primaryHsl, accentHsl, accentFgHsl, primaryHsl, fgHsl)
    } else {
      const lightL = Math.min(l, 36)
      const primaryHsl = `${h} ${s}% ${lightL}%`
      const accentHsl = `${h} 60% 94%`
      const accentFgHsl = `${h} ${s}% 25%`
      const fgHsl = lightL > 65 ? '220 15% 15%' : '0 0% 100%'
      setPaletteStyles(root, primaryHsl, accentHsl, accentFgHsl, primaryHsl, fgHsl)
    }
  } else {
    const preset = COLOR_PRESETS.find((p) => p.id === presetId) || COLOR_PRESETS[0]
    const hslVal = mode === 'dark' ? preset.darkPrimaryHsl : preset.primaryHsl
    const [h, sStr] = hslVal.split(' ')
    const hNum = h
    const sNum = parseInt(sStr, 10) || 100

    if (mode === 'dark') {
      const accentHsl = `${hNum} 40% 18%`
      const accentFgHsl = `${hNum} 80% 70%`
      setPaletteStyles(root, hslVal, accentHsl, accentFgHsl, hslVal, '0 0% 100%')
    } else {
      const accentHsl = `${hNum} 60% 94%`
      const accentFgHsl = `${hNum} ${Math.min(sNum, 90)}% 25%`
      setPaletteStyles(root, hslVal, accentHsl, accentFgHsl, hslVal, '0 0% 100%')
    }
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const authCtx = useContext(AuthContext)
  const userEmail = authCtx?.user?.email || (typeof window !== 'undefined' ? getStoredUser()?.email : null) || null

  const [theme, setThemeState] = useState<Theme>('system')
  const [colorTheme, setColorThemeState] = useState<string>('teal')
  const [customHex, setCustomHexState] = useState<string>('#009B77')

  // Load preferences for the current logged-in user (or global fallback)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const themeKey = userEmail ? `brewdesk_theme_${userEmail}` : 'theme'
    const colorKey = userEmail ? `brewdesk_color_theme_${userEmail}` : 'brewdesk_color_theme'
    const hexKey = userEmail ? `brewdesk_custom_hex_${userEmail}` : 'brewdesk_custom_hex'

    const storedTheme = (window.localStorage.getItem(themeKey) as Theme | null)
      || (window.localStorage.getItem('theme') as Theme | null)
      || 'system'
    const storedColorTheme = window.localStorage.getItem(colorKey)
      || window.localStorage.getItem('brewdesk_color_theme')
      || 'teal'
    const storedCustomHex = window.localStorage.getItem(hexKey)
      || window.localStorage.getItem('brewdesk_custom_hex')
      || '#009B77'

    setThemeState(storedTheme)
    setColorThemeState(storedColorTheme)
    setCustomHexState(storedCustomHex)

    const resolvedMode = applyBaseTheme(storedTheme)
    applyPalette(resolvedMode, storedColorTheme, storedCustomHex)
  }, [userEmail])

  // Listen for system theme changes if theme === 'system'
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const mode = applyBaseTheme('system')
      applyPalette(mode, colorTheme, customHex)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, colorTheme, customHex])

  const setTheme = useCallback((nextTheme: Theme) => {
    if (typeof window !== 'undefined') {
      if (userEmail) {
        window.localStorage.setItem(`brewdesk_theme_${userEmail}`, nextTheme)
      }
      window.localStorage.setItem('theme', nextTheme)
    }
    setThemeState(nextTheme)
    const mode = applyBaseTheme(nextTheme)
    applyPalette(mode, colorTheme, customHex)
  }, [userEmail, colorTheme, customHex])

  const setColorTheme = useCallback((presetId: string) => {
    if (typeof window !== 'undefined') {
      if (userEmail) {
        window.localStorage.setItem(`brewdesk_color_theme_${userEmail}`, presetId)
      }
      window.localStorage.setItem('brewdesk_color_theme', presetId)
    }
    setColorThemeState(presetId)
    const mode = applyBaseTheme(theme)
    applyPalette(mode, presetId, customHex)
  }, [userEmail, theme, customHex])

  const setCustomHex = useCallback((hex: string) => {
    if (typeof window !== 'undefined') {
      if (userEmail) {
        window.localStorage.setItem(`brewdesk_color_theme_${userEmail}`, 'custom')
        window.localStorage.setItem(`brewdesk_custom_hex_${userEmail}`, hex)
      }
      window.localStorage.setItem('brewdesk_color_theme', 'custom')
      window.localStorage.setItem('brewdesk_custom_hex', hex)
    }
    setColorThemeState('custom')
    setCustomHexState(hex)
    const mode = applyBaseTheme(theme)
    applyPalette(mode, 'custom', hex)
  }, [userEmail, theme])

  const resetToDefault = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (userEmail) {
        window.localStorage.removeItem(`brewdesk_color_theme_${userEmail}`)
        window.localStorage.removeItem(`brewdesk_custom_hex_${userEmail}`)
      }
      window.localStorage.removeItem('brewdesk_color_theme')
      window.localStorage.removeItem('brewdesk_custom_hex')
    }
    setColorThemeState('teal')
    setCustomHexState('#009B77')
    const mode = applyBaseTheme(theme)
    applyPalette(mode, 'teal', '#009B77')
  }, [userEmail, theme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        colorTheme,
        setColorTheme,
        customHex,
        setCustomHex,
        resetToDefault,
        presets: COLOR_PRESETS,
        userEmail,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}