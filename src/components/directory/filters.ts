import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DirectoryQuery } from '../../data/types'

export interface Filters {
  q: string
  categoryId: string
  specializationId: string
  interestIds: string[]
  interestMatch: 'any' | 'all'
  membershipTypeId: string
  city: string
}

export const EMPTY_FILTERS: Filters = {
  q: '',
  categoryId: '',
  specializationId: '',
  interestIds: [],
  interestMatch: 'any',
  membershipTypeId: '',
  city: '',
}

/** حالة الفلاتر محفوظة في رابط الصفحة، فيمكن مشاركة نتيجة بحث محددة أو الرجوع إليها */
export function useDirectoryFilters() {
  const [params, setParams] = useSearchParams()
  const filters: Filters = useMemo(
    () => ({
      q: params.get('q') ?? '',
      categoryId: params.get('cat') ?? '',
      specializationId: params.get('spec') ?? '',
      interestIds: (params.get('int') ?? '').split(',').filter(Boolean),
      interestMatch: params.get('match') === 'all' ? 'all' : 'any',
      membershipTypeId: params.get('type') ?? '',
      city: params.get('city') ?? '',
    }),
    [params],
  )

  const update = useCallback(
    (patch: Partial<Filters>) => {
      const next = { ...filters, ...patch }
      // التخصص الفرعي يتبع المجال الرئيسي
      if (patch.categoryId !== undefined && patch.categoryId !== filters.categoryId && patch.specializationId === undefined) next.specializationId = ''
      const sp = new URLSearchParams()
      if (next.q.trim()) sp.set('q', next.q)
      if (next.categoryId) sp.set('cat', next.categoryId)
      if (next.specializationId) sp.set('spec', next.specializationId)
      if (next.interestIds.length) sp.set('int', next.interestIds.join(','))
      if (next.interestIds.length > 1 && next.interestMatch === 'all') sp.set('match', 'all')
      if (next.membershipTypeId) sp.set('type', next.membershipTypeId)
      if (next.city) sp.set('city', next.city)
      setParams(sp, { replace: true })
    },
    [filters, setParams],
  )

  const reset = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams])

  const activeCount =
    (filters.categoryId ? 1 : 0) +
    (filters.specializationId ? 1 : 0) +
    filters.interestIds.length +
    (filters.membershipTypeId ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.q.trim() ? 1 : 0)

  return { filters, update, reset, activeCount }
}

export function toQuery(f: Filters, q: string): DirectoryQuery {
  return {
    q: q.trim() || undefined,
    categoryId: f.categoryId || undefined,
    specializationId: f.specializationId || undefined,
    interestIds: f.interestIds.length ? f.interestIds : undefined,
    interestMatch: f.interestMatch,
    membershipTypeId: f.membershipTypeId ? Number(f.membershipTypeId) : undefined,
    city: f.city || undefined,
  }
}
