-- =============================================================================
--  24_mail_push_job.sql : مهمّة مجدوَلة لدفع طابور بريد APEX تلقائياً
--  -----------------------------------------------------------------------------
--  المُشغّلات تُدرِج البريد في الطابور لكنها لا تستطيع COMMIT/push_queue داخلها.
--  هذه المهمّة تدفع الطابور كل دقيقة فتُرسَل كل رسائل الأحداث آلياً.
--  متطلّب مسبق: ضبط SMTP على المثيل (راجع 23 وتعليمات الإعداد).
--  ينفّذ مرّة واحدة بحساب سكيمة المنصة (WKSP_MCW).
--  ملاحظة مهمّة: في جلسة المهمّة المجدوَلة لا يوجد سياق APEX، فالعرض
--  apex_workspace_schemas يُرجع صفر صفوف. لذلك نثبّت رقم مساحة العمل مباشرةً
--  (security group id) — استبدله برقمك (يظهر من: apex_util.set_security_group_id
--  أو طباعة workspace_id من apex_workspace_schemas داخل جلسة Database Actions).
-- =============================================================================
BEGIN
  BEGIN DBMS_SCHEDULER.DROP_JOB('RE_MAIL_PUSH_JOB', force => TRUE); EXCEPTION WHEN OTHERS THEN NULL; END;

  DBMS_SCHEDULER.CREATE_JOB(
    job_name        => 'RE_MAIL_PUSH_JOB',
    job_type        => 'PLSQL_BLOCK',
    job_action      => 'BEGIN apex_util.set_security_group_id(9421272729640104); apex_mail.push_queue; COMMIT; END;',
    start_date      => SYSTIMESTAMP,
    repeat_interval => 'FREQ=MINUTELY;INTERVAL=1',
    enabled         => TRUE);
END;
/
PROMPT >> 24_mail_push_job.sql  تم: مهمّة دفع البريد كل دقيقة (RE_MAIL_PUSH_JOB).
