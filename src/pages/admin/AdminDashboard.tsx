import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CircleCheck, ClipboardCheck, EyeOff, FileText, UserCheck, Users } from 'lucide-react'
import { api } from '../../data'
import type { FacetOption } from '../../data/types'
import { Card, SectionTitle, Skeleton } from '../../components/ui/primitives'
import { useAsync, useDocumentTitle } from '../../lib/hooks'
import { formatNumber } from '../../lib/text'

function Tile({ icon, label, value, to, accent }: { icon: React.ReactNode; label: string; value: number; to?: string; accent?: boolean }) {
  const body = (
    <Card className={`flex h-full items-center gap-3.5 p-4 transition ${to ? 'hover:border-teal/40 hover:shadow-card-lg' : ''}`}>
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${accent ? 'bg-warn-bg text-warn' : 'bg-teal-light text-teal-strong'}`}>{icon}</span>
      <div>
        <p className="text-2xl font-black tabular-nums leading-8 text-ink">{formatNumber(value)}</p>
        <p className="text-[13px] font-bold text-muted">{label}</p>
      </div>
    </Card>
  )
  return to ? (
    <Link to={to} className="block rounded-[18px]">
      {body}
    </Link>
  ) : (
    body
  )
}

/** مخطط أعمدة أفقية لسلسلة واحدة: لون واحد، القيم مكتوبة مباشرة، وتفاصيل عند المرور */
function BarList({ data, unit, caption }: { data: FacetOption[]; unit: string; caption: string }) {
  const [hover, setHover] = useState<string | null>(null)
  const max = Math.max(1, ...data.map((d) => d.count))
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <figure>
      <table className="w-full border-separate border-spacing-y-1.5 text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">البند</th>
            <th scope="col">العدد</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.id} onMouseEnter={() => setHover(d.id)} onMouseLeave={() => setHover(null)} className="group">
              <th scope="row" className="w-[42%] pe-3 text-start align-middle text-[13px] font-bold text-ink-2">
                {d.label}
              </th>
              <td className="relative align-middle">
                <div className="flex items-center gap-2">
                  <div className="h-5 flex-1">
                    <div
                      className="h-full rounded-e-[4px] bg-teal-strong transition-[width,opacity] duration-500"
                      style={{ width: `${(d.count / max) * 100}%`, minWidth: d.count ? 4 : 0, opacity: hover && hover !== d.id ? 0.45 : 1 }}
                    />
                  </div>
                  <span className="w-8 text-start text-[13px] font-extrabold tabular-nums text-ink">{formatNumber(d.count)}</span>
                </div>
                {hover === d.id && (
                  <div role="tooltip" className="pointer-events-none absolute -top-9 start-0 z-10 rounded-lg bg-ink px-2.5 py-1 text-xs font-bold whitespace-nowrap text-bg shadow-card-lg">
                    {d.label}: {formatNumber(d.count)} {unit} ({Math.round((d.count / Math.max(1, total)) * 100)}٪ من المجموع)
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

export default function AdminDashboard() {
  useDocumentTitle('الإحصائيات | إدارة مساحة الأعضاء')
  const { data: s, loading } = useAsync(() => api.adminGetStats(), [])
  if (loading || !s)
    return (
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-[18px]" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-[18px]" />
      </div>
    )
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Tile icon={<Users className="size-5" />} label="إجمالي أعضاء الجمعية" value={s.totalMembers} to="/admin/members" />
        <Tile icon={<UserCheck className="size-5" />} label="العضويات الفعّالة" value={s.activeMemberships} to="/admin/members?ms=active" />
        <Tile icon={<CircleCheck className="size-5" />} label="الملفات المنشورة والظاهرة" value={s.publishedProfiles} to="/" />
        <Tile icon={<ClipboardCheck className="size-5" />} label="طلبات نشر وتعديل معلّقة" value={s.pendingReviews} to="/admin/reviews" accent={s.pendingReviews > 0} />
        <Tile icon={<FileText className="size-5" />} label="ملفات غير مكتملة أو غير منشأة" value={s.incompleteProfiles} to="/admin/members?ps=incomplete" />
        <Tile icon={<EyeOff className="size-5" />} label="ملفات مخفية أو موقوفة الظهور" value={s.hiddenProfiles} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="توزيع الأعضاء الظاهرين حسب المجال" description="يُحسب العضو في كل مجال اختاره." />
          <div className="mt-4">
            <BarList data={s.byCategory} unit="عضو" caption="عدد الأعضاء الظاهرين في كل مجال" />
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle title="أكثر الاهتمامات التقنية انتشارًا" description="بين الملفات الظاهرة في الدليل." />
          <div className="mt-4">
            <BarList data={s.topInterests} unit="عضو" caption="أكثر الاهتمامات انتشارًا" />
          </div>
        </Card>
      </div>

      {s.pendingReviews > 0 && (
        <Link to="/admin/reviews" className="flex items-center justify-between rounded-[18px] border border-warn/30 bg-warn-bg p-4 font-extrabold text-warn">
          لديك {formatNumber(s.pendingReviews)} طلبات بانتظار المراجعة
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
      )}
    </div>
  )
}
