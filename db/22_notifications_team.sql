-- =============================================================================
--  22_notifications_team.sql : إشعارات ورسائل على مستوى الفريق + مُشغّل التقديمات
--  -----------------------------------------------------------------------------
--  مبدأ "نطاق الفريق": رسائل/إشعارات المنظمة يراها كل مستخدميها، ورسائل الجمعية
--  يراها كل فريق الجمعية (ADMIN+STAFF). يُحلّ مشكلة تعدّد مستخدمي الطرف الواحد.
--  ينفّذ مرّة واحدة. المُشغّل عبارة مستقلّة، ثم كتلة ORDS.
-- =============================================================================

-- مُشغّل: عند أي تقديم جديد، أَشعِر كل مستخدمي المنظمة صاحبة الفرصة
CREATE OR REPLACE TRIGGER re_trg_app_notify
AFTER INSERT ON RE_APPLICATIONS FOR EACH ROW
DECLARE
  v_org NUMBER; v_title VARCHAR2(300); v_bname VARCHAR2(200); v_ttl VARCHAR2(120);
BEGIN
  IF :NEW.target_type = 'JOB' AND :NEW.job_id IS NOT NULL THEN
    SELECT org_id, title INTO v_org, v_title FROM RE_JOBS WHERE job_id = :NEW.job_id;
    v_ttl := 'متقدّم جديد على وظيفة';
  ELSIF :NEW.program_id IS NOT NULL THEN
    SELECT org_id, title INTO v_org, v_title FROM RE_TRAINING_PROGRAMS WHERE program_id = :NEW.program_id;
    v_ttl := 'تسجيل جديد في برنامج';
  ELSE RETURN; END IF;

  BEGIN
    SELECT u.full_name INTO v_bname FROM RE_BENEFICIARIES b JOIN RE_USERS u ON u.user_id = b.user_id
     WHERE b.benef_id = :NEW.benef_id;
  EXCEPTION WHEN NO_DATA_FOUND THEN v_bname := 'مستفيد'; END;

  INSERT INTO RE_NOTIFICATIONS (user_id, channel, title, body, category, link, delivery)
  SELECT user_id, 'INAPP', v_ttl, v_bname || ' — ' || v_title, 'APPLICATION', '/dashboard', 'SENT'
    FROM RE_USERS WHERE org_id = v_org;
EXCEPTION WHEN OTHERS THEN NULL;  -- لا نعطّل التقديم إن فشل الإشعار
END;
/

