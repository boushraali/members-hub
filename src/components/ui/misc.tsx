import { useEffect, useRef, type ReactNode } from 'react'
import {
  Bot,
  BookOpen,
  Brain,
  ChartLine,
  Cloud,
  CodeXml,
  Database,
  Factory,
  Layers,
  Network,
  Palette,
  Rocket,
  Shield,
  X,
  type LucideIcon,
} from 'lucide-react'
import { initials } from '../../lib/text'
import { cx } from './primitives'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  brain: Brain,
  database: Database,
  shield: Shield,
  code: CodeXml,
  cloud: Cloud,
  network: Network,
  bot: Bot,
  rocket: Rocket,
  chart: ChartLine,
  palette: Palette,
  book: BookOpen,
  factory: Factory,
  layers: Layers,
}

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = CATEGORY_ICONS[icon] ?? Layers
  return <Icon className={className} aria-hidden />
}

const AVATAR_BG = ['#08223F', '#044869', '#11766f', '#0369a1', '#0d2c4a']

export function Avatar({ name, src, size = 88, className }: { name: string; src: string | null; size?: number; className?: string }) {
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  return (
    <div
      className={cx('relative shrink-0 overflow-hidden rounded-full ring-4 ring-surface shadow-card', className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={`صورة ${name}`} className="size-full object-cover" loading={src.startsWith('data:') ? undefined : 'lazy'} decoding="async" />
      ) : (
        <div
          role="img"
          aria-label={`صورة رمزية لـ ${name}`}
          className="flex size-full items-center justify-center font-extrabold text-white"
          style={{ background: `linear-gradient(135deg, ${AVATAR_BG[hash % AVATAR_BG.length]}, #22A599)`, fontSize: size * 0.3 }}
        >
          {initials(name)}
        </div>
      )}
    </div>
  )
}

export function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

/** يفتح الرابط في نافذة جديدة بأمان: noopener يمنع الوصول إلى window.opener، وnoreferrer يحجب مصدر الإحالة */
export function LinkedInButton({ href, compact, name }: { href: string; compact?: boolean; name: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#0a66c2]/25 bg-[#0a66c2]/[0.07] font-extrabold text-[#0a66c2] transition hover:bg-[#0a66c2] hover:text-white dark:border-[#70b5f9]/30 dark:text-[#70b5f9] dark:hover:text-[#061826] dark:hover:bg-[#70b5f9]',
        compact ? 'min-h-10 px-3 text-[13px]' : 'min-h-11 px-4 text-sm',
      )}
    >
      <LinkedInLogo className="size-4" />
      <span>الملف المهني على LinkedIn</span>
      <span className="sr-only">لـ {name} (يفتح في نافذة جديدة)</span>
    </a>
  )
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-line-strong bg-bg-soft px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-light text-teal-strong">{icon}</div>
      <h3 className="text-lg font-extrabold text-ink">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action}
    </div>
  )
}

/** نافذة حوار مبنية على <dialog> الأصلي: محاصرة التركيز وإغلاق Esc مدعومان من المتصفح */
export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal?.()
    if (!open && d.open) d.close?.()
  }, [open])
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="modal-title"
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-[20px] border border-line bg-surface p-0 text-ink shadow-card-lg backdrop:bg-[#061826]/60 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 id="modal-title" className="text-lg font-extrabold">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-2" aria-label="إغلاق">
              <X className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
