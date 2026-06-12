# إرسال البريد عبر Oracle — مرجع شامل للدراسة والتحليل

هذا المستند يجمع **كل** ما يخصّ إرسال بريد الأحداث من قاعدة Oracle (Autonomous + APEX 24.2،
سكيمة `WKSP_MCW`، محرّك `APEX_240200`): الجداول، الحزمة، المُشغّلات، الإعدادات، استعلامات
الفحص، **وتحليل سبب عدم الإرسال**، ثم البديل المباشر `UTL_SMTP`.

> الملفات المرتبطة: [23_email_events.sql](23_email_events.sql) · [24_mail_push_job.sql](24_mail_push_job.sql) · [25_disable_db_email.sql](25_disable_db_email.sql)

---

## 0) خريطة الآلية (APEX_MAIL)

```
حدث DML (INSERT/UPDATE)
   └─▶ TRIGGER (AFTER)
          └─▶ RE_MAIL_PKG.send_event(...)
                 ├─ set_security_group_id(<workspace id>)   ← ضبط سياق مساحة العمل
                 ├─ apex_mail.send(...)        ← يُدرِج الرسالة في APEX_MAIL_QUEUE (لا يرسل)
                 └─ apex_mail.add_attachment() ← مرفق BLOB اختياري
   ... (الرسالة الآن منتظرة في الطابور) ...
   └─▶ push_queue  ← يتّصل بـ SMTP فعلياً ويُرسل (يحتاج جلسة APEX صالحة!)
```

**القاعدة الذهبية:** `apex_mail.send` = إدراج في الطابور (لا اتصال SMTP). الإرسال الحقيقي
يحدث في `apex_mail.push_queue` فقط، وهو الذي يتطلّب **جلسة APEX صالحة + إعداد SMTP**.

---

## 1) الجدول: أنواع الأحداث + بريد كل نوع

```sql
CREATE TABLE RE_EVENT_TYPES (
  event_code VARCHAR2(40)  PRIMARY KEY,
  name_ar    VARCHAR2(150) NOT NULL,
  email      VARCHAR2(254) DEFAULT '593021f2.mcw.sa@emea.teams.ms' NOT NULL, -- قناة Teams
  active     VARCHAR2(1)   DEFAULT 'Y' NOT NULL
);

INSERT INTO RE_EVENT_TYPES (event_code, name_ar) VALUES ('USER_REGISTER',    'تسجيل مستخدم جديد');
INSERT INTO RE_EVENT_TYPES (event_code, name_ar) VALUES ('DONATION_NEW',     'تبرّع جديد');
INSERT INTO RE_EVENT_TYPES (event_code, name_ar) VALUES ('MESSAGE_TO_ASSOC', 'رسالة إلى الجمعية');
INSERT INTO RE_EVENT_TYPES (event_code, name_ar) VALUES ('APP_NEW',          'تقديم جديد على فرصة');
INSERT INTO RE_EVENT_TYPES (event_code, name_ar) VALUES ('APP_HIRED',        'قبول/توظيف مستفيد');
INSERT INTO RE_EVENT_TYPES (event_code, name_ar) VALUES ('DOC_UPLOAD',       'مرفق/مستند جديد');
COMMIT;
```

---

## 2) الحزمة: بنّاء HTML + مُرسِل الحدث

