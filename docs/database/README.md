# مخطط قاعدة البيانات والعلاقات

- [schema.sql](schema.sql): إنشاء الجداول الجديدة (بالبادئة `mh_`) دون تعديل أي جدول قائم.
- [seed_taxonomy.sql](seed_taxonomy.sql): البيانات الأولية للتصنيف، مولَّدة آليًا بالأمر `node scripts/generate-seed-sql.mjs`.

> ⚠️ لم يُنفَّذ المخطط على قاعدة بيانات فعلية بعد. اسم جدول الأعضاء `members(id)` افتراضي، ويجب استبداله بالاسم والنوع الحقيقيين.

```mermaid
erDiagram
  members ||--o| mh_member_profiles : "يمتد إلى (member_id UNIQUE)"
  mh_member_profiles ||--o{ mh_member_categories : ""
  mh_member_profiles ||--o{ mh_member_specializations : ""
  mh_member_profiles ||--o{ mh_member_interests : ""
  mh_member_profiles ||--o{ mh_member_skills : ""
  mh_member_profiles ||--o{ mh_member_collaboration_areas : ""
  mh_tech_categories ||--o{ mh_tech_specializations : "يضم"
  mh_tech_specializations |o--o{ mh_tech_specializations : "merged_into"
  mh_tech_categories ||--o{ mh_member_categories : ""
  mh_tech_specializations ||--o{ mh_member_specializations : ""
  mh_tech_interests ||--o{ mh_member_interests : ""
  mh_skills ||--o{ mh_member_skills : ""
  mh_collaboration_areas ||--o{ mh_member_collaboration_areas : ""
  members ||--o{ mh_consent_log : "سجل الموافقات"
  members ||--o{ mh_profile_audit_logs : "سجل العمليات"

  members {
    INT id PK "الجدول القائم — لا يُعدَّل"
    string full_name_ar
    int membership_type_id "1 محترف، 5 طالب"
    string status
    date expires_at
  }
  mh_member_profiles {
    BIGINT id PK
    INT member_id UK,FK
    string slug UK
    string professional_title
    string profile_image_path
    string short_bio
    text full_bio
    string linkedin_url
    string city
    enum publish_status
    bool visibility_enabled
    enum consent_status
    datetime consent_timestamp
    string consent_version
    bool show_photo
    bool show_linkedin
    bool show_city
    bool show_membership_type
    json pending_changes
    text search_text "FULLTEXT ngram"
  }
  mh_tech_categories {
    SMALLINT id PK
    string code UK
    string name_ar
    string name_en
    bool is_active
    int display_order
  }
  mh_tech_specializations {
    INT id PK
    SMALLINT category_id FK
    string code UK
    string name_ar
    string name_en
    bool is_active
    INT merged_into_id FK
  }
  mh_tech_interests {
    SMALLINT id PK
    string code UK
    string name_ar
    bool is_active
  }
  mh_member_specializations {
    INT member_id PK,FK
    INT specialization_id PK,FK
  }
  mh_profile_audit_logs {
    BIGINT id PK
    INT member_id
    enum actor_type
    string action
    json details
    datetime created_at
  }
```

## مطابقة الجداول المنطقية المطلوبة

| المطلوب | المنفَّذ | ملاحظة |
|---|---|---|
| Members | `members` (قائم) | لا يُعدَّل |
| MemberProfiles | `mh_member_profiles` | أُضيفت: `slug`، `consent_version/source/evidence_ref`، موافقات الحقول، `pending_changes`، `rejection_reason`، `search_text`، `published_at` |
| TechCategories | `mh_tech_categories` | أُضيف `code` الثابت و`icon` |
| TechSpecializations | `mh_tech_specializations` | أُضيف `code` و`merged_into_id` لدمج المكرر |
| TechInterests | `mh_tech_interests` | |
| MemberSpecializations | `mh_member_specializations` | + `mh_member_categories` لتمثيل المجال الرئيسي المختار حتى دون تخصص فرعي |
| MemberInterests | `mh_member_interests` | |
| MemberSkills | `mh_member_skills` + `mh_skills` | المهارات مُوحّدة لمنع التكرار («python» = «Python») |
| ProfileAuditLogs | `mh_profile_audit_logs` | + `mh_consent_log` منفصل وغير قابل للتعديل لإثبات الموافقات |
| — | `mh_collaboration_areas` + `mh_member_collaboration_areas` | «المجالات التي يهتم بالتعاون فيها» |
| — | `mh_directory_settings` | سياسة الاعتماد، والإخفاء عند الانتهاء، وإظهار نوع العضوية… |

## الفهارس الأساسية

| الفهرس | يخدم |
|---|---|
| `uq_profile_member (member_id)` | منع الملفات المكررة لنفس العضو |
| `ix_profile_public (publish_status, visibility_enabled, consent_status)` | تصفية الملفات الظاهرة |
| `ft_profile_search (search_text) ngram` | البحث النصي بالعربية |
| `ix_ms_spec (specialization_id, member_id)` وما يماثله لكل جدول ربط | فلاتر التخصص والاهتمام وعدّ الأعضاء |
| `ix_audit_member (member_id, created_at)` | سجل العمليات لكل عضو |
