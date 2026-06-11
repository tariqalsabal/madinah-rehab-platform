-- =============================================================================
--  06_seed_data.sql : البيانات المرجعية + بيانات تجريبية (Demo)
--  ملاحظة: كلمات المرور هنا تجريبية (hash وهمي)؛ في الإنتاج تُولَّد عبر الحزمة.
-- =============================================================================
SET DEFINE OFF;

-- ----------------------------------------------------------------------------
--  الأدوار (RBAC)
-- ----------------------------------------------------------------------------
INSERT INTO SEC_ROLES (role_code, role_name, is_system, description) VALUES ('ADMIN',      'مدير النظام',        'Y', 'صلاحية كاملة على المنصة');
INSERT INTO SEC_ROLES (role_code, role_name, is_system, description) VALUES ('STAFF',      'موظف الجمعية',       'Y', 'إدارة المستفيدين والخطابات والمتابعة');
INSERT INTO SEC_ROLES (role_code, role_name, is_system, description) VALUES ('BENEFICIARY','مستفيد',            'Y', 'ملف شخصي وتقديم على الفرص');
INSERT INTO SEC_ROLES (role_code, role_name, is_system, description) VALUES ('COMPANY_ADMIN','مدير حساب شركة',   'Y', 'إدارة حساب الشركة ووظائفها');
INSERT INTO SEC_ROLES (role_code, role_name, is_system, description) VALUES ('COMPANY_HR', 'موظف موارد بشرية',  'Y', 'استعراض المرشحين وإدارة الطلبات');
INSERT INTO SEC_ROLES (role_code, role_name, is_system, description) VALUES ('INSTITUTE',  'مركز تدريب/معهد',    'Y', 'إدارة البرامج التدريبية');
INSERT INTO SEC_ROLES (role_code, role_name, is_system, description) VALUES ('RECRUITER',  'شركة توظيف',         'Y', 'إدارة فرص التوظيف والمرشحين');
INSERT INTO SEC_ROLES (role_code, role_name, is_system, description) VALUES ('DONOR',      'جهة مانحة',          'Y', 'تقديم ومتابعة التبرعات الوظيفية/التدريبية');

-- ----------------------------------------------------------------------------
--  الصلاحيات الدقيقة
-- ----------------------------------------------------------------------------
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('USER.MANAGE',    'USERS',    'إدارة المستخدمين');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('ORG.APPROVE',    'ORGS',     'اعتماد المنظمات');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('ORG.MANAGE',     'ORGS',     'إدارة بيانات المنظمة');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('BENEF.CREATE',   'BENEF',    'إنشاء ملف مستفيد');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('BENEF.APPROVE',  'BENEF',    'اعتماد المستفيدين');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('BENEF.SELF',     'BENEF',    'إدارة الملف الشخصي للمستفيد');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('JOB.CREATE',     'JOBS',     'إنشاء وظيفة');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('JOB.APPROVE',    'JOBS',     'اعتماد الوظائف');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('JOB.APPLY',      'JOBS',     'التقديم على وظيفة');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('TRAIN.CREATE',   'TRAINING', 'إنشاء برنامج تدريبي');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('TRAIN.APPROVE',  'TRAINING', 'اعتماد البرامج التدريبية');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('TRAIN.APPLY',    'TRAINING', 'التقديم على برنامج تدريبي');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('DONATION.MANAGE','DONATION', 'إدارة التبرعات');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('DONATION.APPROVE','DONATION','اعتماد التبرعات');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('APP.MANAGE',     'APPS',     'إدارة الطلبات والمراحل');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('LETTER.ISSUE',   'LETTERS',  'إصدار خطابات التعريف');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('MATCH.RUN',      'MATCH',    'تشغيل محرك المطابقة');
INSERT INTO SEC_PERMISSIONS (perm_code, perm_group, description) VALUES ('REPORT.VIEW',    'REPORT',   'عرض التقارير والإحصائيات');

-- ربط الأدوار بالصلاحيات
-- ADMIN: كل الصلاحيات
INSERT INTO SEC_ROLE_PERMISSIONS (role_id, perm_id)
SELECT (SELECT role_id FROM SEC_ROLES WHERE role_code='ADMIN'), perm_id FROM SEC_PERMISSIONS;

