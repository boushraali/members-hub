-- مُولَّد آليًا من src/data/taxonomy.ts — لا تعدّله يدويًا
-- البيانات الأولية للتصنيف (12 مجالًا رئيسيًا وتخصصاتها الفرعية والاهتمامات التقنية ومجالات التعاون)
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO mh_tech_categories (code, name_ar, name_en, icon, is_active, display_order) VALUES
  ('ai', 'الذكاء الاصطناعي', 'Artificial Intelligence', 'brain', 1, 1),
  ('data', 'علوم البيانات والتحليلات', 'Data Science & Analytics', 'database', 1, 2),
  ('cyber', 'الأمن السيبراني', 'Cybersecurity', 'shield', 1, 3),
  ('software', 'تطوير البرمجيات', 'Software Development', 'code', 1, 4),
  ('cloud', 'الحوسبة السحابية والبنية التحتية', 'Cloud & Infrastructure', 'cloud', 1, 5),
  ('network', 'الشبكات والاتصالات', 'Networks & Telecommunications', 'network', 1, 6),
  ('robotics', 'الروبوتات والأنظمة الذكية', 'Robotics & Intelligent Systems', 'bot', 1, 7),
  ('emerging', 'التقنيات الناشئة', 'Emerging Technologies', 'rocket', 1, 8),
  ('digital', 'التحول الرقمي وإدارة التقنية', 'Digital Transformation & IT Management', 'chart', 1, 9),
  ('design', 'التصميم وتجربة المستخدم', 'Design & User Experience', 'palette', 1, 10),
  ('edu', 'التقنيات التعليمية والبحث العلمي', 'EdTech & Scientific Research', 'book', 1, 11),
  ('sector', 'التطبيقات القطاعية للتقنية', 'Sector Applications', 'factory', 1, 12)
AS new ON DUPLICATE KEY UPDATE name_ar = new.name_ar, name_en = new.name_en;

