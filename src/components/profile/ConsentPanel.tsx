import { useEffect, useState } from 'react'
import { Ban, CircleCheck, Clock, EyeOff, FileText, Lock, ShieldCheck, TriangleAlert } from 'lucide-react'
import type { Consent, ConsentFields, PublishStatus } from '../../data/types'
import { formatDate } from '../../lib/text'
import { Badge, Button, Card, Field, Input, Switch } from '../ui/primitives'

export const PUBLISH_STATUS: Record<PublishStatus | 'none', { label: string; tone: 'neutral' | 'ok' | 'warn' | 'danger' | 'info'; icon: typeof Clock }> = {
  none: { label: 'لا يوجد ملف', tone: 'neutral', icon: FileText },
  incomplete: { label: 'ملف غير مكتمل', tone: 'neutral', icon: FileText },
  pending_review: { label: 'بانتظار مراجعة الإدارة', tone: 'warn', icon: Clock },
  published: { label: 'منشور', tone: 'ok', icon: CircleCheck },
  hidden: { label: 'مخفي', tone: 'info', icon: EyeOff },
  rejected: { label: 'مرفوض', tone: 'danger', icon: Ban },
}

export function PublishStatusBadge({ status }: { status: PublishStatus | 'none' }) {
  const s = PUBLISH_STATUS[status]
  const I = s.icon
  return (
    <Badge tone={s.tone} icon={<I className="size-3.5" aria-hidden />}>
      {s.label}
    </Badge>
  )
}

export function ConsentBadge({ consent }: { consent: Consent | null | undefined }) {
  const st = consent?.status ?? 'none'
  if (st === 'granted')
    return (
      <Badge tone="ok" icon={<ShieldCheck className="size-3.5" aria-hidden />}>
        {consent?.source === 'admin_recorded' ? 'موافقة موثقة' : 'موافقة صريحة'}
      </Badge>
    )
  if (st === 'withdrawn') return <Badge tone="danger" icon={<Ban className="size-3.5" aria-hidden />}>سُحبت الموافقة</Badge>
  return <Badge tone="warn" icon={<TriangleAlert className="size-3.5" aria-hidden />}>لا توجد موافقة</Badge>
}

const OPTIONAL: { key: keyof ConsentFields; label: string; description: string }[] = [
  { key: 'photo', label: 'إظهار صورتي الشخصية', description: 'عند الإيقاف تظهر صورة رمزية بالأحرف الأولى.' },
  { key: 'linkedin', label: 'إظهار رابط LinkedIn', description: 'يمكّن الزوار من التواصل المهني معك.' },
  { key: 'city', label: 'إظهار مدينتي', description: 'المدينة العامة فقط، وتُستخدم في فلتر المدينة.' },
  { key: 'membershipType', label: 'إظهار نوع عضويتي', description: 'مثل: عضو محترف أو عضو طالب.' },
]

interface Props {
  consent: Consent | null | undefined
  version: string
  mode: 'member' | 'admin'
  busy?: boolean
  onSave?: (granted: boolean, fields: ConsentFields) => Promise<void>
  onRecord?: (fields: ConsentFields, evidenceRef: string) => Promise<void>
}

