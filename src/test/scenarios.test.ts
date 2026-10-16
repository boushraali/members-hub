import { beforeEach, describe, expect, it } from 'vitest'
import { MockApi } from '../data/mock/mockApi'
import { setSession } from '../data/session'
import { ApiError } from '../data/api'
import type { ProfileContent } from '../data/types'

const SARAH = 1001
const JAWAHER = 1013
const LAYAN = 1027 // عضوية فعّالة بلا ملف مهني
const HASSAN = 1028 // بانتظار المراجعة
const IBRAHIM = 1030 // عضوية منتهية
const WAAD = 1031 // سحبت الموافقة
const ABEER = 1033 // أوقفت الظهور
const FAISAL = 1034 // عضوية غير معتمدة بعد

let api: MockApi
const asVisitor = () => setSession('visitor')
const asAdmin = () => setSession('admin')
const asMember = (id: number) => setSession('member', id)
const names = async (q: Parameters<MockApi['searchMembers']>[0]) =>
  (await api.searchMembers({ pageSize: 24, ...q })).items.map((m) => m.fullName)

beforeEach(() => {
  api = new MockApi({ latencyMs: [0, 0], persist: false })
  asVisitor()
})

describe('السيناريو 1: استكشاف تخصص', () => {
  it('يعرض أعضاء مجال الذكاء الاصطناعي ثم يضيّق إلى معالجة اللغات الطبيعية', async () => {
    const ai = await api.searchMembers({ categoryId: 'ai', pageSize: 24 })
    expect(ai.total).toBeGreaterThan(5)
    for (const card of ai.items) expect(card.fullName).toBeTruthy()

    const nlp = await names({ categoryId: 'ai', specializationId: 'ai.nlp' })
    expect(nlp).toEqual(expect.arrayContaining(['سارة العتيبي', 'زياد التميمي']))
    expect(nlp.length).toBeLessThan(ai.total)
  })
})

describe('السيناريو 2: خبرات مشتركة (تخصص + اهتمام)', () => {
  it('الأمن السيبراني + اهتمام الذكاء الاصطناعي يطابق الشرطين معًا', async () => {
    const result = await names({ categoryId: 'cyber', interestIds: ['ai'] })
    expect(result.sort()).toEqual(['أروى العسيري', 'شهد الأحمدي', 'فهد القحطاني', 'هند السبيعي'].sort())
    expect(result).not.toContain('عبدالله الدوسري') // أمن سيبراني بلا اهتمام بالذكاء الاصطناعي
  })

  it('مطابقة جميع الاهتمامات مقابل أيٍّ منها', async () => {
    const any = await api.searchMembers({ interestIds: ['hackathons', 'volunteering'], interestMatch: 'any', pageSize: 24 })
    const all = await api.searchMembers({ interestIds: ['hackathons', 'volunteering'], interestMatch: 'all', pageSize: 24 })
    expect(all.total).toBeLessThan(any.total)
    expect(all.total).toBeGreaterThan(0)
  })

  it('البحث الذكي يتجاهل الهمزات والتشكيل ويبحث في المهارات والمسمى', async () => {
    expect(await names({ q: 'اختبار الإختراق' })).toContain('عبدالله الدوسري')
    expect(await names({ q: 'pytorch' })).toEqual(expect.arrayContaining(['سارة العتيبي', 'نورة الشهري']))
    expect(await names({ q: 'مهندسة رؤيه' })).toContain('غادة الفيفي')
  })
})