```sql
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
    RETURN '<tr><td style="color:#7a8a82;padding:11px 4px;border-bottom:1px solid #eef2f0;width:38%">'
        || p_k || '</td><td style="color:#14331f;font-weight:bold;padding:11px 4px;border-bottom:1px solid #eef2f0">'
        || p_v || '</td></tr>';
  END;

  FUNCTION html_doc(p_badge VARCHAR2, p_title VARCHAR2, p_rows CLOB) RETURN CLOB IS
  BEGIN
    RETURN '<div style="font-family:Tahoma,Arial;direction:rtl;background:#eef3f0;padding:24px">'
      || '<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e2e9e5">'
      || '<div style="background:linear-gradient(135deg,#136138,#1f8a4c,#5cb335);padding:26px;text-align:center;color:#fff">'
      || '<div style="font-size:21px;font-weight:bold">منصة التأهيل والتوظيف</div>'
      || '<div style="font-size:13px;color:#f6eecf">جمعية مستودع المدينة المنورة الخيري</div></div>'
      || '<div style="padding:26px">'
      || '<span style="background:#e7f4ec;color:#136138;padding:5px 16px;border-radius:30px;font-size:13px;font-weight:bold">'|| p_badge ||'</span>'
      || '<h2 style="color:#136138;margin:14px 0 6px">'|| p_title ||'</h2>'
      || '<table style="width:100%;border-collapse:collapse">'|| p_rows ||'</table></div>'
      || '<div style="background:#136138;color:#cfe6d8;padding:16px;text-align:center;font-size:12px">إشعار آليّ · info@mcw.sa</div>'
      || '</div></div>';
  END;

  PROCEDURE send_event(p_event_code VARCHAR2, p_subject VARCHAR2, p_html CLOB,
                       p_blob BLOB DEFAULT NULL, p_filename VARCHAR2 DEFAULT NULL, p_mime VARCHAR2 DEFAULT NULL) IS
    l_to   VARCHAR2(254);
    l_id   NUMBER;
    l_body CLOB;
  BEGIN
    BEGIN
      SELECT email INTO l_to FROM RE_EVENT_TYPES WHERE event_code = p_event_code AND active = 'Y';
    EXCEPTION WHEN NO_DATA_FOUND THEN RETURN; END;

    -- ضبط مساحة العمل (يصلح داخل ORDS/Database Actions، ويفشل في jobs المجرّدة)
    apex_util.set_security_group_id(9421272729640104);   -- ← رقم security group لمساحة WKSP_MCW

    l_body := TO_CLOB('إشعار من المنصة (افتح بصيغة HTML).');
    -- ملاحظة: p_body كـ CLOB لتفادي PLS-00307 (تعدّد overload في apex_mail.send)
    l_id := apex_mail.send(p_to => l_to, p_from => 'tareq.alsabal@mcw.sa',
                           p_subj => p_subject, p_body => l_body, p_body_html => p_html);

    IF p_blob IS NOT NULL AND DBMS_LOB.getlength(p_blob) > 0 THEN
      apex_mail.add_attachment(p_mail_id => l_id, p_attachment => p_blob,
        p_filename => NVL(p_filename,'document'), p_mime_type => NVL(p_mime,'application/octet-stream'));
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL;   -- ← لا يعطّل DML (لكنه يُخفي أخطاء البريد!)
  END;
END RE_MAIL_PKG;
/
```

> **نقطتان مهمّتان للتحليل:**
> 1. `EXCEPTION WHEN OTHERS THEN NULL` يبتلع كل أخطاء البريد بصمت — مفيد لعدم تعطيل الحفظ،
>    لكنه يُخفي سبب الفشل. عند الدراسة، **احذفه مؤقتاً** أو اطبع `SQLERRM` لرؤية الخطأ.
> 2. الرقم `9421272729640104` هو security group id لمساحة العمل (يظهر من الاستعلام في §5).

---

## 3) المُشغّلات الستة (نموذج + الباقي في 23_email_events.sql)

```sql
-- تسجيل مستخدم جديد
CREATE OR REPLACE TRIGGER re_trg_mail_user
AFTER INSERT ON RE_USERS FOR EACH ROW
DECLARE l_rows VARCHAR2(4000);
BEGIN
  l_rows := RE_MAIL_PKG.kv('الاسم', :NEW.full_name) || RE_MAIL_PKG.kv('البريد', :NEW.email)
         || RE_MAIL_PKG.kv('النوع', :NEW.user_type);
  RE_MAIL_PKG.send_event('USER_REGISTER', 'تسجيل جديد: '||:NEW.full_name,
                         RE_MAIL_PKG.html_doc('تسجيل جديد', :NEW.full_name, l_rows));
END;
/

-- مرفق جديد (مع إرفاق BLOB مباشرةً من :NEW.content — متاح داخل الـ trigger)
CREATE OR REPLACE TRIGGER re_trg_mail_doc
AFTER INSERT ON RE_DOCUMENTS FOR EACH ROW
BEGIN
  RE_MAIL_PKG.send_event('DOC_UPLOAD', 'مرفق: '||NVL(:NEW.title,:NEW.doc_type),
    RE_MAIL_PKG.html_doc('مرفق جديد', NVL(:NEW.title,:NEW.doc_type),
       RE_MAIL_PKG.kv('النوع', :NEW.doc_type)),
    :NEW.content, :NEW.file_name, :NEW.mime_type);   -- ← المرفق
END;
/
-- البقية: re_trg_mail_donation / _message / _app_new / _app_hired (انظر 23_email_events.sql)
```

