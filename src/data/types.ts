/**
 * نموذج النطاق (Domain Model) لمساحة الأعضاء.
 *
 * - `Member` يمثّل سجل العضوية القائم في نظام الجمعية (لا يُنشأ من هنا أبدًا).
 * - `MemberProfile` امتداد مهني للعضوية، يرتبط بـ memberId بعلاقة واحد-إلى-واحد.
 * - الأنواع `Public*` هي الشكل الوحيد المسموح بخروجه عبر الواجهات العامة.
 */

// ───────────── العضوية (من النظام القائم) ─────────────

export type MembershipStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended'

export interface MembershipType {
  /** يطابق معرّف النوع في النظام الحالي (membership.php?type=1 / type=5) */
  id: number
  nameAr: string
  nameEn: string
  isActive: boolean
}

export interface Member {
  id: number
  membershipNo: string
  fullNameAr: string
  fullNameEn: string
  membershipTypeId: number
  membershipStatus: MembershipStatus
  joinedAt: string
  expiresAt: string
  /** بيانات داخلية — لا تظهر في أي واجهة عامة إطلاقًا */
  email: string
  phone: string
}

// ───────────── التصنيف ─────────────

export interface TechCategory {
  id: string
  nameAr: string
  nameEn: string
  icon: string
  isActive: boolean
  displayOrder: number
}

export interface TechSpecialization {
  id: string
  categoryId: string
  nameAr: string
  nameEn: string
  isActive: boolean
  /** عند الدمج: يشير إلى التخصص البديل، ويُنقل الأعضاء إليه */
  mergedIntoId?: string | null
}

export interface TechInterest {
  id: string
  nameAr: string
  nameEn: string
  isActive: boolean
}

export interface Skill {
  id: string
  name: string
}

export interface CollaborationArea {
  id: string
  nameAr: string
}

// ───────────── الملف المهني ─────────────

export type PublishStatus = 'incomplete' | 'pending_review' | 'published' | 'hidden' | 'rejected'
export type ConsentStatus = 'none' | 'granted' | 'withdrawn'

/** الحقول الاختيارية التي يقرر العضو إظهارها (الاسم والمسمى والنبذة إلزامية للظهور) */
export interface ConsentFields {
  photo: boolean
  linkedin: boolean
  city: boolean
  membershipType: boolean
}

export interface Consent {
  status: ConsentStatus
  fields: ConsentFields
  /** إصدار نص الموافقة الذي وافق عليه العضو */
  version: string
  timestamp: string | null
  /** 'member' = من حساب العضو، 'admin_recorded' = موافقة موثقة خارج المنصة سجّلها الأدمن */
  source: 'member' | 'admin_recorded' | null
  evidenceRef?: string | null
}

/** الحقول القابلة للتحرير في الملف المهني */
export interface ProfileContent {
  professionalTitle: string
  profileImageUrl: string | null
  shortBio: string
  fullBio: string
  linkedinUrl: string
  city: string
  categoryIds: string[]
  specializationIds: string[]
  interestIds: string[]
  skillIds: string[]
  collaborationAreaIds: string[]
}

export interface MemberProfile extends ProfileContent {
  id: number
  memberId: number
  slug: string
  publishStatus: PublishStatus
  /** مفتاح العضو لإيقاف الظهور مؤقتًا دون المساس بحالة الاعتماد */
  visibilityEnabled: boolean
  consent: Consent
  /** تعديلات حسّاسة بانتظار الاعتماد بينما تبقى النسخة المعتمدة ظاهرة */
  pendingChanges: Partial<ProfileContent> | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

// ───────────── الإعدادات والتدقيق ─────────────

export type EditApprovalPolicy = 'review_all' | 'review_sensitive' | 'auto'

export interface DirectorySettings {
  showMembershipType: boolean
  /** الإعداد الافتراضي: إخفاء الملف تلقائيًا عند انتهاء العضوية أو إلغائها */
  hideOnMembershipInactive: boolean
  showEmptySpecializations: boolean
  editApprovalPolicy: EditApprovalPolicy
  consentVersion: string
}

export type AuditAction =
  | 'profile.created'
  | 'profile.updated'
  | 'profile.submitted'
  | 'profile.approved'
  | 'profile.rejected'
  | 'profile.hidden'
  | 'profile.unhidden'
  | 'membership.status_changed'
  | 'profile.changes_applied'
  | 'consent.granted'
  | 'consent.withdrawn'
  | 'consent.recorded_by_admin'
  | 'taxonomy.changed'
  | 'taxonomy.merged'
  | 'settings.changed'

export interface AuditLog {
  id: number
  at: string
  actor: { role: Role; id: number | null; label: string }
  action: AuditAction
  memberId: number | null
  details: string
}

// ───────────── الصلاحيات ─────────────

export type Role = 'visitor' | 'member' | 'admin'

export interface Session {
  role: Role
  /** في حالة العضو: معرّف العضوية المسجّل دخوله */
  memberId: number | null
}

// ───────────── الأشكال العامة (Public DTOs) ─────────────

export interface PublicTag {
  id: string
  label: string
  kind: 'specialization' | 'interest' | 'skill'
}

export interface PublicMemberCard {
  slug: string
  fullName: string
  professionalTitle: string
  photoUrl: string | null
  primaryCategory: { id: string; label: string } | null
  shortBio: string
  tags: PublicTag[]
  membershipType: string | null
  linkedinUrl: string | null
  city: string | null
}

export interface PublicMemberProfile extends PublicMemberCard {
  fullNameEn: string
  fullBio: string
  categories: { id: string; label: string; specializations: { id: string; label: string }[] }[]
  interests: { id: string; label: string }[]
  skills: string[]
  collaborationAreas: string[]
}

export interface DirectoryQuery {
  q?: string
  categoryId?: string
  specializationId?: string
  interestIds?: string[]
  interestMatch?: 'any' | 'all'
  membershipTypeId?: number
  city?: string
  page?: number
  pageSize?: number
}

export interface DirectoryPage {
  items: PublicMemberCard[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface FacetOption {
  id: string
  label: string
  count: number
}

export interface DirectoryMeta {
  publishedCount: number
  activeSpecializationCount: number
  categories: (FacetOption & { icon: string; specializations: FacetOption[] })[]
  interests: FacetOption[]
  membershipTypes: FacetOption[]
  cities: FacetOption[]
  showMembershipType: boolean
}

// ───────────── واجهات الإدارة ─────────────

export interface AdminMemberRow {
  member: Member
  membershipTypeName: string
  profile: MemberProfile | null
  isPubliclyVisible: boolean
  /** أسباب عدم الظهور (فارغة إذا كان الملف ظاهرًا) */
  blockers: string[]
  completeness: number
}

export interface AdminStats {
  totalMembers: number
  activeMemberships: number
  publishedProfiles: number
  incompleteProfiles: number
  pendingReviews: number
  hiddenProfiles: number
  byCategory: FacetOption[]
  topInterests: FacetOption[]
}

export interface TaxonomyTree {
  categories: (TechCategory & {
    memberCount: number
    specializations: (TechSpecialization & { memberCount: number })[]
  })[]
  interests: (TechInterest & { memberCount: number })[]
}
