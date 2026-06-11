-- =============================================================================
--  07_views.sql : العروض (Views) للتقارير ولوحات المعلومات وطبقة الـ REST
-- =============================================================================

-- ملف المستفيد الموسّع (يدمج المستخدم + التصنيفات + عدّ المهارات)
CREATE OR REPLACE VIEW RE_V_BENEFICIARIES AS
SELECT b.benef_id, b.user_id, u.full_name, u.email, u.phone, b.gender, b.city, b.region,
       b.education_level, b.major, b.experience_years, b.current_status,
       b.approval_status, b.completeness_pct, b.case_officer_id,
       (SELECT COUNT(*) FROM RE_BENEFICIARY_SKILLS s WHERE s.benef_id=b.benef_id) AS skills_count,
       (SELECT COUNT(*) FROM RE_APPLICATIONS a WHERE a.benef_id=b.benef_id)       AS applications_count,
       b.created_at
  FROM RE_BENEFICIARIES b
  JOIN RE_USERS u ON u.user_id = b.user_id;

-- الوظائف المنشورة مع اسم الجهة وعدد المتقدمين
CREATE OR REPLACE VIEW RE_V_JOBS AS
SELECT j.job_id, j.title, j.status, j.city, j.region, j.work_mode, j.employment_type,
       j.min_education, j.min_experience, j.salary_min, j.salary_max, j.vacancies,
       j.org_id, o.legal_name AS org_name, o.brand_name AS org_brand, o.logo_url,
       fc.name_ar AS field_name, func.name_ar AS function_name,
       j.donation_id, j.published_at, j.deadline,
       (SELECT COUNT(*) FROM RE_APPLICATIONS a WHERE a.job_id=j.job_id) AS applicants
  FROM RE_JOBS j
  JOIN RE_ORGANIZATIONS o ON o.org_id = j.org_id
  LEFT JOIN RE_CATEGORIES fc   ON fc.category_id   = j.field_cat
  LEFT JOIN RE_CATEGORIES func ON func.category_id = j.function_cat;

-- البرامج التدريبية مع المقاعد المتاحة
CREATE OR REPLACE VIEW RE_V_TRAINING AS
SELECT p.program_id, p.title, p.status, p.city, p.delivery_mode, p.level, p.duration_hours,
       p.seats_total, p.seats_taken, (p.seats_total - p.seats_taken) AS seats_available,
       p.original_fee, p.discount_pct, p.is_free, p.certificate,
       p.org_id, o.legal_name AS org_name, o.brand_name AS org_brand,
       fc.name_ar AS field_name, p.start_date, p.end_date, p.published_at
  FROM RE_TRAINING_PROGRAMS p
  JOIN RE_ORGANIZATIONS o ON o.org_id = p.org_id
  LEFT JOIN RE_CATEGORIES fc ON fc.category_id = p.field_cat;

-- الطلبات الموسّعة (للوحة الشركة/الموظف)
CREATE OR REPLACE VIEW RE_V_APPLICATIONS AS
SELECT a.application_id, a.target_type, a.status, a.match_score, a.created_at,
       a.benef_id, ub.full_name AS beneficiary_name, ub.email AS beneficiary_email,
       a.job_id, j.title AS job_title,
       a.program_id, p.title AS program_title,
       COALESCE(jo.legal_name, po.legal_name) AS org_name
  FROM RE_APPLICATIONS a
  JOIN RE_BENEFICIARIES b ON b.benef_id = a.benef_id
  JOIN RE_USERS ub        ON ub.user_id = b.user_id
  LEFT JOIN RE_JOBS j              ON j.job_id     = a.job_id
  LEFT JOIN RE_ORGANIZATIONS jo    ON jo.org_id    = j.org_id
  LEFT JOIN RE_TRAINING_PROGRAMS p ON p.program_id = a.program_id
  LEFT JOIN RE_ORGANIZATIONS po    ON po.org_id    = p.org_id;

-- ملخص التبرعات مع نسبة الاستهلاك
CREATE OR REPLACE VIEW RE_V_DONATIONS AS
SELECT d.donation_id, d.donation_type, d.title, d.target_role, d.units_pledged, d.units_consumed,
       (d.units_pledged - d.units_consumed) AS units_remaining,
       CASE WHEN d.units_pledged > 0
            THEN ROUND(d.units_consumed / d.units_pledged * 100) ELSE 0 END AS consumed_pct,
       d.discount_pct, d.monetary_value, d.status, d.valid_from, d.valid_to,
       o.org_id AS donor_org_id, o.legal_name AS donor_name, o.org_type AS donor_type
  FROM RE_DONATIONS d
  JOIN RE_ORGANIZATIONS o ON o.org_id = d.donor_org_id;

-- لوحة المعلومات الإجمالية (KPIs) — صف واحد
CREATE OR REPLACE VIEW RE_V_DASHBOARD AS
SELECT
  (SELECT COUNT(*) FROM RE_BENEFICIARIES)                                           AS total_beneficiaries,
  (SELECT COUNT(*) FROM RE_BENEFICIARIES WHERE approval_status='APPROVED')          AS approved_beneficiaries,
  (SELECT COUNT(*) FROM RE_JOBS WHERE status='PUBLISHED')                           AS open_jobs,
  (SELECT COUNT(*) FROM RE_TRAINING_PROGRAMS WHERE status='PUBLISHED')              AS open_programs,
  (SELECT COUNT(*) FROM RE_ORGANIZATIONS WHERE org_type='COMPANY')                  AS companies,
  (SELECT COUNT(*) FROM RE_ORGANIZATIONS WHERE org_type='INSTITUTE')                AS institutes,
  (SELECT COUNT(*) FROM RE_ORGANIZATIONS WHERE org_type='RECRUITER')                AS recruiters,
  (SELECT COUNT(*) FROM RE_APPLICATIONS WHERE status='HIRED')                       AS total_hired,
  (SELECT COUNT(*) FROM RE_APPLICATIONS WHERE status='ENROLLED')                    AS total_trainees,
  (SELECT NVL(SUM(units_pledged),0)  FROM RE_DONATIONS WHERE donation_type='JOB')      AS job_donation_units,
  (SELECT NVL(SUM(units_pledged),0)  FROM RE_DONATIONS WHERE donation_type='TRAINING') AS training_donation_units,
  (SELECT NVL(SUM(monetary_value),0) FROM RE_DONATIONS WHERE status IN ('ACTIVE','APPROVED','EXHAUSTED')) AS total_donation_value,
  CASE WHEN (SELECT COUNT(*) FROM RE_APPLICATIONS WHERE target_type='JOB') > 0
       THEN ROUND( (SELECT COUNT(*) FROM RE_APPLICATIONS WHERE status='HIRED')
                 / (SELECT COUNT(*) FROM RE_APPLICATIONS WHERE target_type='JOB') * 100) ELSE 0 END AS hire_rate_pct
FROM DUAL;

PROMPT >> 07_views.sql  تم إنشاء العروض (Views).