> **لماذا الـ trigger (لا الصفحة)؟** لضمان الإشعار مهما كان مصدر التغيير (ORDS/APEX/يدوي).
> ولماذا تمرير `:NEW.content` مباشرةً للمرفق؟ لأن الصف لم يُثبّت بعد (داخل AFTER INSERT)،
> فلا يمكن لجلسة أخرى قراءته — لكن `:NEW` متاح داخل الـ trigger نفسه.

---

## 4) إعداد SMTP على المثيل (بحساب ADMIN، مرّة واحدة)

```sql
-- 4.1 السماح للمضيف في ACL الشبكة (principal = سكيمة محرّك APEX)
BEGIN
  DBMS_NETWORK_ACL_ADMIN.APPEND_HOST_ACE(
    host => 'smtp.office365.com', lower_port => 587, upper_port => 587,
    ace  => xs$ace_type(privilege_list => xs$name_list('SMTP'),
                        principal_name => 'APEX_240200', principal_type => xs_acl.ptype_db));
END;
/

-- 4.2 معاملات SMTP للمثيل
BEGIN
  APEX_INSTANCE_ADMIN.SET_PARAMETER('SMTP_HOST_ADDRESS','smtp.office365.com');
  APEX_INSTANCE_ADMIN.SET_PARAMETER('SMTP_HOST_PORT','587');
  APEX_INSTANCE_ADMIN.SET_PARAMETER('SMTP_TLS_MODE','STARTTLS');
  APEX_INSTANCE_ADMIN.SET_PARAMETER('SMTP_USERNAME','tareq.alsabal@mcw.sa');
  APEX_INSTANCE_ADMIN.SET_PARAMETER('SMTP_PASSWORD','<App Password>');
  APEX_INSTANCE_ADMIN.SET_PARAMETER('SMTP_FROM','tareq.alsabal@mcw.sa');
  APEX_INSTANCE_ADMIN.SET_PARAMETER('SMTP_MAX_EMAILS','5000');   -- رفع الحد اليومي
  COMMIT;
END;
/
```

---

## 5) استعلامات الفحص (التشخيص)

```sql
-- 5.1 رقم security group لمساحة العمل (شغّله داخل Database Actions حيث السياق موجود)
SELECT workspace_id FROM apex_workspace_schemas
 WHERE schema = SYS_CONTEXT('USERENV','CURRENT_SCHEMA');

-- 5.2 ما المنتظر في الطابور؟ (إدراج ناجح؟)
SELECT mail_id, mail_to, mail_from, mail_subj, mail_send_count,
       SUBSTR(mail_send_error,1,300) err, last_updated_by
  FROM apex_mail_queue ORDER BY mail_id DESC;

-- 5.3 سجلّ ما أُرسِل/فشل
SELECT * FROM apex_mail_log ORDER BY 1 DESC FETCH FIRST 10 ROWS ONLY;

-- 5.4 اختبار إرسال يدوي (داخل Database Actions — له سياق APEX)
DECLARE l_id NUMBER; BEGIN
  apex_util.set_security_group_id((SELECT workspace_id FROM apex_workspace_schemas
     WHERE schema = SYS_CONTEXT('USERENV','CURRENT_SCHEMA') AND ROWNUM=1));
  l_id := apex_mail.send(p_to=>'...@emea.teams.ms', p_from=>'tareq.alsabal@mcw.sa',
            p_subj=>'test', p_body=>TO_CLOB('t'), p_body_html=>TO_CLOB('<b>test</b>'));
  apex_mail.push_queue; COMMIT;
END;
/

-- 5.5 معاملات SMTP (بحساب ADMIN فقط)
SELECT name, value FROM apex_instance_parameters WHERE name LIKE 'SMTP%';

-- 5.6 تشغيلات مهمّة الدفع وأخطاؤها الكاملة
SELECT status, error#, SUBSTR(additional_info,1,400) the_error,
       TO_CHAR(actual_start_date,'HH24:MI:SS') t
  FROM user_scheduler_job_run_details WHERE job_name='RE_MAIL_PUSH_JOB'
 ORDER BY actual_start_date DESC FETCH FIRST 5 ROWS ONLY;
```

