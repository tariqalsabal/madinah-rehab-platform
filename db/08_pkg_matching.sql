-- =============================================================================
--  08_pkg_matching.sql : محرك المطابقة الذكي (Matching Engine)
--  يحسب درجة توافق 0..100 بين مستفيد ووظيفة/برنامج تدريبي.
--  -----------------------------------------------------------------------------
--  الأوزان (مجموعها 100):
--    التخصص/المجال      30
--    المهارات           30
--    المؤهل             15
--    الخبرة             10
--    المدينة            10
--    الرغبات/المسمى      5
-- =============================================================================

CREATE OR REPLACE PACKAGE RE_MATCH_PKG AS
  -- درجة المطابقة لوظيفة محددة
  FUNCTION score_job(p_benef_id IN NUMBER, p_job_id IN NUMBER) RETURN NUMBER;
  -- درجة المطابقة لبرنامج تدريبي
  FUNCTION score_program(p_benef_id IN NUMBER, p_program_id IN NUMBER) RETURN NUMBER;
  -- JSON بتفصيل النقاط (للعرض في الواجهة)
  FUNCTION score_job_json(p_benef_id IN NUMBER, p_job_id IN NUMBER) RETURN CLOB;
  -- إعادة احتساب وتخزين أفضل المطابقات لمستفيد (في RE_MATCHES)
  PROCEDURE refresh_matches_for_benef(p_benef_id IN NUMBER);
  -- إعادة احتساب مطابقات وظيفة لكل المستفيدين المعتمدين
  PROCEDURE refresh_matches_for_job(p_job_id IN NUMBER);
END RE_MATCH_PKG;
/

