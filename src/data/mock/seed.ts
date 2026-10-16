/**
 * ⚠️ بيانات افتراضية بالكامل لأغراض المعاينة فقط.
 * الأسماء مركّبة عشوائيًا ولا تمثّل أشخاصًا حقيقيين، ولا توجد صور لأشخاص حقيقيين،
 * والبريد والجوال بنطاقات اختبار محجوزة (example.com / 0500000xxx).
 */
import type {
  Consent,
  DirectorySettings,
  Member,
  MemberProfile,
  MembershipStatus,
  PublishStatus,
  Skill,
} from '../types'
import { slugify } from '../../lib/text'

export const CONSENT_VERSION = '2026-10-v1'

export const DEFAULT_SETTINGS: DirectorySettings = {
  showMembershipType: true,
  hideOnMembershipInactive: true,
  showEmptySpecializations: false,
  editApprovalPolicy: 'review_sensitive',
  consentVersion: CONSENT_VERSION,
}

type ConsentSeed = 'granted' | 'none' | 'withdrawn'

interface Row {
  ar: string
  en: string
  type: 1 | 5
  status: MembershipStatus
  title: string
  city: string
  cats: string[]
  specs: string[]
  interests: string[]
  skills: string[]
  collab: string[]
  publish: PublishStatus | null // null = لا يوجد ملف مهني بعد
  consent: ConsentSeed
  bio: string
  photo?: boolean
  visible?: boolean
  rejection?: string
  pendingTitle?: string
  noLinkedin?: boolean
  hideCity?: boolean
}

