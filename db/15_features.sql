-- =============================================================================
--  15_features.sql : إصلاحات جذرية + نقاط نهاية الإنشاء (وظيفة/برنامج/تبرع/اعتماد)
--  -----------------------------------------------------------------------------
--  ينفّذ مرّة واحدة في SQL Commands. عبارات DDL مستقلّة (تُثبّت تلقائياً)،
--  ثم كتلة ORDS واحدة في النهاية.
-- =============================================================================

-- 1) فهارس فريدة شرطية: تمنع "سبق التقديم" الخاطئ (سلوك NULL في 23ai)
DROP INDEX re_app_uq_job;
CREATE UNIQUE INDEX re_app_uq_job ON RE_APPLICATIONS (
  CASE WHEN job_id IS NULL THEN NULL ELSE benef_id END,
  CASE WHEN job_id IS NULL THEN NULL ELSE job_id END);

DROP INDEX re_app_uq_prog;
CREATE UNIQUE INDEX re_app_uq_prog ON RE_APPLICATIONS (
  CASE WHEN program_id IS NULL THEN NULL ELSE benef_id END,
  CASE WHEN program_id IS NULL THEN NULL ELSE program_id END);

-- 2) تسمية العمود المحجوز level -> prog_level (يحلّ كسر البرامج)
ALTER TABLE RE_TRAINING_PROGRAMS RENAME COLUMN "LEVEL" TO prog_level;

-- 3) إعادة بناء عرض البرامج بالاسم الجديد
CREATE OR REPLACE VIEW RE_V_TRAINING AS
SELECT p.program_id, p.title, p.status, p.city, p.delivery_mode, p.prog_level, p.duration_hours,
       p.seats_total, p.seats_taken, (p.seats_total - p.seats_taken) AS seats_available,
       p.original_fee, p.discount_pct, p.is_free, p.certificate,
       p.org_id, o.legal_name AS org_name, o.brand_name AS org_brand,
       fc.name_ar AS field_name, p.start_date, p.end_date, p.published_at
  FROM RE_TRAINING_PROGRAMS p
  JOIN RE_ORGANIZATIONS o ON o.org_id = p.org_id
  LEFT JOIN RE_CATEGORIES fc ON fc.category_id = p.field_cat;

