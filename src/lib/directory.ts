import type {
  CollaborationArea,
  DirectoryMeta,
  DirectoryPage,
  DirectoryQuery,
  DirectorySettings,
  FacetOption,
  Member,
  MemberProfile,
  MembershipType,
  ProfileContent,
  PublicMemberCard,
  PublicMemberProfile,
  PublicTag,
  Skill,
  TechCategory,
  TechInterest,
  TechSpecialization,
} from '../data/types'
import { matchesAllTokens } from './text'

/**
 * منطق الدليل العام — دوال نقية (Pure) تمثّل ما يجب أن ينفّذه الخادم حرفيًا.
 * الواجهة الأمامية لا تتلقى إلا مخرجات هذه الدوال (Public DTOs)، فلا تصل إليها أي بيانات داخلية.
 */

export interface DirectoryState {
  members: Member[]
  profiles: MemberProfile[]
  categories: TechCategory[]
  specializations: TechSpecialization[]
  interests: TechInterest[]
  skills: Skill[]
  collaborationAreas: CollaborationArea[]
  membershipTypes: MembershipType[]
  settings: DirectorySettings
}

export const MAX_PAGE_SIZE = 24
export const DEFAULT_PAGE_SIZE = 12

/**
 * أسباب منع الظهور في الدليل العام — يُتحقق منها على مستوى الخادم في كل طلب.
 * الملف يظهر فقط إذا كانت القائمة فارغة.
 */
export function visibilityBlockers(
  member: Member | undefined,
  profile: MemberProfile | undefined | null,
  settings: Pick<DirectorySettings, 'hideOnMembershipInactive'>,
): string[] {
  if (!member) return ['لا توجد عضوية مرتبطة']
  if (!profile) return ['لم يُنشأ الملف المهني بعد']
  const reasons: string[] = []
  const membershipOk =
    member.membershipStatus === 'active' || (!settings.hideOnMembershipInactive && member.membershipStatus === 'expired')
  if (!membershipOk) reasons.push('العضوية غير فعّالة')
  if (profile.consent.status !== 'granted')
    reasons.push(profile.consent.status === 'withdrawn' ? 'سحب العضو موافقته على النشر' : 'لا توجد موافقة صريحة على النشر')
  if (profile.publishStatus !== 'published') reasons.push('الملف غير معتمد للنشر')
  if (!profile.visibilityEnabled) reasons.push('أوقف العضو ظهور ملفه')
  return reasons
}

export function isPubliclyVisible(
  member: Member | undefined,
  profile: MemberProfile | undefined | null,
  settings: Pick<DirectorySettings, 'hideOnMembershipInactive'>,
): boolean {
  return visibilityBlockers(member, profile, settings).length === 0
}

/** الملف المعتمد المنشور (التعديلات المعلّقة لا تظهر للعامة حتى اعتمادها) */
function publishedContent(profile: MemberProfile): ProfileContent {
  return profile
}

interface Lookup {
  cat: Map<string, TechCategory>
  spec: Map<string, TechSpecialization>
  interest: Map<string, TechInterest>
  skill: Map<string, Skill>
  collab: Map<string, CollaborationArea>
  type: Map<number, MembershipType>
}

function buildLookup(s: DirectoryState): Lookup {
  return {
    cat: new Map(s.categories.map((c) => [c.id, c])),
    spec: new Map(s.specializations.map((c) => [c.id, c])),
    interest: new Map(s.interests.map((c) => [c.id, c])),
    skill: new Map(s.skills.map((c) => [c.id, c])),
    collab: new Map(s.collaborationAreas.map((c) => [c.id, c])),
    type: new Map(s.membershipTypes.map((c) => [c.id, c])),
  }
}

/** يحلّ التخصصات المدموجة إلى التخصص البديل ويستبعد غير النشط */
export function resolveSpecializationIds(ids: string[], specs: Map<string, TechSpecialization>): string[] {
  const out = new Set<string>()
  for (const id of ids) {
    let cur = specs.get(id)
    let guard = 0
    while (cur?.mergedIntoId && guard++ < 5) cur = specs.get(cur.mergedIntoId)
    if (cur && cur.isActive) out.add(cur.id)
  }
  return [...out]
}

function activeCategoryIds(p: ProfileContent, L: Lookup): string[] {
  return p.categoryIds.filter((id) => L.cat.get(id)?.isActive)
}

function activeSpecIds(p: ProfileContent, L: Lookup): string[] {
  return resolveSpecializationIds(p.specializationIds, L.spec).filter((id) => L.cat.get(L.spec.get(id)!.categoryId)?.isActive)
}

function activeInterestIds(p: ProfileContent, L: Lookup): string[] {
  return p.interestIds.filter((id) => L.interest.get(id)?.isActive)
}

