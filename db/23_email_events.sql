-- =============================================================================
--  23_email_events.sql : إشعارات بريد HTML أنيقة لكل حدث (عبر Triggers + APEX_MAIL)
--  -----------------------------------------------------------------------------
--  البريد الافتراضي لكل الأنواع = قناة Teams للإدارة. يُرسَل آلياً من القاعدة،
--  ولا يحتاج أي تدخّل من الواجهة. المرفقات تُرفق مباشرةً من BLOB المحفوظ.
--  متطلّب: تكوين بريد APEX على المثيل (SMTP). إن لم يُكوَّن، تُتجاهل الأخطاء بهدوء.
-- =============================================================================

-- 1) جدول أنواع الأحداث + بريد كل نوع (قابل للتعديل لاحقاً)
CREATE TABLE RE_EVENT_TYPES (
  event_code VARCHAR2(40)  PRIMARY KEY,
  name_ar    VARCHAR2(150) NOT NULL,
  email      VARCHAR2(254) DEFAULT '593021f2.mcw.sa@emea.teams.ms' NOT NULL,
  active     VARCHAR2(1)   DEFAULT 'Y' NOT NULL
);

INSERT INTO RE_EVENT_TYPES (event_code, name_ar) VALUES ('USER_REGISTER',    'تسجيل مستخدم جديد');
INSERT INTO RE_EVENT_TYPES (event_code, name_ar) VALUES ('DONATION_NEW',     'تبرّع جديد');
INSERT INTO RE_EVENT_TYPES (event_code, name_ar) VALUES ('MESSAGE_TO_ASSOC', 'رسالة إلى الجمعية');
INSERT INTO RE_EVENT_TYPES (event_code, name_ar) VALUES ('APP_NEW',          'تقديم جديد على فرصة');
INSERT INTO RE_EVENT_TYPES (event_code, name_ar) VALUES ('APP_HIRED',        'قبول/توظيف مستفيد');
INSERT INTO RE_EVENT_TYPES (event_code, name_ar) VALUES ('DOC_UPLOAD',       'مرفق/مستند جديد');
COMMIT;

-- 2) حزمة البريد: بنّاء HTML أنيق + مُرسِل الحدث
CREATE OR REPLACE PACKAGE RE_MAIL_PKG AS
  FUNCTION kv(p_k VARCHAR2, p_v VARCHAR2) RETURN VARCHAR2;
  FUNCTION html_doc(p_badge VARCHAR2, p_title VARCHAR2, p_rows CLOB) RETURN CLOB;
  PROCEDURE send_event(p_event_code VARCHAR2, p_subject VARCHAR2, p_html CLOB,
                       p_blob BLOB DEFAULT NULL, p_filename VARCHAR2 DEFAULT NULL, p_mime VARCHAR2 DEFAULT NULL);
END RE_MAIL_PKG;
/

