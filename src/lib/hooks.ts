import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { getSession, subscribeSession } from '../data/session'

export interface AsyncState<T> {
  data: T | undefined
  error: unknown
  loading: boolean
  reload: () => void
  setData: (d: T) => void
}

/** جلب بيانات غير متزامن مع تجاهل الاستجابات القديمة (لتجنّب سباق النتائج عند تغيير الفلاتر بسرعة) */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<{ data: T | undefined; error: unknown; loading: boolean }>({ data: undefined, error: null, loading: true })
  const [tick, setTick] = useState(0)
  const reqId = useRef(0)
  useEffect(() => {
    const id = ++reqId.current
    setState((s) => ({ ...s, loading: true, error: null }))
    fn().then(
      (data) => id === reqId.current && setState({ data, error: null, loading: false }),
      (error) => id === reqId.current && setState((s) => ({ ...s, error, loading: false })),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  const setData = useCallback((data: T) => setState({ data, error: null, loading: false }), [])
  return { ...state, reload, setData }
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function useSession() {
  return useSyncExternalStore(subscribeSession, getSession)
}

const THEME_KEY = 'aia-members-hub:theme'
export function useTheme(): [theme: 'light' | 'dark', toggle: () => void] {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* تجاهل */
    }
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title
  }, [title])
}
