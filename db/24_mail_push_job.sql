-- =============================================================================
--  24_mail_push_job.sql : مهمّة مجدوَلة لدفع طابور بريد APEX تلقائياً
--  -----------------------------------------------------------------------------
--  المُشغّلات تُدرِج البريد في الطابور لكنها لا تستطيع COMMIT/push_queue داخلها.
--  هذه المهمّة تدفع الطابور كل دقيقة فتُرسَل كل رسائل الأحداث آلياً.
--  متطلّب مسبق: ضبط SMTP على المثيل (راجع 23 وتعليمات الإعداد).
--  ينفّذ مرّة واحدة بحساب سكيمة المنصة (WKSP_MCW).
--  ملاحظة مهمّة: في جلسة المهمّة المجدوَلة المجرّدة، apex_util.set_security_group_id
--  يفشل بـ ORA-20987 ("Security Group ID is invalid") لعدم وجود هويّة مساحة عمل.
--  الحل القياسي: إنشاء جلسة APEX حقيقية عبر apex_session.create_session باستخدام
--  أي تطبيق في مساحة العمل (هنا 101)، فتصبح الهويّة صالحة وينجح push_queue.
-- =============================================================================
BEGIN
  BEGIN DBMS_SCHEDULER.DROP_JOB('RE_MAIL_PUSH_JOB', force => TRUE); EXCEPTION WHEN OTHERS THEN NULL; END;

  DBMS_SCHEDULER.CREATE_JOB(
    job_name        => 'RE_MAIL_PUSH_JOB',
    job_type        => 'PLSQL_BLOCK',
    job_action      => q'[BEGIN
        apex_session.create_session(p_app_id => 101, p_page_id => 1, p_username => 'ADMIN');
        apex_util.set_security_group_id(9421272729640104);  -- يصحّ بعد إنشاء الجلسة؛ يجبر مجموعة الرسائل
        apex_mail.push_queue;
        COMMIT;
      END;]',
    start_date      => SYSTIMESTAMP,
    repeat_interval => 'FREQ=MINUTELY;INTERVAL=1',
    enabled         => TRUE);
END;
/
PROMPT >> 24_mail_push_job.sql  تم: مهمّة دفع البريد كل دقيقة (RE_MAIL_PUSH_JOB).
