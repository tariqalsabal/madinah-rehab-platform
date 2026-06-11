-- =============================================================================
--  11_ords_rest.sql : تعريف REST APIs عبر ORDS  (Oracle REST Data Services)
--  Base path : /ords/<schema>/api/v1/...
--  المصادقة  : OAuth2 client_credentials (privilege) + JWT في طبقة الواجهة.
--  -----------------------------------------------------------------------------
--  يُنفّذ في سكيمة التطبيق بعد منحها صلاحية ORDS.ENABLE_SCHEMA.
-- =============================================================================
BEGIN
  ORDS.ENABLE_SCHEMA(
    p_enabled             => TRUE,
    p_schema              => SYS_CONTEXT('USERENV','CURRENT_SCHEMA'),
    p_url_mapping_type    => 'BASE_PATH',
    p_url_mapping_pattern => 'rehab',
    p_auto_rest_auth      => FALSE);
  COMMIT;
END;
/

-- ----------------------------------------------------------------------------
--  وحدة الـ API
-- ----------------------------------------------------------------------------
BEGIN
  ORDS.DEFINE_MODULE(
    p_module_name => 'rehab.api.v1',
    p_base_path   => 'api/v1/',
    p_items_per_page => 25,
    p_status      => 'PUBLISHED',
    p_comments    => 'منصة التأهيل والتوظيف - REST API v1');

  ---------------------------------------------------------------------------
  -- المصادقة: POST /auth/login  ,  POST /auth/register
  ---------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'auth/login');
  ORDS.DEFINE_HANDLER(
    p_module_name => 'rehab.api.v1', p_pattern => 'auth/login', p_method => 'POST',
    p_source_type => ORDS.source_type_plsql,
    p_source => q'[
      DECLARE
        v_uid NUMBER;
        v_secret VARCHAR2(200) := NVL(SYS_CONTEXT('RE_CTX','JWT_SECRET'), 'CHANGE_ME_DEV_SECRET');
        v_claims CLOB; v_token VARCHAR2(4000); v_roles VARCHAR2(400);
      BEGIN
        v_uid := RE_APP_PKG.authenticate(:email, :password);
        IF v_uid IS NULL THEN
          :status_code := 401;
          HTP.P('{"error":"بيانات الدخول غير صحيحة"}');
          RETURN;
        END IF;
        v_roles  := RE_SEC_PKG.user_roles(v_uid);
        v_claims := JSON_OBJECT('sub' VALUE v_uid, 'roles' VALUE v_roles);
        v_token  := RE_SEC_PKG.sign_jwt(v_claims, v_secret, 3600);
        :status_code := 200;
        HTP.P(JSON_OBJECT('access_token' VALUE v_token, 'user_id' VALUE v_uid, 'roles' VALUE v_roles));
      END;]',
    p_items_per_page => 0);

  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'auth/register');
  ORDS.DEFINE_HANDLER(
    p_module_name => 'rehab.api.v1', p_pattern => 'auth/register', p_method => 'POST',
    p_source_type => ORDS.source_type_plsql,
    p_source => q'[
      DECLARE v_uid NUMBER;
      BEGIN
        v_uid := RE_APP_PKG.register_user(:email, :full_name, :password,
                                          NVL(:user_type,'BENEFICIARY'), :phone);
        :status_code := 201;
        HTP.P(JSON_OBJECT('user_id' VALUE v_uid, 'status' VALUE 'PENDING'));
      EXCEPTION WHEN DUP_VAL_ON_INDEX THEN
        :status_code := 409; HTP.P('{"error":"البريد مسجّل مسبقاً"}');
      END;]',
    p_items_per_page => 0);

  ---------------------------------------------------------------------------
  -- الوظائف:  GET /jobs   (قائمة منشورة، تدعم البحث والصفحات)
  ---------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'jobs');
  ORDS.DEFINE_HANDLER(
    p_module_name => 'rehab.api.v1', p_pattern => 'jobs', p_method => 'GET',
    p_source_type => ORDS.source_type_collection_feed,
    p_source => q'[
      SELECT job_id, title, org_name, org_brand, city, work_mode, employment_type,
             salary_min, salary_max, vacancies, field_name, function_name, published_at, applicants
        FROM RE_V_JOBS
       WHERE status = 'PUBLISHED'
         AND (:q IS NULL OR LOWER(title) LIKE '%'||LOWER(:q)||'%')
         AND (:city IS NULL OR city = :city)
       ORDER BY published_at DESC ]',
    p_items_per_page => 25);

  -- GET /jobs/:id
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'jobs/:id');
  ORDS.DEFINE_HANDLER(
    p_module_name => 'rehab.api.v1', p_pattern => 'jobs/:id', p_method => 'GET',
    p_source_type => ORDS.source_type_query_one,
    p_source => 'SELECT * FROM RE_V_JOBS WHERE job_id = :id');

  ---------------------------------------------------------------------------
  -- البرامج التدريبية:  GET /programs
  ---------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'programs');
  ORDS.DEFINE_HANDLER(
    p_module_name => 'rehab.api.v1', p_pattern => 'programs', p_method => 'GET',
    p_source_type => ORDS.source_type_collection_feed,
    p_source => q'[
      SELECT program_id, title, org_name, city, delivery_mode, level, seats_available,
             is_free, discount_pct, certificate, start_date, field_name
        FROM RE_V_TRAINING
       WHERE status = 'PUBLISHED'
       ORDER BY published_at DESC ]',
    p_items_per_page => 25);

  ---------------------------------------------------------------------------
  -- المطابقة:  GET /beneficiaries/:id/matches  (أفضل المطابقات)
  ---------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'beneficiaries/:id/matches');
  ORDS.DEFINE_HANDLER(
    p_module_name => 'rehab.api.v1', p_pattern => 'beneficiaries/:id/matches', p_method => 'GET',
    p_source_type => ORDS.source_type_collection_feed,
    p_source => q'[
      SELECT m.target_type, m.score, m.breakdown,
             j.title AS job_title, j.org_name AS job_org,
             p.title AS program_title
        FROM RE_MATCHES m
        LEFT JOIN RE_V_JOBS j     ON j.job_id     = m.job_id
        LEFT JOIN RE_V_TRAINING p ON p.program_id = m.program_id
       WHERE m.benef_id = :id
       ORDER BY m.score DESC ]',
    p_items_per_page => 20);

  ---------------------------------------------------------------------------
  -- التقديم:  POST /applications/job   ,  POST /applications/program
  ---------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'applications/job');
  ORDS.DEFINE_HANDLER(
    p_module_name => 'rehab.api.v1', p_pattern => 'applications/job', p_method => 'POST',
    p_source_type => ORDS.source_type_plsql,
    p_source => q'[
      DECLARE v_id NUMBER;
      BEGIN
        v_id := RE_APP_PKG.apply_job(:benef_id, :job_id, :cover_note);
        :status_code := 201;
        HTP.P(JSON_OBJECT('application_id' VALUE v_id));
      EXCEPTION WHEN DUP_VAL_ON_INDEX THEN
        :status_code := 409; HTP.P('{"error":"سبق التقديم على هذه الوظيفة"}');
      END;]',
    p_items_per_page => 0);

  ---------------------------------------------------------------------------
  -- التحقق من الخطاب (عام، يُستخدم خلف QR):  GET /letters/verify/:code
  ---------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'letters/verify/:code');
  ORDS.DEFINE_HANDLER(
    p_module_name => 'rehab.api.v1', p_pattern => 'letters/verify/:code', p_method => 'GET',
    p_source_type => ORDS.source_type_plsql,
    p_source => q'[
      BEGIN
        :status_code := 200;
        HTP.P(RE_APP_PKG.verify_letter(:code));
      END;]',
    p_items_per_page => 0);

  ---------------------------------------------------------------------------
  -- لوحة المؤشرات:  GET /dashboard/kpis
  ---------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'dashboard/kpis');
  ORDS.DEFINE_HANDLER(
    p_module_name => 'rehab.api.v1', p_pattern => 'dashboard/kpis', p_method => 'GET',
    p_source_type => ORDS.source_type_query_one,
    p_source => 'SELECT * FROM RE_V_DASHBOARD');

  COMMIT;
END;
/

-- ----------------------------------------------------------------------------
--  أمثلة الحماية (OAuth2): إنشاء role + privilege وربطهما بالمسارات المحمية
-- ----------------------------------------------------------------------------
BEGIN
  ORDS.CREATE_ROLE(p_role_name => 'rehab_user');

  ORDS.DEFINE_PRIVILEGE(
    p_privilege_name => 'rehab.priv.secured',
    p_roles          => ORDS_TYPES.T_ROLES('rehab_user'),
    p_patterns       => ORDS_TYPES.T_PATTERNS(
                          '/api/v1/applications/*',
                          '/api/v1/beneficiaries/*'),
    p_label          => 'مسارات محمية',
    p_description     => 'تتطلب رمز وصول صالح');
  COMMIT;
END;
/

PROMPT >> 11_ords_rest.sql  تم تعريف REST APIs عبر ORDS (وحدة rehab.api.v1).
