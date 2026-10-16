-- =====================================================================
-- مساحة أعضاء الجمعية — توسعة قاعدة البيانات (MySQL 8.0.19+ / InnoDB / utf8mb4)
--
-- ⚠️ مبادئ الترحيل:
--   1) لا يُعدَّل أي جدول قائم. كل الجداول الجديدة بالبادئة mh_ (Members Hub).
--   2) الملف المهني امتداد للعضوية: member_id يشير إلى جدول الأعضاء الحالي.
--   3) اسم جدول الأعضاء ونوع مفتاحه غير معروفين لنا بعد (لم نصل للشيفرة المصدرية).
--      استبدل `members`(`id` INT UNSIGNED) أدناه بالاسم والنوع الفعليين قبل التنفيذ،
--      ويجب أن يطابق نوع member_id نوع المفتاح الأصلي حرفيًا (INT/BIGINT، UNSIGNED أو لا).
--   4) لم يُنفَّذ هذا الملف على قاعدة بيانات فعلية بعد — يُختبر أولًا على نسخة Staging.
-- =====================================================================

SET NAMES utf8mb4;

-- ───────────── التصنيف ─────────────

CREATE TABLE mh_tech_categories (
  id             SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code           VARCHAR(40)  NOT NULL,             -- معرّف ثابت (ai, cyber, …) لا يتغير عند تعديل الاسم
  name_ar        VARCHAR(80)  NOT NULL,
  name_en        VARCHAR(80)  NOT NULL DEFAULT '',
  icon           VARCHAR(30)  NOT NULL DEFAULT 'layers',
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  display_order  SMALLINT     NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cat_code (code),
  UNIQUE KEY uq_cat_name_ar (name_ar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE mh_tech_specializations (
  id              INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  category_id     SMALLINT UNSIGNED NOT NULL,
  code            VARCHAR(80)       NOT NULL,       -- مثل ai.nlp — ثابت حتى لو نُقل التخصص لمجال آخر
  name_ar         VARCHAR(120)      NOT NULL,
  name_en         VARCHAR(120)      NOT NULL DEFAULT '',
  is_active       TINYINT(1)        NOT NULL DEFAULT 1,
  merged_into_id  INT UNSIGNED      NULL,           -- عند الدمج: التخصص البديل
  display_order   SMALLINT          NOT NULL DEFAULT 0,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_spec_code (code),
  KEY ix_spec_category (category_id, is_active),
  CONSTRAINT fk_spec_category FOREIGN KEY (category_id) REFERENCES mh_tech_categories (id) ON DELETE RESTRICT,
  CONSTRAINT fk_spec_merged   FOREIGN KEY (merged_into_id) REFERENCES mh_tech_specializations (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE mh_tech_interests (
  id             SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code           VARCHAR(40)  NOT NULL,
  name_ar        VARCHAR(80)  NOT NULL,
  name_en        VARCHAR(80)  NOT NULL DEFAULT '',
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  display_order  SMALLINT     NOT NULL DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_interest_code (code),
  UNIQUE KEY uq_interest_name_ar (name_ar)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE mh_skills (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name             VARCHAR(40)  NOT NULL,
  name_normalized  VARCHAR(40)  NOT NULL,           -- بعد التطبيع (lower + توحيد الهمزات) لمنع التكرار
  is_approved      TINYINT(1)   NOT NULL DEFAULT 1, -- يمكن للأدمن إخفاء مهارة غير لائقة
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_skill_norm (name_normalized)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE mh_collaboration_areas (
  id             SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code           VARCHAR(40)  NOT NULL,
  name_ar        VARCHAR(80)  NOT NULL,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  display_order  SMALLINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_collab_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────── الملف المهني ─────────────

CREATE TABLE mh_member_profiles (
  id                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_id              INT UNSIGNED    NOT NULL,          -- ⚠️ يطابق نوع members.id
  slug                   VARCHAR(80)     NOT NULL,          -- /site/members/{slug} — لا يحتوي member_id (منع التعداد)
  professional_title     VARCHAR(80)     NOT NULL DEFAULT '',
  profile_image_path     VARCHAR(255)    NULL,              -- مسار داخلي لصورة أُعيد ترميزها (بلا EXIF)
  short_bio              VARCHAR(250)    NOT NULL DEFAULT '',
  full_bio               TEXT            NULL,              -- نص عادي فقط (≤ 2000)
  linkedin_url           VARCHAR(200)    NULL,              -- https://www.linkedin.com/in/{handle} بعد التطبيع
  city                   VARCHAR(60)     NULL,              -- مدينة عامة من قائمة ثابتة
  publish_status         ENUM('incomplete','pending_review','published','hidden','rejected') NOT NULL DEFAULT 'incomplete',
  visibility_enabled     TINYINT(1)      NOT NULL DEFAULT 1, -- مفتاح العضو لإيقاف الظهور
  consent_status         ENUM('none','granted','withdrawn') NOT NULL DEFAULT 'none',
  consent_timestamp      DATETIME        NULL,
  consent_version        VARCHAR(20)     NULL,
  consent_source         ENUM('member','admin_recorded') NULL,
  consent_evidence_ref   VARCHAR(200)    NULL,
  show_photo             TINYINT(1)      NOT NULL DEFAULT 0, -- موافقات الحقول الاختيارية
  show_linkedin          TINYINT(1)      NOT NULL DEFAULT 0,
  show_city              TINYINT(1)      NOT NULL DEFAULT 0,
  show_membership_type   TINYINT(1)      NOT NULL DEFAULT 0,
  pending_changes        JSON            NULL,              -- تعديلات حساسة بانتظار الاعتماد
  rejection_reason       VARCHAR(500)    NULL,
  search_text            TEXT            NULL,              -- نص مُطبَّع للبحث (يُعاد بناؤه عند كل حفظ/اعتماد)
  published_at           DATETIME        NULL,
  created_at             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_profile_member (member_id),                 -- ملف واحد فقط لكل عضوية (منع التكرار)
  UNIQUE KEY uq_profile_slug (slug),
  KEY ix_profile_public (publish_status, visibility_enabled, consent_status),
  KEY ix_profile_city (city),
  FULLTEXT KEY ft_profile_search (search_text) WITH PARSER ngram,
  CONSTRAINT fk_profile_member FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- جداول الربط: مفتاحها member_id كما في المتطلبات، ومرتبطة بالملف (CASCADE عند حذف الملف)

CREATE TABLE mh_member_categories (
  member_id    INT UNSIGNED      NOT NULL,
  category_id  SMALLINT UNSIGNED NOT NULL,
  sort_order   TINYINT UNSIGNED  NOT NULL DEFAULT 0,  -- 0 = المجال الرئيسي الظاهر في البطاقة
  PRIMARY KEY (member_id, category_id),
  KEY ix_mc_category (category_id, member_id),
  CONSTRAINT fk_mc_profile  FOREIGN KEY (member_id)   REFERENCES mh_member_profiles (member_id) ON DELETE CASCADE,
  CONSTRAINT fk_mc_category FOREIGN KEY (category_id) REFERENCES mh_tech_categories (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE mh_member_specializations (
  member_id          INT UNSIGNED NOT NULL,
  specialization_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (member_id, specialization_id),
  KEY ix_ms_spec (specialization_id, member_id),
  CONSTRAINT fk_ms_profile FOREIGN KEY (member_id)         REFERENCES mh_member_profiles (member_id) ON DELETE CASCADE,
  CONSTRAINT fk_ms_spec    FOREIGN KEY (specialization_id) REFERENCES mh_tech_specializations (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE mh_member_interests (
  member_id    INT UNSIGNED      NOT NULL,
  interest_id  SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (member_id, interest_id),
  KEY ix_mi_interest (interest_id, member_id),
  CONSTRAINT fk_mi_profile  FOREIGN KEY (member_id)   REFERENCES mh_member_profiles (member_id) ON DELETE CASCADE,
  CONSTRAINT fk_mi_interest FOREIGN KEY (interest_id) REFERENCES mh_tech_interests (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE mh_member_skills (
  member_id   INT UNSIGNED     NOT NULL,
  skill_id    INT UNSIGNED     NOT NULL,
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (member_id, skill_id),
  KEY ix_msk_skill (skill_id, member_id),
  CONSTRAINT fk_msk_profile FOREIGN KEY (member_id) REFERENCES mh_member_profiles (member_id) ON DELETE CASCADE,
  CONSTRAINT fk_msk_skill   FOREIGN KEY (skill_id)  REFERENCES mh_skills (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE mh_member_collaboration_areas (
  member_id  INT UNSIGNED      NOT NULL,
  area_id    SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (member_id, area_id),
  CONSTRAINT fk_mca_profile FOREIGN KEY (member_id) REFERENCES mh_member_profiles (member_id) ON DELETE CASCADE,
  CONSTRAINT fk_mca_area    FOREIGN KEY (area_id)   REFERENCES mh_collaboration_areas (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ───────────── الموافقات والتدقيق ─────────────

-- سجل غير قابل للتعديل لكل منح/سحب موافقة (إثبات الامتثال لنظام حماية البيانات الشخصية)
CREATE TABLE mh_consent_log (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_id      INT UNSIGNED    NOT NULL,
  action         ENUM('granted','withdrawn','recorded_by_admin') NOT NULL,
  version        VARCHAR(20)     NOT NULL,
  fields         JSON            NOT NULL,              -- {"photo":true,"linkedin":true,...}
  source         ENUM('member','admin_recorded') NOT NULL,
  evidence_ref   VARCHAR(200)    NULL,
  actor_user_id  INT UNSIGNED    NULL,                  -- الأدمن عند التوثيق
  ip_hash        CHAR(64)        NULL,                  -- SHA-256 مع Salt — لا يُخزن IP صريح
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_consent_member (member_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE mh_profile_audit_logs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_id   INT UNSIGNED    NULL,                     -- NULL لعمليات التصنيف والإعدادات
  actor_type  ENUM('member','admin','system') NOT NULL,
  actor_id    INT UNSIGNED    NULL,
  action      VARCHAR(40)     NOT NULL,                 -- profile.approved, consent.withdrawn, taxonomy.merged, …
  details     JSON            NULL,                     -- الحقول المتغيرة (أسماء الحقول، لا قيم حساسة)
  ip_hash     CHAR(64)        NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_audit_member (member_id, created_at),
  KEY ix_audit_action (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- ملاحظة: لا FK على member_id هنا عمدًا — يبقى السجل بعد حذف العضو لأغراض التدقيق،
-- مع تطبيق سياسة الاحتفاظ المعتمدة (مثلًا حذف السجلات الأقدم من N سنوات).

CREATE TABLE mh_directory_settings (
  setting_key    VARCHAR(50)  NOT NULL,
  setting_value  VARCHAR(200) NOT NULL,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ───────────── الاستعلام العام المرجعي ─────────────
-- شرط الظهور يُطبَّق في الخادم على كل طلب (لا يعتمد على عمود مخزّن قد يتقادم).
-- ⚠️ استبدل m.status و m.membership_type_id بأسماء الأعمدة الفعلية وقيمها في جدول الأعضاء.
--
-- SELECT p.slug, m.full_name_ar, p.professional_title, …
-- FROM mh_member_profiles p
-- JOIN members m ON m.id = p.member_id
-- WHERE p.publish_status = 'published'
--   AND p.visibility_enabled = 1
--   AND p.consent_status = 'granted'
--   AND (m.status = 'active' OR (:hide_on_inactive = 0 AND m.status = 'expired'))
--   AND (:category IS NULL OR EXISTS (SELECT 1 FROM mh_member_categories c WHERE c.member_id = p.member_id AND c.category_id = :category))
--   AND (:spec IS NULL OR EXISTS (SELECT 1 FROM mh_member_specializations s WHERE s.member_id = p.member_id AND s.specialization_id = :spec))
--   AND (:q IS NULL OR MATCH(p.search_text) AGAINST (:q IN BOOLEAN MODE))
-- ORDER BY m.full_name_ar
-- LIMIT :limit OFFSET :offset;   -- limit ≤ 24
