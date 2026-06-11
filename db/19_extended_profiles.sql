-- =============================================================================
--  19_extended_profiles.sql : توسعة البروفايلات (20+ حقلاً) + مرفقات المنظمات
--  ينفّذ مرّة واحدة. عبارات ALTER مستقلّة، ثم كتلة ORDS.
-- =============================================================================

-- حقول إضافية للمستفيد (تكمل البروفايل المهني)
ALTER TABLE RE_BENEFICIARIES ADD (
  university         VARCHAR2(150),
  gpa                VARCHAR2(20),
  current_job_title  VARCHAR2(120),
  current_employer   VARCHAR2(150),
  notice_period      VARCHAR2(40),
  languages          VARCHAR2(200),
  has_license        VARCHAR2(1) DEFAULT 'N',
  has_car            VARCHAR2(1) DEFAULT 'N',
  special_needs      VARCHAR2(1) DEFAULT 'N',
  special_needs_type VARCHAR2(120),
  linkedin_url       VARCHAR2(300),
  portfolio_url      VARCHAR2(300)
);

-- حقول إضافية للمنظمات (شركة/معهد/مانح): بيانات قانونية وبنكية وتواصل
ALTER TABLE RE_ORGANIZATIONS ADD (
  national_address VARCHAR2(200),
  iban             VARCHAR2(40),
  bank_name        VARCHAR2(100),
  vat_number       VARCHAR2(40),
  license_number   VARCHAR2(40),
  established_year  NUMBER,
  employees_count  NUMBER,
  contact_person   VARCHAR2(150),
  contact_phone    VARCHAR2(20),
  contact_email    VARCHAR2(254)
);

