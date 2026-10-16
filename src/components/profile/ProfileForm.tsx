import { useId, useRef, useState, type ReactNode } from 'react'
import { Briefcase, Handshake, ImagePlus, Lightbulb, Link2, Plus, Trash2, Wrench, X } from 'lucide-react'
import type { TaxonomyData } from '../../data/api'
import type { ConsentFields, ProfileContent, PublicMemberCard } from '../../data/types'
import { SAUDI_CITIES } from '../../data/taxonomy'
import { LIMITS, normalizeLinkedinUrl, type FieldErrors } from '../../lib/validation'
import { Avatar, CategoryIcon } from '../ui/misc'
import { Card, ChoiceChip, Field, Input, Select, Textarea, cx } from '../ui/primitives'

/** قيمة النموذج: مثل ProfileContent لكن المهارات بأسمائها (تُحوَّل إلى معرّفات عند الحفظ) */
export type ProfileFormValue = Omit<ProfileContent, 'skillIds'> & { skillNames: string[] }

export function toFormValue(p: ProfileContent | null, tax: TaxonomyData): ProfileFormValue {
  const empty: ProfileFormValue = {
    professionalTitle: '', profileImageUrl: null, shortBio: '', fullBio: '', linkedinUrl: '', city: '',
    categoryIds: [], specializationIds: [], interestIds: [], skillNames: [], collaborationAreaIds: [],
  }
  if (!p) return empty
  const { skillIds, ...rest } = p
  return {
    ...empty,
    ...pickContent(rest as ProfileContent),
    skillNames: skillIds.map((id) => tax.skills.find((s) => s.id === id)?.name).filter((x): x is string => !!x),
  }
}

function pickContent(p: ProfileContent): Omit<ProfileContent, 'skillIds'> {
  return {
    professionalTitle: p.professionalTitle,
    profileImageUrl: p.profileImageUrl,
    shortBio: p.shortBio,
    fullBio: p.fullBio,
    linkedinUrl: p.linkedinUrl,
    city: p.city,
    categoryIds: p.categoryIds,
    specializationIds: p.specializationIds,
    interestIds: p.interestIds,
    collaborationAreaIds: p.collaborationAreaIds,
  }
}

/** بناء بطاقة المعاينة محليًا بنفس قواعد البطاقة العامة */
export function previewCard(v: ProfileFormValue, opts: { name: string; slug: string; tax: TaxonomyData; consent: ConsentFields; membershipType: string | null }): PublicMemberCard {
  const cat = opts.tax.categories.find((c) => c.id === v.categoryIds[0])
  const interests = v.interestIds
    .map((id) => opts.tax.interests.find((i) => i.id === id))
    .filter((x) => !!x)
    .map((i) => ({ id: i!.id, label: i!.nameAr, kind: 'interest' as const }))
  const skills = v.skillNames.slice(0, 2).map((s) => ({ id: s, label: s, kind: 'skill' as const }))
  return {
    slug: opts.slug,
    fullName: opts.name,
    professionalTitle: v.professionalTitle,
    photoUrl: opts.consent.photo ? v.profileImageUrl : null,
    primaryCategory: cat ? { id: cat.id, label: cat.nameAr } : null,
    shortBio: v.shortBio,
    tags: [...skills, ...interests].slice(0, 4),
    membershipType: opts.consent.membershipType ? opts.membershipType : null,
    linkedinUrl: opts.consent.linkedin && v.linkedinUrl ? v.linkedinUrl : null,
    city: opts.consent.city && v.city ? v.city : null,
  }
}

function FormSection({ icon, title, description, children, id }: { icon: ReactNode; title: string; description?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <Card as="section" className="p-5 sm:p-6">
      <div id={id} className="mb-5 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-light text-teal-strong">{icon}</span>
        <div>
          <h2 className="text-base font-extrabold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </Card>
  )
}

function Counter({ value, min, max }: { value: number; min?: number; max: number }) {
  const bad = value > max || (min !== undefined && value > 0 && value < min)
  return (
    <span dir="ltr" className={cx('text-xs font-bold tabular-nums', bad ? 'text-danger' : 'text-muted')} aria-live="polite">
      {value} / {min !== undefined ? `${min}–${max}` : max}
    </span>
  )
}