CREATE OR REPLACE PACKAGE BODY RE_MAIL_PKG AS

  FUNCTION kv(p_k VARCHAR2, p_v VARCHAR2) RETURN VARCHAR2 IS
  BEGIN
    IF p_v IS NULL OR p_v = '' THEN RETURN ''; END IF;
    RETURN '<tr><td style="color:#7a8a82;padding:11px 4px;border-bottom:1px solid #eef2f0;width:38%;font-size:13px">'
        || p_k || '</td><td style="color:#14331f;font-weight:bold;padding:11px 4px;border-bottom:1px solid #eef2f0;font-size:14px">'
        || p_v || '</td></tr>';
  END;

  FUNCTION html_doc(p_badge VARCHAR2, p_title VARCHAR2, p_rows CLOB) RETURN CLOB IS
  BEGIN
    RETURN '<div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;background:#eef3f0;padding:24px;margin:0">'
      || '<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e9e5;box-shadow:0 6px 24px rgba(19,97,56,.08)">'
      || '<div style="background:linear-gradient(135deg,#136138 0%,#1f8a4c 55%,#5cb335 100%);padding:26px 24px;text-align:center;color:#fff">'
      || '<div style="font-size:21px;font-weight:bold;letter-spacing:.3px">منصة التأهيل والتوظيف</div>'
      || '<div style="font-size:13px;color:#f6eecf;margin-top:3px">جمعية مستودع المدينة المنورة الخيري</div>'
      || '</div>'
      || '<div style="padding:26px 24px">'
      || '<span style="display:inline-block;background:#e7f4ec;color:#136138;padding:5px 16px;border-radius:30px;font-size:13px;font-weight:bold">'|| p_badge ||'</span>'
      || '<h2 style="color:#136138;margin:14px 0 6px;font-size:19px">'|| p_title ||'</h2>'
      || '<table style="width:100%;border-collapse:collapse;margin-top:10px">'|| p_rows ||'</table>'
      || '</div>'
      || '<div style="background:#f6eecf;height:5px"></div>'
      || '<div style="background:#136138;color:#cfe6d8;padding:16px;text-align:center;font-size:12px">'
      || 'إشعار آليّ من منصة التأهيل والتوظيف — مستودع المدينة المنورة الخيري · info@mcw.sa</div>'
      || '</div></div>';
  END;

  PROCEDURE send_event(p_event_code VARCHAR2, p_subject VARCHAR2, p_html CLOB,
                       p_blob BLOB DEFAULT NULL, p_filename VARCHAR2 DEFAULT NULL, p_mime VARCHAR2 DEFAULT NULL) IS
    l_to   VARCHAR2(254);
    l_id   NUMBER;
    l_body CLOB;  -- CLOB لتفادي غموض overload في apex_mail.send
  BEGIN
    BEGIN
      SELECT email INTO l_to FROM RE_EVENT_TYPES WHERE event_code = p_event_code AND active = 'Y';
    EXCEPTION WHEN NO_DATA_FOUND THEN RETURN; END; -- نوع معطّل/غير معرّف → تجاهل

    -- تثبيت مساحة العمل مباشرةً (السياق غير متوفّر داخل Trigger/ORDS؛
    -- apex_workspace_schemas مُرشّح بالسياق فيُرجع صفر صفوف هناك). استبدل الرقم برقمك.
    apex_util.set_security_group_id(9421272729640104);

    l_body := TO_CLOB('إشعار من منصة التأهيل والتوظيف (افتح بصيغة HTML).');
    l_id := apex_mail.send(
              p_to        => l_to,
              p_from      => 'tareq.alsabal@mcw.sa',
              p_subj      => p_subject,
              p_body      => l_body,
              p_body_html => p_html);

    IF p_blob IS NOT NULL AND DBMS_LOB.getlength(p_blob) > 0 THEN
      apex_mail.add_attachment(p_mail_id => l_id, p_attachment => p_blob,
                               p_filename => NVL(p_filename,'document'),
                               p_mime_type => NVL(p_mime,'application/octet-stream'));
    END IF;
    -- لا نستدعي push_queue داخل Trigger (ممنوع COMMIT)؛ تُرسَل عبر مهمّة APEX الدورية.
  EXCEPTION WHEN OTHERS THEN NULL; -- لا نعطّل أي عملية حفظ بسبب البريد
  END;

END RE_MAIL_PKG;
/

-- 3) المُشغّلات (Triggers) لكل حدث
-- 3.1 تسجيل مستخدم جديد
CREATE OR REPLACE TRIGGER re_trg_mail_user
AFTER INSERT ON RE_USERS FOR EACH ROW
DECLARE l_type VARCHAR2(60); l_rows VARCHAR2(4000);
BEGIN
  l_type := CASE :NEW.user_type
              WHEN 'BENEFICIARY' THEN 'مستفيد' WHEN 'COMPANY' THEN 'شركة'
              WHEN 'INSTITUTE' THEN 'معهد' WHEN 'RECRUITER' THEN 'شركة توظيف'
              WHEN 'DONOR' THEN 'جهة مانحة' WHEN 'STAFF' THEN 'موظف جمعية'
              WHEN 'ADMIN' THEN 'مدير نظام' ELSE :NEW.user_type END;
  l_rows := RE_MAIL_PKG.kv('الاسم', :NEW.full_name) || RE_MAIL_PKG.kv('البريد', :NEW.email)
         || RE_MAIL_PKG.kv('الجوال', :NEW.phone) || RE_MAIL_PKG.kv('نوع الحساب', l_type)
         || RE_MAIL_PKG.kv('الحالة', :NEW.status) || RE_MAIL_PKG.kv('التاريخ', TO_CHAR(:NEW.created_at,'YYYY-MM-DD HH24:MI'));
  RE_MAIL_PKG.send_event('USER_REGISTER', 'تسجيل جديد: '||l_type||' — '||:NEW.full_name,
                         RE_MAIL_PKG.html_doc('تسجيل جديد', l_type||' · '||:NEW.full_name, l_rows));
