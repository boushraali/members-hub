/**
 * تطبيع النص العربي والإنجليزي لأغراض البحث:
 * إزالة التشكيل والتطويل، توحيد الهمزات والتاء المربوطة والألف المقصورة، وتوحيد حالة الأحرف.
 * يجب تطبيق نفس الدالة في الخادم عند بناء عمود البحث (search_text).
 */
export function normalizeText(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[ً-ٰٟۖ-ۭ]/g, '') // التشكيل
    .replace(/ـ/g, '') // التطويل
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** يُرجع الكلمات بعد التطبيع، مع تجاهل "ال" التعريف في بداية الكلمات العربية لتحسين المطابقة */
export function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(/[\s,،؛;/|]+/)
    .filter(Boolean)
    .map((t) => (t.length > 3 && t.startsWith('ال') ? t.slice(2) : t))
}

export function matchesAllTokens(haystack: string, query: string): boolean {
  const tokens = tokenize(query)
  if (tokens.length === 0) return true
  const normalized = normalizeText(haystack)
  return tokens.every((t) => normalized.includes(t))
}

/** إنشاء معرّف رابط لاتيني من الاسم الإنجليزي (لا يُستخدم member_id في الرابط لمنع التعداد) */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '؟'
  // تجاهل «ال» التعريف في اسم العائلة: «تركي البقمي» ← «ت ب»
  const letter = (w: string) => (w.length > 3 && w.startsWith('ال') ? w[2] : w[0]) ?? ''
  const first = letter(parts[0])
  const last = parts.length > 1 ? letter(parts[parts.length - 1]) : ''
  return `${first}${last ? ' ' + last : ''}`
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ar-SA').format(n)
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}
