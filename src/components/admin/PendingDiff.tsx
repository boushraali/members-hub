import type { TaxonomyData } from '../../data/api'
import type { MemberProfile, ProfileContent } from '../../data/types'
import { FIELD_LABELS } from '../../lib/labels'

function render(field: keyof ProfileContent, value: unknown, tax: TaxonomyData) {
  if (field === 'profileImageUrl')
    return value ? <img src={String(value)} alt="" className="size-14 rounded-full object-cover" /> : <span className="text-muted">بدون صورة</span>
  if (Array.isArray(value)) {
    const lookup: Record<string, (id: string) => string | undefined> = {
      categoryIds: (id) => tax.categories.find((x) => x.id === id)?.nameAr,
      specializationIds: (id) => tax.specializations.find((x) => x.id === id)?.nameAr,
      interestIds: (id) => tax.interests.find((x) => x.id === id)?.nameAr,
      skillIds: (id) => tax.skills.find((x) => x.id === id)?.name,
      collaborationAreaIds: (id) => tax.collaborationAreas.find((x) => x.id === id)?.nameAr,
    }
    const names = (value as string[]).map((id) => lookup[field]?.(id) ?? id)
    return names.length ? names.join('، ') : <span className="text-muted">—</span>
  }
  return value ? <span className="whitespace-pre-line">{String(value)}</span> : <span className="text-muted">—</span>
}

export function PendingDiff({ profile, tax }: { profile: MemberProfile; tax: TaxonomyData }) {
  const changes = profile.pendingChanges ?? {}
  const fields = Object.keys(changes) as (keyof ProfileContent)[]
  if (!fields.length) return null
  return (
    <dl className="space-y-3">
      {fields.map((f) => (
        <div key={f} className="rounded-xl border border-line p-3">
          <dt className="mb-2 text-[13px] font-extrabold text-ink">{FIELD_LABELS[f]}</dt>
          <dd className="grid gap-2 text-[13px] leading-6 sm:grid-cols-2">
            <div className="rounded-lg bg-danger-bg/60 p-2.5">
              <p className="mb-1 text-[11px] font-bold text-danger">المعتمد حاليًا</p>
              <div className="text-ink-2">{render(f, profile[f], tax)}</div>
            </div>
            <div className="rounded-lg bg-ok-bg/70 p-2.5">
              <p className="mb-1 text-[11px] font-bold text-ok">التعديل المقترح</p>
              <div className="text-ink">{render(f, changes[f], tax)}</div>
            </div>
          </dd>
        </div>
      ))}
    </dl>
  )
}