function SkillsInput({ value, onChange, suggestions, disabled }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[]; disabled?: boolean }) {
  const [draft, setDraft] = useState('')
  const listId = useId()
  const add = (raw: string) => {
    const name = raw.trim().replace(/[<>]/g, '').slice(0, LIMITS.skillNameMax)
    if (!name || value.length >= LIMITS.skillsMax) return
    if (!value.some((v) => v.toLowerCase() === name.toLowerCase())) onChange([...value, name])
    setDraft('')
  }
  return (
    <Field label="المهارات" hint={`أضف حتى ${LIMITS.skillsMax} مهارة (مثل: Python، Power BI، ISO 27001). اضغط Enter للإضافة.`} counter={<Counter value={value.length} max={LIMITS.skillsMax} />}>
      {(a) => (
        <div>
          <div className="flex gap-2">
            <Input
              {...a}
              list={listId}
              value={draft}
              disabled={disabled || value.length >= LIMITS.skillsMax}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',' || e.key === '،') {
                  e.preventDefault()
                  add(draft)
                }
              }}
              placeholder="اكتب مهارة…"
              dir="auto"
            />
            <button type="button" onClick={() => add(draft)} disabled={!draft.trim() || disabled} className="inline-flex min-h-11 items-center gap-1 rounded-xl border-[1.5px] border-line px-3 text-sm font-bold text-ink hover:border-teal-strong disabled:opacity-40">
              <Plus className="size-4" aria-hidden /> إضافة
            </button>
          </div>
          <datalist id={listId}>
            {suggestions.filter((s) => !value.includes(s)).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {value.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="المهارات المضافة">
              {value.map((s) => (
                <li key={s} className="inline-flex items-center gap-1 rounded-lg bg-surface-2 py-1 ps-2.5 pe-1 text-[13px] font-bold text-ink-2" dir="auto">
                  {s}
                  <button type="button" disabled={disabled} onClick={() => onChange(value.filter((x) => x !== s))} className="rounded p-0.5 text-muted hover:bg-line hover:text-danger" aria-label={`حذف ${s}`}>
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Field>
  )
}

interface Props {
  value: ProfileFormValue
  onChange: (v: ProfileFormValue) => void
  tax: TaxonomyData
  errors: FieldErrors
  memberName: string
  disabled?: boolean
  onUploadPhoto: (file: File) => Promise<void>
  uploading?: boolean
  /** الحقول التي تنتظر الاعتماد (تظهر بجانبها شارة) */
  pendingFields?: string[]
  consentSlot?: ReactNode
}

export function ProfileForm({ value: v, onChange, tax, errors, memberName, disabled, onUploadPhoto, uploading, pendingFields = [], consentSlot }: Props) {
  const set = <K extends keyof ProfileFormValue>(k: K, val: ProfileFormValue[K]) => onChange({ ...v, [k]: val })
  const fileRef = useRef<HTMLInputElement>(null)
  const [linkedinTouched, setLinkedinTouched] = useState(false)
  const pending = (f: string) =>
    pendingFields.includes(f) ? <span className="ms-2 rounded-full bg-warn-bg px-2 py-0.5 text-[11px] font-bold text-warn">بانتظار الاعتماد</span> : null

  const toggle = (list: string[], id: string, max?: number) => (list.includes(id) ? list.filter((x) => x !== id) : max && list.length >= max ? list : [...list, id])
  const toggleCategory = (id: string) => {
    const next = toggle(v.categoryIds, id, LIMITS.categoriesMax)
    // إزالة تخصص المجال من التخصصات الفرعية عند إلغاء المجال
    const specs = v.specializationIds.filter((s) => next.includes(tax.specializations.find((x) => x.id === s)?.categoryId ?? ''))
    onChange({ ...v, categoryIds: next, specializationIds: specs })
  }

  const linkedinError = errors.linkedinUrl ?? (linkedinTouched && v.linkedinUrl.trim() && !normalizeLinkedinUrl(v.linkedinUrl) ? 'الرابط يجب أن يكون بالشكل https://www.linkedin.com/in/username' : undefined)

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-5">
      <legend className="sr-only">بيانات الملف المهني</legend>

      <FormSection icon={<Briefcase className="size-[18px]" aria-hidden />} title="المعلومات المهنية" description="هذه المعلومات تظهر في بطاقتك وصفحة ملفك.">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar name={memberName} src={v.profileImageUrl} size={96} />
          <div>
            <p className="text-sm font-bold text-ink">
              الصورة الشخصية {pending('profileImageUrl')}
            </p>
            <p className="mt-0.5 text-xs text-muted">صورة واضحة واحترافية. JPG أو PNG أو WEBP، حتى 2 ميجابايت، وبأبعاد 200×200 على الأقل.</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (f) await onUploadPhoto(f)
                }}
              />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || disabled} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border-[1.5px] border-line px-3 text-[13px] font-extrabold text-ink hover:border-teal-strong disabled:opacity-50">
                <ImagePlus className="size-4" aria-hidden /> {uploading ? 'جارٍ الرفع…' : v.profileImageUrl ? 'تغيير الصورة' : 'رفع صورة'}
              </button>
              {v.profileImageUrl && (
                <button type="button" onClick={() => set('profileImageUrl', null)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-[13px] font-bold text-muted hover:text-danger">
                  <Trash2 className="size-4" aria-hidden /> إزالة
                </button>
              )}
            </div>
          </div>
        </div>

        <Field label="المسمى الوظيفي" required error={errors.professionalTitle} hint="مثال: أخصائي ذكاء اصطناعي، مهندس برمجيات، باحث في علم البيانات" counter={<span className="flex items-center">{pending('professionalTitle')}<Counter value={v.professionalTitle.length} max={LIMITS.titleMax} /></span>}>
          {(a) => <Input {...a} value={v.professionalTitle} maxLength={LIMITS.titleMax} onChange={(e) => set('professionalTitle', e.target.value)} />}
        </Field>

        <Field
          label="النبذة المختصرة"
          required
          error={errors.shortBio}
          hint="تظهر في البطاقة: خبرتك المهنية وأهم اهتماماتك في سطرين أو ثلاثة. نص فقط دون روابط أو أكواد."
          counter={<span className="flex items-center">{pending('shortBio')}<Counter value={v.shortBio.trim().length} min={LIMITS.shortBioMin} max={LIMITS.shortBioMax} /></span>}
        >
          {(a) => <Textarea {...a} rows={4} value={v.shortBio} maxLength={LIMITS.shortBioMax} onChange={(e) => set('shortBio', e.target.value)} />}
        </Field>

        <Field label="النبذة المهنية الموسعة" error={errors.fullBio} hint="تظهر في صفحة ملفك التفصيلية." counter={<span className="flex items-center">{pending('fullBio')}<Counter value={v.fullBio.length} max={LIMITS.fullBioMax} /></span>}>
          {(a) => <Textarea {...a} rows={6} value={v.fullBio} maxLength={LIMITS.fullBioMax} onChange={(e) => set('fullBio', e.target.value)} />}
        </Field>
      </FormSection>

      <FormSection
        id="specializations"
        icon={<CategoryIcon icon="layers" className="size-[18px]" />}
        title="التخصص المهني"
        description="مجال عملك وخبرتك الفعلية. اختر مجالًا رئيسيًا واحدًا على الأقل (حتى 3)، ثم تخصصاتك الفرعية."
      >
        <div>
          <p className="mb-2 text-sm font-bold text-ink">
            المجالات الرئيسية <span className="text-danger" aria-hidden>*</span>
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="المجالات الرئيسية">
            {tax.categories.map((c) => (
              <ChoiceChip key={c.id} selected={v.categoryIds.includes(c.id)} onToggle={() => toggleCategory(c.id)} disabled={v.categoryIds.length >= LIMITS.categoriesMax}>
                {c.nameAr}
              </ChoiceChip>
            ))}
          </div>
          {errors.categoryIds && <p role="alert" className="mt-1.5 text-xs font-bold text-danger">{errors.categoryIds}</p>}
        </div>
        {v.categoryIds.length > 0 && (
          <div className="space-y-4 rounded-2xl bg-bg-soft p-4">
            {v.categoryIds.map((cid) => {
              const cat = tax.categories.find((c) => c.id === cid)
              if (!cat) return null
              return (
                <div key={cid} role="group" aria-label={`تخصصات ${cat.nameAr}`}>
                  <p className="mb-2 flex items-center gap-1.5 text-[13px] font-extrabold text-teal-strong">
                    <CategoryIcon icon={cat.icon} className="size-4" />
                    {cat.nameAr}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tax.specializations
                      .filter((s) => s.categoryId === cid)
                      .map((s) => (
                        <ChoiceChip
                          key={s.id}
                          selected={v.specializationIds.includes(s.id)}
                          onToggle={() => set('specializationIds', toggle(v.specializationIds, s.id, LIMITS.specializationsMax))}
                          disabled={v.specializationIds.length >= LIMITS.specializationsMax}
                        >
                          {s.nameAr}
                        </ChoiceChip>
                      ))}
                  </div>
                </div>
              )
            })}
            {errors.specializationIds && <p role="alert" className="text-xs font-bold text-danger">{errors.specializationIds}</p>}
          </div>
        )}
      </FormSection>

      <FormSection
        icon={<Lightbulb className="size-[18px]" aria-hidden />}
        title="الاهتمامات التقنية"
        description="ما تحب متابعته أو المشاركة فيه — وقد يختلف عن تخصصك المهني. تُستخدم لاكتشاف الأعضاء ذوي الاهتمامات المشتركة."
      >
        <div className="flex flex-wrap gap-2" role="group" aria-label="الاهتمامات التقنية">
          {tax.interests.map((i) => (
            <ChoiceChip key={i.id} selected={v.interestIds.includes(i.id)} onToggle={() => set('interestIds', toggle(v.interestIds, i.id, LIMITS.interestsMax))} disabled={v.interestIds.length >= LIMITS.interestsMax}>
              {i.nameAr}
            </ChoiceChip>
          ))}
        </div>
        {errors.interestIds && <p role="alert" className="text-xs font-bold text-danger">{errors.interestIds}</p>}
      </FormSection>

      <FormSection icon={<Wrench className="size-[18px]" aria-hidden />} title="المهارات ومجالات التعاون">
        <SkillsInput value={v.skillNames} onChange={(x) => set('skillNames', x)} suggestions={tax.skills.map((s) => s.name)} disabled={disabled} />
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink">
            <Handshake className="size-4 text-teal-strong" aria-hidden /> مجالات أرغب بالتعاون فيها
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="مجالات التعاون">
            {tax.collaborationAreas.map((c) => (
              <ChoiceChip key={c.id} selected={v.collaborationAreaIds.includes(c.id)} onToggle={() => set('collaborationAreaIds', toggle(v.collaborationAreaIds, c.id))}>
                {c.nameAr}
              </ChoiceChip>
            ))}
          </div>
        </div>
      </FormSection>

      <FormSection icon={<Link2 className="size-[18px]" aria-hidden />} title="التواصل المهني والموقع" description="لا نعرض بريدك أو رقم جوالك إطلاقًا — التواصل يتم عبر LinkedIn فقط.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="رابط LinkedIn" error={linkedinError} hint="https://www.linkedin.com/in/username" counter={pending('linkedinUrl')}>
            {(a) => <Input {...a} type="url" dir="ltr" inputMode="url" value={v.linkedinUrl} onBlur={() => setLinkedinTouched(true)} onChange={(e) => set('linkedinUrl', e.target.value)} placeholder="https://www.linkedin.com/in/…" className="text-left" />}
          </Field>
          <Field label="المدينة" hint="مدينة عامة فقط — لا نطلب أو نعرض أي عنوان تفصيلي.">
            {(a) => (
              <Select {...a} value={v.city} onChange={(e) => set('city', e.target.value)}>
                <option value="">— بدون —</option>
                {SAUDI_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </FormSection>

      {consentSlot}
    </fieldset>
  )
}

/** تحويل قيمة النموذج إلى ProfileContent بعد حلّ أسماء المهارات إلى معرّفات */
export function fromFormValue(v: ProfileFormValue, skillIds: string[]): ProfileContent {
  const { skillNames: _ignored, ...rest } = v
  void _ignored
  return { ...rest, skillIds }
}