-- STAFF
INSERT INTO SEC_ROLE_PERMISSIONS (role_id, perm_id)
SELECT (SELECT role_id FROM SEC_ROLES WHERE role_code='STAFF'), perm_id
  FROM SEC_PERMISSIONS WHERE perm_code IN ('BENEF.CREATE','BENEF.APPROVE','APP.MANAGE','LETTER.ISSUE','MATCH.RUN','REPORT.VIEW');

-- BENEFICIARY
INSERT INTO SEC_ROLE_PERMISSIONS (role_id, perm_id)
SELECT (SELECT role_id FROM SEC_ROLES WHERE role_code='BENEFICIARY'), perm_id
  FROM SEC_PERMISSIONS WHERE perm_code IN ('BENEF.SELF','JOB.APPLY','TRAIN.APPLY');

-- COMPANY_ADMIN / COMPANY_HR
INSERT INTO SEC_ROLE_PERMISSIONS (role_id, perm_id)
SELECT (SELECT role_id FROM SEC_ROLES WHERE role_code='COMPANY_ADMIN'), perm_id
  FROM SEC_PERMISSIONS WHERE perm_code IN ('ORG.MANAGE','JOB.CREATE','APP.MANAGE','DONATION.MANAGE');
INSERT INTO SEC_ROLE_PERMISSIONS (role_id, perm_id)
SELECT (SELECT role_id FROM SEC_ROLES WHERE role_code='COMPANY_HR'), perm_id
  FROM SEC_PERMISSIONS WHERE perm_code IN ('JOB.CREATE','APP.MANAGE');

-- INSTITUTE
INSERT INTO SEC_ROLE_PERMISSIONS (role_id, perm_id)
SELECT (SELECT role_id FROM SEC_ROLES WHERE role_code='INSTITUTE'), perm_id
  FROM SEC_PERMISSIONS WHERE perm_code IN ('ORG.MANAGE','TRAIN.CREATE','APP.MANAGE','DONATION.MANAGE');

-- RECRUITER
INSERT INTO SEC_ROLE_PERMISSIONS (role_id, perm_id)
SELECT (SELECT role_id FROM SEC_ROLES WHERE role_code='RECRUITER'), perm_id
  FROM SEC_PERMISSIONS WHERE perm_code IN ('ORG.MANAGE','JOB.CREATE','APP.MANAGE','DONATION.MANAGE');

-- DONOR
INSERT INTO SEC_ROLE_PERMISSIONS (role_id, perm_id)
SELECT (SELECT role_id FROM SEC_ROLES WHERE role_code='DONOR'), perm_id
  FROM SEC_PERMISSIONS WHERE perm_code IN ('DONATION.MANAGE');

-- ----------------------------------------------------------------------------
--  التصنيفات: المؤهلات / المستويات / المجالات / الوظائف
-- ----------------------------------------------------------------------------
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('QUALIFICATION','SECONDARY','ثانوية عامة','High School');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('QUALIFICATION','DIPLOMA',  'دبلوم','Diploma');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('QUALIFICATION','BACHELOR', 'بكالوريوس','Bachelor');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('QUALIFICATION','MASTER',   'ماجستير','Master');

INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('SENIORITY','FRESH',  'حديث تخرج','Fresh Graduate');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('SENIORITY','SEEKER', 'باحث عن عمل','Job Seeker');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('SENIORITY','EXP',    'ذوي خبرة','Experienced');

INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FIELD','IT',       'تقنية المعلومات','Information Technology');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FIELD','DEV',      'برمجة','Software Development');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FIELD','DESIGN',   'تصميم','Design');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FIELD','ACCOUNT',  'محاسبة','Accounting');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FIELD','HR',       'موارد بشرية','Human Resources');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FIELD','SALES',    'مبيعات','Sales');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FIELD','CS',       'خدمة عملاء','Customer Service');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FIELD','PM',       'إدارة مشاريع','Project Management');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FIELD','LOGISTICS','لوجستيات','Logistics');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FIELD','ADMIN',    'إداري','Administration');

INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FUNCTION','ACCOUNTANT','محاسب','Accountant');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FUNCTION','CS_AGENT', 'موظف خدمة عملاء','Customer Service Agent');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FUNCTION','SALES_REP','مندوب مبيعات','Sales Representative');
INSERT INTO RE_CATEGORIES (cat_type, code, name_ar, name_en) VALUES ('FUNCTION','DEVELOPER','مطوّر برمجيات','Software Developer');

