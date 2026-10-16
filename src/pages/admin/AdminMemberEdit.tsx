import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Ban, CircleCheck, Eye, EyeOff, FlaskConical, Lock, RotateCcw, Save } from 'lucide-react'
import { api } from '../../data'
import { ApiError, type SaveResult, type TaxonomyData } from '../../data/api'
import type { AdminMemberRow, AuditLog, DirectorySettings, MembershipStatus, PublishStatus } from '../../data/types'
import { PendingDiff } from '../../components/admin/PendingDiff'
import { MemberCard } from '../../components/directory/MemberCard'
import { ConsentPanel, PublishStatusBadge } from '../../components/profile/ConsentPanel'
import { ProfileForm, fromFormValue, previewCard, toFormValue, type ProfileFormValue } from '../../components/profile/ProfileForm'
import { Modal } from '../../components/ui/misc'
import { Badge, Button, Card, Field, Select, Skeleton, Textarea } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/Toast'
import { useDocumentTitle } from '../../lib/hooks'
import { formatDate } from '../../lib/text'
import type { FieldErrors } from '../../lib/validation'
import { isMock } from '../../data'
import { MEMBERSHIP_STATUS_LABEL } from './AdminMembers'

const mask = (s: string, keep = 3) => (s.length <= keep ? s : `${s.slice(0, keep)}${'•'.repeat(Math.max(3, s.length - keep - 4))}${s.slice(-4)}`)

export function AuditList({ items }: { items: AuditLog[] }) {
  if (!items.length) return <p className="text-sm text-muted">لا توجد عمليات مسجلة بعد.</p>
  return (
    <ol className="space-y-3 border-s-2 border-line ps-4">
      {items.map((a) => (
        <li key={a.id} className="relative">
          <span className="absolute -start-[23px] top-1.5 size-3 rounded-full border-2 border-surface bg-teal-strong" aria-hidden />
          <p className="text-[13px] font-bold text-ink">{a.details}</p>
          <p className="text-xs text-muted">
            {a.actor.label} • {formatDate(a.at)} • <code dir="ltr">{a.action}</code>
          </p>
        </li>
      ))}
    </ol>
  )
}

