import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ArrowDown, CircleAlert, Layers, Search, SearchX, Users } from 'lucide-react'
import { api } from '../data'
import type { DirectoryMeta, PublicMemberCard } from '../data/types'
import { FilterBar } from '../components/directory/FilterBar'
import { MemberCard, MemberCardSkeleton } from '../components/directory/MemberCard'
import { toQuery, useDirectoryFilters } from '../components/directory/filters'
import { CategoryIcon, EmptyState } from '../components/ui/misc'
import { Button, Select, Skeleton, cx } from '../components/ui/primitives'
import { useAsync, useDebounced, useDocumentTitle } from '../lib/hooks'
import { formatNumber } from '../lib/text'
import { PageShell } from '../components/layout/Layout'

const PAGE_SIZE = 12

function Stat({ icon, value, label, loading }: { icon: React.ReactNode; value: number | undefined; label: string; loading: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.07] px-4 py-3 backdrop-blur">
      <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-[#7fe7ff]">{icon}</span>
      <div>
        {loading || value === undefined ? (
          <span className="block h-7 w-12 animate-pulse rounded bg-white/15" aria-hidden />
        ) : (
          <span className="block text-2xl font-black leading-7 text-white">{formatNumber(value)}</span>
        )}
        <span className="text-xs font-bold text-[#b9d6e6]">{label}</span>
      </div>
    </div>
  )
}