function visibleMembershipTypeId(member: Member, profile: MemberProfile, settings: DirectorySettings): number | null {
  return settings.showMembershipType && profile.consent.fields.membershipType ? member.membershipTypeId : null
}

function visibleCity(profile: MemberProfile): string | null {
  return profile.consent.fields.city && profile.city.trim() ? profile.city.trim() : null
}

function cardTags(p: ProfileContent, L: Lookup): PublicTag[] {
  const skills: PublicTag[] = p.skillIds
    .map((id) => L.skill.get(id))
    .filter((s): s is Skill => !!s)
    .slice(0, 2)
    .map((s) => ({ id: s.id, label: s.name, kind: 'skill' }))
  const interests: PublicTag[] = activeInterestIds(p, L).map((id) => ({
    id,
    label: L.interest.get(id)!.nameAr,
    kind: 'interest',
  }))
  const tags = [...skills, ...interests].slice(0, 4)
  if (tags.length < 2) {
    for (const id of activeSpecIds(p, L)) {
      if (tags.length >= 4) break
      tags.push({ id, label: L.spec.get(id)!.nameAr, kind: 'specialization' })
    }
  }
  return tags
}

function toCard(member: Member, profile: MemberProfile, s: DirectoryState, L: Lookup): PublicMemberCard {
  const p = publishedContent(profile)
  const primaryCatId = activeCategoryIds(p, L)[0]
  const typeId = visibleMembershipTypeId(member, profile, s.settings)
  return {
    slug: profile.slug,
    fullName: member.fullNameAr,
    professionalTitle: p.professionalTitle,
    photoUrl: profile.consent.fields.photo ? p.profileImageUrl : null,
    primaryCategory: primaryCatId ? { id: primaryCatId, label: L.cat.get(primaryCatId)!.nameAr } : null,
    shortBio: p.shortBio,
    tags: cardTags(p, L),
    membershipType: typeId !== null ? L.type.get(typeId)?.nameAr ?? null : null,
    linkedinUrl: profile.consent.fields.linkedin && p.linkedinUrl ? p.linkedinUrl : null,
    city: visibleCity(profile),
  }
}

export function toPublicProfile(member: Member, profile: MemberProfile, s: DirectoryState): PublicMemberProfile {
  const L = buildLookup(s)
  const p = publishedContent(profile)
  const specIds = activeSpecIds(p, L)
  const catIds = [...new Set([...activeCategoryIds(p, L), ...specIds.map((id) => L.spec.get(id)!.categoryId)])]
  return {
    ...toCard(member, profile, s, L),
    fullNameEn: member.fullNameEn,
    fullBio: p.fullBio,
    categories: catIds.map((cid) => ({
      id: cid,
      label: L.cat.get(cid)!.nameAr,
      specializations: specIds
        .filter((sid) => L.spec.get(sid)!.categoryId === cid)
        .map((sid) => ({ id: sid, label: L.spec.get(sid)!.nameAr })),
    })),
    interests: activeInterestIds(p, L).map((id) => ({ id, label: L.interest.get(id)!.nameAr })),
    skills: p.skillIds.map((id) => L.skill.get(id)?.name).filter((x): x is string => !!x),
    collaborationAreas: p.collaborationAreaIds.map((id) => L.collab.get(id)?.nameAr).filter((x): x is string => !!x),
  }
}

/** النص القابل للبحث: الاسم، المسمى، التخصصات، المهارات، الاهتمامات (لا تدخل البيانات الداخلية مطلقًا) */
function searchableText(member: Member, profile: MemberProfile, L: Lookup): string {
  const p = publishedContent(profile)
  const specIds = activeSpecIds(p, L)
  return [
    member.fullNameAr,
    member.fullNameEn,
    p.professionalTitle,
    ...activeCategoryIds(p, L).flatMap((id) => [L.cat.get(id)!.nameAr, L.cat.get(id)!.nameEn]),
    ...specIds.flatMap((id) => [L.spec.get(id)!.nameAr, L.spec.get(id)!.nameEn]),
    ...p.skillIds.map((id) => L.skill.get(id)?.name ?? ''),
    ...activeInterestIds(p, L).flatMap((id) => [L.interest.get(id)!.nameAr, L.interest.get(id)!.nameEn]),
  ].join(' | ')
}

function visiblePairs(s: DirectoryState): { member: Member; profile: MemberProfile }[] {
  const byId = new Map(s.members.map((m) => [m.id, m]))
  return s.profiles
    .map((profile) => ({ member: byId.get(profile.memberId)!, profile }))
    .filter(({ member, profile }) => isPubliclyVisible(member, profile, s.settings))
}

