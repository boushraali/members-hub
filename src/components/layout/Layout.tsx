import { useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FlaskConical, Menu, Moon, RotateCcw, Sun, X, UserRound, LayoutDashboard } from 'lucide-react'
import { setSession } from '../../data/session'
import { isMock, resetMockData } from '../../data'
import { useSession, useTheme } from '../../lib/hooks'
import { cx } from '../ui/primitives'

const SITE = 'https://aia.org.sa/site/index.php'
const NAV = [
  { label: 'عن الجمعية', href: `${SITE}#about` },
  { label: 'الخدمات', href: `${SITE}#services` },
  { label: 'العضوية', href: `${SITE}#membership` },
  { label: 'مجتمعنا', href: `${SITE}#community` },
  { label: 'المدونة', href: 'https://aia.org.sa/site/news.php' },
  { label: 'تواصل معنا', href: `${SITE}#contact` },
]

/** شخصيات المعاينة — كل منها يمثّل حالة مختلفة في دورة حياة الملف المهني */
export const PERSONAS: { value: string; label: string; role: 'visitor' | 'member' | 'admin'; memberId?: number }[] = [
  { value: 'visitor', label: 'زائر', role: 'visitor' },
  { value: 'm1001', label: 'عضو: سارة — ملف منشور', role: 'member', memberId: 1001 },
  { value: 'm1027', label: 'عضو: ليان — بلا ملف مهني', role: 'member', memberId: 1027 },
  { value: 'm1029', label: 'عضو: مها — ملف غير مكتمل', role: 'member', memberId: 1029 },
  { value: 'm1032', label: 'عضو: طلال — ملف مرفوض', role: 'member', memberId: 1032 },
  { value: 'm1030', label: 'عضو: إبراهيم — عضوية منتهية', role: 'member', memberId: 1030 },
  { value: 'admin', label: 'مشرف الدليل (أدمن)', role: 'admin' },
]

function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#22A599] to-[#00A8DF] text-white shadow-card">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <circle cx="4.5" cy="6" r="1.6" />
          <circle cx="19.5" cy="6" r="1.6" />
          <circle cx="4.5" cy="18" r="1.6" />
          <circle cx="19.5" cy="18" r="1.6" />
          <path d="M6 7l3.6 3M18 7l-3.6 3M6 17l3.6-3M18 17l-3.6-3" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-black text-ink">جمعية الذكاء الاصطناعي</span>
        <span className="block text-[11px] font-bold text-muted">AI Association</span>
      </span>
    </span>
  )
}

