# خطة التكامل مع نظام العضويات الحالي

> **الوضع الحالي بصراحة:** لم يتم أي ربط بخادم الجمعية. النموذج الأولي يعمل ببيانات تجريبية داخل المتصفح، وطبقة `HttpApi` جاهزة لكنها **لم تُختبر مع خادم حقيقي**. نقاط النهاية أدناه **مقترحة** ويجب تنفيذها داخل مشروع PHP الحالي.

## 1. المعلومات المطلوبة من فريق التطوير (نمير للحلول التقنية)

لا يمكن إكمال الربط قبل الحصول على ما يلي:

| # | المطلوب | لماذا |
|---|---|---|
| 1 | اسم جدول الأعضاء، ونوع مفتاحه الأساسي، وأسماء أعمدة: الاسم العربي والإنجليزي، نوع العضوية، حالة العضوية، تاريخ الانتهاء | لضبط `member_id` والـ FK والـ JOIN في [schema.sql](database/schema.sql) |
| 2 | القيم الفعلية لحالة العضوية (مثلًا: `active`/`expired`، أو `1`/`0`، أو الحكم بتاريخ الانتهاء فقط) | لتطبيق شرط الظهور |
| 3 | جدول أنواع العضوية (مؤكد حاليًا: `1` محترف، `5` طالب) | فلتر نوع العضوية وأي أنواع مستقبلية |
| 4 | آلية الجلسة وتسجيل دخول الأعضاء (اسم متغير الجلسة الذي يحمل معرّف العضو) | لإعادة استخدام المصادقة في `/me/*` |
| 5 | نظام صلاحيات لوحة الإدارة الحالي (جدول المستخدمين والأدوار) | لإضافة صلاحية `members_directory.manage` |
| 6 | إصدار PHP وMySQL/MariaDB، ونمط الوصول لقاعدة البيانات (PDO؟ إطار عمل؟) | ملاءمة الشيفرة. الـ ngram FULLTEXT يتطلب MySQL 5.7.6+، وصياغة البيانات الأولية تتطلب 8.0.19+ |
| 7 | بيئة Staging ونسخة من قاعدة البيانات **دون بيانات شخصية حقيقية** | التطوير دون المساس بالإنتاج |
| 8 | ملف `includes/header.php` والفوتر | لتضمين ترويسة الموقع الموحدة |
| 9 | نص سياسة الخصوصية المعتمد ومن يملك صلاحية تعديله | إضافة بند الدليل وإصدار الموافقة |

## 2. مراحل التنفيذ

| المرحلة | العمل | معيار القبول |
|---|---|---|
| 0. تحقق | استلام البنود أعلاه، ومطابقة `schema.sql` مع الجدول الفعلي | مراجعة المخطط مع فريق التطوير |
| 1. قاعدة البيانات | تنفيذ `schema.sql` ثم `seed_taxonomy.sql` على Staging | الجداول تُنشأ دون أي `ALTER` على جداول قائمة |
| 2. API | تنفيذ نقاط النهاية (القسم 3) في `/members/api/v1/` بإعادة استخدام الجلسة والاتصال الحاليين | اجتياز اختبارات العقد (القسم 5) |
| 3. ربط الواجهة | `VITE_DATA_SOURCE=http`، والبناء والنشر في `/site/members/`، وتضمين الترويسة | سيناريوهات `e2e/` تنجح على Staging |
| 4. لوحة الإدارة | رابط «إدارة مساحة الأعضاء» في القائمة الحالية، محمي بالصلاحية | الأدمن فقط يصل للقسم |
| 5. حساب العضو | رابط «ملفي المهني» داخل حساب العضو الحالي | العضو يرى ملفه فقط |
| 6. الإطلاق | دعوة الأعضاء بالبريد لإنشاء ملفاتهم والموافقة على النشر (لا ترحيل تلقائي لأي بيانات للعموم) | يبدأ الدليل فارغًا ويمتلئ بالموافقات فقط |

## 3. نقاط النهاية المقترحة

القاعدة: `/members/api/v1`. الصيغة JSON. الأخطاء بالشكل `{ "error": { "code", "message", "fieldErrors"? } }`، مع الرموز `401/403/404/409/422/429`.

