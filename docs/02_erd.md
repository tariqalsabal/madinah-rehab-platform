# مخطط العلاقات (ERD)

```mermaid
erDiagram
    RE_USERS ||--o| RE_BENEFICIARIES : "ملف مستفيد"
    RE_USERS }o--|| RE_ORGANIZATIONS : "موظف منظمة"
    RE_USERS ||--o{ SEC_USER_ROLES : "أدوار"
    SEC_ROLES ||--o{ SEC_USER_ROLES : ""
    SEC_ROLES ||--o{ SEC_ROLE_PERMISSIONS : ""
    SEC_PERMISSIONS ||--o{ SEC_ROLE_PERMISSIONS : ""
    RE_USERS ||--o{ SEC_TOKENS : "توكنات"
    RE_USERS ||--o{ RE_NOTIFICATIONS : "إشعارات"

    RE_BENEFICIARIES ||--o{ RE_BENEFICIARY_CATEGORIES : ""
    RE_CATEGORIES ||--o{ RE_BENEFICIARY_CATEGORIES : ""
    RE_CATEGORIES ||--o{ RE_CATEGORIES : "parent"
    RE_BENEFICIARIES ||--o{ RE_BENEFICIARY_SKILLS : ""
    RE_SKILLS ||--o{ RE_BENEFICIARY_SKILLS : ""
    RE_BENEFICIARIES ||--o{ RE_DOCUMENTS : "وثائق"

    RE_ORGANIZATIONS ||--o{ RE_JOBS : "وظائف"
    RE_ORGANIZATIONS ||--o{ RE_TRAINING_PROGRAMS : "برامج"
    RE_ORGANIZATIONS ||--o{ RE_DONATIONS : "تبرعات"
    RE_DONATIONS ||--o{ RE_JOBS : "يموّل"
    RE_DONATIONS ||--o{ RE_TRAINING_PROGRAMS : "يموّل"
    RE_JOBS ||--o{ RE_JOB_SKILLS : ""
    RE_SKILLS ||--o{ RE_JOB_SKILLS : ""

    RE_BENEFICIARIES ||--o{ RE_APPLICATIONS : "طلبات"
    RE_JOBS ||--o{ RE_APPLICATIONS : ""
    RE_TRAINING_PROGRAMS ||--o{ RE_APPLICATIONS : ""
    RE_APPLICATIONS ||--o{ RE_APPLICATION_EVENTS : ""
    RE_APPLICATIONS ||--o{ RE_INTERVIEWS : ""
    RE_APPLICATIONS ||--o{ RE_OFFERS : ""
    RE_BENEFICIARIES ||--o{ RE_MATCHES : "مطابقات"
    RE_BENEFICIARIES ||--o{ RE_LETTERS : "خطابات"
```

## ملاحظات تصميمية
- **توحيد المستخدم**: `RE_USERS` جدول واحد لكل الأنواع لتبسيط المصادقة؛ التمييز عبر
  `user_type` + الأدوار. المستفيد يرتبط 1:1 بـ `RE_BENEFICIARIES`، وموظف المنظمة عبر `org_id`.
- **توحيد الطلب**: `RE_APPLICATIONS` يخدم الوظائف والتدريب عبر `target_type` مع قيد تحقق
  يضمن ملء `job_id` أو `program_id` حصراً.
- **التبرع كمورد قابل للاستهلاك**: `units_pledged`/`units_consumed` مع قيد يمنع التجاوز.
- **التصنيفات هرمية** عبر `parent_id` وبأنواع (مجال/مؤهل/مستوى/وظيفة).
```