INSERT INTO mh_tech_specializations (category_id, code, name_ar, name_en, is_active, display_order)
SELECT c.id, s.code, s.name_ar, s.name_en, 1, s.ord FROM (
  SELECT 'ai' AS cat, 'ai.genai' AS code, 'الذكاء الاصطناعي التوليدي' AS name_ar, 'Generative AI' AS name_en, 1 AS ord
  UNION ALL
  SELECT 'ai' AS cat, 'ai.ml' AS code, 'تعلم الآلة' AS name_ar, 'Machine Learning' AS name_en, 2 AS ord
  UNION ALL
  SELECT 'ai' AS cat, 'ai.dl' AS code, 'التعلم العميق' AS name_ar, 'Deep Learning' AS name_en, 3 AS ord
  UNION ALL
  SELECT 'ai' AS cat, 'ai.nlp' AS code, 'معالجة اللغات الطبيعية' AS name_ar, 'NLP' AS name_en, 4 AS ord
  UNION ALL
  SELECT 'ai' AS cat, 'ai.cv' AS code, 'الرؤية الحاسوبية' AS name_ar, 'Computer Vision' AS name_en, 5 AS ord
  UNION ALL
  SELECT 'ai' AS cat, 'ai.prompt' AS code, 'هندسة المطالبات' AS name_ar, 'Prompt Engineering' AS name_en, 6 AS ord
  UNION ALL
  SELECT 'ai' AS cat, 'ai.agents' AS code, 'وكلاء الذكاء الاصطناعي' AS name_ar, 'AI Agents' AS name_en, 7 AS ord
  UNION ALL
  SELECT 'ai' AS cat, 'ai.llm' AS code, 'النماذج اللغوية الكبيرة' AS name_ar, 'LLMs' AS name_en, 8 AS ord
  UNION ALL
  SELECT 'ai' AS cat, 'ai.ai-eng' AS code, 'هندسة وتطوير حلول الذكاء الاصطناعي' AS name_ar, 'AI Engineering' AS name_en, 9 AS ord
  UNION ALL
  SELECT 'ai' AS cat, 'ai.mlops' AS code, 'تشغيل نماذج الذكاء الاصطناعي' AS name_ar, 'MLOps' AS name_en, 10 AS ord
  UNION ALL
  SELECT 'ai' AS cat, 'ai.rai' AS code, 'الذكاء الاصطناعي المسؤول وأخلاقياته' AS name_ar, 'Responsible AI' AS name_en, 11 AS ord
  UNION ALL
  SELECT 'data' AS cat, 'data.ds' AS code, 'علم البيانات' AS name_ar, 'Data Science' AS name_en, 12 AS ord
  UNION ALL
  SELECT 'data' AS cat, 'data.da' AS code, 'تحليل البيانات' AS name_ar, 'Data Analysis' AS name_en, 13 AS ord
  UNION ALL
  SELECT 'data' AS cat, 'data.de' AS code, 'هندسة البيانات' AS name_ar, 'Data Engineering' AS name_en, 14 AS ord
  UNION ALL
  SELECT 'data' AS cat, 'data.bigdata' AS code, 'البيانات الضخمة' AS name_ar, 'Big Data' AS name_en, 15 AS ord
  UNION ALL
  SELECT 'data' AS cat, 'data.bi' AS code, 'ذكاء الأعمال' AS name_ar, 'Business Intelligence' AS name_en, 16 AS ord
  UNION ALL
  SELECT 'data' AS cat, 'data.viz' AS code, 'تصور البيانات ولوحات المعلومات' AS name_ar, 'Data Visualization' AS name_en, 17 AS ord
  UNION ALL
  SELECT 'data' AS cat, 'data.dgov' AS code, 'حوكمة البيانات' AS name_ar, 'Data Governance' AS name_en, 18 AS ord
  UNION ALL
  SELECT 'data' AS cat, 'data.dq' AS code, 'جودة البيانات وإدارتها' AS name_ar, 'Data Quality & Management' AS name_en, 19 AS ord
  UNION ALL
  SELECT 'data' AS cat, 'data.predictive' AS code, 'التحليلات التنبؤية' AS name_ar, 'Predictive Analytics' AS name_en, 20 AS ord
  UNION ALL
  SELECT 'cyber' AS cat, 'cyber.grc' AS code, 'حوكمة الأمن السيبراني وإدارة المخاطر والامتثال' AS name_ar, 'GRC' AS name_en, 21 AS ord
  UNION ALL
  SELECT 'cyber' AS cat, 'cyber.pentest' AS code, 'اختبار الاختراق والأمن الهجومي' AS name_ar, 'Penetration Testing' AS name_en, 22 AS ord
  UNION ALL
  SELECT 'cyber' AS cat, 'cyber.dfir' AS code, 'الاستجابة للحوادث والتحليل الجنائي الرقمي' AS name_ar, 'DFIR' AS name_en, 23 AS ord
  UNION ALL
  SELECT 'cyber' AS cat, 'cyber.soc' AS code, 'عمليات الأمن السيبراني' AS name_ar, 'SOC' AS name_en, 24 AS ord
  UNION ALL
  SELECT 'cyber' AS cat, 'cyber.netsec' AS code, 'أمن الشبكات والبنية التحتية' AS name_ar, 'Network & Infrastructure Security' AS name_en, 25 AS ord
  UNION ALL
  SELECT 'cyber' AS cat, 'cyber.appsec' AS code, 'أمن التطبيقات' AS name_ar, 'Application Security' AS name_en, 26 AS ord
  UNION ALL
  SELECT 'cyber' AS cat, 'cyber.cloudsec' AS code, 'أمن الحوسبة السحابية' AS name_ar, 'Cloud Security' AS name_en, 27 AS ord
  UNION ALL
  SELECT 'cyber' AS cat, 'cyber.iam' AS code, 'إدارة الهوية والصلاحيات' AS name_ar, 'IAM' AS name_en, 28 AS ord
  UNION ALL
  SELECT 'cyber' AS cat, 'cyber.aisec' AS code, 'أمن الذكاء الاصطناعي' AS name_ar, 'AI Security' AS name_en, 29 AS ord
  UNION ALL
  SELECT 'cyber' AS cat, 'cyber.privacy' AS code, 'حماية البيانات والخصوصية' AS name_ar, 'Data Protection & Privacy' AS name_en, 30 AS ord
  UNION ALL
  SELECT 'software' AS cat, 'software.web' AS code, 'تطوير تطبيقات الويب' AS name_ar, 'Web Development' AS name_en, 31 AS ord
  UNION ALL
  SELECT 'software' AS cat, 'software.mobile' AS code, 'تطوير تطبيقات الجوال' AS name_ar, 'Mobile Development' AS name_en, 32 AS ord
  UNION ALL
  SELECT 'software' AS cat, 'software.frontend' AS code, 'تطوير الواجهات الأمامية' AS name_ar, 'Frontend' AS name_en, 33 AS ord
  UNION ALL
  SELECT 'software' AS cat, 'software.backend' AS code, 'تطوير الأنظمة الخلفية' AS name_ar, 'Backend' AS name_en, 34 AS ord
  UNION ALL
  SELECT 'software' AS cat, 'software.fullstack' AS code, 'التطوير المتكامل' AS name_ar, 'Full-Stack' AS name_en, 35 AS ord
  UNION ALL
  SELECT 'software' AS cat, 'software.se' AS code, 'هندسة البرمجيات' AS name_ar, 'Software Engineering' AS name_en, 36 AS ord
  UNION ALL
  SELECT 'software' AS cat, 'software.api' AS code, 'تطوير واجهات API' AS name_ar, 'API Development' AS name_en, 37 AS ord
  UNION ALL
  SELECT 'software' AS cat, 'software.qa' AS code, 'اختبار البرمجيات وضمان الجودة' AS name_ar, 'QA & Testing' AS name_en, 38 AS ord
  UNION ALL
  SELECT 'software' AS cat, 'software.enterprise' AS code, 'تطوير الأنظمة المؤسسية' AS name_ar, 'Enterprise Systems' AS name_en, 39 AS ord
  UNION ALL
  SELECT 'software' AS cat, 'software.devops' AS code, 'هندسة DevOps' AS name_ar, 'DevOps' AS name_en, 40 AS ord
  UNION ALL
  SELECT 'cloud' AS cat, 'cloud.cloud' AS code, 'الحوسبة السحابية' AS name_ar, 'Cloud Computing' AS name_en, 41 AS ord
  UNION ALL
  SELECT 'cloud' AS cat, 'cloud.solutions' AS code, 'هندسة الحلول السحابية' AS name_ar, 'Cloud Solutions Architecture' AS name_en, 42 AS ord
  UNION ALL
  SELECT 'cloud' AS cat, 'cloud.sysadmin' AS code, 'إدارة الخوادم والأنظمة' AS name_ar, 'Systems Administration' AS name_en, 43 AS ord
  UNION ALL
  SELECT 'cloud' AS cat, 'cloud.infra' AS code, 'البنية التحتية التقنية' AS name_ar, 'IT Infrastructure' AS name_en, 44 AS ord
  UNION ALL
  SELECT 'cloud' AS cat, 'cloud.k8s' AS code, 'الحاويات وKubernetes' AS name_ar, 'Containers & Kubernetes' AS name_en, 45 AS ord
  UNION ALL
  SELECT 'cloud' AS cat, 'cloud.dc' AS code, 'إدارة مراكز البيانات' AS name_ar, 'Data Center Management' AS name_en, 46 AS ord
  UNION ALL
  SELECT 'cloud' AS cat, 'cloud.sre' AS code, 'هندسة موثوقية المواقع' AS name_ar, 'SRE' AS name_en, 47 AS ord
  UNION ALL
  SELECT 'cloud' AS cat, 'cloud.iac' AS code, 'البنية التحتية كرمز' AS name_ar, 'Infrastructure as Code' AS name_en, 48 AS ord
  UNION ALL
  SELECT 'network' AS cat, 'network.neteng' AS code, 'هندسة الشبكات' AS name_ar, 'Network Engineering' AS name_en, 49 AS ord
  UNION ALL
  SELECT 'network' AS cat, 'network.netsec' AS code, 'أمن الشبكات' AS name_ar, 'Network Security' AS name_en, 50 AS ord
  UNION ALL
  SELECT 'network' AS cat, 'network.wireless' AS code, 'الشبكات اللاسلكية' AS name_ar, 'Wireless Networks' AS name_en, 51 AS ord
  UNION ALL
  SELECT 'network' AS cat, 'network.digicomm' AS code, 'الاتصالات الرقمية' AS name_ar, 'Digital Communications' AS name_en, 52 AS ord
  UNION ALL
  SELECT 'network' AS cat, 'network.5g6g' AS code, 'شبكات الجيل الخامس والسادس' AS name_ar, '5G / 6G' AS name_en, 53 AS ord
  UNION ALL
  SELECT 'network' AS cat, 'network.sdn' AS code, 'الشبكات المعرفة برمجيًا' AS name_ar, 'SDN' AS name_en, 54 AS ord
  UNION ALL
  SELECT 'network' AS cat, 'network.iotnet' AS code, 'إنترنت الأشياء والشبكات الذكية' AS name_ar, 'IoT & Smart Networks' AS name_en, 55 AS ord
  UNION ALL
  SELECT 'robotics' AS cat, 'robotics.robotics' AS code, 'الروبوتات' AS name_ar, 'Robotics' AS name_en, 56 AS ord
  UNION ALL
  SELECT 'robotics' AS cat, 'robotics.automation' AS code, 'الأتمتة الذكية' AS name_ar, 'Intelligent Automation' AS name_en, 57 AS ord
  UNION ALL
  SELECT 'robotics' AS cat, 'robotics.embedded' AS code, 'الأنظمة المدمجة' AS name_ar, 'Embedded Systems' AS name_en, 58 AS ord
  UNION ALL
  SELECT 'robotics' AS cat, 'robotics.iot' AS code, 'إنترنت الأشياء' AS name_ar, 'IoT' AS name_en, 59 AS ord
  UNION ALL
  SELECT 'robotics' AS cat, 'robotics.autonomous' AS code, 'الأنظمة الذاتية' AS name_ar, 'Autonomous Systems' AS name_en, 60 AS ord
  UNION ALL
  SELECT 'robotics' AS cat, 'robotics.drones' AS code, 'الطائرات دون طيار' AS name_ar, 'Drones' AS name_en, 61 AS ord
  UNION ALL
  SELECT 'robotics' AS cat, 'robotics.industrial' AS code, 'الأنظمة الصناعية الذكية' AS name_ar, 'Smart Industrial Systems' AS name_en, 62 AS ord
  UNION ALL
  SELECT 'emerging' AS cat, 'emerging.blockchain' AS code, 'البلوك تشين' AS name_ar, 'Blockchain' AS name_en, 63 AS ord
  UNION ALL
  SELECT 'emerging' AS cat, 'emerging.vr' AS code, 'الواقع الافتراضي' AS name_ar, 'VR' AS name_en, 64 AS ord
  UNION ALL
  SELECT 'emerging' AS cat, 'emerging.ar' AS code, 'الواقع المعزز' AS name_ar, 'AR' AS name_en, 65 AS ord
  UNION ALL
  SELECT 'emerging' AS cat, 'emerging.xr' AS code, 'الواقع الممتد' AS name_ar, 'XR' AS name_en, 66 AS ord
  UNION ALL
  SELECT 'emerging' AS cat, 'emerging.twins' AS code, 'التوأم الرقمي' AS name_ar, 'Digital Twins' AS name_en, 67 AS ord
  UNION ALL
  SELECT 'emerging' AS cat, 'emerging.quantum' AS code, 'الحوسبة الكمية' AS name_ar, 'Quantum Computing' AS name_en, 68 AS ord
  UNION ALL
  SELECT 'emerging' AS cat, 'emerging.web3' AS code, 'تقنيات Web3' AS name_ar, 'Web3' AS name_en, 69 AS ord
  UNION ALL
  SELECT 'emerging' AS cat, 'emerging.edge' AS code, 'الحوسبة الطرفية' AS name_ar, 'Edge Computing' AS name_en, 70 AS ord
  UNION ALL
  SELECT 'digital' AS cat, 'digital.dt' AS code, 'التحول الرقمي' AS name_ar, 'Digital Transformation' AS name_en, 71 AS ord
  UNION ALL
  SELECT 'digital' AS cat, 'digital.pm' AS code, 'إدارة المشاريع التقنية' AS name_ar, 'IT Project Management' AS name_en, 72 AS ord
  UNION ALL
  SELECT 'digital' AS cat, 'digital.product' AS code, 'إدارة المنتجات الرقمية' AS name_ar, 'Digital Product Management' AS name_en, 73 AS ord
  UNION ALL
  SELECT 'digital' AS cat, 'digital.ba' AS code, 'تحليل الأعمال' AS name_ar, 'Business Analysis' AS name_en, 74 AS ord
  UNION ALL
  SELECT 'digital' AS cat, 'digital.sa' AS code, 'تحليل النظم' AS name_ar, 'Systems Analysis' AS name_en, 75 AS ord
  UNION ALL
  SELECT 'digital' AS cat, 'digital.itgov' AS code, 'الحوكمة التقنية' AS name_ar, 'IT Governance' AS name_en, 76 AS ord
  UNION ALL
  SELECT 'digital' AS cat, 'digital.innovation' AS code, 'إدارة الابتكار' AS name_ar, 'Innovation Management' AS name_en, 77 AS ord
  UNION ALL
  SELECT 'digital' AS cat, 'digital.ea' AS code, 'العمارة المؤسسية' AS name_ar, 'Enterprise Architecture' AS name_en, 78 AS ord
  UNION ALL
  SELECT 'digital' AS cat, 'digital.itsm' AS code, 'إدارة الخدمات التقنية' AS name_ar, 'ITSM' AS name_en, 79 AS ord
  UNION ALL
  SELECT 'design' AS cat, 'design.ux' AS code, 'تصميم تجربة المستخدم' AS name_ar, 'UX Design' AS name_en, 80 AS ord
  UNION ALL
  SELECT 'design' AS cat, 'design.ui' AS code, 'تصميم واجهات المستخدم' AS name_ar, 'UI Design' AS name_en, 81 AS ord
  UNION ALL
  SELECT 'design' AS cat, 'design.product-design' AS code, 'تصميم المنتجات الرقمية' AS name_ar, 'Digital Product Design' AS name_en, 82 AS ord
  UNION ALL
  SELECT 'design' AS cat, 'design.research' AS code, 'أبحاث المستخدمين' AS name_ar, 'User Research' AS name_en, 83 AS ord
  UNION ALL
  SELECT 'design' AS cat, 'design.interaction' AS code, 'التصميم التفاعلي' AS name_ar, 'Interaction Design' AS name_en, 84 AS ord
  UNION ALL
  SELECT 'design' AS cat, 'design.service' AS code, 'تصميم الخدمات الرقمية' AS name_ar, 'Service Design' AS name_en, 85 AS ord
  UNION ALL
  SELECT 'design' AS cat, 'design.a11y' AS code, 'إمكانية الوصول الرقمي' AS name_ar, 'Accessibility' AS name_en, 86 AS ord
  UNION ALL
  SELECT 'edu' AS cat, 'edu.ai-edu' AS code, 'الذكاء الاصطناعي في التعليم' AS name_ar, 'AI in Education' AS name_en, 87 AS ord
  UNION ALL
  SELECT 'edu' AS cat, 'edu.edtech' AS code, 'تطوير التقنيات التعليمية' AS name_ar, 'EdTech Development' AS name_en, 88 AS ord
  UNION ALL
  SELECT 'edu' AS cat, 'edu.content' AS code, 'تصميم المحتوى الرقمي' AS name_ar, 'Digital Content Design' AS name_en, 89 AS ord
  UNION ALL
  SELECT 'edu' AS cat, 'edu.its' AS code, 'أنظمة التعلم الذكية' AS name_ar, 'Intelligent Learning Systems' AS name_en, 90 AS ord
  UNION ALL
  SELECT 'edu' AS cat, 'edu.research' AS code, 'البحث العلمي في التقنية' AS name_ar, 'Tech Research' AS name_en, 91 AS ord
  UNION ALL
  SELECT 'edu' AS cat, 'edu.edu-innovation' AS code, 'الابتكار التعليمي' AS name_ar, 'Educational Innovation' AS name_en, 92 AS ord
  UNION ALL
  SELECT 'edu' AS cat, 'edu.learning-analytics' AS code, 'تحليل بيانات التعليم' AS name_ar, 'Learning Analytics' AS name_en, 93 AS ord
  UNION ALL
  SELECT 'sector' AS cat, 'sector.fintech' AS code, 'التقنية المالية' AS name_ar, 'FinTech' AS name_en, 94 AS ord
  UNION ALL
  SELECT 'sector' AS cat, 'sector.healthtech' AS code, 'التقنية الصحية' AS name_ar, 'HealthTech' AS name_en, 95 AS ord
  UNION ALL
  SELECT 'sector' AS cat, 'sector.edtech' AS code, 'التقنية التعليمية' AS name_ar, 'EdTech' AS name_en, 96 AS ord
  UNION ALL
  SELECT 'sector' AS cat, 'sector.govtech' AS code, 'التقنية الحكومية' AS name_ar, 'GovTech' AS name_en, 97 AS ord
  UNION ALL
  SELECT 'sector' AS cat, 'sector.smartcity' AS code, 'المدن الذكية' AS name_ar, 'Smart Cities' AS name_en, 98 AS ord
  UNION ALL
  SELECT 'sector' AS cat, 'sector.industry40' AS code, 'التقنية الصناعية' AS name_ar, 'Industry 4.0' AS name_en, 99 AS ord
  UNION ALL
  SELECT 'sector' AS cat, 'sector.green' AS code, 'الاستدامة والتقنيات الخضراء' AS name_ar, 'Sustainability & GreenTech' AS name_en, 100 AS ord
  UNION ALL
  SELECT 'sector' AS cat, 'sector.agritech' AS code, 'التقنية الزراعية' AS name_ar, 'AgriTech' AS name_en, 101 AS ord
  UNION ALL
  SELECT 'sector' AS cat, 'sector.space' AS code, 'تقنيات الفضاء' AS name_ar, 'Space Tech' AS name_en, 102 AS ord
) AS s JOIN mh_tech_categories c ON c.code = s.cat
ON DUPLICATE KEY UPDATE name_ar = s.name_ar, name_en = s.name_en;

