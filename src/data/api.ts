import type {
  AdminMemberRow,
  AdminStats,
  AuditLog,
  CollaborationArea,
  ConsentFields,
  DirectoryMeta,
  DirectoryPage,
  DirectoryQuery,
  DirectorySettings,
  MembershipStatus,
  MembershipType,
  MemberProfile,
  ProfileContent,
  PublicMemberProfile,
  PublishStatus,
  Skill,
  TaxonomyTree,
  TechCategory,
  TechInterest,
  TechSpecialization,
} from './types'

/**
 * عقد التكامل (Integration Contract).
 *
 * الواجهة الأمامية تعتمد على هذه الواجهة فقط. يوجد تنفيذان:
 *  - MockApi: بيانات تجريبية داخل المتصفح (للمعاينة).
 *  - HttpApi: يستدعي نقاط النهاية الموصوفة في docs/INTEGRATION.md على خادم الجمعية.
 *
 * كل التحقق من الصلاحيات والأهلية يتم في الخادم؛ ما يفعله MockApi هنا محاكاة لنفس القواعد.
 */

export interface TaxonomyData {
  categories: TechCategory[]
  specializations: TechSpecialization[]
  interests: TechInterest[]
  collaborationAreas: CollaborationArea[]
  skills: Skill[]
}

export interface MyProfileView {
  member: {
    id: number
    fullNameAr: string
    fullNameEn: string
    membershipTypeName: string
    membershipStatus: MembershipStatus
    expiresAt: string
  }
  profile: MemberProfile | null
  /** العضوية معتمدة وفعّالة → يمكن إنشاء/تعديل الملف */
  eligible: boolean
  isPubliclyVisible: boolean
  blockers: string[]
  editApprovalPolicy: DirectorySettings['editApprovalPolicy']
  consentVersion: string
}

export interface SaveResult<T> {
  data: T
  /** رسالة توضيحية عن مصير التعديل حسب سياسة الاعتماد */
  notice?: string
}

export interface AdminMemberFilter {
  q?: string
  membershipTypeId?: number
  membershipStatus?: MembershipStatus
  publishStatus?: PublishStatus | 'none'
  sort?: 'name' | 'updated' | 'completeness'
}

export interface MembersHubApi {
  // ── عام (زوار) ──
  getDirectoryMeta(): Promise<DirectoryMeta>
  searchMembers(query: DirectoryQuery): Promise<DirectoryPage>
  getPublicProfile(slug: string): Promise<PublicMemberProfile | null>
  getTaxonomy(): Promise<TaxonomyData>

  // ── العضو (جلسة العضو الحالية) ──
  getMyProfile(): Promise<MyProfileView>
  saveMyProfile(content: ProfileContent): Promise<SaveResult<MyProfileView>>
  submitMyProfile(): Promise<SaveResult<MyProfileView>>
  setMyVisibility(enabled: boolean): Promise<SaveResult<MyProfileView>>
  updateMyConsent(granted: boolean, fields: ConsentFields): Promise<SaveResult<MyProfileView>>
  uploadPhoto(file: File): Promise<string>
  resolveSkills(names: string[]): Promise<Skill[]>

  // ── الإدارة (RBAC: admin) ──
  adminListMembers(filter: AdminMemberFilter): Promise<AdminMemberRow[]>
  adminGetMember(memberId: number): Promise<AdminMemberRow>
  adminSaveProfile(memberId: number, content: ProfileContent): Promise<SaveResult<AdminMemberRow>>
  adminSetPublishStatus(memberId: number, status: PublishStatus, reason?: string): Promise<SaveResult<AdminMemberRow>>
  adminRecordConsent(memberId: number, fields: ConsentFields, evidenceRef: string): Promise<SaveResult<AdminMemberRow>>
  adminListReviewQueue(): Promise<AdminMemberRow[]>
  adminApprove(memberId: number): Promise<SaveResult<AdminMemberRow>>
  adminReject(memberId: number, reason: string): Promise<SaveResult<AdminMemberRow>>
  adminGetTaxonomy(): Promise<TaxonomyTree>
  adminUpsertCategory(input: Partial<TechCategory> & Pick<TechCategory, 'nameAr' | 'nameEn'>): Promise<TechCategory>
  adminUpsertSpecialization(
    input: Partial<TechSpecialization> & Pick<TechSpecialization, 'nameAr' | 'nameEn' | 'categoryId'>,
  ): Promise<TechSpecialization>
  adminUpsertInterest(input: Partial<TechInterest> & Pick<TechInterest, 'nameAr' | 'nameEn'>): Promise<TechInterest>
  adminMergeSpecialization(sourceId: string, targetId: string): Promise<{ movedMembers: number }>
  adminDeleteSpecialization(id: string): Promise<{ deleted: boolean; hidden: boolean }>
  adminGetStats(): Promise<AdminStats>
  adminGetAudit(memberId?: number): Promise<AuditLog[]>
  adminGetSettings(): Promise<DirectorySettings>
  adminUpdateSettings(patch: Partial<DirectorySettings>): Promise<DirectorySettings>
  adminListMembershipTypes(): Promise<MembershipType[]>

  /**
   * محاكاة حدث من نظام العضويات القائم (انتهاء/تجديد/إلغاء).
   * في الإنتاج: لا توجد نقطة نهاية كهذه — تُقرأ حالة العضوية مباشرة من جدول العضويات الأصلي.
   */
  simulateMembershipEvent?(memberId: number, status: MembershipStatus): Promise<void>
}

export class ApiError extends Error {
  constructor(
    public code: 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT' | 'NOT_ELIGIBLE' | 'RATE_LIMITED' | 'NETWORK',
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