BEGIN
  -- إعادة تعريف POST /me/profile لتشمل كل الحقول (القديمة + الجديدة)
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'me/profile', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      BEGIN
        UPDATE RE_BENEFICIARIES SET
          national_id = :national_id, gender = NVL(:gender, gender), marital_status = :marital_status,
          city = NVL(:city, city), region = :region,
          education_level = NVL(:education_level, education_level), major = :major,
          university = :university, gpa = :gpa, graduation_year = :graduation_year,
          experience_years = NVL(:experience_years, experience_years),
          current_job_title = :current_job_title, current_employer = :current_employer,
          notice_period = :notice_period, languages = :languages,
          has_license = NVL(:has_license, has_license), has_car = NVL(:has_car, has_car),
          special_needs = NVL(:special_needs, special_needs), special_needs_type = :special_needs_type,
          linkedin_url = :linkedin_url, portfolio_url = :portfolio_url,
          nationality = :nationality, is_saudi = NVL(:is_saudi, is_saudi), residency_type = :residency_type,
          current_status = NVL(:current_status, current_status),
          desired_titles = :desired_titles, desired_city = :desired_city, desired_min_salary = :desired_min_salary,
          willing_relocate = NVL(:willing_relocate, willing_relocate),
          work_type_pref = :work_type_pref, work_env_pref = :work_env_pref, summary = :summary,
          hide_name = NVL(:hide_name, hide_name), hide_phone = NVL(:hide_phone, hide_phone),
          updated_at = SYSTIMESTAMP
        WHERE user_id = :uid;
        :status_code := 200; HTP.P('{"ok":true}');
      EXCEPTION WHEN OTHERS THEN :status_code := 400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  -- إعادة تعريف GET /beneficiaries/:id/profile لإظهار الحقول الجديدة
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'beneficiaries/:id/profile', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT b.benef_id, b.user_id,
             CASE WHEN adm.x=1 OR b.hide_name='N' THEN u.full_name ELSE 'مستفيد #'||b.benef_id END AS full_name,
             CASE WHEN adm.x=1 OR b.hide_phone='N' THEN u.phone ELSE NULL END AS phone,
             CASE WHEN adm.x=1 THEN u.email ELSE NULL END AS email,
             CASE WHEN adm.x=1 THEN b.national_id ELSE NULL END AS national_id,
             CASE WHEN adm.x=1 OR b.hide_name='N' THEN 'N' ELSE 'Y' END AS is_anonymous,
             b.gender, b.marital_status, b.city, b.region, b.education_level, b.major, b.university, b.gpa,
             b.graduation_year, b.experience_years, b.current_job_title, b.current_employer, b.notice_period,
             b.languages, b.has_license, b.has_car, b.special_needs, b.special_needs_type, b.linkedin_url, b.portfolio_url,
             b.nationality, b.is_saudi, b.residency_type, b.current_status, b.desired_titles, b.desired_city,
             b.desired_min_salary, b.work_type_pref, b.work_env_pref, b.summary, b.approval_status, b.completeness_pct,
             (SELECT LISTAGG(s.name_ar, '، ') WITHIN GROUP (ORDER BY s.name_ar)
                FROM RE_BENEFICIARY_SKILLS bs JOIN RE_SKILLS s ON s.skill_id=bs.skill_id WHERE bs.benef_id=b.benef_id) AS skills
        FROM RE_BENEFICIARIES b
        JOIN RE_USERS u ON u.user_id = b.user_id
        CROSS JOIN (SELECT CASE WHEN EXISTS (
                       SELECT 1 FROM SEC_USER_ROLES ur JOIN SEC_ROLE_PERMISSIONS rp ON rp.role_id=ur.role_id
                         JOIN SEC_PERMISSIONS p ON p.perm_id=rp.perm_id
                        WHERE ur.user_id = :viewer AND p.perm_code='USER.MANAGE') THEN 1 ELSE 0 END AS x FROM DUAL) adm
       WHERE b.benef_id = :id ]');

  -- GET /me/org?uid= : ملف منظمة المستخدم الحالي
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'me/org');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'me/org', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT o.org_id, o.org_type, o.legal_name, o.brand_name, o.cr_number, o.unified_number, o.sector,
             o.city, o.region, o.address, o.national_address, o.website, o.phone, o.email,
             o.iban, o.bank_name, o.vat_number, o.license_number, o.established_year, o.employees_count,
             o.contact_person, o.contact_phone, o.contact_email, o.approval_status
        FROM RE_ORGANIZATIONS o JOIN RE_USERS u ON u.org_id = o.org_id WHERE u.user_id = :uid ]');

  -- POST /me/org : تحديث ملف المنظمة
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'me/org', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      BEGIN
        UPDATE RE_ORGANIZATIONS SET
          legal_name = NVL(:legal_name, legal_name), brand_name = :brand_name, cr_number = :cr_number,
          unified_number = :unified_number, sector = :sector, city = :city, region = :region,
          address = :address, national_address = :national_address, website = :website, phone = :phone, email = :email,
          iban = :iban, bank_name = :bank_name, vat_number = :vat_number, license_number = :license_number,
          established_year = :established_year, employees_count = :employees_count,
          contact_person = :contact_person, contact_phone = :contact_phone, contact_email = :contact_email,
          updated_at = SYSTIMESTAMP
        WHERE org_id = (SELECT org_id FROM RE_USERS WHERE user_id = :uid);
        :status_code := 200; HTP.P('{"ok":true}');
      EXCEPTION WHEN OTHERS THEN :status_code := 400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  -- GET /me/org/documents?uid=  +  POST /org/documents : مرفقات المنظمة
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'me/org/documents');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'me/org/documents', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT doc_id, doc_type, title, file_url, created_at
        FROM RE_DOCUMENTS
       WHERE owner_type='ORG' AND owner_id = (SELECT org_id FROM RE_USERS WHERE user_id=:uid)
       ORDER BY doc_id DESC ]');

  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'org/documents');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'org/documents', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      DECLARE v_org NUMBER;
      BEGIN
        SELECT org_id INTO v_org FROM RE_USERS WHERE user_id=:uid;
        INSERT INTO RE_DOCUMENTS(owner_type,owner_id,doc_type,title,storage_kind,file_url,uploaded_by)
        VALUES('ORG', v_org, :doc_type, :title, 'URL', :url, :uid);
        :status_code := 201; HTP.P('{"ok":true}');
      EXCEPTION WHEN OTHERS THEN :status_code := 400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  COMMIT;
END;
/
PROMPT >> 19_extended_profiles.sql  تم: توسعة البروفايلات + مرفقات المنظمات.
