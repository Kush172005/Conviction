import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ThemeOrigin = { x: number; y: number }

const STORAGE_KEY = 'conviction-theme'
const DARK_COLOR = '#0E141C'
const LIGHT_COLOR = '#F1F3F6'

type ThemeContextValue = {
  theme: ThemePreference
  resolved: 'light' | 'dark'
  setTheme: (theme: ThemePreference, origin?: ThemeOrigin) => void
  toggleResolved: (origin?: ThemeOrigin) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'light'
}

function applyThemeClass(resolved: 'light' | 'dark') {
  const root = document.documentElement
  const body = document.body
  root.classList.toggle('dark', resolved === 'dark')
  body.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', resolved === 'dark' ? DARK_COLOR : LIGHT_COLOR)
  const fav = document.getElementById('app-favicon') as HTMLLinkElement | null
  if (fav) fav.href = resolved === 'dark' ? '/favicon.svg' : '/favicon-light.svg'
}

function resolvePreference(preference: ThemePreference, system: 'light' | 'dark') {
  return preference === 'system' ? system : preference
}

function setTransitionOrigin(origin?: ThemeOrigin) {
  const x = origin?.x ?? window.innerWidth / 2
  const y = origin?.y ?? window.innerHeight / 2
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )
  const root = document.documentElement
  root.style.setProperty('--vt-x', `${x}px`)
  root.style.setProperty('--vt-y', `${y}px`)
  root.style.setProperty('--vt-r', `${Math.ceil(radius)}px`)
}

function canUseViewTransition() {
  return (
    typeof document !== 'undefined' &&
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function runThemeChange(apply: () => void, origin?: ThemeOrigin) {
  if (!canUseViewTransition()) {
    apply()
    return
  }
  setTransitionOrigin(origin)
  document.startViewTransition(() => {
    flushSync(apply)
  })
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => readStoredTheme())
  const [system, setSystem] = useState<'light' | 'dark'>(getSystemTheme)

  const resolved = resolvePreference(theme, system)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystem(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    applyThemeClass(resolved)
  }, [resolved])

  const setTheme = useCallback((next: ThemePreference, origin?: ThemeOrigin) => {
    const nextResolved = resolvePreference(next, getSystemTheme())
    const apply = () => {
      setThemeState(next)
      window.localStorage.setItem(STORAGE_KEY, next)
      applyThemeClass(nextResolved)
    }
    if (nextResolved === resolved && next === theme) {
      apply()
      return
    }
    if (nextResolved === resolved) {
      apply()
      return
    }
    runThemeChange(apply, origin)
  }, [resolved, theme])

  const toggleResolved = useCallback((origin?: ThemeOrigin) => {
    const next = resolved === 'dark' ? 'light' : 'dark'
    setTheme(next, origin)
  }, [resolved, setTheme])

  const value = useMemo(
    () => ({ theme, resolved, setTheme, toggleResolved }),
    [theme, resolved, setTheme, toggleResolved]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