-- ----------------------------------------------------------------------------
--  المهارات
-- ----------------------------------------------------------------------------
INSERT INTO RE_SKILLS (name_ar, name_en, category) VALUES ('Excel','Excel','TOOL');
INSERT INTO RE_SKILLS (name_ar, name_en, category) VALUES ('محاسبة مالية','Financial Accounting','TECHNICAL');
INSERT INTO RE_SKILLS (name_ar, name_en, category) VALUES ('خدمة العملاء','Customer Care','SOFT');
INSERT INTO RE_SKILLS (name_ar, name_en, category) VALUES ('اللغة الإنجليزية','English','LANGUAGE');
INSERT INTO RE_SKILLS (name_ar, name_en, category) VALUES ('SQL','SQL','TECHNICAL');
INSERT INTO RE_SKILLS (name_ar, name_en, category) VALUES ('JavaScript','JavaScript','TECHNICAL');
INSERT INTO RE_SKILLS (name_ar, name_en, category) VALUES ('التواصل','Communication','SOFT');
INSERT INTO RE_SKILLS (name_ar, name_en, category) VALUES ('المبيعات','Selling','TECHNICAL');

-- ----------------------------------------------------------------------------
--  مستخدمون تجريبيون  (المصادقة الحقيقية تُولّد hash عبر SEC_AUTH_PKG)
-- ----------------------------------------------------------------------------
INSERT INTO RE_USERS (username, email, full_name, user_type, status, email_verified, password_hash, password_salt)
VALUES ('admin', 'admin@madinah-rehab.sa', 'مدير النظام', 'ADMIN', 'ACTIVE', 'Y', 'DEMOHASH', 'DEMOSALT');
INSERT INTO RE_USERS (username, email, full_name, user_type, status, email_verified, password_hash, password_salt)
VALUES ('staff1', 'staff@madinah-rehab.sa', 'سعيد الموظف', 'STAFF', 'ACTIVE', 'Y', 'DEMOHASH', 'DEMOSALT');
INSERT INTO RE_USERS (username, email, full_name, user_type, status, email_verified, password_hash, password_salt)
VALUES ('ahmed', 'ahmed@example.com', 'أحمد المستفيد', 'BENEFICIARY', 'ACTIVE', 'Y', 'DEMOHASH', 'DEMOSALT');

-- منح الأدوار
INSERT INTO SEC_USER_ROLES (user_id, role_id) SELECT u.user_id, r.role_id FROM RE_USERS u, SEC_ROLES r WHERE u.username='admin'  AND r.role_code='ADMIN';
INSERT INTO SEC_USER_ROLES (user_id, role_id) SELECT u.user_id, r.role_id FROM RE_USERS u, SEC_ROLES r WHERE u.username='staff1' AND r.role_code='STAFF';
INSERT INTO SEC_USER_ROLES (user_id, role_id) SELECT u.user_id, r.role_id FROM RE_USERS u, SEC_ROLES r WHERE u.username='ahmed'  AND r.role_code='BENEFICIARY';

-- ----------------------------------------------------------------------------
--  منظمات تجريبية
-- ----------------------------------------------------------------------------
INSERT INTO RE_ORGANIZATIONS (org_type, legal_name, brand_name, city, sector, approval_status, email)
VALUES ('COMPANY', 'شركة المدينة للتقنية', 'MadTech', 'المدينة المنورة', 'تقنية المعلومات', 'APPROVED', 'hr@madtech.sa');
INSERT INTO RE_ORGANIZATIONS (org_type, legal_name, brand_name, city, sector, approval_status, email)
VALUES ('INSTITUTE', 'معهد طيبة للتدريب', 'Taibah Institute', 'المدينة المنورة', 'تدريب', 'APPROVED', 'info@taibah-tr.sa');
INSERT INTO RE_ORGANIZATIONS (org_type, legal_name, brand_name, city, sector, approval_status, email)
VALUES ('RECRUITER', 'شركة الوسيط للتوظيف', 'Waseet', 'الرياض', 'توظيف', 'APPROVED', 'jobs@waseet.sa');

-- مستفيد تجريبي مكتمل الملف
INSERT INTO RE_BENEFICIARIES (user_id, gender, education_level, major, experience_years, current_status, city, desired_titles, approval_status, completeness_pct)
SELECT user_id, 'MALE', 'BACHELOR', 'محاسبة', 2, 'SEEKER', 'المدينة المنورة', 'محاسب,مدقق', 'APPROVED', 90
  FROM RE_USERS WHERE username='ahmed';

