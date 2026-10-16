import { Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Search, UserX } from 'lucide-react'
import { api } from '../../data'
import type { AdminMemberFilter } from '../../data/api'
import type { MembershipStatus, PublishStatus } from '../../data/types'
import { ConsentBadge, PublishStatusBadge } from '../../components/profile/ConsentPanel'
import { Avatar, EmptyState } from '../../components/ui/misc'
import { Badge, Card, Input, Select, Skeleton } from '../../components/ui/primitives'
import { useAsync, useDebounced, useDocumentTitle } from '../../lib/hooks'
import { formatDate, formatNumber } from '../../lib/text'
import { useEffect, useState } from 'react'

export const MEMBERSHIP_STATUS_LABEL: Record<MembershipStatus, { label: string; tone: 'ok' | 'warn' | 'danger' | 'neutral' }> = {
  active: { label: 'فعّالة', tone: 'ok' },
  pending: { label: 'بانتظار الاعتماد', tone: 'warn' },
  expired: { label: 'منتهية', tone: 'danger' },
  cancelled: { label: 'ملغاة', tone: 'neutral' },
  suspended: { label: 'موقوفة', tone: 'danger' },
}

export default function AdminMembers() {
  useDocumentTitle('قائمة الأعضاء | إدارة مساحة الأعضاء')
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const dq = useDebounced(q, 250)
  const filter: AdminMemberFilter = {
    q: dq || undefined,
    membershipTypeId: params.get('type') ? Number(params.get('type')) : undefined,
    membershipStatus: (params.get('ms') as MembershipStatus) || undefined,
    publishStatus: (params.get('ps') as PublishStatus | 'none') || undefined,
    sort: (params.get('sort') as AdminMemberFilter['sort']) || 'name',
  }
  const setParam = (k: string, v: string) => {
    const sp = new URLSearchParams(params)
    if (v) sp.set(k, v)
    else sp.delete(k)
    setParams(sp, { replace: true })
  }
  useEffect(() => setParam('q', dq), [dq]) // eslint-disable-line react-hooks/exhaustive-deps

  const types = useAsync(() => api.adminListMembershipTypes(), [])
  const rows = useAsync(() => api.adminListMembers(filter), [JSON.stringify(filter)])

  return (
    <div className="space-y-4">
      <Card className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
        <label className="relative block sm:col-span-2 xl:col-span-1">
          <span className="sr-only">بحث</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="الاسم، رقم العضوية، البريد…" className="ps-9" />
        </label>
        <label>
          <span className="sr-only">نوع العضوية</span>
          <Select value={params.get('type') ?? ''} onChange={(e) => setParam('type', e.target.value)}>
            <option value="">كل أنواع العضوية</option>
            {types.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nameAr}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">حالة العضوية</span>
          <Select value={params.get('ms') ?? ''} onChange={(e) => setParam('ms', e.target.value)}>
            <option value="">كل حالات العضوية</option>
            {Object.entries(MEMBERSHIP_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
        </label>
        <label>
          <span className="sr-only">حالة الملف</span>
          <Select value={params.get('ps') ?? ''} onChange={(e) => setParam('ps', e.target.value)}>
            <option value="">كل حالات الملف</option>
            <option value="none">لا يوجد ملف</option>
            <option value="incomplete">غير مكتمل</option>
            <option value="pending_review">بانتظار المراجعة</option>
            <option value="published">منشور</option>
            <option value="hidden">مخفي</option>
            <option value="rejected">مرفوض</option>
          </Select>
        </label>
        <label>
          <span className="sr-only">الترتيب</span>
          <Select value={filter.sort} onChange={(e) => setParam('sort', e.target.value === 'name' ? '' : e.target.value)}>
            <option value="name">ترتيب: الاسم</option>
            <option value="updated">ترتيب: آخر تحديث</option>
            <option value="completeness">ترتيب: اكتمال الملف</option>
          </Select>
        </label>
      </Card>

      <p className="text-sm font-bold text-muted" aria-live="polite">
        {rows.data ? `${formatNumber(rows.data.length)} عضوية` : 'جارٍ التحميل…'}
      </p>

      {rows.loading && !rows.data ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : rows.data?.length === 0 ? (
        <EmptyState icon={<UserX className="size-7" />} title="لا توجد عضويات مطابقة" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <caption className="sr-only">قائمة عضويات الجمعية وحالة ملفاتها المهنية</caption>
              <thead className="bg-surface-2 text-[13px] text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-bold">العضو</th>
                  <th scope="col" className="px-3 py-3 text-start font-bold">العضوية</th>
                  <th scope="col" className="px-3 py-3 text-start font-bold">الملف المهني</th>
                  <th scope="col" className="px-3 py-3 text-start font-bold">الموافقة</th>
                  <th scope="col" className="px-3 py-3 text-start font-bold">الظهور</th>
                  <th scope="col" className="px-3 py-3 text-start font-bold">الاكتمال</th>
                  <th scope="col" className="px-3 py-3 text-start font-bold">آخر تحديث</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">إجراء</span></th>
                </tr>
              </thead>
              <tbody className={rows.loading ? 'opacity-60' : ''}>
                {rows.data?.map((r) => {
                  const ms = MEMBERSHIP_STATUS_LABEL[r.member.membershipStatus]
                  return (
                    <tr key={r.member.id} className="border-t border-line hover:bg-bg-soft">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.member.fullNameAr} src={r.profile?.profileImageUrl ?? null} size={38} className="!ring-2" />
                          <div>
                            <p className="font-extrabold text-ink">{r.member.fullNameAr}</p>
                            <p className="text-xs text-muted" dir="ltr">{r.member.membershipNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-[13px] font-semibold text-ink-2">{r.membershipTypeName}</p>
                        <Badge tone={ms.tone} className="mt-1">{ms.label}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <PublishStatusBadge status={r.profile?.publishStatus ?? 'none'} />
                        {r.profile?.pendingChanges && <p className="mt-1 text-xs font-bold text-warn">+ تعديلات معلّقة</p>}
                      </td>
                      <td className="px-3 py-3">{r.profile ? <ConsentBadge consent={r.profile.consent} /> : <span className="text-muted">—</span>}</td>
                      <td className="px-3 py-3">
                        {r.isPubliclyVisible ? (
                          <span className="inline-flex items-center gap-1 text-[13px] font-bold text-ok"><Eye className="size-4" aria-hidden />ظاهر</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[13px] font-bold text-muted" title={r.blockers.join(' • ')}>
                            <EyeOff className="size-4" aria-hidden />غير ظاهر
                            <span className="sr-only">: {r.blockers.join('، ')}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                            <span className="block h-full rounded-full bg-teal-strong" style={{ width: `${r.completeness}%` }} />
                          </span>
                          <span className="text-xs font-bold tabular-nums text-ink-2">{r.completeness}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted">{r.profile ? formatDate(r.profile.updatedAt) : '—'}</td>
                      <td className="px-4 py-3 text-end">
                        <Link to={`/admin/members/${r.member.id}`} className="inline-flex min-h-9 items-center rounded-[10px] border-[1.5px] border-line px-3 text-[13px] font-extrabold text-ink whitespace-nowrap hover:border-teal-strong hover:text-teal-strong">
                          {r.profile ? 'إدارة الملف' : 'إنشاء ملف'}
                          <span className="sr-only"> — {r.member.fullNameAr}</span>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