describe('السيناريو 3: عرض ملف عضو', () => {
  it('يعيد الملف العام مع LinkedIn ودون أي بيانات داخلية', async () => {
    const profile = await api.getPublicProfile('sarah-alotaibi')
    expect(profile?.fullName).toBe('سارة العتيبي')
    expect(profile?.linkedinUrl).toMatch(/^https:\/\/www\.linkedin\.com\/in\//)
    const json = JSON.stringify(profile)
    expect(json).not.toMatch(/@example\.com|0500000|membershipNo|email|phone|memberId/)
  })

  it('لا يمكن فتح ملف غير منشور حتى بمعرفة الرابط', async () => {
    expect(await api.getPublicProfile('hassan-al-saeed')).toBeNull() // بانتظار المراجعة
    expect(await api.getPublicProfile('ibrahim-alhamdan')).toBeNull() // عضوية منتهية
    expect(await api.getPublicProfile('waad-althubaiti')).toBeNull() // سحب الموافقة
    expect(await api.getPublicProfile('abeer-alsahli')).toBeNull() // أوقفت الظهور
  })
})

describe('السيناريو 4: الأدمن ينشئ ملف عضو ويعتمده', () => {
  const content: ProfileContent = {
    professionalTitle: 'مهندسة ذكاء اصطناعي',
    profileImageUrl: null,
    shortBio:
      'أعمل على تطوير حلول ذكاء اصطناعي تطبيقية للقطاع الصحي، وأركز على بناء نماذج تعلم آلة قابلة للتفسير، وأسعى لتمكين الكوادر الطبية من الاستفادة من البيانات في دعم القرار السريري اليومي.',
    fullBio: '',
    linkedinUrl: 'linkedin.com/in/example-layan',
    city: 'الرياض',
    categoryIds: ['ai', 'sector'],
    specializationIds: ['ai.ml', 'sector.healthtech'],
    interestIds: ['ai', 'research'],
    skillIds: [],
    collaborationAreaIds: ['research'],
  }

  it('لا يُنشر دون موافقة، ثم يظهر تلقائيًا بعد تسجيل الموافقة والاعتماد', async () => {
    asAdmin()
    const saved = await api.adminSaveProfile(LAYAN, content)
    expect(saved.data.profile?.linkedinUrl).toBe('https://www.linkedin.com/in/example-layan')
    expect(saved.data.profile?.publishStatus).toBe('incomplete')

    await expect(api.adminSetPublishStatus(LAYAN, 'published')).rejects.toMatchObject({ code: 'VALIDATION' })

    await api.adminRecordConsent(LAYAN, { photo: true, linkedin: true, city: true, membershipType: true }, 'نموذج موافقة رقم 2026-114')
    const approved = await api.adminSetPublishStatus(LAYAN, 'published')
    expect(approved.data.isPubliclyVisible).toBe(true)

    asVisitor()
    expect(await names({ q: 'ليان' })).toEqual(['ليان الشريف'])
    const audit = (asAdmin(), await api.adminGetAudit(LAYAN)).map((a) => a.action)
    expect(audit).toEqual(expect.arrayContaining(['profile.created', 'consent.recorded_by_admin', 'profile.approved']))
  })

  it('اعتماد طلب معلّق من قائمة المراجعة', async () => {
    asAdmin()
    const queue = await api.adminListReviewQueue()
    expect(queue.map((r) => r.member.id)).toEqual(expect.arrayContaining([HASSAN, JAWAHER]))
    await api.adminApprove(HASSAN)
    asVisitor()
    expect(await names({ q: 'حسن' })).toContain('حسن آل سعيد')
  })

  it('لا يمكن إنشاء ملف لعضوية لم تُعتمد بعد', async () => {
    asAdmin()
    await expect(api.adminSaveProfile(FAISAL, content)).rejects.toMatchObject({ code: 'NOT_ELIGIBLE' })
  })
})

describe('السيناريو 5: العضو يعدّل بياناته', () => {
  it('تعديل الاهتمامات ينعكس فورًا، وتعديل المسمى ينتظر الاعتماد', async () => {
    asMember(SARAH)
    const view = await api.getMyProfile()
    const current = view.profile!

    const r1 = await api.saveMyProfile({ ...current, interestIds: [...current.interestIds, 'volunteering'] })
    expect(r1.data.profile?.pendingChanges).toBeNull()
    asVisitor()
    expect(await names({ interestIds: ['volunteering'], categoryId: 'ai' })).toContain('سارة العتيبي')

    asMember(SARAH)
    const r2 = await api.saveMyProfile({ ...r1.data.profile!, professionalTitle: 'قائدة فريق معالجة اللغات' })
    expect(r2.data.profile?.pendingChanges).toEqual({ professionalTitle: 'قائدة فريق معالجة اللغات' })
    asVisitor()
    expect((await api.getPublicProfile('sarah-alotaibi'))?.professionalTitle).toBe('أخصائية معالجة لغات طبيعية')

    asAdmin()
    await api.adminApprove(SARAH)
    asVisitor()
    expect((await api.getPublicProfile('sarah-alotaibi'))?.professionalTitle).toBe('قائدة فريق معالجة اللغات')
  })

  it('إيقاف الظهور يخفي البطاقة دون المساس بالعضوية', async () => {
    asMember(SARAH)
    const r = await api.setMyVisibility(false)
    expect(r.data.member.membershipStatus).toBe('active')
    expect(r.notice).toContain('عضويتك')
    asVisitor()
    expect(await api.getPublicProfile('sarah-alotaibi')).toBeNull()
  })

  it('سحب الموافقة يخفي الملف فورًا', async () => {
    asMember(SARAH)
    await api.updateMyConsent(false, { photo: false, linkedin: false, city: false, membershipType: false })
    asVisitor()
    expect(await names({ q: 'سارة' })).toEqual([])
  })

  it('ينشئ ملفًا واحدًا فقط لكل عضوية مهما تكرر الحفظ', async () => {
    asMember(LAYAN)
    const empty = (await api.getMyProfile()).profile
    expect(empty).toBeNull()
    const blank: ProfileContent = {
      professionalTitle: 'مسودة', profileImageUrl: null, shortBio: '', fullBio: '', linkedinUrl: '', city: '',
      categoryIds: [], specializationIds: [], interestIds: [], skillIds: [], collaborationAreaIds: [],
    }
    const a = await api.saveMyProfile(blank)
    const b = await api.saveMyProfile({ ...blank, professionalTitle: 'مسودة 2' })
    expect(a.data.profile!.id).toBe(b.data.profile!.id)
    asAdmin()
    const rows = await api.adminListMembers({ q: 'ليان' })
    expect(rows).toHaveLength(1)
  })
})

describe('طلب النشر (UC-07)', () => {
  it('يُرفض الطلب دون حقول مكتملة أو موافقة، ثم يدخل قائمة المراجعة عند اكتماله', async () => {
    const MAHA = 1029
    asMember(MAHA)
    await expect(api.submitMyProfile()).rejects.toMatchObject({ code: 'VALIDATION' })
    const p = (await api.getMyProfile()).profile!
    await api.saveMyProfile({
      ...p,
      professionalTitle: 'محللة نظم',
      shortBio:
        'طالبة نظم معلومات مهتمة بتحليل النظم ونمذجة الإجراءات، شاركت في مشروع تخرج لرقمنة خدمات طلابية، وأتطلع إلى التعاون مع المختصين في التحول الرقمي وتحليل الأعمال داخل الجهات الحكومية.',
    })
    await expect(api.submitMyProfile()).rejects.toMatchObject({ code: 'VALIDATION', fieldErrors: { consent: expect.any(String) } })
    await api.updateMyConsent(true, { photo: true, linkedin: true, city: true, membershipType: true })
    const r = await api.submitMyProfile()
    expect(r.data.profile!.publishStatus).toBe('pending_review')
    asAdmin()
    expect((await api.adminListReviewQueue()).map((x) => x.member.id)).toContain(MAHA)
  })
})

describe('دورة حياة العضوية', () => {
  it('انتهاء العضوية يخفي الملف، والتجديد يعيد تقييم الظهور', async () => {
    asVisitor()
    expect(await api.getPublicProfile('ibrahim-alhamdan')).toBeNull()
    asAdmin()
    await api.simulateMembershipEvent(IBRAHIM, 'active')
    asVisitor()
    expect(await api.getPublicProfile('ibrahim-alhamdan')).not.toBeNull()
    asAdmin()
    await api.simulateMembershipEvent(IBRAHIM, 'cancelled')
    asVisitor()
    expect(await api.getPublicProfile('ibrahim-alhamdan')).toBeNull()
  })

  it('العضو ذو العضوية غير الفعّالة لا يستطيع تعديل ملفه', async () => {
    asMember(IBRAHIM)
    const view = await api.getMyProfile()
    expect(view.eligible).toBe(false)
    await expect(api.saveMyProfile(view.profile!)).rejects.toMatchObject({ code: 'NOT_ELIGIBLE' })
  })
})

describe('الأمان والخصوصية', () => {
  it('RBAC: الزائر والعضو لا يصلان لواجهات الإدارة', async () => {
    await expect(api.adminListMembers({})).rejects.toBeInstanceOf(ApiError)
    asMember(SARAH)
    await expect(api.adminGetStats()).rejects.toMatchObject({ code: 'FORBIDDEN' })
    asVisitor()
    await expect(api.getMyProfile()).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('تنظيف النبذة من الأكواد ورفض روابط LinkedIn المزيفة', async () => {
    asMember(SARAH)
    const p = (await api.getMyProfile()).profile!
    const r = await api.saveMyProfile({ ...p, fullBio: 'نص <script>alert(1)</script><img src=x onerror=alert(1)> سليم' })
    // الملف منشور، فالنبذة (حقل حساس) تُعلّق للمراجعة — وتُنظَّف قبل التعليق
    expect(r.data.profile!.pendingChanges?.fullBio).toBe('نص alert(1) سليم')
    await expect(api.saveMyProfile({ ...p, linkedinUrl: 'https://linkedin.com.evil.io/in/x' })).rejects.toMatchObject({ code: 'VALIDATION' })
    await expect(api.saveMyProfile({ ...p, linkedinUrl: 'javascript:alert(1)' })).rejects.toMatchObject({ code: 'VALIDATION' })
  })

  it('لا يمكن التصفية بنوع العضوية أو المدينة لمن لم يوافق على إظهارهما', async () => {
    const students = await api.searchMembers({ membershipTypeId: 5, pageSize: 24 })
    for (const c of students.items) expect(c.membershipType).toBe('عضو طالب')
    const badrCity = await names({ city: 'الرياض', q: 'بدر' })
    expect(badrCity).toEqual([]) // بدر أخفى مدينته
  })

  it('حجم الصفحة محدود ومعدل الطلبات مقيّد (الحد من الجمع الآلي)', async () => {
    const page = await api.searchMembers({ pageSize: 1000 })
    expect(page.items.length).toBeLessThanOrEqual(24)
    const limited = new MockApi({ latencyMs: [0, 0], persist: false, searchRateLimitPerMinute: 3 })
    await limited.searchMembers({})
    await limited.searchMembers({})
    await limited.searchMembers({})
    await expect(limited.searchMembers({})).rejects.toMatchObject({ code: 'RATE_LIMITED' })
  })

  it('الإحصائيات العامة محسوبة من الملفات الظاهرة فقط', async () => {
    const meta = await api.getDirectoryMeta()
    const all = await api.searchMembers({ pageSize: 24, page: 1 })
    const p2 = await api.searchMembers({ pageSize: 24, page: 2 })
    expect(meta.publishedCount).toBe(all.items.length + p2.items.length)
    expect(meta.publishedCount).toBe(26)
    expect(meta.categories.every((c) => c.count > 0)).toBe(true)
  })
})

describe('إدارة التصنيفات', () => {
  it('دمج التخصص المكرر ينقل الأعضاء ولا يفقد الارتباطات', async () => {
    asAdmin()
    const before = await api.adminGetTaxonomy()
    const cyberNetsec = before.categories.find((c) => c.id === 'cyber')!.specializations.find((s) => s.id === 'cyber.netsec')!
    expect(cyberNetsec.memberCount).toBeGreaterThan(0)
    const { movedMembers } = await api.adminMergeSpecialization('cyber.netsec', 'network.netsec')
    expect(movedMembers).toBe(cyberNetsec.memberCount)
    asVisitor()
    expect(await names({ specializationId: 'network.netsec' })).toContain('شهد الأحمدي')
    expect(await names({ categoryId: 'network' })).toContain('شهد الأحمدي')
  })

  it('حذف تخصص مستخدم يتحول إلى إخفاء، ويمنع تكرار الأسماء', async () => {
    asAdmin()
    expect(await api.adminDeleteSpecialization('ai.nlp')).toEqual({ deleted: false, hidden: true })
    await expect(api.adminUpsertSpecialization({ categoryId: 'ai', nameAr: 'تعلم الالة', nameEn: 'ML' })).rejects.toMatchObject({ code: 'CONFLICT' })
    const meta = (asVisitor(), await api.getDirectoryMeta())
    expect(meta.categories.find((c) => c.id === 'ai')!.specializations.some((s) => s.id === 'ai.nlp')).toBe(false)
  })

  it('إخفاء نوع العضوية من الإعدادات يزيل الفلتر والقيمة من البطاقات', async () => {
    asAdmin()
    await api.adminUpdateSettings({ showMembershipType: false })
    asVisitor()
    const meta = await api.getDirectoryMeta()
    expect(meta.membershipTypes).toEqual([])
    const page = await api.searchMembers({})
    expect(page.items.every((c) => c.membershipType === null)).toBe(true)
  })
})

describe('حالات خاصة', () => {
  it('العضو الذي سحب موافقته وعضو أوقف الظهور غير ظاهرين للأدمن كمنشورين', async () => {
    asAdmin()
    const waad = await api.adminGetMember(WAAD)
    const abeer = await api.adminGetMember(ABEER)
    expect(waad.isPubliclyVisible).toBe(false)
    expect(waad.blockers).toContain('سحب العضو موافقته على النشر')
    expect(abeer.blockers).toContain('أوقف العضو ظهور ملفه')
  })
})