const ROWS: Row[] = [
  {
    ar: 'سارة العتيبي', en: 'Sarah Alotaibi', type: 1, status: 'active', photo: true,
    title: 'أخصائية معالجة لغات طبيعية', city: 'الرياض',
    cats: ['ai'], specs: ['ai.nlp', 'ai.llm', 'ai.genai'],
    interests: ['ai', 'genai', 'research', 'oss'], skills: ['Python', 'PyTorch', 'Transformers', 'Arabic NLP'],
    collab: ['research', 'mentoring', 'speaking'], publish: 'published', consent: 'granted',
    bio: 'أعمل على بناء نماذج لغوية تفهم اللهجات العربية وتخدم المستخدم المحلي، وأهتم بتقييم جودة النماذج التوليدية وتقليل الانحياز فيها، وأشارك في مبادرات المصدر المفتوح للمحتوى العربي.',
  },
  {
    ar: 'فهد القحطاني', en: 'Fahad Alqahtani', type: 1, status: 'active',
    title: 'مستشار حوكمة الأمن السيبراني', city: 'الرياض',
    cats: ['cyber', 'ai'], specs: ['cyber.grc', 'cyber.aisec', 'ai.rai'],
    interests: ['ai', 'cyber', 'training'], skills: ['ISO 27001', 'NCA ECC', 'Risk Assessment'],
    collab: ['training', 'mentoring'], publish: 'published', consent: 'granted',
    bio: 'خبرة تزيد على اثنتي عشرة سنة في حوكمة الأمن السيبراني وإدارة المخاطر والامتثال للضوابط الوطنية، وأركّز حاليًا على أطر حوكمة أنظمة الذكاء الاصطناعي وتقييم مخاطرها في الجهات الحكومية.',
  },
  {
    ar: 'نورة الشهري', en: 'Noura Alshehri', type: 5, status: 'active', photo: true,
    title: 'طالبة ماجستير في الرؤية الحاسوبية', city: 'جدة',
    cats: ['ai'], specs: ['ai.cv', 'ai.dl'],
    interests: ['research', 'hackathons', 'ai'], skills: ['OpenCV', 'PyTorch', 'YOLO'],
    collab: ['research', 'projects'], publish: 'published', consent: 'granted',
    bio: 'أبحث في تقنيات الرؤية الحاسوبية لرصد العيوب في خطوط الإنتاج الصناعية، وشاركت في عدة هاكاثونات وطنية، وأتطلع للتعاون مع باحثين ومختصين في تطبيقات التعلم العميق على الأجهزة الطرفية.',
  },
  {
    ar: 'عبدالله الدوسري', en: 'Abdullah Aldosari', type: 1, status: 'active',
    title: 'مهندس اختبار اختراق', city: 'الدمام',
    cats: ['cyber'], specs: ['cyber.pentest', 'cyber.appsec'],
    interests: ['cyber', 'hackathons', 'volunteering'], skills: ['Burp Suite', 'OSCP', 'Web Security'],
    collab: ['judging', 'training'], publish: 'published', consent: 'granted',
    bio: 'متخصص في اختبار اختراق تطبيقات الويب والأنظمة الداخلية للمؤسسات المالية، وأقدّم ورش عمل تطوعية في الأمن الهجومي للطلاب، وأشارك في تحكيم مسابقات التقاط العلم (CTF) على المستوى المحلي.',
  },
  {
    ar: 'ريم الزهراني', en: 'Reem Alzahrani', type: 1, status: 'active',
    title: 'عالمة بيانات', city: 'الرياض',
    cats: ['data', 'ai'], specs: ['data.ds', 'data.predictive', 'ai.ml'],
    interests: ['ai', 'research', 'dt'], skills: ['Python', 'SQL', 'scikit-learn', 'Power BI'],
    collab: ['projects', 'mentoring'], publish: 'published', consent: 'granted',
    bio: 'أبني نماذج تنبؤية تدعم اتخاذ القرار في قطاع التجزئة والخدمات اللوجستية، وأحوّل البيانات المعقدة إلى رؤى واضحة لصناع القرار، وأهتم بتمكين الفرق غير التقنية من فهم نتائج التحليل.',
  },
  {
    ar: 'خالد المطيري', en: 'Khalid Almutairi', type: 1, status: 'active', photo: true,
    title: 'مهندس برمجيات أول', city: 'الرياض',
    cats: ['software'], specs: ['software.backend', 'software.api', 'software.se'],
    interests: ['oss', 'appdev', 'collab'], skills: ['Go', 'Node.js', 'PostgreSQL'],
    collab: ['projects', 'mentoring'], publish: 'published', consent: 'granted',
    bio: 'أصمم أنظمة خلفية عالية التحمل وواجهات API لمنصات تخدم ملايين المستخدمين، وأساهم في مشاريع مفتوحة المصدر، وأؤمن بأن جودة الكود وقابلية الصيانة هما أساس أي منتج تقني ناجح ومستدام.',
  },
  {
    ar: 'هند السبيعي', en: 'Hind Alsubaie', type: 1, status: 'active',
    title: 'محللة في مركز عمليات الأمن السيبراني', city: 'الخبر',
    cats: ['cyber'], specs: ['cyber.soc', 'cyber.dfir'],
    interests: ['cyber', 'ai', 'training'], skills: ['SIEM', 'Splunk', 'Threat Hunting'],
    collab: ['training', 'speaking'], publish: 'published', consent: 'granted',
    bio: 'أعمل في رصد التهديدات والاستجابة للحوادث داخل مركز عمليات أمنية، وأستكشف توظيف تقنيات الذكاء الاصطناعي في تحليل السجلات واكتشاف الأنماط الشاذة وتسريع عمليات التحقيق الرقمي.',
  },
  {
    ar: 'محمد الغامدي', en: 'Mohammed Alghamdi', type: 1, status: 'active',
    title: 'مهندس حلول سحابية', city: 'جدة',
    cats: ['cloud'], specs: ['cloud.solutions', 'cloud.k8s', 'cloud.iac'],
    interests: ['dt', 'oss'], skills: ['AWS', 'Terraform', 'Kubernetes'],
    collab: ['projects', 'startups'], publish: 'published', consent: 'granted',
    bio: 'أساعد المؤسسات على نقل أنظمتها إلى السحابة وتصميم بنى تحتية مرنة وآمنة وقابلة للتوسع، مع التركيز على أتمتة البنية التحتية كرمز وخفض التكاليف التشغيلية دون التأثير على الأداء أو الموثوقية.',
  },
  {
    ar: 'لمى الحربي', en: 'Lama Alharbi', type: 1, status: 'active', photo: true,
    title: 'مصممة تجربة مستخدم', city: 'الرياض',
    cats: ['design'], specs: ['design.ux', 'design.research', 'design.a11y'],
    interests: ['product', 'entrepreneurship'], skills: ['Figma', 'Usability Testing', 'WCAG'],
    collab: ['mentoring', 'startups'], publish: 'published', consent: 'granted',
    bio: 'أصمم تجارب رقمية تتمحور حول الإنسان، وأقود أبحاث المستخدمين واختبارات قابلية الاستخدام، وأهتم بشكل خاص بإمكانية الوصول الرقمي لضمان أن تكون الخدمات الحكومية والتجارية متاحة للجميع.',
  },
  {
    ar: 'يوسف الشمري', en: 'Yousef Alshammari', type: 5, status: 'active',
    title: 'طالب علوم حاسب ومطوّر تطبيقات جوال', city: 'حائل',
    cats: ['software'], specs: ['software.mobile', 'software.frontend'],
    interests: ['appdev', 'hackathons', 'ai'], skills: ['Flutter', 'Dart', 'Firebase'],
    collab: ['projects', 'volunteering'], publish: 'published', consent: 'granted',
    bio: 'طالب في السنة الأخيرة بتخصص علوم الحاسب، طوّرت عدة تطبيقات جوال لخدمة المجتمع المحلي، وأسعى لدمج قدرات الذكاء الاصطناعي في تطبيقات بسيطة تحل مشكلات يومية حقيقية للمستخدمين.',
  },
  {
    ar: 'أمل العنزي', en: 'Amal Alanazi', type: 1, status: 'active',
    title: 'باحثة في الذكاء الاصطناعي المسؤول', city: 'الرياض',
    cats: ['ai', 'edu'], specs: ['ai.rai', 'edu.research'],
    interests: ['ai', 'research', 'training'], skills: ['AI Ethics', 'Policy Analysis'],
    collab: ['research', 'speaking'], publish: 'published', consent: 'granted',
    bio: 'أبحث في أخلاقيات الذكاء الاصطناعي وأثر الأنظمة الذكية على المجتمع، وأعمل على أطر عملية لتقييم العدالة والشفافية في النماذج، وأشارك في صياغة أدلة إرشادية للاستخدام المسؤول للتقنية.',
  },
  {
    ar: 'تركي البقمي', en: 'Turki Albuqami', type: 1, status: 'active',
    title: 'مهندس تشغيل نماذج تعلم الآلة', city: 'الرياض',
    cats: ['ai', 'cloud'], specs: ['ai.mlops', 'ai.ai-eng', 'cloud.k8s'],
    interests: ['genai', 'oss', 'ai'], skills: ['MLflow', 'Docker', 'Kubeflow'],
    collab: ['projects', 'training'], publish: 'published', consent: 'granted',
    bio: 'أنقل نماذج تعلم الآلة من مرحلة التجربة إلى الإنتاج، وأبني منصات للنشر والمراقبة وإعادة التدريب الآلي، وأهتم بتشغيل النماذج اللغوية الكبيرة بكفاءة عالية وتكلفة مناسبة داخل البيئات المحلية.',
  },
  {
    ar: 'جواهر المالكي', en: 'Jawaher Almalki', type: 1, status: 'active',
    title: 'مديرة مشاريع تحول رقمي', city: 'مكة المكرمة',
    cats: ['digital'], specs: ['digital.dt', 'digital.pm', 'digital.itgov'],
    interests: ['dt', 'entrepreneurship', 'collab'], skills: ['PMP', 'Agile', 'COBIT'],
    collab: ['mentoring', 'speaking'], publish: 'published', consent: 'granted',
    pendingTitle: 'مديرة برامج التحول الرقمي',
    bio: 'قدت عددًا من برامج التحول الرقمي في القطاعين الحكومي والخاص، من وضع الاستراتيجية وحتى التنفيذ وقياس الأثر، وأهتم بمواءمة المبادرات التقنية مع أهداف رؤية المملكة وتمكين فرق العمل.',
  },
  {
    ar: 'سلطان الرشيدي', en: 'Sultan Alrashidi', type: 1, status: 'active',
    title: 'مهندس شبكات واتصالات', city: 'بريدة',
    cats: ['network'], specs: ['network.neteng', 'network.5g6g', 'network.sdn'],
    interests: ['cyber', 'training'], skills: ['CCNP', 'SD-WAN'],
    collab: ['training'], publish: 'published', consent: 'granted', noLinkedin: true,
    bio: 'أعمل في تصميم وتشغيل شبكات المؤسسات وشبكات الجيل الخامس، ولدي اهتمام بالشبكات المعرفة برمجيًا وأتمتة إدارتها، وأقدّم دورات تدريبية للمهندسين الجدد في أساسيات الشبكات وأمنها.',
  },
  {
    ar: 'دانة الجهني', en: 'Dana Aljuhani', type: 5, status: 'active', photo: true,
    title: 'طالبة هندسة روبوتات', city: 'المدينة المنورة',
    cats: ['robotics'], specs: ['robotics.robotics', 'robotics.embedded', 'robotics.autonomous'],
    interests: ['hackathons', 'research', 'ai'], skills: ['ROS', 'C++', 'Arduino'],
    collab: ['projects', 'research'], publish: 'published', consent: 'granted',
    bio: 'أدرس هندسة الروبوتات وأطوّر مع فريقي روبوتًا ذاتي الحركة للمستودعات، وفزنا بمراكز متقدمة في مسابقات وطنية، وأهتم بدمج الرؤية الحاسوبية مع الأنظمة المدمجة منخفضة الاستهلاك للطاقة.',
  },
  {
    ar: 'ماجد الحارثي', en: 'Majed Alharthi', type: 1, status: 'active',
    title: 'مهندس حلول بلوك تشين', city: 'جدة',
    cats: ['emerging', 'sector'], specs: ['emerging.blockchain', 'emerging.web3', 'sector.fintech'],
    interests: ['entrepreneurship', 'oss'], skills: ['Solidity', 'Hyperledger'],
    collab: ['startups', 'projects'], publish: 'published', consent: 'granted',
    bio: 'أطوّر حلولًا قائمة على البلوك تشين لقطاع التقنية المالية، مثل التحقق من الهوية وتتبع سلاسل الإمداد، وأدعم الشركات الناشئة في تقييم جدوى التقنيات اللامركزية قبل الاستثمار فيها.',
  },
  {
    ar: 'منيرة القرني', en: 'Munira Alqarni', type: 1, status: 'active',
    title: 'مختصة تقنيات تعليمية', city: 'أبها',
    cats: ['edu'], specs: ['edu.ai-edu', 'edu.edtech', 'edu.content'],
    interests: ['training', 'ai', 'genai'], skills: ['LMS', 'Instructional Design'],
    collab: ['training', 'volunteering'], publish: 'published', consent: 'granted',
    bio: 'أصمم تجارب تعلم رقمية تفاعلية وأدرّب المعلمين على توظيف أدوات الذكاء الاصطناعي التوليدي في التعليم بشكل مسؤول، وأهتم بقياس أثر التقنية على تحصيل الطلاب ومشاركتهم داخل الصف.',
  },
  {
    ar: 'بدر العمري', en: 'Badr Alamri', type: 1, status: 'active',
    title: 'مهندس بيانات', city: 'الرياض',
    cats: ['data'], specs: ['data.de', 'data.bigdata', 'data.dgov'],
    interests: ['oss', 'dt'], skills: ['Spark', 'Airflow', 'dbt'],
    collab: ['projects'], publish: 'published', consent: 'granted', hideCity: true,
    bio: 'أبني خطوط معالجة البيانات ومستودعات البيانات الحديثة لمؤسسات كبيرة، وأهتم بحوكمة البيانات وجودتها بوصفها شرطًا أساسيًا لنجاح أي مشروع ذكاء اصطناعي، وأشارك خبراتي في لقاءات تقنية دورية.',
  },
  {
    ar: 'شهد الأحمدي', en: 'Shahad Alahmadi', type: 5, status: 'active',
    title: 'طالبة أمن سيبراني', city: 'ينبع',
    cats: ['cyber'], specs: ['cyber.netsec', 'cyber.privacy'],
    interests: ['cyber', 'ai', 'volunteering', 'hackathons'], skills: ['Wireshark', 'CTF', 'Linux'],
    collab: ['volunteering', 'projects'], publish: 'published', consent: 'granted',
    bio: 'طالبة أمن سيبراني شغوفة بتحليل حركة الشبكات وحماية الخصوصية، أشارك بانتظام في مسابقات التقاط العلم، وأتطوع في حملات التوعية الرقمية، وأستكشف استخدام تعلم الآلة في كشف التسلل.',
  },
  {
    ar: 'عمر باوزير', en: 'Omar Bawazir', type: 1, status: 'active',
    title: 'مدير منتجات رقمية', city: 'جدة',
    cats: ['digital', 'design'], specs: ['digital.product', 'design.product-design'],
    interests: ['product', 'entrepreneurship', 'genai'], skills: ['Product Discovery', 'OKRs'],
    collab: ['startups', 'mentoring'], publish: 'published', consent: 'granted',
    bio: 'أقود فرق المنتجات الرقمية من اكتشاف الفكرة حتى الإطلاق والنمو، وعملت على منتجات في التجارة الإلكترونية والخدمات المالية، وأستكشف حاليًا بناء منتجات تعتمد على الذكاء الاصطناعي التوليدي.',
  },
  {
    ar: 'رهف الدخيل', en: 'Rahaf Aldakhil', type: 1, status: 'active', photo: true,
    title: 'مهندسة وكلاء ذكاء اصطناعي', city: 'الرياض',
    cats: ['ai', 'software'], specs: ['ai.agents', 'ai.llm', 'ai.prompt', 'software.backend'],
    interests: ['genai', 'ai', 'product'], skills: ['LangGraph', 'Python', 'RAG'],
    collab: ['projects', 'speaking'], publish: 'published', consent: 'granted',
    bio: 'أبني وكلاء ذكاء اصطناعي قادرين على تنفيذ مهام متعددة الخطوات داخل الأنظمة المؤسسية، مع التركيز على الاسترجاع المعزز وضبط المطالبات وتقييم الموثوقية، وأحب مشاركة التجارب العملية مع المجتمع.',
  },
  {
    ar: 'نايف السلمي', en: 'Naif Alsulami', type: 1, status: 'active',
    title: 'أخصائي تقنية صحية', city: 'الدمام',
    cats: ['sector', 'data'], specs: ['sector.healthtech', 'data.da'],
    interests: ['ai', 'research', 'dt'], skills: ['HL7 FHIR', 'Tableau'],
    collab: ['research', 'projects'], publish: 'published', consent: 'granted',
    bio: 'أعمل على تكامل الأنظمة الصحية وتحليل بيانات المرضى لتحسين جودة الرعاية، وأهتم بتطبيقات الذكاء الاصطناعي في التشخيص المبكر، مع الالتزام الكامل بمتطلبات حماية البيانات الصحية الحساسة.',
  },
  {
    ar: 'غادة الفيفي', en: 'Ghada Alfaifi', type: 1, status: 'active',
    title: 'مهندسة رؤية حاسوبية', city: 'جازان',
    cats: ['ai'], specs: ['ai.cv', 'ai.ai-eng'],
    interests: ['ai', 'collab', 'product'], skills: ['TensorRT', 'Edge AI'],
    collab: ['projects'], publish: 'published', consent: 'granted',
    bio: 'أطوّر أنظمة رؤية حاسوبية تعمل على الأجهزة الطرفية لمراقبة المحاصيل الزراعية والمنشآت، وأهتم بتحسين أداء النماذج على العتاد محدود الموارد، وأبحث عن شراكات في مشاريع تطبيقية ذات أثر.',
  },
  {
    ar: 'سعود الزامل', en: 'Saud Alzamil', type: 1, status: 'active',
    title: 'مهندس DevOps وموثوقية مواقع', city: 'الخبر',
    cats: ['cloud', 'software'], specs: ['cloud.sre', 'software.devops'],
    interests: ['oss', 'collab'], skills: ['Prometheus', 'GitOps', 'CI/CD'],
    collab: ['mentoring', 'projects'], publish: 'published', consent: 'granted',
    bio: 'أعمل على رفع موثوقية الأنظمة وأتمتة عمليات النشر والمراقبة، وأطبّق ممارسات هندسة موثوقية المواقع في بيئات إنتاجية عالية الحركة، وأساهم في توثيق أفضل الممارسات للفرق التقنية الناشئة.',
  },
  {
    ar: 'أروى العسيري', en: 'Arwa Alasiri', type: 1, status: 'active',
    title: 'مختصة إدارة الهوية والصلاحيات', city: 'الرياض',
    cats: ['cyber'], specs: ['cyber.iam', 'cyber.cloudsec'],
    interests: ['cyber', 'ai', 'dt'], skills: ['Zero Trust', 'PAM', 'Entra ID'],
    collab: ['training', 'speaking'], publish: 'published', consent: 'granted',
    bio: 'أصمم حلول إدارة الهوية والصلاحيات ونماذج الثقة المعدومة للمؤسسات، وأهتم بتأمين البيئات السحابية الهجينة، وأتابع كيف يمكن للذكاء الاصطناعي أن يدعم اكتشاف إساءة استخدام الصلاحيات مبكرًا.',
  },
  {
    ar: 'زياد التميمي', en: 'Ziyad Altamimi', type: 5, status: 'active',
    title: 'طالب ذكاء اصطناعي مهتم بالنماذج اللغوية', city: 'الرياض',
    cats: ['ai'], specs: ['ai.llm', 'ai.nlp'],
    interests: ['genai', 'oss', 'hackathons'], skills: ['Hugging Face', 'Python'],
    collab: ['projects', 'volunteering'], publish: 'published', consent: 'granted',
    bio: 'أدرس الذكاء الاصطناعي وأجرّب ضبط النماذج اللغوية مفتوحة المصدر على مهام عربية متخصصة، وأنشر تجاربي ونتائجي بشكل مفتوح، وأبحث عن فرص للتعاون مع باحثين ومطورين في مشاريع تطبيقية.',
  },
  // ───── حالات غير منشورة لاختبار سير العمل في لوحة الإدارة ─────
  {
    ar: 'ليان الشريف', en: 'Layan Alsharif', type: 1, status: 'active',
    title: '', city: '', cats: [], specs: [], interests: [], skills: [], collab: [],
    publish: null, consent: 'none', bio: '',
  },
  {
    ar: 'حسن آل سعيد', en: 'Hassan Al Saeed', type: 1, status: 'active',
    title: 'أخصائي ذكاء الأعمال', city: 'الطائف',
    cats: ['data'], specs: ['data.bi', 'data.viz'],
    interests: ['dt', 'ai'], skills: ['Power BI', 'DAX'],
    collab: ['training'], publish: 'pending_review', consent: 'granted',
    bio: 'أصمم لوحات معلومات تفاعلية تساعد الإدارات العليا على متابعة مؤشرات الأداء بشكل لحظي، وأعمل على بناء نماذج بيانات موحّدة تربط مصادر متعددة، وأهتم بتبسيط عرض البيانات لغير المختصين.',
  },
  {
    ar: 'مها الخالدي', en: 'Maha Alkhalidi', type: 5, status: 'active',
    title: 'طالبة نظم معلومات', city: 'الرياض',
    cats: ['digital'], specs: ['digital.sa'], interests: ['dt'], skills: [], collab: [],
    publish: 'incomplete', consent: 'none', bio: 'طالبة نظم معلومات مهتمة بتحليل النظم.',
  },
  {
    ar: 'إبراهيم الحمدان', en: 'Ibrahim Alhamdan', type: 1, status: 'expired',
    title: 'مهندس أنظمة مدمجة', city: 'الجبيل',
    cats: ['robotics'], specs: ['robotics.embedded', 'robotics.industrial'],
    interests: ['research', 'product'], skills: ['C', 'RTOS'],
    collab: ['projects'], publish: 'published', consent: 'granted',
    bio: 'أطوّر أنظمة مدمجة لخطوط الإنتاج الصناعية الذكية، وأعمل على ربط الحساسات بأنظمة التحكم وتحليل البيانات اللحظية، وأهتم بتطبيقات الصناعة الرابعة وتحسين كفاءة المصانع المحلية وتقليل الهدر.',
  },
  {
    ar: 'وعد الثبيتي', en: 'Waad Althubaiti', type: 1, status: 'active',
    title: 'مختصة تحليل أعمال', city: 'الطائف',
    cats: ['digital'], specs: ['digital.ba'], interests: ['dt'], skills: ['BPMN'],
    collab: [], publish: 'published', consent: 'withdrawn',
    bio: 'أعمل على تحليل متطلبات الأعمال وتحويلها إلى حلول تقنية واضحة، وأهتم بإعادة هندسة الإجراءات الحكومية لتكون رقمية بالكامل، وأتعاون مع فرق التطوير لضمان تحقيق القيمة المرجوة للمستفيد.',
  },
  {
    ar: 'طلال المري', en: 'Talal Almarri', type: 1, status: 'active',
    title: 'مطوّر', city: 'الدمام',
    cats: ['software'], specs: ['software.web'], interests: ['appdev'], skills: ['PHP'],
    collab: [], publish: 'rejected', consent: 'granted',
    rejection: 'المسمى الوظيفي عام جدًا، والنبذة لا توضح مجال الخبرة. يرجى التحديث وإعادة الإرسال.',
    bio: 'أعمل في تطوير مواقع الويب منذ عدة سنوات وأحب تعلم التقنيات الجديدة، وأسعى دائمًا لتطوير مهاراتي في البرمجة والتصميم، وأتمنى المشاركة في المشاريع التقنية المختلفة مع أعضاء الجمعية.',
  },
  {
    ar: 'عبير السهلي', en: 'Abeer Alsahli', type: 1, status: 'active',
    title: 'مهندسة جودة برمجيات', city: 'الرياض',
    cats: ['software'], specs: ['software.qa'], interests: ['oss', 'training'], skills: ['Cypress', 'Playwright'],
    collab: ['training'], publish: 'published', consent: 'granted', visible: false,
    bio: 'أبني استراتيجيات اختبار شاملة تجمع بين الاختبار اليدوي والآلي، وأعمل على أتمتة اختبارات الواجهات والأنظمة الخلفية ضمن خطوط التكامل المستمر، وأهتم بنشر ثقافة الجودة داخل فرق التطوير.',
  },
  {
    ar: 'فيصل الراجحي', en: 'Faisal Alrajhi', type: 1, status: 'pending',
    title: '', city: '', cats: [], specs: [], interests: [], skills: [], collab: [],
    publish: null, consent: 'none', bio: '',
  },
]