export function queryDirectory(s: DirectoryState, query: DirectoryQuery): DirectoryPage {
  const L = buildLookup(s)
  const pageSize = Math.min(Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)
  const page = Math.max(1, query.page ?? 1)
  const interestIds = query.interestIds ?? []
  const match = query.interestMatch ?? 'any'

  const results = visiblePairs(s).filter(({ member, profile }) => {
    const p = publishedContent(profile)
    if (query.categoryId) {
      const specCats = activeSpecIds(p, L).map((id) => L.spec.get(id)!.categoryId)
      if (!activeCategoryIds(p, L).includes(query.categoryId) && !specCats.includes(query.categoryId)) return false
    }
    if (query.specializationId && !activeSpecIds(p, L).includes(query.specializationId)) return false
    if (interestIds.length) {
      const mine = new Set(activeInterestIds(p, L))
      const ok = match === 'all' ? interestIds.every((i) => mine.has(i)) : interestIds.some((i) => mine.has(i))
      if (!ok) return false
    }
    // لا يُسمح بالتصفية على حقل لم يوافق العضو على إظهاره (منع الاستدلال غير المباشر)
    if (query.membershipTypeId !== undefined && visibleMembershipTypeId(member, profile, s.settings) !== query.membershipTypeId)
      return false
    if (query.city && visibleCity(profile) !== query.city) return false
    if (query.q?.trim() && !matchesAllTokens(searchableText(member, profile, L), query.q)) return false
    return true
  })

  results.sort((a, b) => a.member.fullNameAr.localeCompare(b.member.fullNameAr, 'ar'))
  const total = results.length
  const start = (page - 1) * pageSize
  const items = results.slice(start, start + pageSize).map(({ member, profile }) => toCard(member, profile, s, L))
  return { items, total, page, pageSize, hasMore: start + pageSize < total }
}

export function findPublicProfile(s: DirectoryState, slug: string): PublicMemberProfile | null {
  const pair = visiblePairs(s).find(({ profile }) => profile.slug === slug)
  return pair ? toPublicProfile(pair.member, pair.profile, s) : null
}

export function buildMeta(s: DirectoryState): DirectoryMeta {
  const L = buildLookup(s)
  const pairs = visiblePairs(s)
  const catCount = new Map<string, number>()
  const specCount = new Map<string, number>()
  const interestCount = new Map<string, number>()
  const typeCount = new Map<number, number>()
  const cityCount = new Map<string, number>()
  const inc = <K,>(m: Map<K, number>, k: K) => m.set(k, (m.get(k) ?? 0) + 1)

  for (const { member, profile } of pairs) {
    const p = publishedContent(profile)
    const specIds = activeSpecIds(p, L)
    new Set([...activeCategoryIds(p, L), ...specIds.map((id) => L.spec.get(id)!.categoryId)]).forEach((c) => inc(catCount, c))
    specIds.forEach((id) => inc(specCount, id))
    activeInterestIds(p, L).forEach((id) => inc(interestCount, id))
    const t = visibleMembershipTypeId(member, profile, s.settings)
    if (t !== null) inc(typeCount, t)
    const c = visibleCity(profile)
    if (c) inc(cityCount, c)
  }

  const showEmpty = s.settings.showEmptySpecializations
  const categories = s.categories
    .filter((c) => c.isActive && (showEmpty || (catCount.get(c.id) ?? 0) > 0))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((c) => ({
      id: c.id,
      label: c.nameAr,
      icon: c.icon,
      count: catCount.get(c.id) ?? 0,
      specializations: s.specializations
        .filter((sp) => sp.categoryId === c.id && sp.isActive && !sp.mergedIntoId && (showEmpty || (specCount.get(sp.id) ?? 0) > 0))
        .map((sp) => ({ id: sp.id, label: sp.nameAr, count: specCount.get(sp.id) ?? 0 })),
    }))

  const byCountDesc = (a: FacetOption, b: FacetOption) => b.count - a.count || a.label.localeCompare(b.label, 'ar')

  return {
    publishedCount: pairs.length,
    activeSpecializationCount: [...specCount.values()].filter((n) => n > 0).length,
    categories,
    interests: s.interests
      .filter((i) => i.isActive && (showEmpty || (interestCount.get(i.id) ?? 0) > 0))
      .map((i) => ({ id: i.id, label: i.nameAr, count: interestCount.get(i.id) ?? 0 }))
      .sort(byCountDesc),
    membershipTypes: s.settings.showMembershipType
      ? s.membershipTypes
          .filter((t) => t.isActive && (typeCount.get(t.id) ?? 0) > 0)
          .map((t) => ({ id: String(t.id), label: t.nameAr, count: typeCount.get(t.id) ?? 0 }))
      : [],
    cities: [...cityCount.entries()].map(([id, count]) => ({ id, label: id, count })).sort(byCountDesc),
    showMembershipType: s.settings.showMembershipType,
  }
}
