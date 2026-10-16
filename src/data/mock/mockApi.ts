import { ApiError, type AdminMemberFilter, type MembersHubApi, type MyProfileView, type SaveResult, type TaxonomyData } from '../api'
import { getSession } from '../session'
import {
  SAUDI_CITIES,
  SEED_CATEGORIES,
  SEED_COLLABORATION_AREAS,
  SEED_INTERESTS,
  SEED_MEMBERSHIP_TYPES,
  SEED_SPECIALIZATIONS,
} from '../taxonomy'
import type {
  AdminMemberRow,
  AdminStats,
  AuditAction,
  AuditLog,
  ConsentFields,
  DirectorySettings,
  Member,
  MemberProfile,
  MembershipStatus,
  ProfileContent,
  PublishStatus,
  Skill,
  TaxonomyTree,
  TechCategory,
  TechInterest,
  TechSpecialization,
} from '../types'
import { buildMeta, findPublicProfile, queryDirectory, visibilityBlockers, type DirectoryState } from '../../lib/directory'
import { normalizeText, slugify } from '../../lib/text'
import {
  LIMITS,
  normalizeLinkedinUrl,
  profileCompleteness,
  sanitizePlainText,
  sniffImageType,
  validateForSubmission,
  validateImageFile,
} from '../../lib/validation'
import { DEFAULT_SETTINGS, buildSeed, buildSkills } from './seed'
import { FIELD_LABELS } from '../../lib/labels'

/**
 * خادم وهمي داخل المتصفح يحاكي قواعد العمل التي يجب أن ينفّذها خادم الجمعية.
 * كل دالة هنا تقابل نقطة نهاية في docs/INTEGRATION.md.
 */

const STORAGE_KEY = 'aia-members-hub:mock-db:v1'

interface MockDb extends DirectoryState {
  audit: AuditLog[]
  seq: { profile: number; audit: number }
}

const SENSITIVE_FIELDS: (keyof ProfileContent)[] = ['professionalTitle', 'profileImageUrl', 'shortBio', 'fullBio', 'linkedinUrl']
const CONTENT_FIELDS: (keyof ProfileContent)[] = [
  'professionalTitle', 'profileImageUrl', 'shortBio', 'fullBio', 'linkedinUrl', 'city',
  'categoryIds', 'specializationIds', 'interestIds', 'skillIds', 'collaborationAreaIds',
]

function freshDb(): MockDb {
  const { members, profiles } = buildSeed()
  return {
    members,
    profiles,
    categories: structuredClone(SEED_CATEGORIES),
    specializations: structuredClone(SEED_SPECIALIZATIONS),
    interests: structuredClone(SEED_INTERESTS),
    skills: buildSkills(),
    collaborationAreas: structuredClone(SEED_COLLABORATION_AREAS),
    membershipTypes: structuredClone(SEED_MEMBERSHIP_TYPES),
    settings: { ...DEFAULT_SETTINGS },
    audit: [],
    seq: { profile: 501 + profiles.length, audit: 1 },
  }
}

const now = () => new Date().toISOString()
const clone = <T,>(v: T): T => structuredClone(v)
const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

export interface MockApiOptions {
  latencyMs?: [number, number]
  persist?: boolean
  /** الحد الأقصى لطلبات البحث في الدقيقة لكل زائر (محاكاة الحماية من الجمع الآلي) */
  searchRateLimitPerMinute?: number
}

export class MockApi implements MembersHubApi {
  private db: MockDb
  private searchHits: number[] = []

  constructor(private opts: MockApiOptions = {}) {
    this.db = this.load()
  }

  // ───────────── البنية التحتية ─────────────

