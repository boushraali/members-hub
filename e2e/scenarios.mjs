/**
 * اختبار السيناريوهات التفاعلية من طرف إلى طرف على متصفح حقيقي (Microsoft Edge المثبت).
 * التشغيل: npm run build && npm run e2e
 * يحفظ لقطات الشاشة في e2e/screenshots
 */
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const PORT = 4179
const BASE = `http://localhost:${PORT}/site/members`
const SHOTS = new URL('./screenshots/', import.meta.url)
mkdirSync(SHOTS, { recursive: true })

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' })
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => String(d).includes('localhost') && resolve())
  server.on('exit', (c) => reject(new Error(`preview exited ${c}`)))
  setTimeout(() => reject(new Error('preview timeout')), 20000)
})

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const results = []
const consoleErrors = []
let ctx, page

async function fresh(viewport = { width: 1366, height: 900 }) {
  await ctx?.close()
  ctx = await browser.newContext({ viewport, locale: 'ar-SA', reducedMotion: 'reduce' })
  page = await ctx.newPage()
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))
  page.on('pageerror', (e) => consoleErrors.push(String(e)))
  page.on('response', (r) => r.status() >= 400 && consoleErrors.push(`HTTP ${r.status()} ${r.url()}`))
}

async function step(name, fn) {
  try {
    await fn()
    results.push(['✓', name])
  } catch (e) {
    results.push(['✗', name, e.message.split('\n')[0]])
    await page?.screenshot({ path: fileURLToPath(new URL(`FAIL-${results.length}.png`, SHOTS)), fullPage: true }).catch(() => {})
  }
}

const shot = (name, fullPage = true) => page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, SHOTS)), fullPage })
const cardNames = async () => (await page.locator('main article h3').allInnerTexts()).map((s) => s.trim())
const resultCount = () => page.locator('section[aria-label="فلاتر البحث"] p[aria-live]').innerText()
const waitCards = () => page.waitForSelector('main article h3', { timeout: 8000 })
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg)
}
async function settle() {
  await page.waitForTimeout(150)
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 8000 })
}
async function persona(value) {
  await page.locator('select').filter({ has: page.locator('option[value="admin"]') }).selectOption(value)
  await settle()
}

// ─────────── السيناريو 1 ───────────
await fresh()
await step('السيناريو 1: تحميل الدليل مع Skeleton ثم البطاقات والإحصائيات', async () => {
  await page.goto(`${BASE}/`)
  await waitCards()
  const stats = await page.locator('#hero-title ~ div').last().innerText()
  assert(/٢٦|26/.test(stats), `published stat should be 26, got: ${stats}`)
  await shot('01-hub-desktop')
})
await step('السيناريو 1: اختيار «الذكاء الاصطناعي» ثم «معالجة اللغات الطبيعية»', async () => {
  await page.getByRole('navigation', { name: 'تصفح حسب المجال' }).getByRole('button', { name: /^الذكاء الاصطناعي/ }).click()
  await settle()
  const aiCount = await cardNames()
  assert(aiCount.length >= 8, `expected many AI members, got ${aiCount.length}`)
  assert(page.url().includes('cat=ai'), 'filter must be reflected in the URL')
  await page.getByLabel('التخصص الفرعي').selectOption('ai.nlp')
  await settle()
  const nlp = await cardNames()
  assert(nlp.includes('سارة العتيبي') && nlp.includes('زياد التميمي'), `NLP results: ${nlp}`)
  assert(nlp.length < aiCount.length, 'results must narrow')
  await shot('02-scenario1-nlp')
})

// ─────────── السيناريو 2 ───────────
await step('السيناريو 2: الأمن السيبراني + اهتمام الذكاء الاصطناعي', async () => {
  await page.getByRole('button', { name: 'إعادة ضبط الفلاتر' }).click()
  await settle()
  await page.getByLabel('التخصص الرئيسي').selectOption('cyber')
  await settle()
  await page.getByRole('button', { name: /الاهتمامات التقنية/ }).click()
  await page.getByRole('checkbox', { name: /^الذكاء الاصطناعي\s*[\d٠-٩]+$/ }).check()
  await settle()
  await shot('03-scenario2-interests-open', false)
  await page.getByRole('button', { name: 'تم', exact: true }).click()
  const names = (await cardNames()).sort()
  const expected = ['أروى العسيري', 'شهد الأحمدي', 'فهد القحطاني', 'هند السبيعي'].sort()
  assert(JSON.stringify(names) === JSON.stringify(expected), `got ${names}`)
  const count = await resultCount()
  assert(/4|٤/.test(count), `count text: ${count}`)
  await shot('04-scenario2-results')
})
await step('البحث الذكي + حالة عدم وجود نتائج', async () => {
  await page.getByRole('button', { name: 'إعادة ضبط الفلاتر' }).click()
  await page.getByRole('searchbox').fill('PyTorch')
  await page.waitForTimeout(450)
  await settle()
  const names = await cardNames()
  assert(names.includes('نورة الشهري'), `search: ${names}`)
  await page.getByRole('searchbox').fill('كلمة غير موجودة إطلاقا')
  await page.waitForTimeout(450)
  await settle()
  await page.getByRole('heading', { name: 'لا توجد نتائج مطابقة' }).waitFor()
  await shot('05-empty-state', false)
  await page.getByRole('button', { name: 'إعادة ضبط جميع الفلاتر' }).click()
  await settle()
})