function Hero({
  meta,
  metaLoading,
  q,
  setQ,
  categoryId,
  interestId,
  onCategory,
  onInterest,
  onExplore,
}: {
  meta: DirectoryMeta | undefined
  metaLoading: boolean
  q: string
  setQ: (q: string) => void
  categoryId: string
  interestId: string
  onCategory: (id: string) => void
  onInterest: (id: string) => void
  onExplore: () => void
}) {
  const darkSelect = '!border-white/15 !bg-white/95 !text-[#08223F] dark:!bg-[#0c2a40] dark:!text-[#e8f1f8]'
  return (
    <section className="hero-bg relative overflow-hidden text-white" aria-labelledby="hero-title">
      <svg className="pointer-events-none absolute inset-0 size-full opacity-[0.13]" aria-hidden>
        <defs>
          <pattern id="net" width="56" height="56" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="1.6" fill="#7fe7ff" />
            <path d="M4 4 L56 30 M4 4 L30 56" stroke="#7fe7ff" strokeWidth=".6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#net)" />
      </svg>
      <div className="relative mx-auto max-w-[1240px] px-4 pb-14 pt-12 sm:px-6 md:pb-16 md:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[13px] font-extrabold text-[#7fe7ff]">
          <Users className="size-4" aria-hidden />
          AI Association Members Hub
        </span>
        <h1 id="hero-title" className="mt-4 text-3xl font-black leading-tight md:text-5xl">
          مساحة أعضاء الجمعية
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[#d8e9f3] md:text-lg">
          مجتمع من الخبراء والمختصين والمهتمين بالتقنية والذكاء الاصطناعي، يجمعهم الشغف بالمعرفة والابتكار وصناعة المستقبل.
        </p>
        <p className="mt-2 text-sm font-bold text-[#9fdcf0]">اكتشف الأعضاء، واستعرض التخصصات، وتواصل مع أصحاب الخبرات والاهتمامات المشتركة.</p>

        <form
          role="search"
          aria-label="البحث عن الأعضاء"
          onSubmit={(e) => {
            e.preventDefault()
            onExplore()
          }}
          className="mt-8 grid gap-2.5 rounded-[22px] border border-white/12 bg-white/[0.08] p-2.5 backdrop-blur-md md:grid-cols-[1.6fr_1fr_1fr_auto]"
        >
          <label className="relative block">
            <span className="sr-only">ابحث بالاسم أو المسمى أو التخصص أو المهارة</span>
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-5 -translate-y-1/2 text-[#5a6b80]" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث بالاسم، المسمى، التخصص، المهارة…"
              className="min-h-12 w-full rounded-xl border-0 bg-white/95 ps-11 pe-3 text-[15px] text-[#08223F] placeholder:text-[#5a6b80] focus:outline-none focus:ring-3 focus:ring-[#7fe7ff]/60 dark:bg-[#0c2a40] dark:text-[#e8f1f8] dark:placeholder:text-[#9fb4c8]"
            />
          </label>
          <label className="block">
            <span className="sr-only">التخصص التقني</span>
            <Select value={categoryId} onChange={(e) => onCategory(e.target.value)} className={cx('min-h-12', darkSelect)}>
              <option value="">كل التخصصات التقنية</option>
              {meta?.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="sr-only">الاهتمام التقني</span>
            <Select value={interestId} onChange={(e) => onInterest(e.target.value)} className={cx('min-h-12', darkSelect)}>
              <option value="">كل الاهتمامات</option>
              {meta?.interests.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </Select>
          </label>
          <Button type="submit" size="lg" className="!min-h-12 !bg-[#22A599] !text-[#04202a] hover:!bg-[#2fc4b6]" icon={<ArrowDown className="size-4" aria-hidden />}>
            استكشف الأعضاء
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap gap-3">
          <Stat icon={<Users className="size-5" />} value={meta?.publishedCount} label="عضو منشور في الدليل" loading={metaLoading} />
          <Stat icon={<Layers className="size-5" />} value={meta?.activeSpecializationCount} label="تخصص متاح" loading={metaLoading} />
        </div>
      </div>
    </section>
  )
}

function CategoryStrip({ meta, active, onSelect }: { meta: DirectoryMeta | undefined; active: string; onSelect: (id: string) => void }) {
  if (!meta) {
    return (
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-44 shrink-0 rounded-2xl" />
        ))}
      </div>
    )
  }
  return (
    <nav aria-label="تصفح حسب المجال">
      <ul className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {meta.categories.map((c) => {
          const on = active === c.id
          return (
            <li key={c.id} className="shrink-0 snap-start">
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(on ? '' : c.id)}
                className={cx(
                  'flex items-center gap-2.5 rounded-2xl border-[1.5px] px-3.5 py-2.5 text-start transition',
                  on ? 'border-teal-strong bg-teal-light' : 'border-line bg-surface hover:border-line-strong hover:shadow-card',
                )}
              >
                <span className={cx('flex size-9 items-center justify-center rounded-xl', on ? 'bg-teal-strong text-white dark:text-[#061826]' : 'bg-surface-2 text-teal-strong')}>
                  <CategoryIcon icon={c.icon} className="size-[18px]" />
                </span>
                <span>
                  <span className={cx('block text-[13px] font-extrabold leading-5', on ? 'text-teal-strong' : 'text-ink')}>{c.label}</span>
                  <span className="text-xs font-semibold text-muted">{formatNumber(c.count)} عضو</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default function HubPage() {
  useDocumentTitle('مساحة أعضاء الجمعية | AI Association Members Hub')
  const { filters, update, reset, activeCount } = useDirectoryFilters()
  const meta = useAsync(() => api.getDirectoryMeta(), [])
  const resultsRef = useRef<HTMLDivElement>(null)

  // البحث: حالة محلية فورية، تُرحَّل إلى الرابط بعد توقف الكتابة
  const [qInput, setQInput] = useState(filters.q)
  const debouncedQ = useDebounced(qInput, 300)
  useEffect(() => {
    if (debouncedQ !== filters.q) update({ q: debouncedQ })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ])
  useEffect(() => {
    if (filters.q !== debouncedQ) setQInput(filters.q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q])

  const queryKey = JSON.stringify(toQuery(filters, filters.q))
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<PublicMemberCard[]>([])
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const reqId = useRef(0)

  useEffect(() => {
    const id = ++reqId.current
    setLoading(true)
    setError(false)
    setPage(1)
    api
      .searchMembers({ ...JSON.parse(queryKey), page: 1, pageSize: PAGE_SIZE })
      .then((r) => {
        if (id !== reqId.current) return
        setItems(r.items)
        setTotal(r.total)
        setHasMore(r.hasMore)
      })
      .catch(() => id === reqId.current && setError(true))
      .finally(() => id === reqId.current && setLoading(false))
  }, [queryKey, retry])

  const loadMore = async () => {
    const id = reqId.current
    setLoadingMore(true)
    try {
      const r = await api.searchMembers({ ...JSON.parse(queryKey), page: page + 1, pageSize: PAGE_SIZE })
      if (id !== reqId.current) return
      setItems((x) => [...x, ...r.items])
      setPage(page + 1)
      setHasMore(r.hasMore)
    } catch {
      setError(true)
    } finally {
      setLoadingMore(false)
    }
  }

  const scrollToResults = () => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <PageShell>
      <Hero
        meta={meta.data}
        metaLoading={meta.loading}
        q={qInput}
        setQ={setQInput}
        categoryId={filters.categoryId}
        interestId={filters.interestIds.length === 1 ? filters.interestIds[0] : ''}
        onCategory={(id) => update({ categoryId: id })}
        onInterest={(id) => update({ interestIds: id ? [id] : [] })}
        onExplore={() => {
          update({ q: qInput })
          scrollToResults()
        }}
      />

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <section className="pt-10" aria-labelledby="cats-title">
          <h2 id="cats-title" className="mb-4 text-lg font-extrabold text-ink">
            تصفح حسب المجال
          </h2>
          <CategoryStrip meta={meta.data} active={filters.categoryId} onSelect={(id) => update({ categoryId: id })} />
        </section>

        <div ref={resultsRef} className="scroll-mt-24 pt-6">
          <FilterBar meta={meta.data} filters={filters} update={update} reset={() => { setQInput(''); reset() }} activeCount={activeCount} total={total} loading={loading} />
        </div>

        <section aria-labelledby="results-title" aria-busy={loading} className="pt-6">
          <h2 id="results-title" className="sr-only">
            نتائج الأعضاء
          </h2>
          {error ? (
            <EmptyState
              icon={<CircleAlert className="size-7" />}
              title="تعذّر تحميل الأعضاء"
              description="حدث خطأ أثناء جلب البيانات. تحقق من الاتصال ثم أعد المحاولة."
              action={<Button onClick={() => setRetry((n) => n + 1)}>إعادة المحاولة</Button>}
            />
          ) : loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <MemberCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<SearchX className="size-7" />}
              title="لا توجد نتائج مطابقة"
              description="جرّب تقليل عدد الفلاتر، أو البحث بكلمة أعم، أو اختيار «أيٌّ منها» عند تحديد عدة اهتمامات."
              action={
                <Button variant="outline" onClick={() => { setQInput(''); reset() }}>
                  إعادة ضبط جميع الفلاتر
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <AnimatePresence mode="popLayout" initial={false}>
                  {items.map((m) => (
                    <MemberCard key={m.slug} member={m} />
                  ))}
                </AnimatePresence>
              </div>
              <div className="mt-8 flex flex-col items-center gap-2">
                <p className="text-[13px] font-semibold text-muted">
                  عرض {formatNumber(items.length)} من {formatNumber(total ?? 0)}
                </p>
                {hasMore && (
                  <Button variant="outline" onClick={loadMore} loading={loadingMore}>
                    عرض المزيد من الأعضاء
                  </Button>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </PageShell>
  )
}
