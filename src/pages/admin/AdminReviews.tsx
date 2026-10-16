import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, Inbox, X } from 'lucide-react'
import { api } from '../../data'
import { PendingDiff } from '../../components/admin/PendingDiff'
import { MemberCard } from '../../components/directory/MemberCard'
import { ConsentBadge, PublishStatusBadge } from '../../components/profile/ConsentPanel'
import { EmptyState, Modal } from '../../components/ui/misc'
import { Badge, Button, Card, Field, Skeleton, Textarea } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/Toast'
import { useAsync, useDocumentTitle } from '../../lib/hooks'
import { formatDate } from '../../lib/text'
import { toFormValue, previewCard } from '../../components/profile/ProfileForm'

export default function AdminReviews() {
  useDocumentTitle('طلبات المراجعة | إدارة مساحة الأعضاء')
  const { notify, notifyError } = useToast()
  const queue = useAsync(() => api.adminListReviewQueue(), [])
  const tax = useAsync(() => api.getTaxonomy(), [])
  const [busy, setBusy] = useState<number | null>(null)
  const [rejecting, setRejecting] = useState<number | null>(null)
  const [reason, setReason] = useState('')

  const act = async (memberId: number, fn: () => Promise<{ notice?: string }>) => {
    setBusy(memberId)
    try {
      const r = await fn()
      notify('success', r.notice ?? 'تم.')
      queue.reload()
      return true
    } catch (e) {
      notifyError(e)
      return false
    } finally {
      setBusy(null)
    }
  }

  if (queue.loading && !queue.data) return <Skeleton className="h-72 rounded-[18px]" />
  if (!queue.data?.length || !tax.data)
    return <EmptyState icon={<Inbox className="size-7" />} title="لا توجد طلبات معلّقة" description="ستظهر هنا طلبات النشر الجديدة والتعديلات الحساسة على الملفات المنشورة." />

  return (
    <div className="space-y-4">
      {queue.data.map((r) => {
        const p = r.profile!
        const isNew = p.publishStatus === 'pending_review'
        const card = previewCard(toFormValue(p, tax.data!), {
          name: r.member.fullNameAr,
          slug: p.slug,
          tax: tax.data!,
          consent: p.consent.fields,
          membershipType: r.membershipTypeName,
        })
        return (
          <Card key={r.member.id} as="article" className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-ink">{r.member.fullNameAr}</h2>
                  <Badge tone={isNew ? 'info' : 'warn'}>{isNew ? 'طلب نشر جديد' : 'تعديلات على ملف منشور'}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {r.membershipTypeName} • آخر تحديث {formatDate(p.updatedAt)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <PublishStatusBadge status={p.publishStatus} />
                  <ConsentBadge consent={p.consent} />
                  {r.member.membershipStatus !== 'active' && <Badge tone="danger">العضوية غير فعّالة</Badge>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="teal" size="sm" loading={busy === r.member.id} onClick={() => act(r.member.id, () => api.adminApprove(r.member.id))} icon={<CircleCheck className="size-4" aria-hidden />}>
                  {isNew ? 'اعتماد ونشر' : 'اعتماد التعديلات'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setRejecting(r.member.id)} icon={<X className="size-4" aria-hidden />}>
                  رفض
                </Button>
                <Link to={`/admin/members/${r.member.id}`} className="inline-flex min-h-9 items-center rounded-[10px] px-3 text-[13px] font-extrabold text-teal-strong hover:underline">
                  فتح الملف كاملًا
                </Link>
              </div>
            </div>
            <div className="mt-4">{isNew ? <div className="max-w-[340px]"><MemberCard member={card} preview /></div> : <PendingDiff profile={p} tax={tax.data!} />}</div>
          </Card>
        )
      })}

      <Modal
        open={rejecting !== null}
        onClose={() => setRejecting(null)}
        title="سبب الرفض"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejecting(null)}>إلغاء</Button>
            <Button
              variant="danger"
              disabled={!reason.trim()}
              loading={busy === rejecting}
              onClick={async () => {
                if (rejecting === null) return
                if (await act(rejecting, () => api.adminReject(rejecting, reason))) {
                  setRejecting(null)
                  setReason('')
                }
              }}
            >
              تأكيد الرفض
            </Button>
          </>
        }
      >
        <Field label="ملاحظات للعضو" required>
          {(a) => <Textarea {...a} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />}
        </Field>
      </Modal>
    </div>
  )
}
