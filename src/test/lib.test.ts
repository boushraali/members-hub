import { describe, expect, it } from 'vitest'
import { matchesAllTokens, normalizeText, slugify } from '../lib/text'
import { LIMITS, normalizeLinkedinUrl, sanitizePlainText, sniffImageType, validateImageFile } from '../lib/validation'
import { buildSeed } from '../data/mock/seed'
import { SEED_SPECIALIZATIONS } from '../data/taxonomy'

describe('تطبيع النص العربي', () => {
  it('يوحّد الهمزات والتاء المربوطة ويزيل التشكيل والتطويل', () => {
    expect(normalizeText('الإِخْتِبَـــار')).toBe('الاختبار')
    expect(normalizeText('رؤية حاسوبيّة')).toBe(normalizeText('رويه حاسوبيه'))
    expect(matchesAllTokens('مهندس الأمن السيبراني', 'امن سيبراني')).toBe(true)
    expect(matchesAllTokens('مهندس الأمن السيبراني', 'امن شبكات')).toBe(false)
  })
  it('ينشئ معرّف رابط لاتيني', () => {
    expect(slugify('Hassan Al Saeed')).toBe('hassan-al-saeed')
  })
})

describe('التحقق من LinkedIn', () => {
  it.each([
    ['https://www.linkedin.com/in/sara-ai', 'https://www.linkedin.com/in/sara-ai'],
    ['linkedin.com/in/sara-ai/', 'https://www.linkedin.com/in/sara-ai'],
    ['https://sa.linkedin.com/in/sara-ai', 'https://www.linkedin.com/in/sara-ai'],
  ])('يقبل %s', (input, out) => expect(normalizeLinkedinUrl(input)).toBe(out))

  it.each([
    'https://linkedin.com.evil.io/in/x',
    'https://evil.io/linkedin.com/in/xyz',
    'javascript:alert(1)',
    'https://www.linkedin.com/company/aia',
    'https://user:pass@www.linkedin.com/in/xyz',
    'ftp://linkedin.com/in/xyz',
  ])('يرفض %s', (input) => expect(normalizeLinkedinUrl(input)).toBeNull())
})

describe('تنظيف النصوص', () => {
  it('يزيل الوسوم وأحرف التحكم واتجاه النص المخفي', () => {
    expect(sanitizePlainText('<b>مرحبا</b>‮ عالم', 100)).toBe('مرحبا عالم')
    expect(sanitizePlainText('x'.repeat(300), 250)).toHaveLength(250)
  })
})

describe('التحقق من الصور', () => {
  it('يتعرف على التوقيع الثنائي ويرفض الملفات المتنكرة', () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png')
    expect(sniffImageType(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull()
  })
  it('يطبق حدود النوع والحجم والأبعاد', () => {
    expect(validateImageFile({ type: 'image/gif', size: 10 })).toMatch(/الصيغ/)
    expect(validateImageFile({ type: 'image/png', size: LIMITS.imageMaxBytes + 1 })).toMatch(/2 ميجابايت/)
    expect(validateImageFile({ type: 'image/png', size: 1000, width: 100, height: 100 })).toMatch(/أبعاد/)
    expect(validateImageFile({ type: 'image/png', size: 1000, width: 400, height: 400 })).toBeNull()
  })
})

describe('سلامة البيانات التجريبية', () => {
  const { profiles } = buildSeed()
  it('النبذة المختصرة للملفات المنشورة بين 150 و250 حرفًا', () => {
    for (const p of profiles.filter((x) => x.publishStatus === 'published' || x.publishStatus === 'pending_review')) {
      expect(p.shortBio.length, p.slug).toBeGreaterThanOrEqual(LIMITS.shortBioMin)
      expect(p.shortBio.length, p.slug).toBeLessThanOrEqual(LIMITS.shortBioMax)
    }
  })
  it('كل التخصصات المرتبطة موجودة في التصنيف ومعرّفات الروابط فريدة', () => {
    const ids = new Set(SEED_SPECIALIZATIONS.map((s) => s.id))
    for (const p of profiles) for (const s of p.specializationIds) expect(ids.has(s), s).toBe(true)
    expect(new Set(profiles.map((p) => p.slug)).size).toBe(profiles.length)
    expect(new Set(profiles.map((p) => p.memberId)).size).toBe(profiles.length)
  })
})
