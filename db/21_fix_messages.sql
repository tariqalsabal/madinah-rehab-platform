-- =============================================================================
--  21_fix_messages.sql : إصلاح إرسال الرسائل (تعارض اسم body مع ORDS)
--                        + فرص المنظمة في ملفها العام
--  ينفّذ مرّة واحدة (كتلة BEGIN…END; /).
-- =============================================================================
BEGIN
  -- إصلاح POST /messages : استخدام msg_body بدل body (المحجوز في ORDS)
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'messages', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      BEGIN
        INSERT INTO RE_MESSAGES(from_user,to_user,body,application_id)
        VALUES(:from_uid, :to_uid, :msg_body, :application_id);
        INSERT INTO RE_NOTIFICATIONS(user_id,channel,title,body,category,link,delivery)
        VALUES(:to_uid,'INAPP','رسالة جديدة', SUBSTR(:msg_body,1,180),'MESSAGE','/messages?peer='||:from_uid,'SENT');
        COMMIT;
        :status_code := 201; HTP.P('{"ok":true}');
      EXCEPTION WHEN OTHERS THEN :status_code := 400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  -- GET /organizations/:id/jobs : وظائف المنظمة (كل الحالات: منشورة/مغلقة/مكتملة)
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'organizations/:id/jobs');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'organizations/:id/jobs', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT job_id, title, city, status, vacancies, applicants, published_at, field_name
        FROM RE_V_JOBS WHERE org_id=:id ORDER BY job_id DESC ]', p_items_per_page=>50);

  -- GET /organizations/:id/programs : برامج المنظمة
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'organizations/:id/programs');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'organizations/:id/programs', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT program_id, title, city, status, seats_total, seats_available, is_free, start_date
        FROM RE_V_TRAINING WHERE org_id=:id ORDER BY program_id DESC ]', p_items_per_page=>50);

  -- GET /organizations/:id/donations : مبادرات/تبرعات المنظمة
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'organizations/:id/donations');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'organizations/:id/donations', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT donation_id, donation_type, title, units_pledged, units_consumed, consumed_pct, status
        FROM RE_V_DONATIONS WHERE donor_org_id=:id ORDER BY donation_id DESC ]', p_items_per_page=>50);

  COMMIT;
END;
/
PROMPT >> 21_fix_messages.sql  تم: إصلاح الرسائل + فرص المنظمة العامة.
