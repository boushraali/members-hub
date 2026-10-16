import type { CollaborationArea, MembershipType, TechCategory, TechInterest, TechSpecialization } from './types'

/**
 * بيانات التصنيف الأولية (Seed).
 * في الإنتاج تُدخل هذه القيم مرة واحدة عبر ملف الترحيل docs/database/seed_taxonomy.sql
 * ثم يديرها الأدمن من لوحة الإدارة.
 */

type SpecSeed = [id: string, nameAr: string, nameEn: string]

const TAXONOMY: { cat: Omit<TechCategory, 'displayOrder' | 'isActive'>; specs: SpecSeed[] }[] = [
  {
    cat: { id: 'ai', nameAr: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', icon: 'brain' },
    specs: [
      ['genai', 'الذكاء الاصطناعي التوليدي', 'Generative AI'],
      ['ml', 'تعلم الآلة', 'Machine Learning'],
      ['dl', 'التعلم العميق', 'Deep Learning'],
      ['nlp', 'معالجة اللغات الطبيعية', 'NLP'],
      ['cv', 'الرؤية الحاسوبية', 'Computer Vision'],
      ['prompt', 'هندسة المطالبات', 'Prompt Engineering'],
      ['agents', 'وكلاء الذكاء الاصطناعي', 'AI Agents'],
      ['llm', 'النماذج اللغوية الكبيرة', 'LLMs'],
      ['ai-eng', 'هندسة وتطوير حلول الذكاء الاصطناعي', 'AI Engineering'],
      ['mlops', 'تشغيل نماذج الذكاء الاصطناعي', 'MLOps'],
      ['rai', 'الذكاء الاصطناعي المسؤول وأخلاقياته', 'Responsible AI'],
    ],
  },
  {
    cat: { id: 'data', nameAr: 'علوم البيانات والتحليلات', nameEn: 'Data Science & Analytics', icon: 'database' },
    specs: [
      ['ds', 'علم البيانات', 'Data Science'],
      ['da', 'تحليل البيانات', 'Data Analysis'],
      ['de', 'هندسة البيانات', 'Data Engineering'],
      ['bigdata', 'البيانات الضخمة', 'Big Data'],
      ['bi', 'ذكاء الأعمال', 'Business Intelligence'],
      ['viz', 'تصور البيانات ولوحات المعلومات', 'Data Visualization'],
      ['dgov', 'حوكمة البيانات', 'Data Governance'],
      ['dq', 'جودة البيانات وإدارتها', 'Data Quality & Management'],
      ['predictive', 'التحليلات التنبؤية', 'Predictive Analytics'],
    ],
  },
  {
    cat: { id: 'cyber', nameAr: 'الأمن السيبراني', nameEn: 'Cybersecurity', icon: 'shield' },
    specs: [
      ['grc', 'حوكمة الأمن السيبراني وإدارة المخاطر والامتثال', 'GRC'],
      ['pentest', 'اختبار الاختراق والأمن الهجومي', 'Penetration Testing'],
      ['dfir', 'الاستجابة للحوادث والتحليل الجنائي الرقمي', 'DFIR'],
      ['soc', 'عمليات الأمن السيبراني', 'SOC'],
      ['netsec', 'أمن الشبكات والبنية التحتية', 'Network & Infrastructure Security'],
      ['appsec', 'أمن التطبيقات', 'Application Security'],
      ['cloudsec', 'أمن الحوسبة السحابية', 'Cloud Security'],
      ['iam', 'إدارة الهوية والصلاحيات', 'IAM'],
      ['aisec', 'أمن الذكاء الاصطناعي', 'AI Security'],
      ['privacy', 'حماية البيانات والخصوصية', 'Data Protection & Privacy'],
    ],
  },
  {
    cat: { id: 'software', nameAr: 'تطوير البرمجيات', nameEn: 'Software Development', icon: 'code' },
    specs: [
      ['web', 'تطوير تطبيقات الويب', 'Web Development'],
      ['mobile', 'تطوير تطبيقات الجوال', 'Mobile Development'],
      ['frontend', 'تطوير الواجهات الأمامية', 'Frontend'],
      ['backend', 'تطوير الأنظمة الخلفية', 'Backend'],
      ['fullstack', 'التطوير المتكامل', 'Full-Stack'],
      ['se', 'هندسة البرمجيات', 'Software Engineering'],
      ['api', 'تطوير واجهات API', 'API Development'],
      ['qa', 'اختبار البرمجيات وضمان الجودة', 'QA & Testing'],
      ['enterprise', 'تطوير الأنظمة المؤسسية', 'Enterprise Systems'],
      ['devops', 'هندسة DevOps', 'DevOps'],
    ],
  },
  {
    cat: { id: 'cloud', nameAr: 'الحوسبة السحابية والبنية التحتية', nameEn: 'Cloud & Infrastructure', icon: 'cloud' },
    specs: [
      ['cloud', 'الحوسبة السحابية', 'Cloud Computing'],
      ['solutions', 'هندسة الحلول السحابية', 'Cloud Solutions Architecture'],
      ['sysadmin', 'إدارة الخوادم والأنظمة', 'Systems Administration'],
      ['infra', 'البنية التحتية التقنية', 'IT Infrastructure'],
      ['k8s', 'الحاويات وKubernetes', 'Containers & Kubernetes'],
      ['dc', 'إدارة مراكز البيانات', 'Data Center Management'],
      ['sre', 'هندسة موثوقية المواقع', 'SRE'],
      ['iac', 'البنية التحتية كرمز', 'Infrastructure as Code'],
    ],
  },
  {
    cat: { id: 'network', nameAr: 'الشبكات والاتصالات', nameEn: 'Networks & Telecommunications', icon: 'network' },
    specs: [
      ['neteng', 'هندسة الشبكات', 'Network Engineering'],
      ['netsec', 'أمن الشبكات', 'Network Security'],
      ['wireless', 'الشبكات اللاسلكية', 'Wireless Networks'],
      ['digicomm', 'الاتصالات الرقمية', 'Digital Communications'],
      ['5g6g', 'شبكات الجيل الخامس والسادس', '5G / 6G'],
      ['sdn', 'الشبكات المعرفة برمجيًا', 'SDN'],
      ['iotnet', 'إنترنت الأشياء والشبكات الذكية', 'IoT & Smart Networks'],
    ],
  },
  {
    cat: { id: 'robotics', nameAr: 'الروبوتات والأنظمة الذكية', nameEn: 'Robotics & Intelligent Systems', icon: 'bot' },
    specs: [
      ['robotics', 'الروبوتات', 'Robotics'],
      ['automation', 'الأتمتة الذكية', 'Intelligent Automation'],
      ['embedded', 'الأنظمة المدمجة', 'Embedded Systems'],
      ['iot', 'إنترنت الأشياء', 'IoT'],
      ['autonomous', 'الأنظمة الذاتية', 'Autonomous Systems'],
      ['drones', 'الطائرات دون طيار', 'Drones'],
      ['industrial', 'الأنظمة الصناعية الذكية', 'Smart Industrial Systems'],
    ],
  },
  {
    cat: { id: 'emerging', nameAr: 'التقنيات الناشئة', nameEn: 'Emerging Technologies', icon: 'rocket' },
    specs: [
      ['blockchain', 'البلوك تشين', 'Blockchain'],
      ['vr', 'الواقع الافتراضي', 'VR'],
      ['ar', 'الواقع المعزز', 'AR'],
      ['xr', 'الواقع الممتد', 'XR'],
      ['twins', 'التوأم الرقمي', 'Digital Twins'],
      ['quantum', 'الحوسبة الكمية', 'Quantum Computing'],
      ['web3', 'تقنيات Web3', 'Web3'],
      ['edge', 'الحوسبة الطرفية', 'Edge Computing'],
    ],
  },
  {
    cat: { id: 'digital', nameAr: 'التحول الرقمي وإدارة التقنية', nameEn: 'Digital Transformation & IT Management', icon: 'chart' },
    specs: [
      ['dt', 'التحول الرقمي', 'Digital Transformation'],
      ['pm', 'إدارة المشاريع التقنية', 'IT Project Management'],
      ['product', 'إدارة المنتجات الرقمية', 'Digital Product Management'],
      ['ba', 'تحليل الأعمال', 'Business Analysis'],
      ['sa', 'تحليل النظم', 'Systems Analysis'],
      ['itgov', 'الحوكمة التقنية', 'IT Governance'],
      ['innovation', 'إدارة الابتكار', 'Innovation Management'],
      ['ea', 'العمارة المؤسسية', 'Enterprise Architecture'],
      ['itsm', 'إدارة الخدمات التقنية', 'ITSM'],
    ],
  },
  {
    cat: { id: 'design', nameAr: 'التصميم وتجربة المستخدم', nameEn: 'Design & User Experience', icon: 'palette' },
    specs: [
      ['ux', 'تصميم تجربة المستخدم', 'UX Design'],
      ['ui', 'تصميم واجهات المستخدم', 'UI Design'],
      ['product-design', 'تصميم المنتجات الرقمية', 'Digital Product Design'],
      ['research', 'أبحاث المستخدمين', 'User Research'],
      ['interaction', 'التصميم التفاعلي', 'Interaction Design'],
      ['service', 'تصميم الخدمات الرقمية', 'Service Design'],
      ['a11y', 'إمكانية الوصول الرقمي', 'Accessibility'],
    ],
  },
  {
    cat: { id: 'edu', nameAr: 'التقنيات التعليمية والبحث العلمي', nameEn: 'EdTech & Scientific Research', icon: 'book' },
    specs: [
      ['ai-edu', 'الذكاء الاصطناعي في التعليم', 'AI in Education'],
      ['edtech', 'تطوير التقنيات التعليمية', 'EdTech Development'],
      ['content', 'تصميم المحتوى الرقمي', 'Digital Content Design'],
      ['its', 'أنظمة التعلم الذكية', 'Intelligent Learning Systems'],
      ['research', 'البحث العلمي في التقنية', 'Tech Research'],
      ['edu-innovation', 'الابتكار التعليمي', 'Educational Innovation'],
      ['learning-analytics', 'تحليل بيانات التعليم', 'Learning Analytics'],
    ],
  },
  {
    cat: { id: 'sector', nameAr: 'التطبيقات القطاعية للتقنية', nameEn: 'Sector Applications', icon: 'factory' },
    specs: [
      ['fintech', 'التقنية المالية', 'FinTech'],
      ['healthtech', 'التقنية الصحية', 'HealthTech'],
      ['edtech', 'التقنية التعليمية', 'EdTech'],
      ['govtech', 'التقنية الحكومية', 'GovTech'],
      ['smartcity', 'المدن الذكية', 'Smart Cities'],
      ['industry40', 'التقنية الصناعية', 'Industry 4.0'],
      ['green', 'الاستدامة والتقنيات الخضراء', 'Sustainability & GreenTech'],
      ['agritech', 'التقنية الزراعية', 'AgriTech'],
      ['space', 'تقنيات الفضاء', 'Space Tech'],
    ],
  },
]

export const SEED_CATEGORIES: TechCategory[] = TAXONOMY.map((t, i) => ({
  ...t.cat,
  isActive: true,
  displayOrder: i + 1,
}))

/** معرّف التخصص = `${categoryId}.${code}` لضمان التفرّد عبر المجالات */
export const SEED_SPECIALIZATIONS: TechSpecialization[] = TAXONOMY.flatMap((t) =>
  t.specs.map(([code, nameAr, nameEn]) => ({
    id: `${t.cat.id}.${code}`,
    categoryId: t.cat.id,
    nameAr,
    nameEn,
    isActive: true,
    mergedIntoId: null,
  })),
)

export const SEED_INTERESTS: TechInterest[] = (
  [
    ['ai', 'الذكاء الاصطناعي', 'Artificial Intelligence'],
    ['genai', 'الذكاء الاصطناعي التوليدي', 'Generative AI'],
    ['cyber', 'الأمن السيبراني', 'Cybersecurity'],
    ['oss', 'المشاريع مفتوحة المصدر', 'Open Source'],
    ['appdev', 'تطوير التطبيقات', 'App Development'],
    ['entrepreneurship', 'الابتكار وريادة الأعمال', 'Innovation & Entrepreneurship'],
    ['research', 'البحث العلمي', 'Scientific Research'],
    ['training', 'التدريب ونقل المعرفة', 'Training & Knowledge Transfer'],
    ['hackathons', 'الهاكاثونات والمسابقات', 'Hackathons & Competitions'],
    ['volunteering', 'التطوع التقني', 'Tech Volunteering'],
    ['product', 'تطوير المنتجات التقنية', 'Tech Product Development'],
    ['dt', 'التحول الرقمي', 'Digital Transformation'],
    ['collab', 'التعاون في المشاريع', 'Project Collaboration'],
  ] as const
).map(([id, nameAr, nameEn]) => ({ id, nameAr, nameEn, isActive: true }))

export const SEED_COLLABORATION_AREAS: CollaborationArea[] = [
  { id: 'mentoring', nameAr: 'الإرشاد المهني' },
  { id: 'research', nameAr: 'الأبحاث المشتركة' },
  { id: 'projects', nameAr: 'المشاريع التقنية' },
  { id: 'speaking', nameAr: 'التحدث في الفعاليات' },
  { id: 'training', nameAr: 'تقديم الدورات وورش العمل' },
  { id: 'judging', nameAr: 'تحكيم الهاكاثونات' },
  { id: 'volunteering', nameAr: 'التطوع في مبادرات الجمعية' },
  { id: 'startups', nameAr: 'دعم الشركات الناشئة' },
]

/** معرّفات الأنواع مطابقة لما هو منشور في https://aia.org.sa/members/membership.php?type=… */
export const SEED_MEMBERSHIP_TYPES: MembershipType[] = [
  { id: 1, nameAr: 'عضو محترف', nameEn: 'Professional Member', isActive: true },
  { id: 5, nameAr: 'عضو طالب', nameEn: 'Student Member', isActive: true },
]

export const SAUDI_CITIES = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران', 'الأحساء',
  'الطائف', 'تبوك', 'بريدة', 'أبها', 'خميس مشيط', 'حائل', 'جازان', 'نجران', 'الجبيل', 'ينبع', 'الباحة', 'سكاكا',
]