// ─────────── السيناريو 3 ───────────
await step('السيناريو 3: فتح ملف عضو والتحقق من رابط LinkedIn الآمن', async () => {
  await waitCards()
  await page.getByRole('link', { name: 'سارة العتيبي', exact: true }).click()
  await page.waitForURL(/\/site\/members\/sarah-alotaibi$/)
  await page.getByRole('heading', { level: 1, name: 'سارة العتيبي' }).waitFor()
  const li = page.getByRole('link', { name: /الملف المهني على LinkedIn/ })
  assert((await li.getAttribute('target')) === '_blank', 'target=_blank')
  assert((await li.getAttribute('rel')).includes('noopener'), 'rel noopener')
  const body = await page.locator('main').innerText()
  assert(!/@example\.com|0500000/.test(body), 'no private data on public profile')
  await shot('06-profile')
})
await step('الملف غير المنشور لا يُفتح حتى بالرابط المباشر', async () => {
  await page.goto(`${BASE}/hassan-al-saeed`)
  await page.getByRole('heading', { name: 'الملف غير متاح' }).waitFor()
})

// ─────────── السيناريو 4 ───────────
await step('السيناريو 4: الأدمن يضيف ملف عضو، يوثّق الموافقة، يعتمد، فيظهر في الدليل', async () => {
  await page.goto(`${BASE}/`)
  await persona('admin')
  await page.waitForURL(/\/admin$/)
  await page.getByText('إجمالي أعضاء الجمعية').waitFor()
  await shot('07-admin-dashboard')
  await page.getByRole('link', { name: 'قائمة الأعضاء' }).click()
  await page.getByRole('link', { name: /إنشاء ملف — ليان الشريف/ }).click()
  await page.getByLabel(/المسمى الوظيفي/).fill('مهندسة ذكاء اصطناعي صحي')
  await page.getByLabel(/النبذة المختصرة/).fill(
    'أعمل على تطوير حلول ذكاء اصطناعي تطبيقية للقطاع الصحي، وأركز على بناء نماذج تعلم آلة قابلة للتفسير، وأسعى لتمكين الكوادر الطبية من الاستفادة من البيانات في دعم القرار السريري اليومي.',
  )
  await page.getByRole('group', { name: 'المجالات الرئيسية' }).getByRole('button', { name: 'الذكاء الاصطناعي' }).click()
  await page.getByRole('group', { name: 'تخصصات الذكاء الاصطناعي' }).getByRole('button', { name: 'تعلم الآلة' }).click()
  await page.getByRole('group', { name: 'الاهتمامات التقنية' }).getByRole('button', { name: 'البحث العلمي' }).click()
  await page.getByLabel('رابط LinkedIn', { exact: true }).fill('linkedin.com/in/example-layan')
  await page.getByRole('button', { name: 'حفظ الملف' }).click()
  await page.getByText('تم حفظ الملف.').waitFor()
  // محاولة النشر قبل الموافقة يجب أن تُرفض
  await page.getByRole('button', { name: 'اعتماد ونشر' }).click()
  await page.getByText(/لا يمكن النشر دون موافقة/).first().waitFor()
  await page.getByLabel(/مرجع إثبات الموافقة/).fill('نموذج موافقة رقم 2026-114')
  await page.getByRole('button', { name: 'تسجيل موافقة موثقة' }).click()
  await page.getByText('تم تسجيل الموافقة الموثقة.').waitFor()
  await page.getByRole('button', { name: 'اعتماد ونشر' }).click()
  await page.getByText('تم اعتماد الملف وأصبح ظاهرًا في الدليل.').waitFor()
  await shot('08-admin-member-edit')
  await persona('visitor')
  await page.getByRole('searchbox').fill('ليان')
  await page.waitForTimeout(450)
  await settle()
  assert((await cardNames()).join() === 'ليان الشريف', 'Layan should appear in directory')
})
await step('لوحة الإدارة: قائمة المراجعة والتصنيفات والإعدادات', async () => {
  await persona('admin')
  await page.getByRole('link', { name: 'قائمة الأعضاء' }).click()
  await page.locator('table tbody tr').first().waitFor()
  await shot('09-admin-members')
  await page.getByRole('link', { name: 'طلبات المراجعة' }).click()
  await page.getByRole('heading', { level: 2, name: 'حسن آل سعيد' }).waitFor()
  await shot('10-admin-reviews')
  await page.getByRole('button', { name: 'اعتماد ونشر' }).first().click()
  await page.getByText('تم اعتماد الملف وأصبح ظاهرًا في الدليل.').waitFor()
  await page.getByRole('link', { name: 'التخصصات والاهتمامات' }).click()
  await page.getByText('المعرّفات ثابتة').waitFor()
  await shot('11-admin-taxonomy')
})