function PrototypeBar() {
  const session = useSession()
  const navigate = useNavigate()
  const current = PERSONAS.find((p) => (p.role === 'member' ? p.memberId === session.memberId : p.role === session.role))?.value ?? 'visitor'
  if (!isMock) return null
  return (
    <div className="border-b border-warn/25 bg-warn-bg text-warn">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-[13px] font-bold sm:px-6">
        <span className="flex items-center gap-1.5">
          <FlaskConical className="size-4" aria-hidden />
          نموذج أولي — جميع الأسماء والبيانات افتراضية للمعاينة فقط
        </span>
        <label className="flex items-center gap-2 ms-auto">
          <span className="whitespace-nowrap">المعاينة بصفة:</span>
          <select
            value={current}
            onChange={(e) => {
              const p = PERSONAS.find((x) => x.value === e.target.value)!
              setSession(p.role, p.memberId ?? null)
              navigate(p.role === 'admin' ? '/admin' : p.role === 'member' ? '/my-profile' : '/')
            }}
            className="max-w-[230px] rounded-lg border border-warn/30 bg-surface px-2 py-1 text-[13px] font-bold text-ink"
          >
            {PERSONAS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            if (confirm('إعادة البيانات التجريبية إلى حالتها الأولى؟')) {
              resetMockData()
              location.reload()
            }
          }}
          className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-warn/10"
        >
          <RotateCcw className="size-3.5" aria-hidden /> إعادة ضبط البيانات
        </button>
      </div>
    </div>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [theme, toggleTheme] = useTheme()
  const session = useSession()
  const navLink = 'rounded-lg px-2 py-1 text-sm font-bold text-muted transition hover:text-teal-strong'
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[70] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        تخطَّ إلى المحتوى
      </a>
      <PrototypeBar />
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href={SITE} aria-label="الصفحة الرئيسية لجمعية الذكاء الاصطناعي">
            <BrandMark />
          </a>
          <nav aria-label="القائمة الرئيسية" className="hidden items-center gap-1 lg:flex">
            {NAV.slice(0, 4).map((n) => (
              <a key={n.label} href={n.href} className={navLink}>
                {n.label}
              </a>
            ))}
            <NavLink to="/" end className={({ isActive }) => cx(navLink, isActive && 'bg-teal-light !text-teal-strong')}>
              مساحة الأعضاء
            </NavLink>
            {NAV.slice(4).map((n) => (
              <a key={n.label} href={n.href} className={navLink}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl p-2.5 text-muted transition hover:bg-surface-2 hover:text-ink"
              aria-label={theme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
            >
              {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            {session.role === 'member' && (
              <Link to="/my-profile" className="hidden items-center gap-1.5 rounded-xl border-[1.5px] border-line px-3 py-2 text-sm font-extrabold text-ink hover:border-teal-strong sm:flex">
                <UserRound className="size-4" aria-hidden /> ملفي المهني
              </Link>
            )}
            {session.role === 'admin' && (
              <Link to="/admin" className="hidden items-center gap-1.5 rounded-xl border-[1.5px] border-line px-3 py-2 text-sm font-extrabold text-ink hover:border-teal-strong sm:flex">
                <LayoutDashboard className="size-4" aria-hidden /> لوحة الإدارة
              </Link>
            )}
            {session.role === 'visitor' && (
              <a href="https://aia.org.sa/members/membership.php" className="hidden rounded-xl bg-ink px-4 py-2.5 text-sm font-extrabold text-bg hover:bg-navy-mid sm:inline-flex dark:bg-teal-strong dark:text-[#061826]">
                انضم للجمعية
              </a>
            )}
            <button type="button" className="rounded-xl p-2.5 text-ink lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label="القائمة" onClick={() => setOpen((o) => !o)}>
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="mobile-nav" aria-label="القائمة الرئيسية" className="border-t border-line bg-bg px-4 pb-4 lg:hidden">
            <ul className="flex flex-col py-2">
              <li>
                <NavLink to="/" end onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 font-bold text-teal-strong">
                  مساحة الأعضاء
                </NavLink>
              </li>
              {session.role === 'member' && (
                <li>
                  <Link to="/my-profile" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 font-bold text-ink">
                    ملفي المهني
                  </Link>
                </li>
              )}
              {session.role === 'admin' && (
                <li>
                  <Link to="/admin" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 font-bold text-ink">
                    لوحة الإدارة
                  </Link>
                </li>
              )}
              {NAV.map((n) => (
                <li key={n.label}>
                  <a href={n.href} className="block rounded-lg px-3 py-2.5 font-bold text-muted">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    </>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-[#08223F] text-[#b9d6e6]">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-black text-white">جمعية الذكاء الاصطناعي</p>
          <p className="mt-2 text-sm leading-7">جمعية أهلية غير ربحية تحت إشراف الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا).</p>
        </div>
        <div>
          <p className="font-extrabold text-white">روابط سريعة</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><a className="hover:text-white" href="https://aia.org.sa/members/membership.php">العضوية</a></li>
            <li><a className="hover:text-white" href="https://aia.org.sa/members/renew.php">تجديد العضوية</a></li>
            <li><a className="hover:text-white" href="https://aia.org.sa/site/privacy.php">سياسة الخصوصية</a></li>
          </ul>
        </div>
        <div>
          <p className="font-extrabold text-white">خصوصية الدليل</p>
          <p className="mt-3 text-sm leading-7">لا يظهر أي عضو في الدليل إلا بموافقته الصريحة واعتماد الإدارة، ولا تُعرض بيانات التواصل الشخصية مطلقًا.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-[#8fb3c9]">© جمعية الذكاء الاصطناعي — نموذج أولي لمساحة الأعضاء</div>
    </footer>
  )
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