---

## 6) تحليل سبب عدم الإرسال (سلسلة الأخطاء التي واجهناها)

| الخطوة | السلوك | السبب الجذري |
|---|---|---|
| **الإعداد الأوّلي** | `ORA-20001: SMTP_HOST_ADDRESS must be set` | المثيل الجديد بلا SMTP (الجسر القديم على مثيل آخر). **حُلّ** بـ §4. |
| **الإدراج (triggers)** | الطابور يمتلئ، `mail_send_count=0` | `apex_mail.send` ينجح (مجرّد INSERT). الإدراج سليم. ✅ |
| **push من Database Actions** | يعمل بلا خطأ، لكن لا يرسل | **"Access to session state is disabled"** — أداة Database Actions تعمل بوضع مقيّد يمنع حالة جلسة APEX، فـ `push_queue` يصبح بلا أثر (no-op). |
| **push من DBMS_SCHEDULER (set_security_group_id)** | `ORA-20987: Security Group ID is invalid` | في الجلسة المجرّدة لا توجد **هويّة مساحة عمل** فيرفض `set_security_group_id`. |
| **push من job (create_session)** | المهمّة SUCCEEDED، لكن `in_queue` يبقى 7 و`mail_send_count=0` | الجلسة المُنشأة لتطبيق 101 لها **مجموعة أمان مختلفة** عن مجموعة الرسائل، فـ `push_queue` لا يلتقطها (يعالج مجموعته فقط). |

**الخلاصة الجذرية:** على هذا المثيل، `apex_mail.push_queue` لا يجد **سياق جلسة APEX صحيح
بمطابقة مجموعة الرسائل** من أي بيئة متاحة لك (Database Actions مقيّدة، وjobs بلا سياق). لذلك
الرسائل تبقى في الطابور دون إرسال — **رغم أن الإدراج والقناة وSMTP كلها سليمة** (أثبته الإرسال
المباشر من بريدك للقناة، ووصوله فوراً).

**نقاط للدراسة العميقة:**
- جرّب `apex_session.create_session` بتطبيق في **نفس** workspace ثم `set_security_group_id`
  بعدها (بعد الجلسة قد يُقبل)، وتحقّق أن مجموعة الجلسة = مجموعة الرسائل عبر §5.2/§5.1.
- تحقّق من تفعيل عملية إرسال البريد التلقائية في APEX (Manage Instance → ربما معطّلة).
- ابحث في `apex_mail_log` (§5.3) عن أي محاولة إرسال فعلية وخطئها.

---

## 7) البديل المباشر: UTL_SMTP (يتجاوز طابور APEX كلياً)

يرسل فوراً داخل الـ trigger دون طابور/مجموعات أمان/جلسات. **يتطلّب فقط:** ACL (§4.1) +
تفعيل **SMTP AUTH** في M365 + **App Password**. (خطأ `PLS-00382` السابق سببه أن `EHLO`
تُرجع `REPLIES` لا `REPLY` — مُصحَّح أدناه.)