INSERT INTO mh_tech_interests (code, name_ar, name_en, is_active, display_order) VALUES
  ('ai', 'الذكاء الاصطناعي', 'Artificial Intelligence', 1, 1),
  ('genai', 'الذكاء الاصطناعي التوليدي', 'Generative AI', 1, 2),
  ('cyber', 'الأمن السيبراني', 'Cybersecurity', 1, 3),
  ('oss', 'المشاريع مفتوحة المصدر', 'Open Source', 1, 4),
  ('appdev', 'تطوير التطبيقات', 'App Development', 1, 5),
  ('entrepreneurship', 'الابتكار وريادة الأعمال', 'Innovation & Entrepreneurship', 1, 6),
  ('research', 'البحث العلمي', 'Scientific Research', 1, 7),
  ('training', 'التدريب ونقل المعرفة', 'Training & Knowledge Transfer', 1, 8),
  ('hackathons', 'الهاكاثونات والمسابقات', 'Hackathons & Competitions', 1, 9),
  ('volunteering', 'التطوع التقني', 'Tech Volunteering', 1, 10),
  ('product', 'تطوير المنتجات التقنية', 'Tech Product Development', 1, 11),
  ('dt', 'التحول الرقمي', 'Digital Transformation', 1, 12),
  ('collab', 'التعاون في المشاريع', 'Project Collaboration', 1, 13)