### عامة (بدون دخول، مع تحديد معدل الطلبات)

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/directory/meta` | الأعداد، والمجالات والتخصصات (التي تحوي أعضاء فقط)، والاهتمامات، وأنواع العضوية، والمدن → `DirectoryMeta` |
| GET | `/directory/members?q=&categoryId=&specializationId=&interestIds[]=&interestMatch=any\|all&membershipTypeId=&city=&page=&pageSize=` | → `DirectoryPage`. قيمة `pageSize` تُقص إلى 24 كحد أقصى |
| GET | `/directory/members/{slug}` | → `PublicMemberProfile`، أو 404 لأي ملف غير ظاهر (دون تمييز السبب) |
| GET | `/taxonomy` | التصنيف النشط لنماذج الإدخال |

### العضو (جلسة العضو، و`member_id` من الجلسة حصرًا)

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/me/profile` | → `MyProfileView` (يتضمن `eligible` و`blockers`) |
| PUT | `/me/profile` | حفظ (يُنشئ الملف عند أول حفظ، ويطبق سياسة الاعتماد). 403 إن كانت العضوية غير فعّالة |
| POST | `/me/profile/submit` | طلب النشر (422 إن نقصت الحقول أو الموافقة) |
| POST | `/me/profile/visibility` | `{ enabled }` |
| PUT | `/me/consent` | `{ granted, fields }`، ويُسجَّل في `mh_consent_log` |
| POST | `/me/profile/photo` | `multipart/form-data` → `{ url }` |
| POST | `/skills/resolve` | `{ names[] }` → مهارات موحّدة |

### الإدارة (صلاحية `members_directory.manage`)

| الطريقة | المسار |
|---|---|
| GET | `/admin/members?q=&membershipTypeId=&membershipStatus=&publishStatus=&sort=` |
| GET / PUT | `/admin/members/{memberId}` ، `/admin/members/{memberId}/profile` |
| POST | `/admin/members/{memberId}/profile/status` — `{ status, reason? }` |
| POST | `/admin/members/{memberId}/consent` — `{ fields, evidenceRef }` (توثيق موافقة خارجية) |
| GET | `/admin/reviews` ، POST `/admin/reviews/{memberId}/approve` ، POST `/admin/reviews/{memberId}/reject` |
| GET | `/admin/taxonomy` |
| POST / PUT | `/admin/taxonomy/categories[/{id}]` ، `/admin/taxonomy/specializations[/{id}]` ، `/admin/taxonomy/interests[/{id}]` |
| POST | `/admin/taxonomy/specializations/merge` — `{ sourceId, targetId }` |
| DELETE | `/admin/taxonomy/specializations/{id}` — يحذف إن لم يكن مستخدمًا، وإلا يُخفيه |
| GET | `/admin/stats` ، `/admin/audit?memberId=` ، `/admin/membership-types` |
| GET / PATCH | `/admin/settings` |

الأشكال الدقيقة لكل استجابة معرّفة في [src/data/types.ts](../src/data/types.ts) و[src/data/api.ts](../src/data/api.ts). المنطق المرجعي الذي يجب أن يطابقه الخادم موجود في [src/lib/directory.ts](../src/lib/directory.ts) و[src/data/mock/mockApi.ts](../src/data/mock/mockApi.ts).

## 4. هيكل مقترح داخل مشروع PHP

```
members/
├── api/v1/index.php            موجّه بسيط (Router) + JSON + معالجة الأخطاء
├── api/v1/lib/
│   ├── auth.php                requireMember() / requireAdmin() من الجلسة الحالية
│   ├── csrf.php
│   ├── rate_limit.php
│   ├── DirectoryRepository.php استعلامات الدليل العام (شرط الظهور في مكان واحد)
│   ├── ProfileService.php      الحفظ، سياسة الاعتماد، الموافقات، التدقيق (داخل Transaction)
│   ├── TaxonomyService.php     الإضافة، الدمج، الإخفاء
│   ├── ImageService.php        التحقق وإعادة الترميز (GD/Imagick)
│   └── text_normalize.php      نفس قواعد src/lib/text.ts
site/members/
├── index.php                   يطبع header.php + <meta name="csrf-token"> ثم يحمّل حزمة React
└── profile.php                 يولّد صفحة /site/members/{slug} من الخادم (SEO + Open Graph)
```

قاعدة إعادة الكتابة (Apache):

```apache
RewriteRule ^site/members/(admin|my-profile)(/.*)?$ site/members/index.php [L]
RewriteRule ^site/members/([a-z0-9-]+)/?$ site/members/profile.php?slug=$1 [L,QSA]
RewriteRule ^site/members/?$ site/members/index.php [L]
```

## 5. التحقق قبل الإطلاق

1. **اختبارات العقد:** تشغيل `src/test/scenarios.test.ts` ضد `HttpApi` على Staging، بعد إضافة مُهيِّئ يضبط الجلسة.
2. **سيناريوهات المتصفح:** `npm run e2e` مع `VITE_DATA_SOURCE=http` على Staging.
3. **فحص الخصوصية:** التأكد آليًا من أن استجابات `/directory/*` لا تحتوي البريد أو الجوال أو الهوية أو `member_id`.
4. **اختبار الأحمال:** البحث بـ 5,000 ملف وهمي، بهدف أقل من 300ms عند p95.
5. **مراجعة أمنية:** للرفع والصلاحيات وCSRF وتحديد معدل الطلبات.
6. **التحقق من عدم المساس بالإنتاج:** لا تعديل على `membership.php` أو `renew.php` أو الدفع أو الجداول القائمة.
