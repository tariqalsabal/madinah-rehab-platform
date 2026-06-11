-- =============================================================================
--  17_profiles.sql : بروفايل شامل للمستفيد + خصوصية + مرفقات + اطّلاع الأطراف
--  ينفّذ مرّة واحدة. عبارة ALTER مستقلّة، ثم كتلة ORDS.
-- =============================================================================

-- حقول إضافية للبروفايل والخصوصية
ALTER TABLE RE_BENEFICIARIES ADD (
  is_saudi        VARCHAR2(1)  DEFAULT 'Y',   -- Y سعودي / N مقيم
  residency_type  VARCHAR2(40),               -- نوع الإقامة (للمقيم)
  work_type_pref  VARCHAR2(30),               -- FULL/PART/REMOTE/HYBRID/TEMP
  work_env_pref   VARCHAR2(120),              -- بيئة العمل المفضّلة (نص حر)
  hide_name       VARCHAR2(1)  DEFAULT 'N',   -- إخفاء الاسم عن الشركات
  hide_phone      VARCHAR2(1)  DEFAULT 'N'    -- إخفاء الجوال عن الشركات
);

BEGIN
  -- POST /me/profile : تحديث بروفايل المستفيد الحالي
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'me/profile');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'me/profile', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      BEGIN
        UPDATE RE_BENEFICIARIES SET
          city = NVL(:city, city), region = NVL(:region, region),
          education_level = NVL(:education_level, education_level), major = NVL(:major, major),
          graduation_year = NVL(:graduation_year, graduation_year),
          experience_years = NVL(:experience_years, experience_years),
          nationality = NVL(:nationality, nationality), is_saudi = NVL(:is_saudi, is_saudi),
          residency_type = :residency_type, current_status = NVL(:current_status, current_status),
          desired_titles = :desired_titles, desired_city = :desired_city,
          desired_min_salary = :desired_min_salary, willing_relocate = NVL(:willing_relocate, willing_relocate),
          work_type_pref = :work_type_pref, work_env_pref = :work_env_pref,
          summary = :summary, hide_name = NVL(:hide_name, hide_name), hide_phone = NVL(:hide_phone, hide_phone),
          updated_at = SYSTIMESTAMP
        WHERE user_id = :uid;
        :status_code := 200; HTP.P('{"ok":true}');
      EXCEPTION WHEN OTHERS THEN :status_code := 400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  -- GET /beneficiaries/:id/profile?viewer= : ملف المستفيد (يحترم الخصوصية؛ الأدمن يرى الكل)
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'beneficiaries/:id/profile');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'beneficiaries/:id/profile', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT b.benef_id, b.user_id,
             CASE WHEN adm.x=1 OR b.hide_name='N' THEN u.full_name ELSE 'مستفيد #'||b.benef_id END AS full_name,
             CASE WHEN adm.x=1 OR b.hide_phone='N' THEN u.phone ELSE NULL END AS phone,
             CASE WHEN adm.x=1 THEN u.email ELSE NULL END AS email,
             CASE WHEN adm.x=1 OR b.hide_name='N' THEN 'N' ELSE 'Y' END AS is_anonymous,
             b.gender, b.city, b.region, b.education_level, b.major, b.graduation_year, b.experience_years,
             b.nationality, b.is_saudi, b.residency_type, b.current_status, b.desired_titles, b.desired_city,
             b.work_type_pref, b.work_env_pref, b.summary, b.approval_status, b.completeness_pct,
             (SELECT LISTAGG(s.name_ar, '، ') WITHIN GROUP (ORDER BY s.name_ar)
                FROM RE_BENEFICIARY_SKILLS bs JOIN RE_SKILLS s ON s.skill_id=bs.skill_id WHERE bs.benef_id=b.benef_id) AS skills
        FROM RE_BENEFICIARIES b
        JOIN RE_USERS u ON u.user_id = b.user_id
        CROSS JOIN (SELECT CASE WHEN EXISTS (
                       SELECT 1 FROM SEC_USER_ROLES ur JOIN SEC_ROLE_PERMISSIONS rp ON rp.role_id=ur.role_id
                         JOIN SEC_PERMISSIONS p ON p.perm_id=rp.perm_id
                        WHERE ur.user_id = :viewer AND p.perm_code='USER.MANAGE') THEN 1 ELSE 0 END AS x FROM DUAL) adm
       WHERE b.benef_id = :id ]');

  -- GET /me/documents?uid=  : مرفقات المستفيد
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'me/documents');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'me/documents', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT doc_id, doc_type, title, file_url, created_at
        FROM RE_DOCUMENTS
       WHERE owner_type='BENEFICIARY' AND owner_id = (SELECT benef_id FROM RE_BENEFICIARIES WHERE user_id=:uid)
       ORDER BY doc_id DESC ]');

  -- POST /documents : إضافة مرفق برابط  body:{uid, doc_type, title, url}
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'documents');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'documents', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      DECLARE v_bid NUMBER;
      BEGIN
        SELECT benef_id INTO v_bid FROM RE_BENEFICIARIES WHERE user_id=:uid;
        INSERT INTO RE_DOCUMENTS(owner_type,owner_id,doc_type,title,storage_kind,file_url,uploaded_by)
        VALUES('BENEFICIARY', v_bid, :doc_type, :title, 'URL', :url, :uid);
        :status_code := 201; HTP.P('{"ok":true}');
      EXCEPTION WHEN OTHERS THEN :status_code := 400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  -- إعادة تعريف /jobs/:id/applicants : يضيف benef_id + user_id ويحترم الخصوصية
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'jobs/:id/applicants', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT a.application_id, a.benef_id, b.user_id AS benef_user_id,
             CASE WHEN b.hide_name='N' THEN a.beneficiary_name ELSE 'مستفيد #'||a.benef_id END AS beneficiary_name,
             CASE WHEN b.hide_name='N' THEN a.beneficiary_email ELSE NULL END AS beneficiary_email,
             a.status, a.match_score, a.created_at
        FROM RE_V_APPLICATIONS a
        JOIN RE_BENEFICIARIES b ON b.benef_id = a.benef_id
       WHERE a.job_id = :id ORDER BY a.match_score DESC NULLS LAST ]', p_items_per_page=>50);

  -- إعادة تعريف /programs/:id/enrollees : يضيف benef_id + user_id
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'programs/:id/enrollees', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT a.application_id, a.benef_id, b.user_id AS benef_user_id,
             a.beneficiary_name, a.beneficiary_email, a.status, a.created_at
        FROM RE_V_APPLICATIONS a
        JOIN RE_BENEFICIARIES b ON b.benef_id = a.benef_id
       WHERE a.program_id = :id ORDER BY a.created_at DESC ]', p_items_per_page=>50);

  COMMIT;
END;
/
PROMPT >> 17_profiles.sql  تم: البروفايل الشامل + الخصوصية + المرفقات + ربط المتقدّمين.