AS new ON DUPLICATE KEY UPDATE name_ar = new.name_ar, name_en = new.name_en;

INSERT INTO mh_collaboration_areas (code, name_ar, is_active, display_order) VALUES
  ('mentoring', 'الإرشاد المهني', 1, 1),
  ('research', 'الأبحاث المشتركة', 1, 2),
  ('projects', 'المشاريع التقنية', 1, 3),
  ('speaking', 'التحدث في الفعاليات', 1, 4),
  ('training', 'تقديم الدورات وورش العمل', 1, 5),
  ('judging', 'تحكيم الهاكاثونات', 1, 6),
  ('volunteering', 'التطوع في مبادرات الجمعية', 1, 7),
  ('startups', 'دعم الشركات الناشئة', 1, 8)
AS new ON DUPLICATE KEY UPDATE name_ar = new.name_ar;

INSERT INTO mh_directory_settings (setting_key, setting_value) VALUES
  ('show_membership_type', 'true'),
  ('hide_on_membership_inactive', 'true'),
  ('show_empty_specializations', 'false'),
  ('edit_approval_policy', 'review_sensitive'),
  ('consent_version', '2026-10-v1')
AS new ON DUPLICATE KEY UPDATE setting_value = mh_directory_settings.setting_value; -- لا يطغى على إعدادات معدّلة

COMMIT;