CREATE OR REPLACE PACKAGE BODY RE_MATCH_PKG AS

  -- ترتيب المؤهلات لمقارنتها رقمياً
  FUNCTION edu_rank(p_code IN VARCHAR2) RETURN NUMBER IS
  BEGIN
    RETURN CASE p_code
             WHEN 'SECONDARY' THEN 1 WHEN 'DIPLOMA' THEN 2
             WHEN 'BACHELOR'  THEN 3 WHEN 'MASTER'  THEN 4
             WHEN 'PHD'       THEN 5 ELSE 0 END;
  END;

  -- مكوّن التخصص/المجال (30): تطابق major مع field_cat للوظيفة عبر تصنيفات المستفيد
  FUNCTION specialty_pts(p_benef_id NUMBER, p_field_cat NUMBER) RETURN NUMBER IS
    v_cnt NUMBER;
  BEGIN
    IF p_field_cat IS NULL THEN RETURN 15; END IF; -- محايد إن لم يحدَّد مجال
    SELECT COUNT(*) INTO v_cnt
      FROM RE_BENEFICIARY_CATEGORIES bc
     WHERE bc.benef_id = p_benef_id AND bc.category_id = p_field_cat;
    RETURN CASE WHEN v_cnt > 0 THEN 30 ELSE 8 END;
  END;

  -- مكوّن المهارات (30): نسبة المهارات المطلوبة المتوفّرة مرجّحة بالأوزان
  FUNCTION skills_pts(p_benef_id NUMBER, p_job_id NUMBER) RETURN NUMBER IS
    v_total_w NUMBER := 0;
    v_have_w  NUMBER := 0;
  BEGIN
    FOR r IN (SELECT js.skill_id, js.weight, js.mandatory,
                     (SELECT 1 FROM RE_BENEFICIARY_SKILLS bs
                       WHERE bs.benef_id=p_benef_id AND bs.skill_id=js.skill_id AND ROWNUM=1) AS has_it
                FROM RE_JOB_SKILLS js WHERE js.job_id=p_job_id) LOOP
      v_total_w := v_total_w + r.weight;
      IF r.has_it = 1 THEN v_have_w := v_have_w + r.weight; END IF;
    END LOOP;
    IF v_total_w = 0 THEN RETURN 20; END IF; -- وظيفة بلا مهارات محددة
    RETURN ROUND(v_have_w / v_total_w * 30);
  END;

  -- مكوّن المؤهل (15)
  FUNCTION edu_pts(p_benef_edu VARCHAR2, p_min_edu VARCHAR2) RETURN NUMBER IS
  BEGIN
    IF p_min_edu IS NULL THEN RETURN 12; END IF;
    IF edu_rank(p_benef_edu) >= edu_rank(p_min_edu) THEN RETURN 15;
    ELSIF edu_rank(p_benef_edu) = edu_rank(p_min_edu)-1 THEN RETURN 8;
    ELSE RETURN 3; END IF;
  END;

  -- مكوّن الخبرة (10)
  FUNCTION exp_pts(p_benef_exp NUMBER, p_min_exp NUMBER) RETURN NUMBER IS
  BEGIN
    IF NVL(p_min_exp,0) = 0 THEN RETURN 10; END IF;
    IF NVL(p_benef_exp,0) >= p_min_exp THEN RETURN 10;
    ELSE RETURN GREATEST(0, ROUND(NVL(p_benef_exp,0) / p_min_exp * 10)); END IF;
  END;

  -- مكوّن المدينة (10)
  FUNCTION city_pts(p_benef_city VARCHAR2, p_job_city VARCHAR2, p_relocate VARCHAR2) RETURN NUMBER IS
  BEGIN
    IF p_job_city IS NULL OR p_benef_city IS NULL THEN RETURN 6; END IF;
    IF TRIM(LOWER(p_benef_city)) = TRIM(LOWER(p_job_city)) THEN RETURN 10;
    ELSIF p_relocate = 'Y' THEN RETURN 6;
    ELSE RETURN 2; END IF;
  END;

  -- مكوّن الرغبات/المسمى (5): تطابق عنوان الوظيفة مع desired_titles
  FUNCTION desire_pts(p_desired VARCHAR2, p_title VARCHAR2) RETURN NUMBER IS
  BEGIN
    IF p_desired IS NULL OR p_title IS NULL THEN RETURN 2; END IF;
    IF INSTR(LOWER(p_desired), LOWER(p_title)) > 0
       OR INSTR(LOWER(p_title), LOWER(p_desired)) > 0 THEN RETURN 5; END IF;
    RETURN 0;
  END;

  FUNCTION score_job(p_benef_id IN NUMBER, p_job_id IN NUMBER) RETURN NUMBER IS
    b RE_BENEFICIARIES%ROWTYPE;
    j RE_JOBS%ROWTYPE;
    v_score NUMBER;
  BEGIN
    SELECT * INTO b FROM RE_BENEFICIARIES WHERE benef_id = p_benef_id;
    SELECT * INTO j FROM RE_JOBS          WHERE job_id   = p_job_id;
    v_score := specialty_pts(p_benef_id, j.field_cat)
             + skills_pts(p_benef_id, p_job_id)
             + edu_pts(b.education_level, j.min_education)
             + exp_pts(b.experience_years, j.min_experience)
             + city_pts(b.city, j.city, b.willing_relocate)
             + desire_pts(b.desired_titles, j.title);
    RETURN LEAST(100, GREATEST(0, v_score));
  EXCEPTION WHEN NO_DATA_FOUND THEN RETURN 0;
  END;

  FUNCTION score_job_json(p_benef_id IN NUMBER, p_job_id IN NUMBER) RETURN CLOB IS
    b RE_BENEFICIARIES%ROWTYPE;
    j RE_JOBS%ROWTYPE;
  BEGIN
    SELECT * INTO b FROM RE_BENEFICIARIES WHERE benef_id = p_benef_id;
    SELECT * INTO j FROM RE_JOBS          WHERE job_id   = p_job_id;
    RETURN JSON_OBJECT(
      'total'         VALUE score_job(p_benef_id, p_job_id),
      'specialty'     VALUE specialty_pts(p_benef_id, j.field_cat),
      'skills'        VALUE skills_pts(p_benef_id, p_job_id),
      'qualification' VALUE edu_pts(b.education_level, j.min_education),
      'experience'    VALUE exp_pts(b.experience_years, j.min_experience),
      'city'          VALUE city_pts(b.city, j.city, b.willing_relocate),
      'desires'       VALUE desire_pts(b.desired_titles, j.title)
    );
  EXCEPTION WHEN NO_DATA_FOUND THEN RETURN '{"total":0}';
  END;

  -- مطابقة البرنامج التدريبي (وزن أعلى للمجال والمؤهل، أقل للمهارات)
  FUNCTION score_program(p_benef_id IN NUMBER, p_program_id IN NUMBER) RETURN NUMBER IS
    b RE_BENEFICIARIES%ROWTYPE;
    p RE_TRAINING_PROGRAMS%ROWTYPE;
    v_score NUMBER;
  BEGIN
    SELECT * INTO b FROM RE_BENEFICIARIES     WHERE benef_id   = p_benef_id;
    SELECT * INTO p FROM RE_TRAINING_PROGRAMS WHERE program_id = p_program_id;
    v_score := specialty_pts(p_benef_id, p.field_cat)            -- 30
             + city_pts(b.city, p.city, b.willing_relocate)      -- 10
             + 40;  -- البرامج التدريبية متاحة للجميع (أساس عالٍ)
    -- مكافأة لحديثي التخرج/الباحثين عن عمل
    IF b.current_status IN ('FRESH_GRAD','SEEKER') THEN v_score := v_score + 20; END IF;
    RETURN LEAST(100, GREATEST(0, v_score));
  EXCEPTION WHEN NO_DATA_FOUND THEN RETURN 0;
  END;

  PROCEDURE refresh_matches_for_benef(p_benef_id IN NUMBER) IS
  BEGIN
    DELETE FROM RE_MATCHES WHERE benef_id = p_benef_id;
    -- الوظائف المنشورة
    INSERT INTO RE_MATCHES (benef_id, target_type, job_id, score, breakdown)
    SELECT p_benef_id, 'JOB', j.job_id, score_job(p_benef_id, j.job_id), score_job_json(p_benef_id, j.job_id)
      FROM RE_JOBS j WHERE j.status = 'PUBLISHED';
    -- البرامج المنشورة
    INSERT INTO RE_MATCHES (benef_id, target_type, program_id, score)
    SELECT p_benef_id, 'TRAINING', p.program_id, score_program(p_benef_id, p.program_id)
      FROM RE_TRAINING_PROGRAMS p WHERE p.status = 'PUBLISHED';
    COMMIT;
  END;

  PROCEDURE refresh_matches_for_job(p_job_id IN NUMBER) IS
  BEGIN
    DELETE FROM RE_MATCHES WHERE job_id = p_job_id;
    INSERT INTO RE_MATCHES (benef_id, target_type, job_id, score, breakdown)
    SELECT b.benef_id, 'JOB', p_job_id, score_job(b.benef_id, p_job_id), score_job_json(b.benef_id, p_job_id)
      FROM RE_BENEFICIARIES b WHERE b.approval_status = 'APPROVED';
    COMMIT;
  END;

END RE_MATCH_PKG;
/

PROMPT >> 08_pkg_matching.sql  تم إنشاء محرك المطابقة RE_MATCH_PKG.