BEGIN
  -- /me/conversations : محادثات على مستوى الفريق
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'me/conversations', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      WITH scope AS (
        SELECT x.user_id FROM RE_USERS x WHERE
          ((SELECT user_type FROM RE_USERS WHERE user_id=:uid) IN ('ADMIN','STAFF') AND x.user_type IN ('ADMIN','STAFF'))
          OR (x.org_id IS NOT NULL AND x.org_id = (SELECT org_id FROM RE_USERS WHERE user_id=:uid))
          OR (x.user_id = :uid)
      )
      SELECT pp.peer_id, u.full_name AS peer_name, u.user_type AS peer_type,
             (SELECT body FROM RE_MESSAGES m2 WHERE (m2.from_user IN (SELECT user_id FROM scope) AND m2.to_user=pp.peer_id)
                 OR (m2.from_user=pp.peer_id AND m2.to_user IN (SELECT user_id FROM scope))
               ORDER BY created_at DESC FETCH FIRST 1 ROW ONLY) AS last_body,
             (SELECT MAX(created_at) FROM RE_MESSAGES m3 WHERE (m3.from_user IN (SELECT user_id FROM scope) AND m3.to_user=pp.peer_id)
                 OR (m3.from_user=pp.peer_id AND m3.to_user IN (SELECT user_id FROM scope))) AS last_at,
             (SELECT COUNT(*) FROM RE_MESSAGES m4 WHERE m4.to_user IN (SELECT user_id FROM scope) AND m4.from_user=pp.peer_id AND m4.is_read='N') AS unread
        FROM (SELECT DISTINCT CASE WHEN m.from_user IN (SELECT user_id FROM scope) THEN m.to_user ELSE m.from_user END AS peer_id
                FROM RE_MESSAGES m WHERE m.from_user IN (SELECT user_id FROM scope) OR m.to_user IN (SELECT user_id FROM scope)) pp
        JOIN RE_USERS u ON u.user_id = pp.peer_id
       WHERE pp.peer_id NOT IN (SELECT user_id FROM scope)
       ORDER BY last_at DESC ]');

  -- /messages GET : رسائل المحادثة على مستوى الفريق + تعليمها مقروءة
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'messages', p_method=>'GET',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      DECLARE v CLOB;
      BEGIN
        UPDATE RE_MESSAGES SET is_read='Y'
         WHERE from_user=:peer AND is_read='N' AND to_user IN (
           SELECT x.user_id FROM RE_USERS x WHERE
             ((SELECT user_type FROM RE_USERS WHERE user_id=:uid) IN ('ADMIN','STAFF') AND x.user_type IN ('ADMIN','STAFF'))
             OR (x.org_id IS NOT NULL AND x.org_id=(SELECT org_id FROM RE_USERS WHERE user_id=:uid)) OR (x.user_id=:uid));
        SELECT JSON_ARRAYAGG(JSON_OBJECT(
                 'message_id' VALUE message_id, 'body' VALUE body,
                 'side' VALUE CASE WHEN from_user IN (
                     SELECT x.user_id FROM RE_USERS x WHERE
                       ((SELECT user_type FROM RE_USERS WHERE user_id=:uid) IN ('ADMIN','STAFF') AND x.user_type IN ('ADMIN','STAFF'))
                       OR (x.org_id IS NOT NULL AND x.org_id=(SELECT org_id FROM RE_USERS WHERE user_id=:uid)) OR (x.user_id=:uid)
                   ) THEN 'me' ELSE 'them' END,
                 'created_at' VALUE TO_CHAR(created_at,'YYYY-MM-DD HH24:MI')) ORDER BY created_at) INTO v
          FROM RE_MESSAGES WHERE
            (from_user=:peer AND to_user IN (SELECT x.user_id FROM RE_USERS x WHERE
               ((SELECT user_type FROM RE_USERS WHERE user_id=:uid) IN ('ADMIN','STAFF') AND x.user_type IN ('ADMIN','STAFF'))
               OR (x.org_id IS NOT NULL AND x.org_id=(SELECT org_id FROM RE_USERS WHERE user_id=:uid)) OR (x.user_id=:uid)))
            OR (to_user=:peer AND from_user IN (SELECT x.user_id FROM RE_USERS x WHERE
               ((SELECT user_type FROM RE_USERS WHERE user_id=:uid) IN ('ADMIN','STAFF') AND x.user_type IN ('ADMIN','STAFF'))
               OR (x.org_id IS NOT NULL AND x.org_id=(SELECT org_id FROM RE_USERS WHERE user_id=:uid)) OR (x.user_id=:uid)));
        COMMIT; :status_code := 200; HTP.P(NVL(v, CHR(91)||CHR(93)));
      END; ]');

  -- /messages POST : إرسال + إشعار كل فريق المستلم
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'messages', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      BEGIN
        INSERT INTO RE_MESSAGES(from_user,to_user,body,application_id) VALUES(:from_uid,:to_uid,:msg_body,:application_id);
        INSERT INTO RE_NOTIFICATIONS(user_id,channel,title,body,category,link,delivery)
        SELECT x.user_id,'INAPP','رسالة جديدة',SUBSTR(:msg_body,1,180),'MESSAGE','/messages?peer='||:from_uid,'SENT'
          FROM RE_USERS x WHERE
            ((SELECT user_type FROM RE_USERS WHERE user_id=:to_uid) IN ('ADMIN','STAFF') AND x.user_type IN ('ADMIN','STAFF'))
            OR (x.org_id IS NOT NULL AND x.org_id=(SELECT org_id FROM RE_USERS WHERE user_id=:to_uid)) OR (x.user_id=:to_uid);
        COMMIT; :status_code := 201; HTP.P('{"ok":true}');
      EXCEPTION WHEN OTHERS THEN :status_code := 400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  -- /admin/messages : إشراف الأدمن على كل الرسائل
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'admin/messages');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'admin/messages', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT m.message_id, m.body, TO_CHAR(m.created_at,'YYYY-MM-DD HH24:MI') AS created_at,
             uf.full_name AS from_name, ut.full_name AS to_name
        FROM RE_MESSAGES m JOIN RE_USERS uf ON uf.user_id=m.from_user JOIN RE_USERS ut ON ut.user_id=m.to_user
       WHERE EXISTS (SELECT 1 FROM SEC_USER_ROLES ur JOIN SEC_ROLE_PERMISSIONS rp ON rp.role_id=ur.role_id
                       JOIN SEC_PERMISSIONS p ON p.perm_id=rp.perm_id
                      WHERE ur.user_id=:actor AND p.perm_code='USER.MANAGE')
       ORDER BY m.created_at DESC FETCH FIRST 100 ROWS ONLY ]', p_items_per_page=>100);

  COMMIT;
END;
/
PROMPT >> 22_notifications_team.sql  تم: إشعارات/رسائل الفريق + مُشغّل التقديمات + رسائل الأدمن.
