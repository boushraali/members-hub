import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { ApiError } from '../../data/api'

type Kind = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  kind: Kind
  message: string
}

const ToastCtx = createContext<{ notify: (kind: Kind, message: string) => void; notifyError: (e: unknown) => void } | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const dismiss = (id: number) => setItems((x) => x.filter((t) => t.id !== id))
  const notify = useCallback((kind: Kind, message: string) => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x.slice(-2), { id, kind, message }])
    setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4500)
  }, [])
  const notifyError = useCallback(
    (e: unknown) => notify('error', e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع. حاول مرة أخرى.'),
    [notify],
  )
  const Icon = { success: CircleCheck, error: CircleAlert, info: Info }
  const tone = { success: 'border-ok/30 text-ok', error: 'border-danger/30 text-danger', info: 'border-info/30 text-info' }
  return (
    <ToastCtx.Provider value={{ notify, notifyError }}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:start-4 sm:items-start">
        <AnimatePresence>
          {items.map((t) => {
            const I = Icon[t.kind]
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-surface px-4 py-3 shadow-card-lg ${tone[t.kind]}`}
              >
                <I className="mt-0.5 size-5 shrink-0" aria-hidden />
                <p className="flex-1 text-sm font-semibold text-ink">{t.message}</p>
                <button onClick={() => dismiss(t.id)} className="text-muted hover:text-ink" aria-label="إغلاق التنبيه">
                  <X className="size-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
