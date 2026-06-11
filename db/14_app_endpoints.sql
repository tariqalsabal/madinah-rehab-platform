-- =============================================================================
--  14_app_endpoints.sql : نقاط نهاية تشغيلية مخصّصة حسب الدور + تحكّم الأدمن
--  -----------------------------------------------------------------------------
--  ينفّذ في سكيمة التطبيق بعد أن أصبحت وحدة rehab.api.v1 موجودة.
--  ملاحظة أمنية: التحديد الحالي يعتمد تمرير معرّفات من جلسة الواجهة الموثوقة
--  (NextAuth)، وتُتحقّق أدوار العمليات الحسّاسة عبر RE_SEC_PKG.has_permission.
--  التحقّق التشفيري من JWT داخل ORDS خطوة تحصين لاحقة.
-- =============================================================================

-- عرض المستخدمين للأدمن (مع الأدوار والمنظمة)
CREATE OR REPLACE VIEW RE_V_USERS AS
SELECT u.user_id, u.full_name, u.email, u.phone, u.user_type, u.status,
       u.created_at, u.last_login_at, u.org_id, o.legal_name AS org_name,
       (SELECT LISTAGG(r.role_code, ',') WITHIN GROUP (ORDER BY r.role_code)
          FROM SEC_USER_ROLES ur JOIN SEC_ROLES r ON r.role_id = ur.role_id
         WHERE ur.user_id = u.user_id) AS roles
  FROM RE_USERS u
  LEFT JOIN RE_ORGANIZATIONS o ON o.org_id = u.org_id;