END;
/

-- 3.2 تبرّع جديد
CREATE OR REPLACE TRIGGER re_trg_mail_donation
AFTER INSERT ON RE_DONATIONS FOR EACH ROW
DECLARE l_org VARCHAR2(250); l_type VARCHAR2(40); l_rows VARCHAR2(4000);
BEGIN
  BEGIN SELECT legal_name INTO l_org FROM RE_ORGANIZATIONS WHERE org_id = :NEW.donor_org_id;
  EXCEPTION WHEN OTHERS THEN l_org := NULL; END;
  l_type := CASE :NEW.donation_type WHEN 'JOB' THEN 'وظيفي' WHEN 'TRAINING' THEN 'تدريبي' ELSE 'توظيفي' END;
  l_rows := RE_MAIL_PKG.kv('الجهة المانحة', l_org) || RE_MAIL_PKG.kv('نوع التبرّع', l_type)
         || RE_MAIL_PKG.kv('العنوان', :NEW.title) || RE_MAIL_PKG.kv('الدور المستهدف', :NEW.target_role)
         || RE_MAIL_PKG.kv('عدد الوحدات', TO_CHAR(:NEW.units_pledged))
         || RE_MAIL_PKG.kv('القيمة التقديرية', CASE WHEN :NEW.monetary_value IS NULL THEN NULL ELSE TO_CHAR(:NEW.monetary_value)||' ر.س' END);
  RE_MAIL_PKG.send_event('DONATION_NEW', 'تبرّع جديد: '||:NEW.title,
                         RE_MAIL_PKG.html_doc('تبرّع جديد', :NEW.title, l_rows));
END;
/

-- 3.3 رسالة إلى الجمعية (حين يكون المستلم من فريق الجمعية)
CREATE OR REPLACE TRIGGER re_trg_mail_message
AFTER INSERT ON RE_MESSAGES FOR EACH ROW
DECLARE l_to_type VARCHAR2(20); l_from VARCHAR2(200); l_rows VARCHAR2(4000);
BEGIN
  SELECT user_type INTO l_to_type FROM RE_USERS WHERE user_id = :NEW.to_user;
  IF l_to_type IN ('ADMIN','STAFF') THEN
    SELECT full_name INTO l_from FROM RE_USERS WHERE user_id = :NEW.from_user;
    l_rows := RE_MAIL_PKG.kv('من', l_from) || RE_MAIL_PKG.kv('الرسالة', SUBSTR(:NEW.body,1,1000))
           || RE_MAIL_PKG.kv('الوقت', TO_CHAR(:NEW.created_at,'YYYY-MM-DD HH24:MI'));
    RE_MAIL_PKG.send_event('MESSAGE_TO_ASSOC', 'رسالة جديدة إلى الجمعية من '||l_from,
                           RE_MAIL_PKG.html_doc('رسالة واردة', 'من: '||l_from, l_rows));
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

-- 3.4 تقديم جديد على فرصة
CREATE OR REPLACE TRIGGER re_trg_mail_app_new
AFTER INSERT ON RE_APPLICATIONS FOR EACH ROW
DECLARE l_bname VARCHAR2(200); l_opp VARCHAR2(300); l_org VARCHAR2(250); l_rows VARCHAR2(4000); l_kind VARCHAR2(20);
BEGIN
  BEGIN SELECT u.full_name INTO l_bname FROM RE_BENEFICIARIES b JOIN RE_USERS u ON u.user_id=b.user_id WHERE b.benef_id=:NEW.benef_id;
  EXCEPTION WHEN OTHERS THEN l_bname := NULL; END;
  IF :NEW.target_type='JOB' THEN
    l_kind := 'وظيفة';
    BEGIN SELECT j.title, o.legal_name INTO l_opp, l_org FROM RE_JOBS j JOIN RE_ORGANIZATIONS o ON o.org_id=j.org_id WHERE j.job_id=:NEW.job_id; EXCEPTION WHEN OTHERS THEN NULL; END;
  ELSE
    l_kind := 'برنامج تدريبي';
    BEGIN SELECT p.title, o.legal_name INTO l_opp, l_org FROM RE_TRAINING_PROGRAMS p JOIN RE_ORGANIZATIONS o ON o.org_id=p.org_id WHERE p.program_id=:NEW.program_id; EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  l_rows := RE_MAIL_PKG.kv('المتقدّم', l_bname) || RE_MAIL_PKG.kv('النوع', l_kind)
         || RE_MAIL_PKG.kv('الفرصة', l_opp) || RE_MAIL_PKG.kv('الجهة', l_org)
         || RE_MAIL_PKG.kv('نسبة التوافق', CASE WHEN :NEW.match_score IS NULL THEN NULL ELSE TO_CHAR(:NEW.match_score)||'%' END);
  RE_MAIL_PKG.send_event('APP_NEW', 'تقديم جديد: '||l_bname||' على '||l_opp,
                         RE_MAIL_PKG.html_doc('تقديم جديد', l_bname||' → '||l_opp, l_rows));
