import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'slingshot-theme'

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

export function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Ignore private-mode / quota failures.
  }
}

/** Resolve theme for first paint (storage → system → dark). */
export function resolveTheme(): Theme {
  return getStoredTheme() ?? systemTheme()
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() =>
    typeof document !== 'undefined' ? resolveTheme() : 'dark',
  )

  useEffect(() => {
    applyTheme(theme)
    persistTheme(theme)
  }, [theme])

  const setTheme = (next: Theme) => {
    setThemeState(next)
  }

  const toggleTheme = () => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return { theme, setTheme, toggleTheme }
}