BEGIN
  ----------------------------------------------------------------------------
  -- GET /me?uid=  : ملف المستخدم الحالي + benef_id + org_id + أعداد
  ----------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'me');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'me', p_method=>'GET',
    p_source_type=>ORDS.source_type_query_one, p_source=>q'[
      SELECT u.user_id, u.full_name, u.email, u.user_type, u.status, u.org_id,
             (SELECT benef_id FROM RE_BENEFICIARIES b WHERE b.user_id=u.user_id) AS benef_id,
             (SELECT LISTAGG(r.role_code, ',') WITHIN GROUP (ORDER BY r.role_code)
                FROM SEC_USER_ROLES ur JOIN SEC_ROLES r ON r.role_id=ur.role_id WHERE ur.user_id=u.user_id) AS roles
        FROM RE_USERS u WHERE u.user_id = :uid ]');

  ----------------------------------------------------------------------------
  -- GET /me/applications?uid=  : طلبات المستفيد الحالي
  ----------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'me/applications');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'me/applications', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT a.application_id, a.target_type, a.status, a.match_score, a.created_at,
             a.job_title, a.program_title, a.org_name
        FROM RE_V_APPLICATIONS a
        JOIN RE_BENEFICIARIES b ON b.benef_id = a.benef_id
       WHERE b.user_id = :uid
       ORDER BY a.created_at DESC ]', p_items_per_page=>50);

  ----------------------------------------------------------------------------
  -- GET /org/jobs?org_id=  : وظائف منظمة (شركة/شركة توظيف)
  ----------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'org/jobs');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'org/jobs', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT job_id, title, status, city, vacancies, applicants, published_at, field_name
        FROM RE_V_JOBS WHERE org_id = :org_id ORDER BY job_id DESC ]', p_items_per_page=>50);

  ----------------------------------------------------------------------------
  -- GET /org/programs?org_id=  : برامج معهد
  ----------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'org/programs');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'org/programs', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT program_id, title, status, city, seats_total, seats_available, is_free, start_date
        FROM RE_V_TRAINING WHERE org_id = :org_id ORDER BY program_id DESC ]', p_items_per_page=>50);

  ----------------------------------------------------------------------------
  -- GET /me/donations?org_id=  : تبرعات منظمة (شركة/معهد/مانح)
  ----------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'me/donations');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'me/donations', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT donation_id, donation_type, title, units_pledged, units_consumed, units_remaining,
             consumed_pct, status, monetary_value
        FROM RE_V_DONATIONS WHERE donor_org_id = :org_id ORDER BY donation_id DESC ]', p_items_per_page=>50);

  ----------------------------------------------------------------------------
  -- GET /jobs/:id/applicants  : المتقدّمون على وظيفة
  ----------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'jobs/:id/applicants');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'jobs/:id/applicants', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT application_id, beneficiary_name, beneficiary_email, status, match_score, created_at
        FROM RE_V_APPLICATIONS WHERE job_id = :id ORDER BY match_score DESC NULLS LAST ]', p_items_per_page=>50);

  ----------------------------------------------------------------------------
  -- GET /programs/:id/enrollees  : المسجّلون في برنامج
  ----------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'programs/:id/enrollees');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'programs/:id/enrollees', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT application_id, beneficiary_name, beneficiary_email, status, created_at
        FROM RE_V_APPLICATIONS WHERE program_id = :id ORDER BY created_at DESC ]', p_items_per_page=>50);

  ----------------------------------------------------------------------------
  -- POST /applications/status  : تغيير حالة طلب (شركة/موظف/أدمن)
  --   body: { application_id, new_status, actor, note }
  ----------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'applications/status');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'applications/status', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      BEGIN
        IF NOT RE_SEC_PKG.has_permission(:actor, 'APP.MANAGE') THEN
          :status_code := 403; HTP.P('{"error":"لا تملك صلاحية إدارة الطلبات"}'); RETURN;
        END IF;
        RE_APP_PKG.change_application_status(:application_id, :new_status, :actor, :note);
        :status_code := 200; HTP.P('{"ok":true}');
      EXCEPTION WHEN OTHERS THEN
        :status_code := 400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  ----------------------------------------------------------------------------
  -- ===== الأدمن =====
  -- GET /admin/users?actor=  : كل المستخدمين (يتطلب USER.MANAGE)
  ----------------------------------------------------------------------------
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'admin/users');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'admin/users', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT user_id, full_name, email, phone, user_type, status, roles, org_name, created_at, last_login_at
        FROM RE_V_USERS
       WHERE EXISTS (SELECT 1 FROM SEC_USER_ROLES ur JOIN SEC_ROLE_PERMISSIONS rp ON rp.role_id=ur.role_id
                       JOIN SEC_PERMISSIONS p ON p.perm_id=rp.perm_id
                      WHERE ur.user_id = :actor AND p.perm_code='USER.MANAGE')
       ORDER BY user_id DESC ]', p_items_per_page=>100);

  -- POST /admin/users/status : إيقاف/تفعيل حساب  body:{ user_id, status, actor }
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'admin/users/status');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'admin/users/status', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      BEGIN
        IF NOT RE_SEC_PKG.has_permission(:actor, 'USER.MANAGE') THEN
          :status_code := 403; HTP.P('{"error":"غير مصرّح"}'); RETURN;
        END IF;
        UPDATE RE_USERS SET status = :status, updated_at = SYSTIMESTAMP WHERE user_id = :user_id;
        RE_SEC_PKG.audit(:actor, 'USER_STATUS', 'RE_USERS', :user_id, :status);
        :status_code := 200; HTP.P('{"ok":true}');
      END; ]');

  -- GET /admin/applications?actor=  : كل الطلبات
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'admin/applications');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'admin/applications', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT application_id, target_type, status, match_score, beneficiary_name, job_title, program_title, org_name, created_at
        FROM RE_V_APPLICATIONS
       WHERE EXISTS (SELECT 1 FROM SEC_USER_ROLES ur JOIN SEC_ROLE_PERMISSIONS rp ON rp.role_id=ur.role_id
                       JOIN SEC_PERMISSIONS p ON p.perm_id=rp.perm_id
                      WHERE ur.user_id = :actor AND p.perm_code IN ('APP.MANAGE','USER.MANAGE'))
       ORDER BY created_at DESC ]', p_items_per_page=>100);

  -- GET /admin/donations?actor=  : كل التبرعات
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'admin/donations');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'admin/donations', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT donation_id, donation_type, title, donor_name, units_pledged, units_consumed, consumed_pct, monetary_value, status
        FROM RE_V_DONATIONS ORDER BY donation_id DESC ]', p_items_per_page=>100);

  COMMIT;
END;
/
PROMPT >> 14_app_endpoints.sql  تم إضافة نقاط النهاية التشغيلية وتحكّم الأدمن.
