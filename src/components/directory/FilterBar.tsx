import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import type { DirectoryMeta } from '../../data/types'
import { formatNumber } from '../../lib/text'
import { Select, cx } from '../ui/primitives'
import type { Filters } from './filters'

interface Props {
  meta: DirectoryMeta | undefined
  filters: Filters
  update: (patch: Partial<Filters>) => void
  reset: () => void
  activeCount: number
  total: number | undefined
  loading: boolean
}

function InterestsPicker({ meta, filters, update }: Pick<Props, 'meta' | 'filters' | 'update'>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const panelId = useId()
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selected = filters.interestIds
  const toggle = (id: string) => update({ interestIds: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id] })
  const label = selected.length === 0 ? 'كل الاهتمامات' : selected.length === 1 ? meta?.interests.find((i) => i.id === selected[0])?.label ?? '1 اهتمام' : `${formatNumber(selected.length)} اهتمامات`

  return (
    <div ref={ref} className="relative">
      <span className="mb-1 block text-xs font-bold text-muted" id={`${panelId}-l`}>
        الاهتمامات التقنية
      </span>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={`${panelId}-l ${panelId}-v`}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          'flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border-[1.5px] bg-surface px-3.5 text-sm text-ink transition',
          open || selected.length ? 'border-teal-strong' : 'border-line hover:border-line-strong',
        )}
      >
        <span id={`${panelId}-v`} className="truncate">
          {label}
        </span>
        <ChevronDown className={cx('size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div id={panelId} className="absolute inset-x-0 top-full z-30 mt-2 min-w-[280px] rounded-2xl border border-line bg-surface p-3 shadow-card-lg sm:w-80">
          <fieldset>
            <legend className="sr-only">اختر اهتمامًا أو أكثر</legend>
            <div className="max-h-72 space-y-0.5 overflow-y-auto">
              {meta?.interests.map((i) => (
                <label key={i.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-surface-2">
                  <input type="checkbox" checked={selected.includes(i.id)} onChange={() => toggle(i.id)} className="size-4 accent-[var(--teal-strong)]" />
                  <span className="flex-1 font-semibold text-ink">{i.label}</span>
                  <span className="text-xs text-muted">{formatNumber(i.count)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {selected.length > 1 && (
            <fieldset className="mt-2 border-t border-line pt-2.5">
              <legend className="mb-1.5 text-xs font-bold text-muted">طريقة المطابقة</legend>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
                {(
                  [
                    ['any', 'أيٌّ منها'],
                    ['all', 'جميعها'],
                  ] as const
                ).map(([v, l]) => (
                  <label key={v} className={cx('cursor-pointer rounded-lg py-1.5 text-center text-[13px] font-bold transition', filters.interestMatch === v ? 'bg-surface text-teal-strong shadow-card' : 'text-muted')}>
                    <input type="radio" name="interest-match" value={v} className="sr-only" checked={filters.interestMatch === v} onChange={() => update({ interestMatch: v })} />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div className="mt-2 flex justify-between border-t border-line pt-2">
            <button type="button" className="text-[13px] font-bold text-muted hover:text-ink disabled:opacity-40" disabled={!selected.length} onClick={() => update({ interestIds: [] })}>
              مسح
            </button>
            <button type="button" className="text-[13px] font-extrabold text-teal-strong" onClick={() => setOpen(false)}>
              تم
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function FilterBar({ meta, filters, update, reset, activeCount, total, loading }: Props) {
  const category = meta?.categories.find((c) => c.id === filters.categoryId)
  const chips: { key: string; label: string; clear: () => void }[] = []
  if (filters.q.trim()) chips.push({ key: 'q', label: `«${filters.q.trim()}»`, clear: () => update({ q: '' }) })
  if (category) chips.push({ key: 'cat', label: category.label, clear: () => update({ categoryId: '' }) })
  const spec = category?.specializations.find((s) => s.id === filters.specializationId)
  if (spec) chips.push({ key: 'spec', label: spec.label, clear: () => update({ specializationId: '' }) })
  filters.interestIds.forEach((id) => {
    const i = meta?.interests.find((x) => x.id === id)
    if (i) chips.push({ key: `i-${id}`, label: i.label, clear: () => update({ interestIds: filters.interestIds.filter((x) => x !== id) }) })
  })
  const type = meta?.membershipTypes.find((t) => t.id === filters.membershipTypeId)
  if (type) chips.push({ key: 'type', label: type.label, clear: () => update({ membershipTypeId: '' }) })
  if (filters.city) chips.push({ key: 'city', label: filters.city, clear: () => update({ city: '' }) })

  return (
    <section aria-label="فلاتر البحث" className="rounded-[20px] border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-ink">
        <SlidersHorizontal className="size-4 text-teal-strong" aria-hidden />
        تصفية النتائج
      </div>
      <div className={cx('grid gap-3 sm:grid-cols-2', meta?.showMembershipType && meta.membershipTypes.length ? 'lg:grid-cols-5' : 'lg:grid-cols-4')}>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-muted">التخصص الرئيسي</span>
          <Select value={filters.categoryId} onChange={(e) => update({ categoryId: e.target.value })}>
            <option value="">جميع المجالات</option>
            {meta?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} ({formatNumber(c.count)})
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-muted">التخصص الفرعي</span>
          <Select value={filters.specializationId} disabled={!category} onChange={(e) => update({ specializationId: e.target.value })} aria-describedby={!category ? 'spec-hint' : undefined}>
            <option value="">{category ? 'جميع التخصصات' : 'اختر المجال أولًا'}</option>
            {category?.specializations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({formatNumber(s.count)})
              </option>
            ))}
          </Select>
          {!category && (
            <span id="spec-hint" className="sr-only">
              تتغير قائمة التخصصات الفرعية بحسب المجال الرئيسي المختار
            </span>
          )}
        </label>
        <InterestsPicker meta={meta} filters={filters} update={update} />
        {meta?.showMembershipType && meta.membershipTypes.length > 0 && (
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-muted">نوع العضوية</span>
            <Select value={filters.membershipTypeId} onChange={(e) => update({ membershipTypeId: e.target.value })}>
              <option value="">جميع العضويات</option>
              {meta.membershipTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-muted">المدينة (اختياري)</span>
          <Select value={filters.city} onChange={(e) => update({ city: e.target.value })}>
            <option value="">كل المدن</option>
            {meta?.cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3.5">
        <p className="text-sm font-bold text-ink" aria-live="polite" aria-atomic>
          {loading && total === undefined ? (
            'جارٍ التحميل…'
          ) : (
            <>
              <span className="text-teal-strong">{formatNumber(total ?? 0)}</span> {total === 1 ? 'عضو' : 'نتيجة'}
              {activeCount > 0 && <span className="font-semibold text-muted"> مطابقة للفلاتر</span>}
            </>
          )}
        </p>
        <ul className="flex flex-1 flex-wrap gap-1.5" aria-label="الفلاتر المطبقة">
          {chips.map((c) => (
            <li key={c.key}>
              <button type="button" onClick={c.clear} className="inline-flex items-center gap-1 rounded-full bg-teal-light px-2.5 py-1 text-xs font-bold text-teal-strong hover:brightness-95">
                {c.label}
                <X className="size-3.5" aria-hidden />
                <span className="sr-only">إزالة الفلتر</span>
              </button>
            </li>
          ))}
        </ul>
        {activeCount > 0 && (
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-extrabold text-muted hover:text-danger">
            <RotateCcw className="size-3.5" aria-hidden />
            إعادة ضبط الفلاتر
          </button>
        )}
      </div>
    </section>
  )
}