export default function AdminMemberEdit() {
  const id = Number(useParams().id)
  useDocumentTitle('إدارة الملف المهني | إدارة مساحة الأعضاء')
  const { notify, notifyError } = useToast()
  const [row, setRow] = useState<AdminMemberRow>()
  const [tax, setTax] = useState<TaxonomyData>()
  const [settings, setSettings] = useState<DirectorySettings>()
  const [audit, setAudit] = useState<AuditLog[]>([])
  const [form, setForm] = useState<ProfileFormValue>()
  const [baseline, setBaseline] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [notFound, setNotFound] = useState(false)

  const apply = (r: AdminMemberRow, t: TaxonomyData) => {
    setRow(r)
    const fv = toFormValue(r.profile, t)
    setForm(fv)
    setBaseline(JSON.stringify(fv))
  }
  const refreshAudit = () => api.adminGetAudit(id).then(setAudit)

  useEffect(() => {
    Promise.all([api.adminGetMember(id), api.getTaxonomy(), api.adminGetSettings(), api.adminGetAudit(id)])
      .then(([r, t, s, a]) => {
        setTax(t)
        setSettings(s)
        setAudit(a)
        apply(r, t)
      })
      .catch((e) => (e instanceof ApiError && e.code === 'NOT_FOUND' ? setNotFound(true) : notifyError(e)))
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (key: string, fn: () => Promise<SaveResult<AdminMemberRow>>) => {
    setBusy(key)
    try {
      const r = await fn()
      apply(r.data, tax!)
      setErrors({})
      if (r.notice) notify('success', r.notice)
      refreshAudit()
      return true
    } catch (e) {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors as FieldErrors)
      notifyError(e)
      return false
    } finally {
      setBusy(null)
    }
  }

  const dirty = form !== undefined && JSON.stringify(form) !== baseline
  const card = useMemo(() => {
    if (!row || !form || !tax) return null
    const consent = row.profile?.consent.status === 'granted' ? row.profile.consent.fields : { photo: true, linkedin: true, city: true, membershipType: true }
    return previewCard(form, { name: row.member.fullNameAr, slug: row.profile?.slug ?? 'preview', tax, consent, membershipType: settings?.showMembershipType ? row.membershipTypeName : null })
  }, [row, form, tax, settings])

  if (notFound) return <p className="text-muted">العضو غير موجود.</p>
  if (!row || !tax || !form || !card || !settings)
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-[18px]" />
        <Skeleton className="h-96 rounded-[18px]" />
      </div>
    )

  const p = row.profile
  const m = row.member
  const ms = MEMBERSHIP_STATUS_LABEL[m.membershipStatus]
  const save = () =>
    run('save', async () => {
      const skills = await api.resolveSkills(form.skillNames)
      return api.adminSaveProfile(id, fromFormValue(form, skills.map((s) => s.id)))
    })
  const setStatus = (status: PublishStatus) =>
    run(status, async () => {
      if (dirty) await save()
      return api.adminSetPublishStatus(id, status)
    })

  return (
    <div className="space-y-5">
      <Link to="/admin/members" className="inline-flex items-center gap-1.5 text-sm font-extrabold text-muted hover:text-teal-strong">
        <ArrowRight className="size-4" aria-hidden /> قائمة الأعضاء
      </Link>

      <Card className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <h2 className="text-xl font-black text-ink">{m.fullNameAr}</h2>
          <p className="text-sm text-muted" dir="ltr">{m.fullNameEn} • {m.membershipNo}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>{row.membershipTypeName}</Badge>
            <Badge tone={ms.tone}>عضوية {ms.label}</Badge>
            <PublishStatusBadge status={p?.publishStatus ?? 'none'} />
            {row.isPubliclyVisible ? <Badge tone="ok" icon={<Eye className="size-3.5" aria-hidden />}>ظاهر في الدليل</Badge> : <Badge icon={<EyeOff className="size-3.5" aria-hidden />}>غير ظاهر</Badge>}
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-line-strong bg-bg-soft px-4 py-3 text-xs text-muted">
          <p className="mb-1 flex items-center gap-1 font-extrabold text-ink-2"><Lock className="size-3.5" aria-hidden /> بيانات داخلية — لا تظهر للعامة</p>
          <p dir="ltr" className="text-end">{mask(m.email)}</p>
          <p dir="ltr" className="text-end">{mask(m.phone)}</p>
          <p>تنتهي العضوية: {formatDate(m.expiresAt).split('،')[0]}</p>
        </div>
      </Card>

      {!row.isPubliclyVisible && (
        <Card className="p-4">
          <p className="mb-1.5 text-sm font-extrabold text-ink">أسباب عدم الظهور في الدليل:</p>
          <ul className="list-disc space-y-0.5 ps-5 text-sm text-muted">
            {row.blockers.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </Card>
      )}

      {p?.pendingChanges && (
        <Card className="border-warn/30 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-extrabold text-ink">تعديلات بانتظار الاعتماد</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="teal" loading={busy === 'approve'} onClick={() => run('approve', () => api.adminApprove(id))} icon={<CircleCheck className="size-4" aria-hidden />}>اعتماد التعديلات</Button>
              <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)}>رفض</Button>
            </div>
          </div>
          <PendingDiff profile={p} tax={tax} />
        </Card>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_330px]">
        <ProfileForm
          value={form}
          onChange={setForm}
          tax={tax}
          errors={errors}
          memberName={m.fullNameAr}
          onUploadPhoto={async (file) => {
            setBusy('photo')
            try {
              const url = await api.uploadPhoto(file)
              setForm((f) => (f ? { ...f, profileImageUrl: url } : f))
            } catch (e) {
              notifyError(e)
            } finally {
              setBusy(null)
            }
          }}
          uploading={busy === 'photo'}
          consentSlot={
            <ConsentPanel
              consent={p?.consent}
              version={settings.consentVersion}
              mode="admin"
              busy={busy === 'consent'}
              onRecord={async (fields, ref) => {
                await run('consent', () => api.adminRecordConsent(id, fields, ref))
              }}
            />
          }
        />

        <aside className="space-y-4 xl:sticky xl:top-24" aria-label="المعاينة والنشر">
          <div className="max-w-[340px]">
            <MemberCard member={card} preview />
          </div>
          <Card className="space-y-2.5 p-4">
            <Button className="w-full" onClick={save} loading={busy === 'save'} disabled={!dirty} icon={<Save className="size-4" aria-hidden />}>
              حفظ الملف
            </Button>
            <p className="pt-1 text-xs font-bold text-muted">إدارة الظهور والنشر</p>
            {p?.publishStatus !== 'published' && (
              <Button variant="teal" className="w-full" loading={busy === 'published'} onClick={() => setStatus('published')} icon={<CircleCheck className="size-4" aria-hidden />}>
                اعتماد ونشر
              </Button>
            )}
            {p && p.publishStatus !== 'hidden' && (
              <Button variant="outline" className="w-full" loading={busy === 'hidden'} onClick={() => setStatus('hidden')} icon={<EyeOff className="size-4" aria-hidden />}>
                إخفاء من الدليل
              </Button>
            )}
            {p && p.publishStatus !== 'rejected' && (
              <Button variant="outline" className="w-full !text-danger" onClick={() => setRejectOpen(true)} icon={<Ban className="size-4" aria-hidden />}>
                رفض مع ذكر السبب
              </Button>
            )}
            {p && p.publishStatus !== 'incomplete' && (
              <Button variant="ghost" className="w-full" loading={busy === 'incomplete'} onClick={() => setStatus('incomplete')} icon={<RotateCcw className="size-4" aria-hidden />}>
                إرجاع إلى «غير مكتمل»
              </Button>
            )}
            {(p?.consent.status ?? 'none') !== 'granted' && (
              <p className="rounded-lg bg-warn-bg p-2.5 text-xs font-bold text-warn">لا يمكن النشر قبل وجود موافقة صريحة من العضو أو موافقة موثقة.</p>
            )}
          </Card>

          {isMock && (
            <Card className="space-y-2 border-dashed p-4">
              <p className="flex items-center gap-1.5 text-xs font-extrabold text-warn"><FlaskConical className="size-4" aria-hidden />محاكاة حدث من نظام العضويات</p>
              <p className="text-xs text-muted">في الإنتاج تأتي حالة العضوية من النظام الحالي مباشرة؛ هذا لاختبار إخفاء الملف عند الانتهاء وإعادته عند التجديد.</p>
              <Select
                value={m.membershipStatus}
                onChange={async (e) => {
                  await api.simulateMembershipEvent?.(id, e.target.value as MembershipStatus)
                  apply(await api.adminGetMember(id), tax)
                  refreshAudit()
                  notify('info', 'تم تحديث حالة العضوية وإعادة تقييم الظهور.')
                }}
              >
                {Object.entries(MEMBERSHIP_STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </Select>
            </Card>
          )}

          <Card className="p-4">
            <p className="mb-3 text-sm font-extrabold text-ink">سجل العمليات على هذا الملف</p>
            <AuditList items={audit.slice(0, 8)} />
          </Card>
        </aside>
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={p?.pendingChanges && p.publishStatus !== 'pending_review' ? 'رفض التعديلات المعلّقة' : 'رفض الملف'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>إلغاء</Button>
            <Button
              variant="danger"
              disabled={!reason.trim()}
              loading={busy === 'reject'}
              onClick={async () => {
                const ok = await run('reject', () => (p?.pendingChanges || p?.publishStatus === 'pending_review' ? api.adminReject(id, reason) : api.adminSetPublishStatus(id, 'rejected', reason)))
                if (ok) {
                  setRejectOpen(false)
                  setReason('')
                }
              }}
            >
              تأكيد الرفض
            </Button>
          </>
        }
      >
        <Field label="سبب الرفض (يصل إلى العضو)" required>
          {(a) => <Textarea {...a} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: يرجى توضيح مجال الخبرة في النبذة المختصرة." />}
        </Field>
      </Modal>
    </div>
  )
}
