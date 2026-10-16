import { NavLink, Outlet } from 'react-router-dom'
import { ChartColumn, ClipboardCheck, Lock, ScrollText, Settings, Tags, Users } from 'lucide-react'
import { PageShell } from '../../components/layout/Layout'
import { EmptyState } from '../../components/ui/misc'
import { cx } from '../../components/ui/primitives'
import { useSession } from '../../lib/hooks'

const LINKS = [
  { to: '/admin', end: true, label: 'الإحصائيات', icon: ChartColumn },
  { to: '/admin/members', label: 'قائمة الأعضاء', icon: Users },
  { to: '/admin/reviews', label: 'طلبات المراجعة', icon: ClipboardCheck },
  { to: '/admin/taxonomy', label: 'التخصصات والاهتمامات', icon: Tags },
  { to: '/admin/settings', label: 'إعدادات الدليل', icon: Settings },
  { to: '/admin/audit', label: 'سجل العمليات', icon: ScrollText },
]

export default function AdminLayout() {
  const session = useSession()
  if (session.role !== 'admin') {
    return (
      <PageShell>
        <div className="mx-auto mt-12 max-w-[640px] px-4">
          <EmptyState icon={<Lock className="size-7" />} title="غير مصرح بالدخول" description="هذا القسم متاح لمشرفي دليل الأعضاء فقط. (في المعاينة: اختر «مشرف الدليل» من الشريط العلوي.)" />
        </div>
      </PageShell>
    )
  }
  return (
    <PageShell>
      <div className="mx-auto max-w-[1240px] px-4 pt-6 sm:px-6">
        <div className="mb-5">
          <span className="text-[13px] font-extrabold text-teal-strong">Members Directory Management</span>
          <h1 className="text-2xl font-black text-ink">إدارة مساحة الأعضاء</h1>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[230px_1fr]">
          <nav aria-label="أقسام الإدارة" className="lg:sticky lg:top-24">
            <ul className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
              {LINKS.map((l) => (
                <li key={l.to} className="shrink-0">
                  <NavLink
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      cx(
                        'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition whitespace-nowrap',
                        isActive ? 'bg-ink text-bg dark:bg-teal-strong dark:text-[#061826]' : 'text-ink-2 hover:bg-surface-2',
                      )
                    }
                  >
                    <l.icon className="size-[18px]" aria-hidden />
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </PageShell>
  )
}