  private load(): MockDb {
    if (this.opts.persist !== false) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) return JSON.parse(raw) as MockDb
      } catch {
        /* نعود للبيانات الأولية */
      }
    }
    return freshDb()
  }

  private save() {
    if (this.opts.persist === false) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db))
    } catch {
      /* تجاهل — المعاينة تعمل في الذاكرة */
    }
  }

  reset() {
    this.db = freshDb()
    this.save()
  }

  private async delay() {
    const [min, max] = this.opts.latencyMs ?? [220, 480]
    if (max <= 0) return
    await new Promise((r) => setTimeout(r, min + Math.random() * (max - min)))
  }

  private actor() {
    const s = getSession()
    if (s.role === 'admin') return { role: s.role, id: 1, label: 'مشرف الدليل (تجريبي)' }
    if (s.role === 'member') {
      const m = this.db.members.find((x) => x.id === s.memberId)
      return { role: s.role, id: s.memberId, label: m ? m.fullNameAr : 'عضو' }
    }
    return { role: s.role, id: null, label: 'زائر' }
  }

  private log(action: AuditAction, memberId: number | null, details: string, system = false) {
    this.db.audit.unshift({
      id: this.db.seq.audit++,
      at: now(),
      actor: system ? { role: 'admin', id: null, label: 'النظام (آلي)' } : this.actor(),
      action,
      memberId,
      details,
    })
    this.db.audit = this.db.audit.slice(0, 500)
  }

  private requireAdmin() {
    if (getSession().role !== 'admin') throw new ApiError('FORBIDDEN', 'هذه العملية متاحة لمشرفي الدليل فقط.')
  }

  private requireMember(): Member {
    const s = getSession()
    if (s.role !== 'member' || s.memberId === null) throw new ApiError('FORBIDDEN', 'يجب تسجيل الدخول بحساب العضو.')
    const m = this.db.members.find((x) => x.id === s.memberId)
    if (!m) throw new ApiError('NOT_FOUND', 'العضوية غير موجودة.')
    return m
  }

  private member(id: number): Member {
    const m = this.db.members.find((x) => x.id === id)
    if (!m) throw new ApiError('NOT_FOUND', 'العضو غير موجود.')
    return m
  }

  private profileOf(memberId: number): MemberProfile | undefined {
    return this.db.profiles.find((p) => p.memberId === memberId)
  }

  /** الملف المهني امتداد للعضوية — ملف واحد فقط لكل member_id (قيد UNIQUE في قاعدة البيانات) */
  private ensureProfile(member: Member): MemberProfile {
    const existing = this.profileOf(member.id)
    if (existing) return existing
    let slug = slugify(member.fullNameEn) || `member-${Math.random().toString(36).slice(2, 8)}`
    const base = slug
    for (let n = 2; this.db.profiles.some((p) => p.slug === slug); n++) slug = `${base}-${n}`
    const profile: MemberProfile = {
      id: this.db.seq.profile++,
      memberId: member.id,
      slug,
      professionalTitle: '',
      profileImageUrl: null,
      shortBio: '',
      fullBio: '',
      linkedinUrl: '',
      city: '',
      categoryIds: [],
      specializationIds: [],
      interestIds: [],
      skillIds: [],
      collaborationAreaIds: [],
      publishStatus: 'incomplete',
      visibilityEnabled: true,
      consent: {
        status: 'none',
        fields: { photo: false, linkedin: false, city: false, membershipType: false },
        version: this.db.settings.consentVersion,
        timestamp: null,
        source: null,
      },
      pendingChanges: null,
      rejectionReason: null,
      createdAt: now(),
      updatedAt: now(),
      publishedAt: null,
    }
    this.db.profiles.push(profile)
    this.log('profile.created', member.id, 'إنشاء ملف مهني مرتبط بالعضوية')
    return profile
  }

  /** تنظيف المدخلات على "الخادم": نص عادي فقط، معرّفات موجودة فقط، حدود أطوال */
  private sanitizeContent(c: ProfileContent): ProfileContent {
    const linkedinRaw = c.linkedinUrl?.trim() ?? ''
    const linkedin = linkedinRaw ? normalizeLinkedinUrl(linkedinRaw) : ''
    if (linkedin === null)
      throw new ApiError('VALIDATION', 'رابط LinkedIn غير صالح.', {
        linkedinUrl: 'أدخل رابط ملف شخصي بالشكل https://www.linkedin.com/in/username',
      })
    const uniq = (ids: string[], valid: Set<string>) => [...new Set(ids)].filter((id) => valid.has(id))
    const categoryIds = uniq(c.categoryIds, new Set(this.db.categories.filter((x) => x.isActive).map((x) => x.id))).slice(0, LIMITS.categoriesMax)
    const specById = new Map(this.db.specializations.map((s) => [s.id, s]))
    const specializationIds = uniq(c.specializationIds, new Set(specById.keys()))
      .filter((id) => categoryIds.includes(specById.get(id)!.categoryId))
      .slice(0, LIMITS.specializationsMax)
    const image = c.profileImageUrl
    if (image && !/^(data:image\/(png|jpeg|webp|svg\+xml)[;,]|\/uploads\/|https:\/\/aia\.org\.sa\/)/.test(image))
      throw new ApiError('VALIDATION', 'مصدر الصورة غير مسموح.')
    return {
      professionalTitle: sanitizePlainText(c.professionalTitle, LIMITS.titleMax),
      profileImageUrl: image || null,
      shortBio: sanitizePlainText(c.shortBio, LIMITS.shortBioMax),
      fullBio: sanitizePlainText(c.fullBio, LIMITS.fullBioMax),
      linkedinUrl: linkedin,
      city: SAUDI_CITIES.includes(c.city) ? c.city : '',
      categoryIds,
      specializationIds,
      interestIds: uniq(c.interestIds, new Set(this.db.interests.filter((x) => x.isActive).map((x) => x.id))).slice(0, LIMITS.interestsMax),
      skillIds: uniq(c.skillIds, new Set(this.db.skills.map((x) => x.id))).slice(0, LIMITS.skillsMax),
      collaborationAreaIds: uniq(c.collaborationAreaIds, new Set(this.db.collaborationAreas.map((x) => x.id))),
    }
  }

  private applyContent(profile: MemberProfile, content: Partial<ProfileContent>) {
    Object.assign(profile, clone(content))
    profile.updatedAt = now()
  }

  private row(member: Member): AdminMemberRow {
    const profile = this.profileOf(member.id) ?? null
    const blockers = visibilityBlockers(member, profile, this.db.settings)
    return clone({
      member,
      membershipTypeName: this.db.membershipTypes.find((t) => t.id === member.membershipTypeId)?.nameAr ?? '—',
      profile,
      isPubliclyVisible: blockers.length === 0,
      blockers,
      completeness: profile ? profileCompleteness(profile) : 0,
    })
  }

  private myView(member: Member): MyProfileView {
    const profile = this.profileOf(member.id) ?? null
    const blockers = visibilityBlockers(member, profile, this.db.settings)
    return clone({
      member: {
        id: member.id,
        fullNameAr: member.fullNameAr,
        fullNameEn: member.fullNameEn,
        membershipTypeName: this.db.membershipTypes.find((t) => t.id === member.membershipTypeId)?.nameAr ?? '—',
        membershipStatus: member.membershipStatus,
        expiresAt: member.expiresAt,
      },
      profile,
      eligible: member.membershipStatus === 'active',
      isPubliclyVisible: blockers.length === 0,
      blockers,
      editApprovalPolicy: this.db.settings.editApprovalPolicy,
      consentVersion: this.db.settings.consentVersion,
    })
  }

  private assertPublishable(member: Member, profile: MemberProfile) {
    if (member.membershipStatus !== 'active') throw new ApiError('NOT_ELIGIBLE', 'لا يمكن نشر ملف لعضوية غير فعّالة.')
    if (profile.consent.status !== 'granted')
      throw new ApiError('VALIDATION', 'لا يمكن النشر دون موافقة صريحة من العضو على نشر بياناته.', { consent: 'الموافقة مطلوبة' })
    const errors = validateForSubmission(profile)
    if (Object.keys(errors).length) throw new ApiError('VALIDATION', 'الملف غير مكتمل للنشر.', errors as Record<string, string>)
  }

  // ───────────── عام ─────────────

  async getDirectoryMeta() {
    await this.delay()
    return buildMeta(this.db)
  }

  async searchMembers(query: Parameters<MembersHubApi['searchMembers']>[0]) {
    await this.delay()
    const limit = this.opts.searchRateLimitPerMinute ?? 120
    const t = Date.now()
    this.searchHits = this.searchHits.filter((x) => t - x < 60_000)
    if (this.searchHits.length >= limit) throw new ApiError('RATE_LIMITED', 'عدد كبير من الطلبات، يرجى المحاولة بعد قليل.')
    this.searchHits.push(t)
    return queryDirectory(this.db, query)
  }

  async getPublicProfile(slug: string) {
    await this.delay()
    return findPublicProfile(this.db, slug)
  }

  async getTaxonomy(): Promise<TaxonomyData> {
    await this.delay()
    return clone({
      categories: this.db.categories.filter((c) => c.isActive).sort((a, b) => a.displayOrder - b.displayOrder),
      specializations: this.db.specializations.filter((s) => s.isActive && !s.mergedIntoId),
      interests: this.db.interests.filter((i) => i.isActive),
      collaborationAreas: this.db.collaborationAreas,
      skills: this.db.skills,
    })
  }

  // ───────────── العضو ─────────────

  async getMyProfile() {
    await this.delay()
    return this.myView(this.requireMember())
  }

  /**
   * تطبيق سياسة اعتماد التعديلات على ملف العضو:
   *  - ملف لم يُعتمد بعد، أو السياسة 'auto' → يُطبّق التعديل مباشرة.
   *  - 'review_sensitive' → الحقول الحساسة (الصورة، المسمى، النبذة، LinkedIn) تُعلّق للمراجعة، والباقي يُطبّق فورًا.
   *  - 'review_all' → كل التعديلات تُعلّق، وتبقى النسخة المعتمدة ظاهرة.
   */
  private applyMemberEdit(profile: MemberProfile, incoming: ProfileContent): { applied: (keyof ProfileContent)[]; queued: (keyof ProfileContent)[] } {
    const policy = this.db.settings.editApprovalPolicy
    const live = profile.publishedAt !== null && (profile.publishStatus === 'published' || profile.publishStatus === 'hidden')
    const differs = (f: keyof ProfileContent) => !sameValue(profile[f], incoming[f])
    if (!live || policy === 'auto') {
      const applied = CONTENT_FIELDS.filter(differs)
      this.applyContent(profile, incoming)
      profile.pendingChanges = null
      return { applied, queued: [] }
    }
    const reviewable = policy === 'review_all' ? CONTENT_FIELDS : SENSITIVE_FIELDS
    const direct: Record<string, unknown> = {}
    const pending: Record<string, unknown> = {}
    for (const f of CONTENT_FIELDS) {
      if (!differs(f)) continue // إعادة القيمة المعتمدة تلغي أي تعديل معلّق عليها
      if (reviewable.includes(f)) pending[f] = incoming[f]
      else direct[f] = incoming[f]
    }
    this.applyContent(profile, direct as Partial<ProfileContent>)
    const queued = Object.keys(pending) as (keyof ProfileContent)[]
    profile.pendingChanges = queued.length ? (clone(pending) as Partial<ProfileContent>) : null
    return { applied: Object.keys(direct) as (keyof ProfileContent)[], queued }
  }

  async saveMyProfile(content: ProfileContent): Promise<SaveResult<MyProfileView>> {
    await this.delay()
    const member = this.requireMember()
    if (member.membershipStatus !== 'active')
      throw new ApiError('NOT_ELIGIBLE', 'تعديل الملف المهني متاح للعضويات الفعّالة فقط. يمكنك تجديد العضوية من صفحة التجديد.')
    const clean = this.sanitizeContent(content)
    const profile = this.ensureProfile(member)
    const hadPending = !!profile.pendingChanges
    const { applied, queued } = this.applyMemberEdit(profile, clean)
    if (applied.length === 0 && queued.length === 0 && !hadPending) return { data: this.myView(member), notice: 'لا توجد تغييرات جديدة.' }
    this.log(
      'profile.updated',
      member.id,
      `تعديل: ${applied.map((f) => FIELD_LABELS[f]).join('، ') || '—'}${queued.length ? ` | بانتظار الاعتماد: ${queued.map((f) => FIELD_LABELS[f]).join('، ')}` : ''}`,
    )
    this.save()
    const live = profile.publishStatus === 'published'
    let notice = 'تم حفظ التعديلات.'
    if (queued.length) notice = `تم الحفظ. التعديلات على (${queued.map((f) => FIELD_LABELS[f]).join('، ')}) بانتظار اعتماد الإدارة، وتبقى النسخة المعتمدة ظاهرة حتى ذلك الحين.`
    else if (live) notice = 'تم الحفظ وتحديث بطاقتك في الدليل مباشرة.'
    return { data: this.myView(member), notice }
  }

  async submitMyProfile(): Promise<SaveResult<MyProfileView>> {
    await this.delay()
    const member = this.requireMember()
    if (member.membershipStatus !== 'active') throw new ApiError('NOT_ELIGIBLE', 'العضوية غير فعّالة.')
    const profile = this.profileOf(member.id)
    if (!profile) throw new ApiError('VALIDATION', 'احفظ ملفك المهني أولًا.')
    if (profile.publishStatus === 'published') throw new ApiError('CONFLICT', 'ملفك منشور بالفعل.')
    if (profile.publishStatus === 'pending_review') return { data: this.myView(member), notice: 'طلبك قيد المراجعة بالفعل.' }
    if (profile.consent.status !== 'granted')
      throw new ApiError('VALIDATION', 'يلزم الموافقة على نشر البيانات قبل إرسال الطلب.', { consent: 'الموافقة مطلوبة' })
    const errors = validateForSubmission(profile)
    if (Object.keys(errors).length) throw new ApiError('VALIDATION', 'أكمل الحقول المطلوبة قبل الإرسال.', errors as Record<string, string>)
    profile.publishStatus = 'pending_review'
    profile.rejectionReason = null
    profile.updatedAt = now()
    this.log('profile.submitted', member.id, 'طلب نشر الملف المهني')
    this.save()
    return { data: this.myView(member), notice: 'تم إرسال ملفك للمراجعة. ستظهر بطاقتك في الدليل فور اعتمادها.' }
  }

  async setMyVisibility(enabled: boolean): Promise<SaveResult<MyProfileView>> {
    await this.delay()
    const member = this.requireMember()
    const profile = this.profileOf(member.id)
    if (!profile) throw new ApiError('NOT_FOUND', 'لا يوجد ملف مهني.')
    profile.visibilityEnabled = enabled
    profile.updatedAt = now()
    this.log(enabled ? 'profile.unhidden' : 'profile.hidden', member.id, enabled ? 'أعاد العضو تفعيل الظهور' : 'أوقف العضو ظهور ملفه')
    this.save()
    return {
      data: this.myView(member),
      notice: enabled ? 'تم تفعيل ظهور ملفك.' : 'تم إيقاف ظهور ملفك في الدليل. عضويتك في الجمعية مستمرة ولم تتأثر.',
    }
  }

  async updateMyConsent(granted: boolean, fields: ConsentFields): Promise<SaveResult<MyProfileView>> {
    await this.delay()
    const member = this.requireMember()
    const profile = this.ensureProfile(member)
    profile.consent = {
      status: granted ? 'granted' : 'withdrawn',
      fields: granted ? { ...fields } : profile.consent.fields,
      version: this.db.settings.consentVersion,
      timestamp: now(),
      source: 'member',
      evidenceRef: null,
    }
    profile.updatedAt = now()
    const shown = Object.entries(fields).filter(([, v]) => v).map(([k]) => k).join(', ')
    this.log(granted ? 'consent.granted' : 'consent.withdrawn', member.id, granted ? `موافقة إصدار ${profile.consent.version} — حقول اختيارية: ${shown || 'لا شيء'}` : 'سحب الموافقة — أُخفي الملف فورًا')
    this.save()
    return {
      data: this.myView(member),
      notice: granted ? 'تم حفظ موافقتك.' : 'تم سحب موافقتك، ولن يظهر ملفك في الدليل. عضويتك مستمرة.',
    }
  }

  async uploadPhoto(file: File): Promise<string> {
    const s = getSession()
    if (s.role === 'visitor') throw new ApiError('FORBIDDEN', 'غير مصرح.')
    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
    const sniffed = sniffImageType(header)
    let dims: { width?: number; height?: number } = {}
    if (typeof createImageBitmap === 'function' && sniffed) {
      try {
        const bmp = await createImageBitmap(file)
        dims = { width: bmp.width, height: bmp.height }
        bmp.close()
      } catch {
        throw new ApiError('VALIDATION', 'تعذّرت قراءة الصورة. تأكد من أن الملف صورة سليمة.')
      }
    }
    const error = !sniffed ? 'محتوى الملف ليس صورة JPG أو PNG أو WEBP.' : validateImageFile({ type: sniffed, size: file.size, ...dims })
    if (error) throw new ApiError('VALIDATION', error)
    // إعادة ترميز الصورة بحجم ثابت يزيل بيانات EXIF (ومنها الموقع الجغرافي) — نفس ما يجب أن يفعله الخادم
    const bitmap = await createImageBitmap(file)
    const size = 400
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const scale = Math.max(size / bitmap.width, size / bitmap.height)
    const w = bitmap.width * scale
    const h = bitmap.height * scale
    ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h)
    bitmap.close()
    await this.delay()
    return canvas.toDataURL('image/jpeg', 0.85)
  }

  async resolveSkills(names: string[]): Promise<Skill[]> {
    if (getSession().role === 'visitor') throw new ApiError('FORBIDDEN', 'غير مصرح.')
    const out: Skill[] = []
    for (const raw of names) {
      const name = sanitizePlainText(raw, LIMITS.skillNameMax)
      if (!name) continue
      const key = normalizeText(name)
      let skill = this.db.skills.find((s) => normalizeText(s.name) === key)
      if (!skill) {
        let id = slugify(name) || `skill-${this.db.skills.length + 1}`
        if (this.db.skills.some((s) => s.id === id)) id = `${id}-${this.db.skills.length + 1}`
        skill = { id, name }
        this.db.skills.push(skill)
      }
      if (!out.some((s) => s.id === skill!.id)) out.push(clone(skill))
    }
    this.save()
    return out
  }

  // ───────────── الإدارة ─────────────

  async adminListMembers(filter: AdminMemberFilter) {
    await this.delay()
    this.requireAdmin()
    const q = normalizeText(filter.q ?? '')
    let rows = this.db.members.map((m) => this.row(m))
    rows = rows.filter((r) => {
      if (q && !normalizeText(`${r.member.fullNameAr} ${r.member.fullNameEn} ${r.member.membershipNo} ${r.member.email}`).includes(q)) return false
      if (filter.membershipTypeId && r.member.membershipTypeId !== filter.membershipTypeId) return false
      if (filter.membershipStatus && r.member.membershipStatus !== filter.membershipStatus) return false
      if (filter.publishStatus) {
        if (filter.publishStatus === 'none' ? r.profile !== null : r.profile?.publishStatus !== filter.publishStatus) return false
      }
      return true
    })
    const sort = filter.sort ?? 'name'
    rows.sort((a, b) =>
      sort === 'updated'
        ? (b.profile?.updatedAt ?? '').localeCompare(a.profile?.updatedAt ?? '')
        : sort === 'completeness'
          ? b.completeness - a.completeness
          : a.member.fullNameAr.localeCompare(b.member.fullNameAr, 'ar'),
    )
    return rows
  }

  async adminGetMember(memberId: number) {
    await this.delay()
    this.requireAdmin()
    return this.row(this.member(memberId))
  }

  async adminSaveProfile(memberId: number, content: ProfileContent): Promise<SaveResult<AdminMemberRow>> {
    await this.delay()
    this.requireAdmin()
    const member = this.member(memberId)
    if (member.membershipStatus === 'pending' || member.membershipStatus === 'cancelled')
      throw new ApiError('NOT_ELIGIBLE', 'لا يمكن إنشاء ملف مهني قبل اعتماد العضوية أو بعد إلغائها.')
    const clean = this.sanitizeContent(content)
    const profile = this.ensureProfile(member)
    const changed = CONTENT_FIELDS.filter((f) => !sameValue(profile[f], clean[f]))
    this.applyContent(profile, clean)
    if (changed.length) this.log('profile.updated', memberId, `تعديل إداري: ${changed.map((f) => FIELD_LABELS[f]).join('، ')}`)
    this.save()
    return { data: this.row(member), notice: changed.length ? 'تم حفظ الملف.' : 'لا توجد تغييرات.' }
  }

  async adminSetPublishStatus(memberId: number, status: PublishStatus, reason?: string): Promise<SaveResult<AdminMemberRow>> {
    await this.delay()
    this.requireAdmin()
    const member = this.member(memberId)
    const profile = this.profileOf(memberId)
    if (!profile) throw new ApiError('NOT_FOUND', 'لا يوجد ملف مهني لهذا العضو.')
    if (status === 'published') this.assertPublishable(member, profile)
    if (status === 'rejected' && !reason?.trim()) throw new ApiError('VALIDATION', 'سبب الرفض مطلوب ليصل إلى العضو.')
    const prev = profile.publishStatus
    profile.publishStatus = status
    profile.rejectionReason = status === 'rejected' ? sanitizePlainText(reason!, 500) : null
    if (status === 'published' && !profile.publishedAt) profile.publishedAt = now()
    profile.updatedAt = now()
    const action: AuditAction =
      status === 'published' ? 'profile.approved' : status === 'rejected' ? 'profile.rejected' : status === 'hidden' ? 'profile.hidden' : 'profile.updated'
    this.log(action, memberId, `الحالة: ${prev} ← ${status}${reason ? ` | ${reason}` : ''}`)
    this.save()
    return { data: this.row(member), notice: status === 'published' ? 'تم اعتماد الملف وأصبح ظاهرًا في الدليل.' : 'تم تحديث الحالة.' }
  }

  async adminRecordConsent(memberId: number, fields: ConsentFields, evidenceRef: string): Promise<SaveResult<AdminMemberRow>> {
    await this.delay()
    this.requireAdmin()
    const ref = sanitizePlainText(evidenceRef, 200)
    if (ref.length < 4) throw new ApiError('VALIDATION', 'أدخل مرجع إثبات الموافقة (رقم النموذج أو البريد أو المعاملة).')
    const member = this.member(memberId)
    const profile = this.ensureProfile(member)
    profile.consent = {
      status: 'granted',
      fields: { ...fields },
      version: this.db.settings.consentVersion,
      timestamp: now(),
      source: 'admin_recorded',
      evidenceRef: ref,
    }
    profile.updatedAt = now()
    this.log('consent.recorded_by_admin', memberId, `تسجيل موافقة موثقة — المرجع: ${ref}`)
    this.save()
    return { data: this.row(member), notice: 'تم تسجيل الموافقة الموثقة.' }
  }

  async adminListReviewQueue() {
    await this.delay()
    this.requireAdmin()
    return this.db.profiles
      .filter((p) => p.publishStatus === 'pending_review' || p.pendingChanges)
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
      .map((p) => this.row(this.member(p.memberId)))
  }

  async adminApprove(memberId: number): Promise<SaveResult<AdminMemberRow>> {
    this.requireAdmin()
    const member = this.member(memberId)
    const profile = this.profileOf(memberId)
    if (!profile) throw new ApiError('NOT_FOUND', 'لا يوجد ملف مهني.')
    if (profile.pendingChanges) {
      await this.delay()
      const fields = Object.keys(profile.pendingChanges) as (keyof ProfileContent)[]
      this.applyContent(profile, profile.pendingChanges)
      profile.pendingChanges = null
      this.log('profile.changes_applied', memberId, `اعتماد تعديلات: ${fields.map((f) => FIELD_LABELS[f]).join('، ')}`)
      if (profile.publishStatus !== 'pending_review') {
        this.save()
        return { data: this.row(member), notice: 'تم اعتماد التعديلات وتحديث البطاقة.' }
      }
    }
    return this.adminSetPublishStatus(memberId, 'published')
  }

  async adminReject(memberId: number, reason: string): Promise<SaveResult<AdminMemberRow>> {
    this.requireAdmin()
    const member = this.member(memberId)
    const profile = this.profileOf(memberId)
    if (!profile) throw new ApiError('NOT_FOUND', 'لا يوجد ملف مهني.')
    if (!reason.trim()) throw new ApiError('VALIDATION', 'سبب الرفض مطلوب.')
    if (profile.publishStatus === 'pending_review') return this.adminSetPublishStatus(memberId, 'rejected', reason)
    await this.delay()
    profile.pendingChanges = null
    profile.rejectionReason = `رُفضت التعديلات الأخيرة: ${sanitizePlainText(reason, 500)}`
    profile.updatedAt = now()
    this.log('profile.rejected', memberId, `رفض تعديلات معلّقة | ${reason}`)
    this.save()
    return { data: this.row(member), notice: 'تم رفض التعديلات، وبقيت النسخة المعتمدة كما هي.' }
  }

  private usage(): { spec: Map<string, number>; cat: Map<string, number>; interest: Map<string, number> } {
    const spec = new Map<string, number>()
    const cat = new Map<string, number>()
    const interest = new Map<string, number>()
    const inc = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1)
    for (const p of this.db.profiles) {
      p.specializationIds.forEach((id) => inc(spec, id))
      p.categoryIds.forEach((id) => inc(cat, id))
      p.interestIds.forEach((id) => inc(interest, id))
    }
    return { spec, cat, interest }
  }

  async adminGetTaxonomy(): Promise<TaxonomyTree> {
    await this.delay()
    this.requireAdmin()
    const u = this.usage()
    return clone({
      categories: [...this.db.categories]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((c) => ({
          ...c,
          memberCount: u.cat.get(c.id) ?? 0,
          specializations: this.db.specializations
            .filter((s) => s.categoryId === c.id)
            .map((s) => ({ ...s, memberCount: u.spec.get(s.id) ?? 0 })),
        })),
      interests: this.db.interests.map((i) => ({ ...i, memberCount: u.interest.get(i.id) ?? 0 })),
    })
  }

  private assertUniqueName<T extends { id: string; nameAr: string; nameEn: string }>(list: T[], input: { id?: string; nameAr: string; nameEn: string }) {
    const ar = normalizeText(input.nameAr)
    const en = normalizeText(input.nameEn)
    const dup = list.find((x) => x.id !== input.id && (normalizeText(x.nameAr) === ar || (en && normalizeText(x.nameEn) === en)))
    if (dup) throw new ApiError('CONFLICT', `يوجد عنصر بنفس الاسم: «${dup.nameAr}». استخدم الدمج بدلًا من التكرار.`)
  }

  async adminUpsertCategory(input: Partial<TechCategory> & Pick<TechCategory, 'nameAr' | 'nameEn'>) {
    await this.delay()
    this.requireAdmin()
    const nameAr = sanitizePlainText(input.nameAr, 80)
    const nameEn = sanitizePlainText(input.nameEn, 80)
    if (!nameAr) throw new ApiError('VALIDATION', 'الاسم العربي مطلوب.')
    this.assertUniqueName(this.db.categories, { id: input.id, nameAr, nameEn })
    let cat = input.id ? this.db.categories.find((c) => c.id === input.id) : undefined
    if (cat) Object.assign(cat, { ...input, nameAr, nameEn })
    else {
      let id = slugify(nameEn) || `cat-${this.db.categories.length + 1}`
      if (this.db.categories.some((c) => c.id === id)) id = `${id}-${this.db.categories.length + 1}`
      cat = { id, nameAr, nameEn, icon: input.icon ?? 'layers', isActive: input.isActive ?? true, displayOrder: this.db.categories.length + 1 }
      this.db.categories.push(cat)
    }
    this.log('taxonomy.changed', null, `مجال: ${nameAr} (${cat.isActive ? 'نشط' : 'مخفي'})`)
    this.save()
    return clone(cat)
  }

  async adminUpsertSpecialization(input: Partial<TechSpecialization> & Pick<TechSpecialization, 'nameAr' | 'nameEn' | 'categoryId'>) {
    await this.delay()
    this.requireAdmin()
    const nameAr = sanitizePlainText(input.nameAr, 80)
    const nameEn = sanitizePlainText(input.nameEn, 80)
    if (!nameAr) throw new ApiError('VALIDATION', 'الاسم العربي مطلوب.')
    if (!this.db.categories.some((c) => c.id === input.categoryId)) throw new ApiError('VALIDATION', 'المجال غير موجود.')
    this.assertUniqueName(this.db.specializations.filter((s) => s.categoryId === input.categoryId && !s.mergedIntoId), { id: input.id, nameAr, nameEn })
    let spec = input.id ? this.db.specializations.find((s) => s.id === input.id) : undefined
    if (spec) {
      // المعرّف ثابت عند التعديل — فلا تنقطع ارتباطات الأعضاء حتى لو تغيّر الاسم أو المجال
      const movedCategory = spec.categoryId !== input.categoryId
      Object.assign(spec, { ...input, nameAr, nameEn })
      if (movedCategory)
        for (const p of this.db.profiles)
          if (p.specializationIds.includes(spec.id) && !p.categoryIds.includes(spec.categoryId)) p.categoryIds.push(spec.categoryId)
    } else {
      let id = `${input.categoryId}.${slugify(nameEn) || this.db.specializations.length + 1}`
      if (this.db.specializations.some((s) => s.id === id)) id = `${id}-${this.db.specializations.length + 1}`
      spec = { id, categoryId: input.categoryId, nameAr, nameEn, isActive: input.isActive ?? true, mergedIntoId: null }
      this.db.specializations.push(spec)
    }
    this.log('taxonomy.changed', null, `تخصص: ${nameAr} (${spec.isActive ? 'نشط' : 'مخفي'})`)
    this.save()
    return clone(spec)
  }

  async adminUpsertInterest(input: Partial<TechInterest> & Pick<TechInterest, 'nameAr' | 'nameEn'>) {
    await this.delay()
    this.requireAdmin()
    const nameAr = sanitizePlainText(input.nameAr, 80)
    const nameEn = sanitizePlainText(input.nameEn, 80)
    if (!nameAr) throw new ApiError('VALIDATION', 'الاسم العربي مطلوب.')
    this.assertUniqueName(this.db.interests, { id: input.id, nameAr, nameEn })
    let interest = input.id ? this.db.interests.find((i) => i.id === input.id) : undefined
    if (interest) Object.assign(interest, { ...input, nameAr, nameEn })
    else {
      let id = slugify(nameEn) || `interest-${this.db.interests.length + 1}`
      if (this.db.interests.some((i) => i.id === id)) id = `${id}-${this.db.interests.length + 1}`
      interest = { id, nameAr, nameEn, isActive: input.isActive ?? true }
      this.db.interests.push(interest)
    }
    this.log('taxonomy.changed', null, `اهتمام: ${nameAr} (${interest.isActive ? 'نشط' : 'مخفي'})`)
    this.save()
    return clone(interest)
  }

  async adminMergeSpecialization(sourceId: string, targetId: string) {
    await this.delay()
    this.requireAdmin()
    if (sourceId === targetId) throw new ApiError('VALIDATION', 'اختر تخصصين مختلفين.')
    const source = this.db.specializations.find((s) => s.id === sourceId)
    const target = this.db.specializations.find((s) => s.id === targetId)
    if (!source || !target) throw new ApiError('NOT_FOUND', 'التخصص غير موجود.')
    if (target.mergedIntoId) throw new ApiError('VALIDATION', 'لا يمكن الدمج في تخصص مدموج مسبقًا.')
    let moved = 0
    const swap = (ids: string[]) => [...new Set(ids.map((id) => (id === sourceId ? targetId : id)))]
    for (const p of this.db.profiles) {
      if (p.specializationIds.includes(sourceId)) {
        moved++
        p.specializationIds = swap(p.specializationIds)
        if (!p.categoryIds.includes(target.categoryId)) p.categoryIds.push(target.categoryId)
      }
      if (p.pendingChanges?.specializationIds) p.pendingChanges.specializationIds = swap(p.pendingChanges.specializationIds)
    }
    source.isActive = false
    source.mergedIntoId = targetId
    this.log('taxonomy.merged', null, `دمج «${source.nameAr}» في «${target.nameAr}» — نُقل ${moved} عضو`)
    this.save()
    return { movedMembers: moved }
  }

  async adminDeleteSpecialization(id: string) {
    await this.delay()
    this.requireAdmin()
    const spec = this.db.specializations.find((s) => s.id === id)
    if (!spec) throw new ApiError('NOT_FOUND', 'التخصص غير موجود.')
    const inUse = this.db.profiles.some((p) => p.specializationIds.includes(id) || p.pendingChanges?.specializationIds?.includes(id))
    if (inUse) {
      spec.isActive = false
      this.log('taxonomy.changed', null, `إخفاء «${spec.nameAr}» بدل حذفه لوجود أعضاء مرتبطين`)
      this.save()
      return { deleted: false, hidden: true }
    }
    this.db.specializations = this.db.specializations.filter((s) => s.id !== id)
    this.log('taxonomy.changed', null, `حذف التخصص غير المستخدم «${spec.nameAr}»`)
    this.save()
    return { deleted: true, hidden: false }
  }

  async adminGetStats(): Promise<AdminStats> {
    await this.delay()
    this.requireAdmin()
    const meta = buildMeta({ ...this.db, settings: { ...this.db.settings, showEmptySpecializations: false } })
    return {
      totalMembers: this.db.members.length,
      activeMemberships: this.db.members.filter((m) => m.membershipStatus === 'active').length,
      publishedProfiles: meta.publishedCount,
      incompleteProfiles:
        this.db.profiles.filter((p) => p.publishStatus === 'incomplete').length +
        this.db.members.filter((m) => m.membershipStatus === 'active' && !this.profileOf(m.id)).length,
      pendingReviews: this.db.profiles.filter((p) => p.publishStatus === 'pending_review' || p.pendingChanges).length,
      hiddenProfiles: this.db.profiles.filter(
        (p) =>
          p.publishStatus === 'hidden' ||
          (p.publishStatus === 'published' && visibilityBlockers(this.member(p.memberId), p, this.db.settings).length > 0),
      ).length,
      byCategory: meta.categories.map(({ id, label, count }) => ({ id, label, count })).sort((a, b) => b.count - a.count),
      topInterests: meta.interests.slice(0, 8),
    }
  }

  async adminGetAudit(memberId?: number) {
    await this.delay()
    this.requireAdmin()
    return clone(memberId ? this.db.audit.filter((a) => a.memberId === memberId) : this.db.audit)
  }

  async adminGetSettings() {
    await this.delay()
    this.requireAdmin()
    return clone(this.db.settings)
  }

  async adminUpdateSettings(patch: Partial<DirectorySettings>) {
    await this.delay()
    this.requireAdmin()
    const before = this.db.settings
    this.db.settings = { ...before, ...patch }
    const changed = (Object.keys(patch) as (keyof DirectorySettings)[]).filter((k) => before[k] !== patch[k])
    if (changed.length) this.log('settings.changed', null, changed.map((k) => `${k}: ${before[k]} ← ${patch[k]}`).join(' | '))
    this.save()
    return clone(this.db.settings)
  }

  async adminListMembershipTypes() {
    await this.delay()
    this.requireAdmin()
    return clone(this.db.membershipTypes)
  }

  async simulateMembershipEvent(memberId: number, status: MembershipStatus) {
    await this.delay()
    this.requireAdmin()
    const member = this.member(memberId)
    const prev = member.membershipStatus
    member.membershipStatus = status
    const profile = this.profileOf(memberId)
    const visible = profile ? visibilityBlockers(member, profile, this.db.settings).length === 0 : false
    this.log('membership.status_changed', memberId, `حالة العضوية: ${prev} ← ${status} | الملف ${visible ? 'ظاهر' : 'غير ظاهر'} بعد إعادة التقييم`, true)
    this.save()
  }
}
