// يولّد docs/database/seed_taxonomy.sql من src/data/taxonomy.ts (مصدر واحد للحقيقة)
// التشغيل: node scripts/generate-seed-sql.mjs   (Node 22.6+ يدعم استيراد ملفات TypeScript مباشرة)
// الصياغة تتطلب MySQL 8.0.19+ (VALUES ... AS new)
import { writeFileSync } from 'node:fs'
import { SEED_CATEGORIES, SEED_SPECIALIZATIONS, SEED_INTERESTS, SEED_COLLABORATION_AREAS } from '../src/data/taxonomy.ts'

const NL = '\n'
const q = (s) => `'${String(s).replaceAll('\\', '\\\\').replaceAll("'", "''")}'`
const rows = (list) => list.join(',' + NL)

const out = [
  '-- مُولَّد آليًا من src/data/taxonomy.ts — لا تعدّله يدويًا',
  '-- البيانات الأولية للتصنيف (12 مجالًا رئيسيًا وتخصصاتها الفرعية والاهتمامات التقنية ومجالات التعاون)',
  'SET NAMES utf8mb4;',
  'START TRANSACTION;',
  '',
  'INSERT INTO mh_tech_categories (code, name_ar, name_en, icon, is_active, display_order) VALUES',
  rows(SEED_CATEGORIES.map((c) => `  (${q(c.id)}, ${q(c.nameAr)}, ${q(c.nameEn)}, ${q(c.icon)}, 1, ${c.displayOrder})`)),
  'AS new ON DUPLICATE KEY UPDATE name_ar = new.name_ar, name_en = new.name_en;',
  '',
  'INSERT INTO mh_tech_specializations (category_id, code, name_ar, name_en, is_active, display_order)',
  'SELECT c.id, s.code, s.name_ar, s.name_en, 1, s.ord FROM (',
  SEED_SPECIALIZATIONS.map(
    (x, i) => `  SELECT ${q(x.categoryId)} AS cat, ${q(x.id)} AS code, ${q(x.nameAr)} AS name_ar, ${q(x.nameEn)} AS name_en, ${i + 1} AS ord`,
  ).join(NL + '  UNION ALL' + NL),
  ') AS s JOIN mh_tech_categories c ON c.code = s.cat',
  'ON DUPLICATE KEY UPDATE name_ar = s.name_ar, name_en = s.name_en;',
  '',
  'INSERT INTO mh_tech_interests (code, name_ar, name_en, is_active, display_order) VALUES',
  rows(SEED_INTERESTS.map((x, i) => `  (${q(x.id)}, ${q(x.nameAr)}, ${q(x.nameEn)}, 1, ${i + 1})`)),
  'AS new ON DUPLICATE KEY UPDATE name_ar = new.name_ar, name_en = new.name_en;',
  '',
  'INSERT INTO mh_collaboration_areas (code, name_ar, is_active, display_order) VALUES',
  rows(SEED_COLLABORATION_AREAS.map((x, i) => `  (${q(x.id)}, ${q(x.nameAr)}, 1, ${i + 1})`)),
  'AS new ON DUPLICATE KEY UPDATE name_ar = new.name_ar;',
  '',
  'INSERT INTO mh_directory_settings (setting_key, setting_value) VALUES',
  "  ('show_membership_type', 'true'),",
  "  ('hide_on_membership_inactive', 'true'),",
  "  ('show_empty_specializations', 'false'),",
  "  ('edit_approval_policy', 'review_sensitive'),",
  "  ('consent_version', '2026-10-v1')",
  'AS new ON DUPLICATE KEY UPDATE setting_value = mh_directory_settings.setting_value; -- لا يطغى على إعدادات معدّلة',
  '',
  'COMMIT;',
  '',
]
writeFileSync(new URL('../docs/database/seed_taxonomy.sql', import.meta.url), out.join(NL))
console.log(`categories=${SEED_CATEGORIES.length} specializations=${SEED_SPECIALIZATIONS.length} interests=${SEED_INTERESTS.length}`)
