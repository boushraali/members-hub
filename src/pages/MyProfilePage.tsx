import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, CircleAlert, Eye, Info, LogOut, Save, Send } from 'lucide-react'
import { api } from '../data'
import { ApiError, type MyProfileView, type TaxonomyData } from '../data/api'
import type { ConsentFields } from '../data/types'
import { PageShell } from '../components/layout/Layout'
import { MemberCard } from '../components/directory/MemberCard'
import { ConsentPanel, PublishStatusBadge } from '../components/profile/ConsentPanel'
import { ProfileForm, fromFormValue, previewCard, toFormValue, type ProfileFormValue } from '../components/profile/ProfileForm'
import { EmptyState } from '../components/ui/misc'
import { Badge, Button, Card, Skeleton, Switch } from '../components/ui/primitives'
import { useToast } from '../components/ui/Toast'
import { useDocumentTitle, useSession } from '../lib/hooks'
import { formatDate } from '../lib/text'
import { profileCompleteness, validateForSubmission, type FieldErrors } from '../lib/validation'
import { FIELD_LABELS } from '../lib/labels'

const MEMBERSHIP_STATUS: Record<string, string> = {
  active: 'فعّالة',
  expired: 'منتهية',
  pending: 'بانتظار الاعتماد',
  cancelled: 'ملغاة',
  suspended: 'موقوفة',
}