```sql
CREATE OR REPLACE PROCEDURE RE_SEND_SMTP(
  p_to VARCHAR2, p_subject VARCHAR2, p_html CLOB,
  p_user VARCHAR2, p_pass VARCHAR2, p_from VARCHAR2 DEFAULT NULL
) IS
  c   UTL_SMTP.CONNECTION;
  rs  UTL_SMTP.REPLIES;          -- ← EHLO يُرجع REPLIES
  v_from VARCHAR2(254) := NVL(p_from, p_user);
  PROCEDURE wl(t VARCHAR2) IS BEGIN UTL_SMTP.WRITE_DATA(c, t || UTL_TCP.CRLF); END;
BEGIN
  c  := UTL_SMTP.OPEN_CONNECTION('smtp.office365.com', 587);
  rs := UTL_SMTP.EHLO(c, 'mcw.sa');
  UTL_SMTP.STARTTLS(c);
  rs := UTL_SMTP.EHLO(c, 'mcw.sa');
  -- AUTH LOGIN (base64)
  UTL_SMTP.COMMAND(c, 'AUTH LOGIN');
  UTL_SMTP.COMMAND(c, UTL_RAW.CAST_TO_VARCHAR2(UTL_ENCODE.BASE64_ENCODE(UTL_RAW.CAST_TO_RAW(p_user))));
  UTL_SMTP.COMMAND(c, UTL_RAW.CAST_TO_VARCHAR2(UTL_ENCODE.BASE64_ENCODE(UTL_RAW.CAST_TO_RAW(p_pass))));
  UTL_SMTP.MAIL(c, v_from);
  UTL_SMTP.RCPT(c, p_to);
  UTL_SMTP.OPEN_DATA(c);
  wl('From: ' || v_from);
  wl('To: ' || p_to);
  wl('Subject: =?UTF-8?B?' || UTL_RAW.CAST_TO_VARCHAR2(UTL_ENCODE.BASE64_ENCODE(UTL_RAW.CAST_TO_RAW(p_subject))) || '?=');
  wl('MIME-Version: 1.0');
  wl('Content-Type: text/html; charset=UTF-8');
  wl('Content-Transfer-Encoding: 8bit');
  wl('');                                   -- سطر فارغ يفصل الترويسة عن الجسم
  -- كتابة جسم HTML بترميز UTF-8 (القاعدة AL32UTF8)
  DECLARE
    l_len PLS_INTEGER := DBMS_LOB.GETLENGTH(p_html); l_off PLS_INTEGER := 1; l_chunk VARCHAR2(8000);
  BEGIN
    WHILE l_off <= l_len LOOP
      l_chunk := DBMS_LOB.SUBSTR(p_html, 4000, l_off);
      UTL_SMTP.WRITE_RAW_DATA(c, UTL_RAW.CAST_TO_RAW(l_chunk));
      l_off := l_off + 4000;
    END LOOP;
  END;
  UTL_SMTP.CLOSE_DATA(c);
  UTL_SMTP.QUIT(c);
EXCEPTION WHEN OTHERS THEN
  BEGIN UTL_SMTP.QUIT(c); EXCEPTION WHEN OTHERS THEN NULL; END;
  RAISE;   -- أثناء الدراسة: ارفع الخطأ لرؤيته. في الإنتاج: استبدله بـ NULL
END;
/

-- استخدامه داخل trigger:
-- RE_SEND_SMTP('593021f2.mcw.sa@emea.teams.ms', 'عنوان', l_html, 'tareq.alsabal@mcw.sa', '<AppPassword>');
```

> **لإرفاق ملف عبر UTL_SMTP:** يلزم بناء رسالة `multipart/mixed`: حدّ فاصل (boundary)،
> جزء نصّي HTML، ثم جزء المرفق بترميز `base64` (عبر `UTL_ENCODE.BASE64_ENCODE` على أجزاء
> الـ BLOB بطول مضاعف 3). أُضيفه عند الطلب.

---

## 8) إيقاف بريد القاعدة (إن اعتمدت إرسال Next.js)

```sql
-- تعطيل المُشغّلات الستة + إسقاط مهمّة الدفع (انظر 25_disable_db_email.sql)
BEGIN
  FOR t IN (SELECT trigger_name FROM user_triggers WHERE trigger_name LIKE 'RE_TRG_MAIL%') LOOP
    EXECUTE IMMEDIATE 'ALTER TRIGGER "'||t.trigger_name||'" DISABLE';
  END LOOP;
  BEGIN DBMS_SCHEDULER.DROP_JOB('RE_MAIL_PUSH_JOB', force=>TRUE); EXCEPTION WHEN OTHERS THEN NULL; END;
END;
/
```

> **مُشغّلات إشعارات الجرس** `RE_TRG_APP_NOTIFY` (داخل التطبيق، RE_NOTIFICATIONS) منفصلة
> وتبقى تعمل — لا علاقة لها بالبريد.

---

## 9) الخلاصة العملية للقرار

- **الإدراج سليم، القناة سليمة، SMTP مضبوط** — الجدار الوحيد: `push_queue` يحتاج سياق جلسة
  APEX صحيح غير متاح من بيئاتك. للدراسة: ركّز على §6 و§5.
- **أسرع طريق مضمون داخل Oracle:** `UTL_SMTP` المباشر (§7) — يتجاوز الطابور تماماً، ويحتاج
  فقط تفعيل SMTP AUTH + App Password في M365.
- **البديل المُعتمَد حالياً في المنصة:** الإرسال من Next.js عبر Nodemailer (نفس متطلّب M365).
