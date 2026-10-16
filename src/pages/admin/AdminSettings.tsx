import { api } from '../../data'
import type { DirectorySettings, EditApprovalPolicy } from '../../data/types'
import { Card, SectionTitle, Skeleton, Switch, cx } from '../../components/ui/primitives'
import { useToast } from '../../components/ui/Toast'
import { useAsync, useDocumentTitle } from '../../lib/hooks'
import { AuditList } from './AdminMemberEdit'

const POLICIES: { value: EditApprovalPolicy; title: string; description: string }[] = [
  { value: 'review_sensitive', title: 'مراجعة الحقول الحساسة (موصى به)', description: 'الصورة والمسمى والنبذة ورابط LinkedIn تُراجع قبل الظهور؛ الاهتمامات والتخصصات والمهارات تنعكس فورًا.' },
  { value: 'review_all', title: 'مراجعة جميع التعديلات', description: 'لا يتغير أي شيء في البطاقة المنشورة قبل اعتماد الإدارة.' },
  { value: 'auto', title: 'نشر التعديلات تلقائيًا', description: 'المراجعة عند النشر الأول فقط.' },
]

export function AdminSettings() {
  useDocumentTitle('إعدادات الدليل | إدارة مساحة الأعضاء')
  const { notify, notifyError } = useToast()
  const s = useAsync(() => api.adminGetSettings(), [])
  const update = async (patch: Partial<DirectorySettings>) => {
    try {
      s.setData(await api.adminUpdateSettings(patch))
      notify('success', 'تم حفظ الإعداد.')
    } catch (e) {
      notifyError(e)
    }
  }
  if (!s.data) return <Skeleton className="h-96 rounded-[18px]" />
  return (
    <div className="space-y-5">
      <Card className="space-y-5 p-5">
        <SectionTitle title="سياسة الظهور" />
        <Switch label="إظهار نوع العضوية في البطاقات والفلاتر" description="يظهر فقط للأعضاء الذين وافقوا على إظهاره." checked={s.data.showMembershipType} onChange={(v) => update({ showMembershipType: v })} />
        <Switch
          label="إخفاء الملف تلقائيًا عند انتهاء العضوية"
          description="الإعداد الافتراضي. عند الإيقاف يبقى ملف العضوية المنتهية ظاهرًا (الملغاة والموقوفة تُخفى دائمًا)."
          checked={s.data.hideOnMembershipInactive}
          onChange={(v) => update({ hideOnMembershipInactive: v })}
        />
        <Switch label="إظهار التخصصات غير المستخدمة في الفلاتر" description="افتراضيًا تظهر فقط التخصصات التي يوجد بها أعضاء منشورون." checked={s.data.showEmptySpecializations} onChange={(v) => update({ showEmptySpecializations: v })} />
      </Card>
      <Card className="p-5">
        <SectionTitle title="سياسة اعتماد التعديلات" description="تُطبَّق على تعديلات الأعضاء بعد نشر ملفاتهم." />
        <fieldset className="mt-4 space-y-2.5">
          <legend className="sr-only">سياسة اعتماد التعديلات</legend>
          {POLICIES.map((p) => (
            <label key={p.value} className={cx('flex cursor-pointer gap-3 rounded-xl border-[1.5px] p-3.5 transition', s.data!.editApprovalPolicy === p.value ? 'border-teal-strong bg-teal-light/50' : 'border-line hover:border-line-strong')}>
              <input type="radio" name="policy" className="mt-1 size-4 accent-[var(--teal-strong)]" checked={s.data!.editApprovalPolicy === p.value} onChange={() => update({ editApprovalPolicy: p.value })} />
              <span>
                <span className="block text-sm font-extrabold text-ink">{p.title}</span>
                <span className="text-[13px] text-muted">{p.description}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </Card>
      <Card className="p-5 text-sm text-muted">
        إصدار نص الموافقة الحالي: <code dir="ltr" className="font-bold text-ink">{s.data.consentVersion}</code> — عند تغيير سياسة النشر يُرفع الإصدار ويُطلب من الأعضاء إعادة التأكيد.
      </Card>
    </div>
  )
}

export function AdminAudit() {
  useDocumentTitle('سجل العمليات | إدارة مساحة الأعضاء')
  const a = useAsync(() => api.adminGetAudit(), [])
  if (!a.data) return <Skeleton className="h-96 rounded-[18px]" />
  return (
    <Card className="p-5">
      <SectionTitle title="سجل العمليات" description="كل عمليات الإنشاء والتعديل والموافقة والنشر والإخفاء — للتدقيق والامتثال." />
      <div className="mt-5">
        <AuditList items={a.data} />
      </div>
    </Card>
  )
}
