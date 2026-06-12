-- =============================================================================
--  26_enable_db_email.sql : إعادة تفعيل إرسال البريد من Oracle نفسها
--  (عكس 25_disable_db_email.sql) — يُعيد مُشغّلات البريد الستة + مهمّة الدفع.
--  ينفّذ مرّة واحدة بحساب سكيمة المنصة (WKSP_MCW).
--  متطلّب: SMTP مضبوط على المثيل (راجع EMAIL_VIA_ORACLE.md §4).
-- =============================================================================
BEGIN
  -- 1) إعادة تفعيل مُشغّلات بريد القاعدة الستة
  FOR t IN (SELECT trigger_name FROM user_triggers WHERE trigger_name LIKE 'RE_TRG_MAIL%') LOOP
    EXECUTE IMMEDIATE 'ALTER TRIGGER "'||t.trigger_name||'" ENABLE';
  END LOOP;

  -- 2) إعادة إنشاء مهمّة دفع الطابور كل دقيقة (create_session لجلسة APEX صالحة)
  BEGIN DBMS_SCHEDULER.DROP_JOB('RE_MAIL_PUSH_JOB', force => TRUE); EXCEPTION WHEN OTHERS THEN NULL; END;
  DBMS_SCHEDULER.CREATE_JOB(
    job_name        => 'RE_MAIL_PUSH_JOB',
    job_type        => 'PLSQL_BLOCK',
    job_action      => q'[BEGIN
        apex_session.create_session(p_app_id => 101, p_page_id => 1, p_username => 'ADMIN');
        apex_util.set_security_group_id(9421272729640104);
        apex_mail.push_queue;
        COMMIT;
      END;]',
    start_date      => SYSTIMESTAMP,
    repeat_interval => 'FREQ=MINUTELY;INTERVAL=1',
    enabled         => TRUE);
END;
/
PROMPT >> 26_enable_db_email.sql  أُعيد تفعيل بريد القاعدة (المُشغّلات + مهمّة الدفع).