// ─────────── السيناريو 5 ───────────
await step('السيناريو 5: العضو يحدّث اهتماماته فتنعكس على بطاقته', async () => {
  await persona('m1001')
  await page.waitForURL(/my-profile$/)
  await page.getByRole('heading', { name: 'ملفي المهني' }).waitFor()
  await shot('12-my-profile')
  await page.getByRole('group', { name: 'الاهتمامات التقنية' }).getByRole('button', { name: 'التطوع التقني' }).click()
  await page.getByRole('button', { name: 'حفظ التعديلات' }).click()
  await page.getByText('تم الحفظ وتحديث بطاقتك في الدليل مباشرة.').waitFor()
  // تعديل حساس يُعلّق
  await page.getByLabel(/المسمى الوظيفي/).fill('قائدة فريق معالجة اللغات')
  await page.getByRole('button', { name: 'حفظ التعديلات' }).click()
  await page.getByText(/بانتظار اعتماد الإدارة/).first().waitFor()
  await persona('visitor')
  await page.goto(`${BASE}/?int=volunteering&cat=ai`)
  await waitCards()
  assert((await cardNames()).includes('سارة العتيبي'), 'interest change reflected')
  await page.goto(`${BASE}/sarah-alotaibi`)
  await page.getByText('أخصائية معالجة لغات طبيعية').first().waitFor()
})
await step('العضو يوقف ظهور ملفه دون إلغاء العضوية', async () => {
  await persona('m1001')
  await page.getByRole('switch', { name: 'إظهار ملفي في مساحة الأعضاء' }).click()
  await page.getByText(/عضويتك في الجمعية مستمرة/).waitFor()
  await persona('visitor')
  await page.goto(`${BASE}/sarah-alotaibi`)
  await page.getByRole('heading', { name: 'الملف غير متاح' }).waitFor()
})
await step('عضو بعضوية منتهية: الملف للقراءة فقط مع رابط التجديد', async () => {
  await persona('m1030')
  await page.getByText(/ملفك غير ظاهر لأن عضويتك منتهية/).waitFor()
  assert(await page.getByLabel(/المسمى الوظيفي/).isDisabled(), 'form disabled')
})

// ─────────── التجاوب والوضع الداكن والوصول ───────────
for (const [name, vp] of [
  ['tablet', { width: 820, height: 1180 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  await step(`التصميم المتجاوب (${name}): عدد الأعمدة وعدم وجود تمرير أفقي`, async () => {
    await fresh(vp)
    await page.goto(`${BASE}/`)
    await waitCards()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    assert(overflow <= 0, `horizontal overflow ${overflow}px`)
    const cols = await page.evaluate(() => getComputedStyle(document.querySelector('main article').parentElement).gridTemplateColumns.split(' ').length)
    assert(cols === (name === 'tablet' ? 2 : 1), `${name} columns = ${cols}`)
    await shot(`13-hub-${name}`)
    await shot(`13-hub-${name}-top`, false)
    await page.locator("main article").first().scrollIntoViewIfNeeded()
    await shot(`13-hub-${name}-cards`, false)
    await page.goto(`${BASE}/sarah-alotaibi`)
    await page.getByRole('heading', { level: 1 }).waitFor()
    const o2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    assert(o2 <= 0, `profile overflow ${o2}px`)
    await shot(`14-profile-${name}`)
  })
}
await step('سطح المكتب العريض: 4 بطاقات في الصف', async () => {
  await fresh({ width: 1440, height: 900 })
  await page.goto(`${BASE}/`)
  await waitCards()
  const cols = await page.evaluate(() => getComputedStyle(document.querySelector('main article').parentElement).gridTemplateColumns.split(' ').length)
  assert(cols === 4, `desktop columns = ${cols}`)
})
await step('الوضع الداكن', async () => {
  await page.getByRole('button', { name: 'التبديل إلى الوضع الداكن' }).click()
  assert((await page.evaluate(() => document.documentElement.dataset.theme)) === 'dark', 'theme attr')
  await page.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(6, 24, 38)')
  await page.waitForTimeout(300)
  await shot('15-hub-dark', false)
})
await step('الوصول: كل صورة لها بديل نصي وكل حقل له اسم', async () => {
  const issues = await page.evaluate(() => {
    const out = []
    document.querySelectorAll('img').forEach((i) => !i.hasAttribute('alt') && out.push('img without alt'))
    document.querySelectorAll('input:not([type=hidden]):not([tabindex="-1"]), select, textarea').forEach((el) => {
      const named = el.labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.closest('label')
      if (!named) out.push(`${el.tagName} unnamed`)
    })
    document.querySelectorAll('button').forEach((b) => !(b.innerText.trim() || b.getAttribute('aria-label')) && out.push('button unnamed'))
    return out
  })
  assert(issues.length === 0, issues.join(', '))
})

await browser.close()
server.kill()

for (const r of results) console.log(r.join('  '))
const failed = results.filter((r) => r[0] === '✗').length
const relevantErrors = consoleErrors.filter((e) => !/favicon|fonts\.g/.test(e))
if (relevantErrors.length) console.log('\nConsole errors:\n' + [...new Set(relevantErrors)].join('\n'))
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed || relevantErrors.length ? 1 : 0)
