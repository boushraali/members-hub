# مساحة أعضاء الجمعية | AI Association Members Hub

نموذج أولي تفاعلي لدليل مهني لأعضاء جمعية الذكاء الاصطناعي، مصمم ليُدمج داخل الموقع الحالي `https://aia.org.sa/site/members/` ويرتبط بنظام العضويات القائم.

> **نموذج أولي، وليس ربطًا فعليًا.** لم يتوفر وصول إلى الشيفرة المصدرية أو قاعدة البيانات أو لوحة الإدارة. لذلك يعمل النموذج ببيانات **افتراضية بالكامل**: أسماء مركّبة، وصور رمزية مجردة، وبريد بنطاق `example.com`. طبقة التكامل الحقيقي جاهزة لكنها غير مختبرة مع خادم. التفاصيل في [docs/INTEGRATION.md](docs/INTEGRATION.md).

## التشغيل

```bash
npm install
npm run dev          # http://localhost:5173/site/members/
npm test             # 41 اختبارًا: منطق الأعمال + السيناريوهات + الأمان
npm run build
npm run e2e          # 16 سيناريو على متصفح Edge حقيقي (يتطلب build) + لقطات في e2e/screenshots
```

يوجد شريط أصفر أعلى الصفحة **«المعاينة بصفة»** للتبديل بين: زائر، وعدة أعضاء بحالات مختلفة (منشور، بلا ملف، غير مكتمل، مرفوض، عضوية منتهية)، ومشرف الدليل. التعديلات تُحفظ في متصفحك، ويعيدها زر «إعادة ضبط البيانات» إلى حالتها الأولى.

## ما يحتويه المشروع

| المخرَج | الموقع |
|---|---|
| تحليل الموقع الحالي وبنية النظام والأمان | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| الدليل العام: Hero، فلاتر متزامنة، بحث ذكي، بطاقات، ترقيم | [src/pages/HubPage.tsx](src/pages/HubPage.tsx) |
| صفحة الملف التفصيلي `/site/members/{slug}` | [src/pages/ProfilePage.tsx](src/pages/ProfilePage.tsx) |
| «ملفي المهني» للعضو: تحرير، معاينة، موافقات، إيقاف الظهور | [src/pages/MyProfilePage.tsx](src/pages/MyProfilePage.tsx) |
| لوحة الإدارة: إحصائيات، أعضاء، مراجعة، تصنيفات، إعدادات، سجل | [src/pages/admin/](src/pages/admin/) |
| مخطط قاعدة البيانات والعلاقات | [docs/database/](docs/database/) |
| خطة التكامل ونقاط النهاية والمعلومات المطلوبة من فريق التطوير | [docs/INTEGRATION.md](docs/INTEGRATION.md) |
| حالات الاستخدام مربوطة بالاختبارات | [docs/USE_CASES.md](docs/USE_CASES.md) |

## التقنيات

React 18، وTypeScript، وTailwind CSS 4، وFramer Motion (يحترم إعداد تقليل الحركة)، وLucide Icons، وReact Router. وللاختبار: Vitest وPlaywright.

الهوية البصرية مأخوذة من ملف أنماط الموقع نفسه: خط Cairo، و`#08223F` و`#22A599` و`#00A8DF`. أُضيفت درجات أغمق للنصوص لتحقيق تباين WCAG AA، وجميع رموز الألوان تحقق ≥ 4.5:1 في الوضعين الفاتح والداكن.

## الربط بالخادم الحقيقي

```bash
VITE_DATA_SOURCE=http VITE_API_BASE=/members/api/v1 npm run build
```

لا يتغير أي مكوّن واجهة. يجب أن ينفّذ الخادم العقد المعرّف في [src/data/api.ts](src/data/api.ts)، وأن يطابق القواعد المرجعية في [src/lib/directory.ts](src/lib/directory.ts).
