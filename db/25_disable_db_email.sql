-- =============================================================================
--  25_disable_db_email.sql : تعطيل بريد القاعدة (انتقل الإرسال إلى Next.js)
--  -----------------------------------------------------------------------------
--  بعد نقل بريد الأحداث إلى /api/notify في المنصة (Nodemailer + M365)، نُعطّل
--  مُشغّلات بريد القاعدة ومهمّة الدفع لتفادي تراكم طابور APEX دون إرسال.
--  ملاحظة: مُشغّلات الإشعارات داخل المنصة (RE_TRG_APP_NOTIFY) تبقى تعمل للجرس.
--  ينفّذ مرّة واحدة.
-- =============================================================================
BEGIN
  -- تعطيل مُشغّلات بريد القاعدة الستة
  FOR t IN (SELECT trigger_name FROM user_triggers WHERE trigger_name LIKE 'RE_TRG_MAIL%') LOOP
    EXECUTE IMMEDIATE 'ALTER TRIGGER "'||t.trigger_name||'" DISABLE';
  END LOOP;

  -- إيقاف مهمّة دفع البريد (لم تعد لازمة)
  BEGIN DBMS_SCHEDULER.DROP_JOB('RE_MAIL_PUSH_JOB', force => TRUE); EXCEPTION WHEN OTHERS THEN NULL; END;
END;
/
PROMPT >> 25_disable_db_email.sql  تم تعطيل بريد القاعدة (الإرسال الآن عبر المنصة Next.js).