END;
/

-- 3.5 قبول/توظيف مستفيد
CREATE OR REPLACE TRIGGER re_trg_mail_app_hired
AFTER UPDATE OF status ON RE_APPLICATIONS FOR EACH ROW
WHEN (NEW.status IN ('HIRED','ENROLLED') AND OLD.status <> NEW.status)
DECLARE l_bname VARCHAR2(200); l_opp VARCHAR2(300); l_rows VARCHAR2(4000);
BEGIN
  BEGIN SELECT u.full_name INTO l_bname FROM RE_BENEFICIARIES b JOIN RE_USERS u ON u.user_id=b.user_id WHERE b.benef_id=:NEW.benef_id; EXCEPTION WHEN OTHERS THEN NULL; END;
  IF :NEW.target_type='JOB' THEN BEGIN SELECT title INTO l_opp FROM RE_JOBS WHERE job_id=:NEW.job_id; EXCEPTION WHEN OTHERS THEN NULL; END;
  ELSE BEGIN SELECT title INTO l_opp FROM RE_TRAINING_PROGRAMS WHERE program_id=:NEW.program_id; EXCEPTION WHEN OTHERS THEN NULL; END; END IF;
  l_rows := RE_MAIL_PKG.kv('المستفيد', l_bname) || RE_MAIL_PKG.kv('الفرصة', l_opp)
         || RE_MAIL_PKG.kv('الحالة', CASE :NEW.status WHEN 'HIRED' THEN 'تم التوظيف' ELSE 'تم التسجيل' END);
  RE_MAIL_PKG.send_event('APP_HIRED', 'بشرى: '||l_bname||' — '||l_opp,
                         RE_MAIL_PKG.html_doc('قبول/توظيف', l_bname, l_rows));
END;
/

-- 3.6 مرفق/مستند جديد (مع إرفاق الملف نفسه)
CREATE OR REPLACE TRIGGER re_trg_mail_doc
AFTER INSERT ON RE_DOCUMENTS FOR EACH ROW
DECLARE l_owner VARCHAR2(30); l_rows VARCHAR2(4000);
BEGIN
  l_owner := CASE :NEW.owner_type WHEN 'BENEFICIARY' THEN 'مستفيد' WHEN 'ORG' THEN 'منظمة' ELSE :NEW.owner_type END;
  l_rows := RE_MAIL_PKG.kv('الجهة', l_owner) || RE_MAIL_PKG.kv('نوع المستند', :NEW.doc_type)
         || RE_MAIL_PKG.kv('العنوان', :NEW.title)
         || RE_MAIL_PKG.kv('طريقة الحفظ', CASE :NEW.storage_kind WHEN 'BLOB' THEN 'ملف مرفوع' ELSE 'رابط' END)
         || RE_MAIL_PKG.kv('الرابط', :NEW.file_url);
  -- يُرفق الملف من BLOB المحفوظ مباشرةً (إن وُجد)
  RE_MAIL_PKG.send_event('DOC_UPLOAD', 'مرفق جديد: '||NVL(:NEW.title, :NEW.doc_type),
                         RE_MAIL_PKG.html_doc('مرفق جديد', NVL(:NEW.title, :NEW.doc_type), l_rows),
                         :NEW.content, :NEW.file_name, :NEW.mime_type);
END;
/

PROMPT >> 23_email_events.sql  تم: جدول الأنواع + حزمة البريد HTML + 6 مُشغّلات للأحداث.
