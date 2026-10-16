import { ApiError, type AdminMemberFilter, type MembersHubApi } from '../api'
import type { ConsentFields, DirectoryQuery, DirectorySettings, ProfileContent, PublishStatus } from '../types'

/**
 * طبقة التكامل الحقيقي مع خادم الجمعية.
 *
 * ⚠️ غير مختبرة مع خادم فعلي — نقاط النهاية أدناه مقترحة في docs/INTEGRATION.md
 * ويجب تنفيذها داخل مشروع PHP الحالي (/members) بإعادة استخدام جلسة الدخول القائمة.
 *
 * - المصادقة: كوكي الجلسة الحالية (credentials: 'include') — لا توجد رموز في localStorage.
 * - CSRF: يُقرأ الرمز من <meta name="csrf-token"> الذي يطبعه قالب PHP.
 * - الخادم هو المرجع الوحيد للدور والصلاحية والأهلية.
 */
export class HttpApi implements MembersHubApi {
  constructor(private base: string) {}

  private csrf(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''
  }

  private async req<T>(method: string, path: string, body?: unknown): Promise<T> {
    let res: Response
    try {
      res = await fetch(`${this.base}${path}`, {
        method,
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
          ...(method !== 'GET' ? { 'X-CSRF-Token': this.csrf() } : {}),
        },
        body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch {
      throw new ApiError('NETWORK', 'تعذّر الاتصال بالخادم.')
    }
    if (res.status === 204) return undefined as T
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      const map: Record<number, ApiError['code']> = { 401: 'FORBIDDEN', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT', 422: 'VALIDATION', 429: 'RATE_LIMITED' }
      throw new ApiError(json?.error?.code ?? map[res.status] ?? 'NETWORK', json?.error?.message ?? 'حدث خطأ غير متوقع.', json?.error?.fieldErrors)
    }
    return json as T
  }

  private qs(params: Record<string, unknown>): string {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === '' || v === null) continue
      if (Array.isArray(v)) v.forEach((x) => sp.append(`${k}[]`, String(x)))
      else sp.set(k, String(v))
    }
    const s = sp.toString()
    return s ? `?${s}` : ''
  }

  // عام
  getDirectoryMeta = () => this.req<Awaited<ReturnType<MembersHubApi['getDirectoryMeta']>>>('GET', '/directory/meta')
  searchMembers = (q: DirectoryQuery) => this.req<Awaited<ReturnType<MembersHubApi['searchMembers']>>>('GET', `/directory/members${this.qs({ ...q })}`)
  getPublicProfile = async (slug: string) => {
    try {
      return await this.req<Awaited<ReturnType<MembersHubApi['getPublicProfile']>>>('GET', `/directory/members/${encodeURIComponent(slug)}`)
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NOT_FOUND') return null
      throw e
    }
  }
  getTaxonomy = () => this.req<Awaited<ReturnType<MembersHubApi['getTaxonomy']>>>('GET', '/taxonomy')

  // العضو
  getMyProfile = () => this.req<Awaited<ReturnType<MembersHubApi['getMyProfile']>>>('GET', '/me/profile')
  saveMyProfile = (c: ProfileContent) => this.req<Awaited<ReturnType<MembersHubApi['saveMyProfile']>>>('PUT', '/me/profile', c)
  submitMyProfile = () => this.req<Awaited<ReturnType<MembersHubApi['submitMyProfile']>>>('POST', '/me/profile/submit')
  setMyVisibility = (enabled: boolean) => this.req<Awaited<ReturnType<MembersHubApi['setMyVisibility']>>>('POST', '/me/profile/visibility', { enabled })
  updateMyConsent = (granted: boolean, fields: ConsentFields) =>
    this.req<Awaited<ReturnType<MembersHubApi['updateMyConsent']>>>('PUT', '/me/consent', { granted, fields })
  uploadPhoto = async (file: File) => {
    const fd = new FormData()
    fd.append('photo', file)
    const r = await this.req<{ url: string }>('POST', '/me/profile/photo', fd)
    return r.url
  }
  resolveSkills = (names: string[]) => this.req<Awaited<ReturnType<MembersHubApi['resolveSkills']>>>('POST', '/skills/resolve', { names })

