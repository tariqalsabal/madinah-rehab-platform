-- =============================================================================
--  00_install_all.sql : سكربت التثبيت الرئيسي — يشغّل كل السكربتات بالترتيب
--  -----------------------------------------------------------------------------
--  الاستخدام (SQLcl / SQL*Plus):
--     sql user/pass@//host:1521/service
--     @00_install_all.sql
--  أو في APEX SQL Workshop: نفّذ الملفات يدوياً بالترتيب 01 -> 11.
-- =============================================================================
SET ECHO OFF
SET FEEDBACK ON
SET SERVEROUTPUT ON
WHENEVER SQLERROR CONTINUE

PROMPT ============================================================
PROMPT  تثبيت منصة التأهيل والتوظيف — مستودع المدينة المنورة الخيري
PROMPT ============================================================

-- ضبط المفتاح السري لـ JWT (للتجربة فقط — في الإنتاج استخدم DBMS_CREDENTIAL/Vault)
-- يُنشأ سياق التطبيق ثم تُضبط القيمة عبر إجراء؛ هنا نكتفي بالتنبيه.
PROMPT >> تذكير: اضبط RE_CTX.JWT_SECRET في الإنتاج (راجع docs/03_deployment_guide.md)

@@01_schema_core.sql
@@02_schema_entities.sql
@@03_schema_opportunities.sql
@@04_schema_applications.sql
@@05_constraints_fk.sql
@@06_seed_data.sql
@@07_views.sql
@@08_pkg_matching.sql
@@09_pkg_security.sql
@@10_pkg_business.sql
-- 11_ords_rest.sql يُنفّذ بعد التأكد من تفعيل ORDS على السكيمة
-- @@11_ords_rest.sql

PROMPT ============================================================
PROMPT  اكتمل التثبيت. تحقّق من الأخطاء أعلاه إن وُجدت.
PROMPT  لتشغيل اختبار سريع لمحرك المطابقة:
PROMPT    SELECT RE_MATCH_PKG.score_job(b.benef_id, j.job_id)
PROMPT      FROM RE_BENEFICIARIES b, RE_JOBS j
PROMPT     WHERE ROWNUM=1;
PROMPT ============================================================