const BASE = Date.parse('2026-09-01T09:00:00Z')
const day = 86_400_000
const iso = (offsetDays: number) => new Date(BASE + offsetDays * day).toISOString()

export function buildSkills(): Skill[] {
  const names = [...new Set(ROWS.flatMap((r) => r.skills))]
  return names.map((name) => ({ id: slugify(name) || name, name }))
}

function skillId(name: string) {
  return slugify(name) || name
}

function consentFor(r: Row, i: number): Consent {
  const fields = { photo: true, linkedin: !r.noLinkedin, city: !r.hideCity, membershipType: i % 4 !== 3 }
  if (r.consent === 'none')
    return { status: 'none', fields: { photo: false, linkedin: false, city: false, membershipType: false }, version: CONSENT_VERSION, timestamp: null, source: null }
  return { status: r.consent, fields, version: CONSENT_VERSION, timestamp: iso(i % 20), source: 'member' }
}

/** صور رمزية تجريدية (SVG) — ليست صورًا لأشخاص */
export function illustratedAvatar(seed: number): string {
  const palettes = [
    ['#08223F', '#22A599'],
    ['#044869', '#00A8DF'],
    ['#0d2c4a', '#7fe7ff'],
    ['#12807a', '#e4f5f3'],
  ]
  const [a, b] = palettes[seed % palettes.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="120" height="120" fill="url(#g)"/><circle cx="60" cy="48" r="20" fill="#ffffff" fill-opacity=".85"/><path d="M22 112c4-22 20-34 38-34s34 12 38 34" fill="#ffffff" fill-opacity=".85"/><circle cx="${20 + (seed * 13) % 80}" cy="${14 + (seed * 7) % 20}" r="3" fill="#ffffff" fill-opacity=".5"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function buildSeed(): { members: Member[]; profiles: MemberProfile[] } {
  const members: Member[] = ROWS.map((r, i) => ({
    id: 1001 + i,
    membershipNo: `AIA-${String(24000 + i * 7).padStart(6, '0')}`,
    fullNameAr: r.ar,
    fullNameEn: r.en,
    membershipTypeId: r.type,
    membershipStatus: r.status,
    joinedAt: iso(-300 + i * 5),
    expiresAt: r.status === 'expired' ? iso(-10) : iso(65 + i * 9),
    email: `member${String(i + 1).padStart(3, '0')}@example.com`,
    phone: `0500000${String(i + 1).padStart(3, '0')}`,
  }))

  const profiles: MemberProfile[] = []
  ROWS.forEach((r, i) => {
    if (!r.publish) return
    const handle = slugify(r.en)
    const isLive = r.publish === 'published'
    profiles.push({
      id: 501 + profiles.length,
      memberId: members[i].id,
      slug: handle,
      professionalTitle: r.title,
      profileImageUrl: r.photo ? illustratedAvatar(i) : null,
      shortBio: r.bio,
      fullBio: r.bio
        ? `${r.bio}\n\nأؤمن بأن مجتمع الجمعية مساحة مناسبة لتبادل الخبرات وبناء شراكات مهنية مثمرة، ويسعدني التواصل مع المهتمين بالمجالات نفسها لتبادل المعرفة أو التعاون في مبادرات ومشاريع مشتركة.`
        : '',
      linkedinUrl: r.noLinkedin || !r.bio ? '' : `https://www.linkedin.com/in/example-${handle}`,
      city: r.city,
      categoryIds: r.cats,
      specializationIds: r.specs,
      interestIds: r.interests,
      skillIds: r.skills.map(skillId),
      collaborationAreaIds: r.collab,
      publishStatus: r.publish,
      visibilityEnabled: r.visible ?? true,
      consent: consentFor(r, i),
      pendingChanges: r.pendingTitle ? { professionalTitle: r.pendingTitle } : null,
      rejectionReason: r.rejection ?? null,
      createdAt: iso(-120 + i),
      updatedAt: iso(i % 30),
      publishedAt: isLive ? iso(i % 30) : null,
    })
  })
  return { members, profiles }
}