  // الإدارة
  adminListMembers = (f: AdminMemberFilter) => this.req<Awaited<ReturnType<MembersHubApi['adminListMembers']>>>('GET', `/admin/members${this.qs({ ...f })}`)
  adminGetMember = (id: number) => this.req<Awaited<ReturnType<MembersHubApi['adminGetMember']>>>('GET', `/admin/members/${id}`)
  adminSaveProfile = (id: number, c: ProfileContent) => this.req<Awaited<ReturnType<MembersHubApi['adminSaveProfile']>>>('PUT', `/admin/members/${id}/profile`, c)
  adminSetPublishStatus = (id: number, status: PublishStatus, reason?: string) =>
    this.req<Awaited<ReturnType<MembersHubApi['adminSetPublishStatus']>>>('POST', `/admin/members/${id}/profile/status`, { status, reason })
  adminRecordConsent = (id: number, fields: ConsentFields, evidenceRef: string) =>
    this.req<Awaited<ReturnType<MembersHubApi['adminRecordConsent']>>>('POST', `/admin/members/${id}/consent`, { fields, evidenceRef })
  adminListReviewQueue = () => this.req<Awaited<ReturnType<MembersHubApi['adminListReviewQueue']>>>('GET', '/admin/reviews')
  adminApprove = (id: number) => this.req<Awaited<ReturnType<MembersHubApi['adminApprove']>>>('POST', `/admin/reviews/${id}/approve`)
  adminReject = (id: number, reason: string) => this.req<Awaited<ReturnType<MembersHubApi['adminReject']>>>('POST', `/admin/reviews/${id}/reject`, { reason })
  adminGetTaxonomy = () => this.req<Awaited<ReturnType<MembersHubApi['adminGetTaxonomy']>>>('GET', '/admin/taxonomy')
  adminUpsertCategory: MembersHubApi['adminUpsertCategory'] = (i) =>
    i.id ? this.req('PUT', `/admin/taxonomy/categories/${i.id}`, i) : this.req('POST', '/admin/taxonomy/categories', i)
  adminUpsertSpecialization: MembersHubApi['adminUpsertSpecialization'] = (i) =>
    i.id ? this.req('PUT', `/admin/taxonomy/specializations/${encodeURIComponent(i.id)}`, i) : this.req('POST', '/admin/taxonomy/specializations', i)
  adminUpsertInterest: MembersHubApi['adminUpsertInterest'] = (i) =>
    i.id ? this.req('PUT', `/admin/taxonomy/interests/${i.id}`, i) : this.req('POST', '/admin/taxonomy/interests', i)
  adminMergeSpecialization = (sourceId: string, targetId: string) =>
    this.req<{ movedMembers: number }>('POST', '/admin/taxonomy/specializations/merge', { sourceId, targetId })
  adminDeleteSpecialization = (id: string) => this.req<{ deleted: boolean; hidden: boolean }>('DELETE', `/admin/taxonomy/specializations/${encodeURIComponent(id)}`)
  adminGetStats = () => this.req<Awaited<ReturnType<MembersHubApi['adminGetStats']>>>('GET', '/admin/stats')
  adminGetAudit = (memberId?: number) => this.req<Awaited<ReturnType<MembersHubApi['adminGetAudit']>>>('GET', `/admin/audit${this.qs({ memberId })}`)
  adminGetSettings = () => this.req<DirectorySettings>('GET', '/admin/settings')
  adminUpdateSettings = (p: Partial<DirectorySettings>) => this.req<DirectorySettings>('PATCH', '/admin/settings', p)
  adminListMembershipTypes = () => this.req<Awaited<ReturnType<MembersHubApi['adminListMembershipTypes']>>>('GET', '/admin/membership-types')
}
