-- =============================================================================
--  24_mail_push_job.sql : مهمّة مجدوَلة لدفع طابور بريد APEX تلقائياً
--  -----------------------------------------------------------------------------
--  المُشغّلات تُدرِج البريد في الطابور لكنها لا تستطيع COMMIT/push_queue داخلها.
--  هذه المهمّة تدفع الطابور كل دقيقة فتُرسَل كل رسائل الأحداث آلياً.
--  متطلّب مسبق: ضبط SMTP على المثيل (راجع 23 وتعليمات الإعداد).
--  ينفّذ مرّة واحدة بحساب سكيمة المنصة (WKSP_MCW).
-- =============================================================================
BEGIN
  BEGIN DBMS_SCHEDULER.DROP_JOB('RE_MAIL_PUSH_JOB', force => TRUE); EXCEPTION WHEN OTHERS THEN NULL; END;

  DBMS_SCHEDULER.CREATE_JOB(
    job_name   => 'RE_MAIL_PUSH_JOB',
    job_type   => 'PLSQL_BLOCK',
    job_action => q'~BEGIN
        FOR c IN (SELECT workspace_id FROM apex_workspace_schemas
                   WHERE schema = SYS_CONTEXT('USERENV','CURRENT_SCHEMA') AND ROWNUM=1) LOOP
          apex_util.set_security_group_id(c.workspace_id);
        END LOOP;
        apex_mail.push_queue;
        COMMIT;
      END;~',
    start_date      => SYSTIMESTAMP,
    repeat_interval => 'FREQ=MINUTELY;INTERVAL=1',
    enabled         => TRUE);
END;
/
PROMPT >> 24_mail_push_job.sql  تم: مهمّة دفع البريد كل دقيقة (RE_MAIL_PUSH_JOB).