export default function MyProfilePage() {
  useDocumentTitle('ملفي المهني | My Professional Profile')
  const session = useSession()
  const { notify, notifyError } = useToast()
  const [view, setView] = useState<MyProfileView>()
  const [tax, setTax] = useState<TaxonomyData>()
  const [form, setForm] = useState<ProfileFormValue>()
  const [baseline, setBaseline] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState<'save' | 'submit' | 'consent' | 'visibility' | 'photo' | null>(null)
  const [loadError, setLoadError] = useState<unknown>(null)

  const applyView = (v: MyProfileView, t: TaxonomyData) => {
    setView(v)
    // نعرض للعضو آخر نسخة أدخلها (بما فيها التعديلات المعلّقة)
    const merged = v.profile ? { ...v.profile, ...(v.profile.pendingChanges ?? {}) } : null
    const fv = toFormValue(merged, t)
    setForm(fv)
    setBaseline(JSON.stringify(fv))
  }

  useEffect(() => {
    if (session.role !== 'member') return
    setView(undefined)
    setLoadError(null)
    Promise.all([api.getMyProfile(), api.getTaxonomy()])
      .then(([v, t]) => {
        setTax(t)
        applyView(v, t)
      })
      .catch(setLoadError)
  }, [session.role, session.memberId])

  const dirty = form !== undefined && JSON.stringify(form) !== baseline
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const card = useMemo(() => {
    if (!form || !tax || !view) return null
    const consent = view.profile?.consent.status === 'granted' ? view.profile.consent.fields : { photo: true, linkedin: true, city: true, membershipType: true }
    return previewCard(form, { name: view.member.fullNameAr, slug: view.profile?.slug ?? 'preview', tax, consent, membershipType: view.member.membershipTypeName })
  }, [form, tax, view])

  if (session.role !== 'member') {
    return (
      <PageShell>
        <div className="mx-auto mt-12 max-w-[640px] px-4">
          <EmptyState icon={<LogOut className="size-7" />} title="سجّل الدخول إلى حساب العضوية" description="صفحة «ملفي المهني» متاحة لأعضاء الجمعية داخل حساباتهم. (في المعاينة: اختر شخصية عضو من الشريط العلوي.)" />
        </div>
      </PageShell>
    )
  }

  const handle = async (kind: NonNullable<typeof busy>, fn: () => Promise<{ data: MyProfileView; notice?: string }>) => {
    setBusy(kind)
    try {
      const r = await fn()
      applyView(r.data, tax!)
      setErrors({})
      if (r.notice) notify('success', r.notice)
    } catch (e) {
      if (e instanceof ApiError && e.fieldErrors) setErrors(e.fieldErrors as FieldErrors)
      notifyError(e)
    } finally {
      setBusy(null)
    }
  }

  const save = () =>
    handle('save', async () => {
      const skills = await api.resolveSkills(form!.skillNames)
      return api.saveMyProfile(fromFormValue(form!, skills.map((s) => s.id)))
    })

  const submit = () => {
    const local = validateForSubmission(fromFormValue(form!, form!.skillNames))
    if (Object.keys(local).length) {
      setErrors(local)
      notify('error', 'أكمل الحقول المطلوبة قبل طلب النشر.')
      return
    }
    return handle('submit', async () => {
      if (dirty) {
        const skills = await api.resolveSkills(form!.skillNames)
        await api.saveMyProfile(fromFormValue(form!, skills.map((s) => s.id)))
      }
      return api.submitMyProfile()
    })
  }

  const uploadPhoto = async (file: File) => {
    setBusy('photo')
    try {
      const url = await api.uploadPhoto(file)
      setForm((f) => (f ? { ...f, profileImageUrl: url } : f))
      notify('info', 'تم تجهيز الصورة. احفظ التعديلات لتطبيقها.')
    } catch (e) {
      notifyError(e)
    } finally {
      setBusy(null)
    }
  }

  if (loadError)
    return (
      <PageShell>
        <div className="mx-auto mt-12 max-w-[640px] px-4">
          <EmptyState icon={<CircleAlert className="size-7" />} title="تعذّر تحميل ملفك" description={loadError instanceof ApiError ? loadError.message : 'حاول مرة أخرى.'} />
        </div>
      </PageShell>
    )

  if (!view || !tax || !form || !card)
    return (
      <PageShell>
        <div className="mx-auto grid max-w-[1240px] gap-5 px-4 pt-8 sm:px-6 lg:grid-cols-[1fr_360px]" aria-busy>
          <div className="space-y-5">
            <Skeleton className="h-28 rounded-[18px]" />
            <Skeleton className="h-96 rounded-[18px]" />
          </div>
          <Skeleton className="h-[520px] rounded-[18px]" />
        </div>
      </PageShell>
    )

  const p = view.profile
  const status = p?.publishStatus ?? 'none'
  const pendingFields = Object.keys(p?.pendingChanges ?? {})
  const canSubmit = view.eligible && (!p || ['incomplete', 'rejected', 'hidden'].includes(p.publishStatus))
  const completeness = profileCompleteness(fromFormValue(form, form.skillNames))
  const policyText = {
    review_sensitive: 'بعد النشر: تعديلات الاهتمامات والتخصصات والمهارات والمدينة تنعكس فورًا، أما الصورة والمسمى والنبذة ورابط LinkedIn فتُراجع قبل ظهورها.',
    review_all: 'بعد النشر: تُراجع جميع التعديلات قبل ظهورها، وتبقى النسخة المعتمدة ظاهرة حتى ذلك الحين.',
    auto: 'بعد النشر: تنعكس تعديلاتك على بطاقتك مباشرة.',
  }[view.editApprovalPolicy]

  return (
    <PageShell>
      <div className="mx-auto max-w-[1240px] px-4 pt-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-[13px] font-extrabold text-teal-strong">My Professional Profile</span>
            <h1 className="text-2xl font-black text-ink md:text-3xl">ملفي المهني</h1>
            <p className="mt-1 text-sm text-muted">ملفك المهني امتداد لعضويتك الحالية، وتتحكم بالكامل فيما يظهر للآخرين.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PublishStatusBadge status={status} />
            {view.isPubliclyVisible ? <Badge tone="ok" icon={<Eye className="size-3.5" aria-hidden />}>ظاهر في الدليل</Badge> : <Badge>غير ظاهر في الدليل</Badge>}
          </div>
        </div>

        <Card className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 p-4 text-sm">
          <span className="flex items-center gap-2 font-extrabold text-ink">
            <BadgeCheck className="size-5 text-teal-strong" aria-hidden />
            {view.member.fullNameAr}
          </span>
          <span className="text-muted">
            نوع العضوية: <strong className="text-ink">{view.member.membershipTypeName}</strong>
          </span>
          <span className="text-muted">
            حالة العضوية: <strong className={view.eligible ? 'text-ok' : 'text-danger'}>{MEMBERSHIP_STATUS[view.member.membershipStatus]}</strong>
          </span>
          <span className="text-muted">
            تنتهي في: <strong className="text-ink">{formatDate(view.member.expiresAt).split('،')[0]}</strong>
          </span>
          <span className="ms-auto flex items-center gap-2 text-muted">
            اكتمال الملف
            <span className="h-2 w-28 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100} aria-label="نسبة اكتمال الملف">
              <span className="block h-full rounded-full bg-teal-strong transition-all" style={{ width: `${completeness}%` }} />
            </span>
            <strong className="tabular-nums text-ink">{completeness}%</strong>
          </span>
        </Card>

        {!view.eligible && (
          <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-bg p-4 text-sm text-danger">
            <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="font-extrabold">ملفك غير ظاهر لأن عضويتك {MEMBERSHIP_STATUS[view.member.membershipStatus]}.</p>
              <p className="mt-0.5">بياناتك محفوظة، وسيُعاد تقييم ظهور ملفك تلقائيًا بعد التجديد.</p>
              <a href="https://aia.org.sa/members/renew.php" className="mt-2 inline-block font-extrabold underline">
                تجديد العضوية
              </a>
            </div>
          </div>
        )}
        {p?.rejectionReason && (
          <div role="alert" className="mt-4 rounded-2xl border border-danger/25 bg-danger-bg p-4 text-sm text-danger">
            <p className="font-extrabold">ملاحظات الإدارة:</p>
            <p className="mt-0.5">{p.rejectionReason}</p>
          </div>
        )}
        {pendingFields.length > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-warn/25 bg-warn-bg p-4 text-sm text-warn">
            <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p>
              <strong>بانتظار الاعتماد:</strong> {pendingFields.map((f) => FIELD_LABELS[f as keyof typeof FIELD_LABELS]).join('، ')}. النسخة المعتمدة السابقة تبقى ظاهرة في الدليل حتى المراجعة.
            </p>
          </div>
        )}
        {view.eligible && !view.isPubliclyVisible && view.blockers.length > 0 && p && (
          <details className="mt-4 rounded-2xl border border-line bg-bg-soft p-4 text-sm">
            <summary className="cursor-pointer font-extrabold text-ink">لماذا لا يظهر ملفي في الدليل؟</summary>
            <ul className="mt-2 list-disc space-y-1 ps-5 text-muted">
              {view.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </details>
        )}

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <ProfileForm
            value={form}
            onChange={setForm}
            tax={tax}
            errors={errors}
            memberName={view.member.fullNameAr}
            disabled={!view.eligible}
            onUploadPhoto={uploadPhoto}
            uploading={busy === 'photo'}
            pendingFields={pendingFields}
            consentSlot={
              <div id="consent">
                <ConsentPanel
                  consent={p?.consent}
                  version={view.consentVersion}
                  mode="member"
                  busy={busy === 'consent'}
                  onSave={(granted: boolean, fields: ConsentFields) => handle('consent', () => api.updateMyConsent(granted, fields))}
                />
                {errors.consent && <p role="alert" className="mt-2 text-sm font-bold text-danger">{errors.consent}</p>}
              </div>
            }
          />

          <aside className="space-y-4 lg:sticky lg:top-24" aria-label="المعاينة والإجراءات">
            <div>
              <p className="mb-2 text-sm font-extrabold text-ink">معاينة بطاقتك</p>
              <div className="max-w-[340px]">
                <MemberCard member={card} preview />
              </div>
            </div>
            <Card className="space-y-3 p-4">
              <Button className="w-full" onClick={save} loading={busy === 'save'} disabled={!dirty || !view.eligible} icon={<Save className="size-4" aria-hidden />}>
                حفظ التعديلات
              </Button>
              {canSubmit && (
                <Button variant="teal" className="w-full" onClick={submit} loading={busy === 'submit'} icon={<Send className="size-4" aria-hidden />}>
                  {p?.publishStatus === 'rejected' ? 'إعادة إرسال للمراجعة' : 'طلب نشر ملفي'}
                </Button>
              )}
              {status === 'pending_review' && <p className="rounded-xl bg-warn-bg p-3 text-[13px] font-semibold text-warn">ملفك قيد المراجعة. ستصلك رسالة عند اعتماده.</p>}
              {dirty && <p className="text-center text-xs font-bold text-warn">لديك تعديلات غير محفوظة</p>}
              <p className="text-xs leading-5 text-muted">{policyText}</p>
            </Card>
            {p && (
              <Card className="space-y-3 p-4">
                <Switch
                  label="إظهار ملفي في مساحة الأعضاء"
                  description="إخفاء الملف المهني لا يعني إلغاء العضوية — عضويتك ومزاياها مستمرة."
                  checked={p.visibilityEnabled}
                  disabled={busy === 'visibility'}
                  onChange={(enabled) => handle('visibility', () => api.setMyVisibility(enabled))}
                />
                {view.isPubliclyVisible && (
                  <Link to={`/${p.slug}`} className="inline-flex items-center gap-1.5 text-sm font-extrabold text-teal-strong hover:underline">
                    <Eye className="size-4" aria-hidden /> عرض ملفي العام
                  </Link>
                )}
              </Card>
            )}
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