-- 4) ORDS: إعادة تعريف /programs + نقاط الإنشاء + اعتماد المستفيدين
BEGIN
  -- /programs (إصلاح: prog_level بدل level)
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'programs', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT program_id, title, org_name, city, delivery_mode, prog_level, seats_available,
             is_free, discount_pct, certificate, start_date, field_name
        FROM RE_V_TRAINING WHERE status='PUBLISHED' ORDER BY published_at DESC ]', p_items_per_page=>25);

  -- POST /org/jobs : الشركة/شركة التوظيف تنشر وظيفة
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'org/jobs', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      DECLARE v_field NUMBER; v_id NUMBER;
      BEGIN
        IF NOT RE_SEC_PKG.has_permission(:actor,'JOB.CREATE') THEN :status_code:=403; HTP.P('{"error":"غير مصرح"}'); RETURN; END IF;
        BEGIN SELECT category_id INTO v_field FROM RE_CATEGORIES WHERE cat_type='FIELD' AND code=:field_code; EXCEPTION WHEN OTHERS THEN v_field:=NULL; END;
        INSERT INTO RE_JOBS(org_id,title,city,min_education,min_experience,salary_min,salary_max,vacancies,status,published_at,field_cat,posted_by)
        VALUES(:org_id,:title,:city,:min_education,NVL(:min_experience,0),:salary_min,:salary_max,NVL(:vacancies,1),'PUBLISHED',SYSTIMESTAMP,v_field,:actor)
        RETURNING job_id INTO v_id;
        :status_code:=201; HTP.P(JSON_OBJECT('job_id' VALUE v_id));
      EXCEPTION WHEN OTHERS THEN :status_code:=400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  -- POST /org/programs : المعهد ينشئ برنامجاً
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'org/programs', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      DECLARE v_field NUMBER; v_id NUMBER;
      BEGIN
        IF NOT RE_SEC_PKG.has_permission(:actor,'TRAIN.CREATE') THEN :status_code:=403; HTP.P('{"error":"غير مصرح"}'); RETURN; END IF;
        BEGIN SELECT category_id INTO v_field FROM RE_CATEGORIES WHERE cat_type='FIELD' AND code=:field_code; EXCEPTION WHEN OTHERS THEN v_field:=NULL; END;
        INSERT INTO RE_TRAINING_PROGRAMS(org_id,title,city,seats_total,original_fee,discount_pct,is_free,certificate,status,published_at,field_cat,start_date,prog_level)
        VALUES(:org_id,:title,:city,NVL(:seats_total,20),NVL(:original_fee,0),NVL(:discount_pct,0),NVL(:is_free,'N'),'Y','PUBLISHED',SYSTIMESTAMP,v_field,
               CASE WHEN :start_date IS NULL THEN NULL ELSE TO_DATE(:start_date,'YYYY-MM-DD') END,'BEGINNER')
        RETURNING program_id INTO v_id;
        :status_code:=201; HTP.P(JSON_OBJECT('program_id' VALUE v_id));
      EXCEPTION WHEN OTHERS THEN :status_code:=400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  -- POST /donations : تسجيل تبرع (وظيفي/تدريبي/توظيفي)
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'donations');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'donations', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      DECLARE v_id NUMBER;
      BEGIN
        IF NOT RE_SEC_PKG.has_permission(:actor,'DONATION.MANAGE') THEN :status_code:=403; HTP.P('{"error":"غير مصرح"}'); RETURN; END IF;
        INSERT INTO RE_DONATIONS(donor_org_id,donation_type,title,target_role,units_pledged,discount_pct,monetary_value,status)
        VALUES(:donor_org_id,:donation_type,:title,:target_role,NVL(:units_pledged,1),:discount_pct,NVL(:monetary_value,0),'ACTIVE')
        RETURNING donation_id INTO v_id;
        :status_code:=201; HTP.P(JSON_OBJECT('donation_id' VALUE v_id));
      EXCEPTION WHEN OTHERS THEN :status_code:=400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  -- GET /admin/beneficiaries?actor= : قائمة المستفيدين (للاعتماد/المتابعة)
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'admin/beneficiaries');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'admin/beneficiaries', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT benef_id, full_name, email, city, education_level, experience_years, approval_status,
             completeness_pct, applications_count, skills_count
        FROM RE_V_BENEFICIARIES
       WHERE EXISTS (SELECT 1 FROM SEC_USER_ROLES ur JOIN SEC_ROLE_PERMISSIONS rp ON rp.role_id=ur.role_id
                       JOIN SEC_PERMISSIONS p ON p.perm_id=rp.perm_id
                      WHERE ur.user_id=:actor AND p.perm_code IN ('BENEF.APPROVE','USER.MANAGE'))
       ORDER BY benef_id DESC ]', p_items_per_page=>100);

  -- POST /beneficiaries/approve : الموظف يعتمد/يرفض مستفيداً  body:{benef_id,status,actor}
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'beneficiaries/approve');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'beneficiaries/approve', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      BEGIN
        IF NOT RE_SEC_PKG.has_permission(:actor,'BENEF.APPROVE') THEN :status_code:=403; HTP.P('{"error":"غير مصرح"}'); RETURN; END IF;
        UPDATE RE_BENEFICIARIES SET approval_status=:status, approved_at=SYSTIMESTAMP, case_officer_id=:actor WHERE benef_id=:benef_id;
        RE_SEC_PKG.audit(:actor,'BENEF_APPROVE','RE_BENEFICIARIES',:benef_id,:status);
        :status_code:=200; HTP.P('{"ok":true}');
      END; ]');

  COMMIT;
END;
/
PROMPT >> 15_features.sql  تم: إصلاح البرامج/الفهارس + نقاط الإنشاء والاعتماد.