-- ربط المستفيد بتصنيفات ومهارات
INSERT INTO RE_BENEFICIARY_CATEGORIES (benef_id, category_id)
SELECT b.benef_id, c.category_id FROM RE_BENEFICIARIES b, RE_CATEGORIES c
 WHERE b.user_id=(SELECT user_id FROM RE_USERS WHERE username='ahmed') AND c.cat_type='FIELD' AND c.code='ACCOUNT';
INSERT INTO RE_BENEFICIARY_SKILLS (benef_id, skill_id, proficiency, years)
SELECT b.benef_id, s.skill_id, 4, 2 FROM RE_BENEFICIARIES b, RE_SKILLS s
 WHERE b.user_id=(SELECT user_id FROM RE_USERS WHERE username='ahmed') AND s.name_ar='محاسبة مالية';
INSERT INTO RE_BENEFICIARY_SKILLS (benef_id, skill_id, proficiency, years)
SELECT b.benef_id, s.skill_id, 5, 3 FROM RE_BENEFICIARIES b, RE_SKILLS s
 WHERE b.user_id=(SELECT user_id FROM RE_USERS WHERE username='ahmed') AND s.name_ar='Excel';

-- تبرع وظيفي تجريبي: 10 وظائف محاسب من شركة المدينة للتقنية
INSERT INTO RE_DONATIONS (donor_org_id, donation_type, title, target_role, units_pledged, status, monetary_value)
SELECT org_id, 'JOB', 'تبرع بـ 10 وظائف محاسب', 'محاسب', 10, 'ACTIVE', 600000
  FROM RE_ORGANIZATIONS WHERE brand_name='MadTech';

-- وظيفة تجريبية منشورة مرتبطة بالتبرع
INSERT INTO RE_JOBS (org_id, title, city, min_education, min_experience, salary_min, salary_max, vacancies, status, published_at, field_cat, function_cat, donation_id)
SELECT o.org_id, 'محاسب', 'المدينة المنورة', 'BACHELOR', 1, 5000, 8000, 3, 'PUBLISHED', SYSTIMESTAMP,
       (SELECT category_id FROM RE_CATEGORIES WHERE cat_type='FIELD' AND code='ACCOUNT'),
       (SELECT category_id FROM RE_CATEGORIES WHERE cat_type='FUNCTION' AND code='ACCOUNTANT'),
       (SELECT donation_id FROM RE_DONATIONS WHERE target_role='محاسب' AND ROWNUM=1)
  FROM RE_ORGANIZATIONS o WHERE o.brand_name='MadTech';
INSERT INTO RE_JOB_SKILLS (job_id, skill_id, weight, mandatory)
SELECT j.job_id, s.skill_id, 5, 'Y' FROM RE_JOBS j, RE_SKILLS s WHERE j.title='محاسب' AND s.name_ar='محاسبة مالية';
INSERT INTO RE_JOB_SKILLS (job_id, skill_id, weight, mandatory)
SELECT j.job_id, s.skill_id, 3, 'N' FROM RE_JOBS j, RE_SKILLS s WHERE j.title='محاسب' AND s.name_ar='Excel';

-- برنامج تدريبي تجريبي (تبرع تدريبي 100%)
INSERT INTO RE_DONATIONS (donor_org_id, donation_type, title, units_pledged, discount_pct, status, monetary_value)
SELECT org_id, 'TRAINING', 'منحة 20 مقعد تدريبي مجاني', 20, 100, 'ACTIVE', 40000
  FROM RE_ORGANIZATIONS WHERE brand_name='Taibah Institute';
INSERT INTO RE_TRAINING_PROGRAMS (org_id, title, city, seats_total, original_fee, discount_pct, is_free, status, published_at, field_cat, donation_id, start_date)
SELECT o.org_id, 'أساسيات المحاسبة المالية', 'المدينة المنورة', 20, 2000, 100, 'Y', 'PUBLISHED', SYSTIMESTAMP,
       (SELECT category_id FROM RE_CATEGORIES WHERE cat_type='FIELD' AND code='ACCOUNT'),
       (SELECT donation_id FROM RE_DONATIONS WHERE title='منحة 20 مقعد تدريبي مجاني' AND ROWNUM=1),
       SYSDATE+14
  FROM RE_ORGANIZATIONS o WHERE o.brand_name='Taibah Institute';

COMMIT;
PROMPT >> 06_seed_data.sql  تم إدراج البيانات المرجعية والتجريبية.