export function ConsentPanel({ consent, version, mode, busy, onSave, onRecord }: Props) {
  const initial: ConsentFields = consent?.status === 'granted' ? consent.fields : { photo: true, linkedin: true, city: true, membershipType: true }
  const [fields, setFields] = useState<ConsentFields>(initial)
  const [agree, setAgree] = useState(false)
  const [evidence, setEvidence] = useState('')
  useEffect(() => {
    if (consent?.status === 'granted') setFields(consent.fields)
  }, [consent])

  const granted = consent?.status === 'granted'
  const outdated = granted && consent?.version !== version
  const fieldsChanged = granted && JSON.stringify(fields) !== JSON.stringify(consent?.fields)

  return (
    <Card as="section" className="p-5 sm:p-6" >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-light text-teal-strong">
            <Lock className="size-[18px]" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-ink">موافقات مشاركة البيانات</h2>
            <p className="mt-0.5 text-[13px] text-muted">وفق نظام حماية البيانات الشخصية — لن يظهر أي شيء في الدليل دون موافقتك الصريحة.</p>
          </div>
        </div>
        <ConsentBadge consent={consent} />
      </div>

      {granted && (
        <p className="mb-4 rounded-xl bg-ok-bg px-3.5 py-2.5 text-[13px] font-semibold text-ok">
          آخر موافقة: {formatDate(consent!.timestamp)} — إصدار السياسة {consent!.version}
          {consent!.source === 'admin_recorded' && ` — سجّلتها الإدارة (المرجع: ${consent!.evidenceRef})`}
        </p>
      )}
      {outdated && (
        <p className="mb-4 rounded-xl bg-warn-bg px-3.5 py-2.5 text-[13px] font-bold text-warn">تم تحديث سياسة النشر. يرجى مراجعة الموافقة وتأكيدها من جديد.</p>
      )}

      <div className="rounded-2xl border border-line bg-bg-soft p-4 text-[13px] leading-6 text-ink-2">
        <p className="font-extrabold text-ink">يُنشر دائمًا عند الموافقة:</p>
        <p>الاسم، المسمى الوظيفي، النبذة، التخصصات، الاهتمامات، المهارات، مجالات التعاون.</p>
        <p className="mt-2 font-extrabold text-ink">لا يُنشر إطلاقًا:</p>
        <p>رقم الهوية، رقم الجوال، البريد الإلكتروني، تاريخ الميلاد، رقم العضوية.</p>
      </div>

      <div className="mt-5 space-y-4">
        <p className="text-sm font-extrabold text-ink">بيانات اختيارية:</p>
        {OPTIONAL.map((o) => (
          <Switch key={o.key} label={o.label} description={o.description} checked={fields[o.key]} onChange={(val) => setFields((f) => ({ ...f, [o.key]: val }))} disabled={busy} />
        ))}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        {mode === 'member' ? (
          <>
            {(!granted || outdated || fieldsChanged) && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] border-line p-3.5 text-sm has-[:checked]:border-teal-strong has-[:checked]:bg-teal-light/50">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--teal-strong)]" />
                <span className="text-ink-2">
                  <strong className="text-ink">أوافق صراحةً</strong> على نشر بيانات ملفي المهني الموضحة أعلاه في مساحة أعضاء الجمعية للعموم، وأعلم أن بإمكاني سحب هذه الموافقة أو إيقاف الظهور في أي وقت دون أن يؤثر ذلك على عضويتي.{' '}
                  <a href="https://aia.org.sa/site/privacy.php" target="_blank" rel="noopener noreferrer" className="font-bold text-teal-strong underline">
                    سياسة الخصوصية
                  </a>
                </span>
              </label>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {(!granted || outdated || fieldsChanged) && (
                <Button variant="teal" disabled={!agree} loading={busy} onClick={() => onSave?.(true, fields).then(() => setAgree(false))} icon={<ShieldCheck className="size-4" aria-hidden />}>
                  {granted ? 'تأكيد الموافقة المحدّثة' : 'حفظ الموافقة'}
                </Button>
              )}
              {granted && (
                <Button variant="outline" className="!text-danger" disabled={busy} onClick={() => confirm('سيتم إخفاء ملفك من الدليل فورًا. هل تريد سحب الموافقة؟') && onSave?.(false, fields)}>
                  سحب الموافقة
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] text-muted">
              لا يملك المشرف منح الموافقة نيابة عن العضو. استخدم هذا الخيار فقط لتوثيق موافقة صريحة حصلت عليها الجمعية خارج المنصة (نموذج موقّع، بريد رسمي)، مع ذكر المرجع.
            </p>
            <Field label="مرجع إثبات الموافقة" required hint="مثال: نموذج موافقة رقم 2026-114">
              {(a) => <Input {...a} value={evidence} onChange={(e) => setEvidence(e.target.value)} />}
            </Field>
            <Button variant="teal" loading={busy} disabled={evidence.trim().length < 4} onClick={() => onRecord?.(fields, evidence).then(() => setEvidence(''))} icon={<ShieldCheck className="size-4" aria-hidden />}>
              تسجيل موافقة موثقة
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
