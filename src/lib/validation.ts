import type { ProfileContent } from '../data/types'

export const LIMITS = {
  titleMax: 80,
  shortBioMin: 150,
  shortBioMax: 250,
  fullBioMax: 2000,
  skillsMax: 12,
  skillNameMax: 40,
  interestsMax: 10,
  specializationsMax: 10,
  categoriesMax: 3,
  imageMaxBytes: 2 * 1024 * 1024,
  imageMinDimension: 200,
  imageAllowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
}

/**
 * تنظيف النصوص الحرة: النبذة نص عادي فقط (لا HTML).
 * يُزال أي وسم وأحرف التحكم، ويُعرض النص لاحقًا عبر React (escape تلقائي).
 * على الخادم: نفس القاعدة + htmlspecialchars عند العرض في PHP.
 */
export function sanitizePlainText(input: string, maxLength: number): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‎‏‪-‮⁦-⁩]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength)
}

/** يقبل فقط روابط الملفات الشخصية على linkedin.com عبر https، ويعيد الرابط بصيغة موحّدة أو null */
export function normalizeLinkedinUrl(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.username || url.password || url.port) return null
  const host = url.hostname.toLowerCase()
  if (host !== 'linkedin.com' && !/^[a-z]{2,3}\.linkedin\.com$/.test(host) && host !== 'www.linkedin.com') return null
  const match = url.pathname.match(/^\/in\/([A-Za-z0-9\-_%]{3,100})\/?$/)
  if (!match) return null
  return `https://www.linkedin.com/in/${match[1]}`
}

export interface ImageCheckInput {
  type: string
  size: number
  width?: number
  height?: number
}

export function validateImageFile(file: ImageCheckInput): string | null {
  if (!(LIMITS.imageAllowedTypes as readonly string[]).includes(file.type)) {
    return 'الصيغ المسموحة: JPG أو PNG أو WEBP فقط.'
  }
  if (file.size > LIMITS.imageMaxBytes) return 'الحد الأقصى لحجم الصورة 2 ميجابايت.'
  if (file.width !== undefined && file.height !== undefined) {
    if (file.width < LIMITS.imageMinDimension || file.height < LIMITS.imageMinDimension) {
      return `أقل أبعاد مقبولة ${LIMITS.imageMinDimension}×${LIMITS.imageMinDimension} بكسل.`
    }
  }
  return null
}

/** التحقق من التوقيع الثنائي (magic bytes) — لا يُعتمد على امتداد الملف أو نوعه المعلن فقط */
export function sniffImageType(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return 'image/png'
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  )
    return 'image/webp'
  return null
}

export type FieldErrors = Partial<Record<keyof ProfileContent | 'consent', string>>

/** التحقق اللازم قبل إرسال الملف للمراجعة (الحفظ كمسودة لا يشترط الاكتمال) */
export function validateForSubmission(p: ProfileContent): FieldErrors {
  const errors: FieldErrors = {}
  if (!p.professionalTitle.trim()) errors.professionalTitle = 'المسمى الوظيفي مطلوب.'
  else if (p.professionalTitle.length > LIMITS.titleMax) errors.professionalTitle = `الحد الأقصى ${LIMITS.titleMax} حرفًا.`
  const bioLen = p.shortBio.trim().length
  if (bioLen < LIMITS.shortBioMin || bioLen > LIMITS.shortBioMax)
    errors.shortBio = `النبذة المختصرة بين ${LIMITS.shortBioMin} و${LIMITS.shortBioMax} حرفًا (الحالي: ${bioLen}).`
  if (p.fullBio.length > LIMITS.fullBioMax) errors.fullBio = `الحد الأقصى ${LIMITS.fullBioMax} حرف.`
  if (p.categoryIds.length < 1) errors.categoryIds = 'اختر مجالًا رئيسيًا واحدًا على الأقل.'
  else if (p.categoryIds.length > LIMITS.categoriesMax) errors.categoryIds = `الحد الأقصى ${LIMITS.categoriesMax} مجالات.`
  if (p.specializationIds.length < 1) errors.specializationIds = 'اختر تخصصًا فرعيًا واحدًا على الأقل.'
  else if (p.specializationIds.length > LIMITS.specializationsMax)
    errors.specializationIds = `الحد الأقصى ${LIMITS.specializationsMax} تخصصات.`
  if (p.interestIds.length > LIMITS.interestsMax) errors.interestIds = `الحد الأقصى ${LIMITS.interestsMax} اهتمامات.`
  if (p.skillIds.length > LIMITS.skillsMax) errors.skillIds = `الحد الأقصى ${LIMITS.skillsMax} مهارة.`
  if (p.linkedinUrl.trim() && !normalizeLinkedinUrl(p.linkedinUrl))
    errors.linkedinUrl = 'أدخل رابط ملف شخصي صحيحًا بالشكل https://www.linkedin.com/in/username'
  return errors
}

/** نسبة اكتمال الملف (لعرضها للعضو والأدمن) */
export function profileCompleteness(p: ProfileContent): number {
  const checks = [
    !!p.professionalTitle.trim(),
    !!p.profileImageUrl,
    p.shortBio.trim().length >= LIMITS.shortBioMin,
    p.fullBio.trim().length > 0,
    p.categoryIds.length > 0,
    p.specializationIds.length > 0,
    p.interestIds.length > 0,
    p.skillIds.length > 0,
    !!p.linkedinUrl.trim(),
    !!p.city.trim(),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
