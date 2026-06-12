-- =============================================================================
--  27_utl_smtp.sql : إرسال مباشر عبر UTL_SMTP (يتجاوز طابور APEX والجلسات كلياً)
--  -----------------------------------------------------------------------------
--  يعمل من الـ Triggers/ORDS/jobs مباشرةً — لا يحتاج جلسة APEX ولا security group.
--  متطلّبات: (أ) ACL للسكيمة WKSP_MCW، (ب) تفعيل SMTP AUTH + App Password في M365.
-- =============================================================================

-- ── الخطوة 1: ACL للسكيمة WKSP_MCW (تُنفَّذ بحساب ADMIN) ──────────────────────
-- ملاحظة: ACL محرّك APEX (APEX_240200/SMTP) لا يكفي لـ UTL_SMTP من WKSP_MCW.
-- مهم: 'resolve' لا تقبل منفذاً → تُضاف في نداء منفصل بلا port (وإلا ORA-24244).
/*  شغّل هذا بحساب ADMIN (نداءان):
BEGIN  -- (أ) connect مع المنفذ
  DBMS_NETWORK_ACL_ADMIN.APPEND_HOST_ACE(
    host => 'smtp.office365.com', lower_port => 587, upper_port => 587,
    ace  => xs$ace_type(privilege_list => xs$name_list('connect'),
                        principal_name => 'WKSP_MCW', principal_type => xs_acl.ptype_db));
END;
/
BEGIN  -- (ب) resolve بلا منفذ
  DBMS_NETWORK_ACL_ADMIN.APPEND_HOST_ACE(
    host => 'smtp.office365.com',
    ace  => xs$ace_type(privilege_list => xs$name_list('resolve'),
                        principal_name => 'WKSP_MCW', principal_type => xs_acl.ptype_db));
END;
/
*/

-- ── الخطوة 2: إجراء الإرسال المباشر (يدعم المرفقات multipart/base64) ──────────
CREATE OR REPLACE PROCEDURE RE_SEND_SMTP(
  p_to       VARCHAR2,
  p_subject  VARCHAR2,
  p_html     CLOB,
  p_blob     BLOB DEFAULT NULL,
  p_filename VARCHAR2 DEFAULT NULL,
  p_mime     VARCHAR2 DEFAULT NULL
) IS
  c_host CONSTANT VARCHAR2(100) := 'smtp.office365.com';
  c_port CONSTANT PLS_INTEGER  := 587;
  c_user CONSTANT VARCHAR2(100) := 'tareq.alsabal@mcw.sa';
  c_pass CONSTANT VARCHAR2(100) := '<ضع_App_Password_هنا>';   -- ← App Password من M365
  c_from CONSTANT VARCHAR2(100) := 'tareq.alsabal@mcw.sa';
  c_bnd  CONSTANT VARCHAR2(40)  := '==BND_MCW_7351==';
  c   UTL_SMTP.CONNECTION;
  rs  UTL_SMTP.REPLIES;                          -- EHLO يُرجع REPLIES (لا REPLY)

  PROCEDURE wl(t VARCHAR2) IS BEGIN UTL_SMTP.WRITE_DATA(c, t || UTL_TCP.CRLF); END;

  PROCEDURE write_clob(p CLOB) IS
    l_len PLS_INTEGER := DBMS_LOB.GETLENGTH(p); l_off PLS_INTEGER := 1; ch VARCHAR2(8000);
  BEGIN
    WHILE l_off <= l_len LOOP
      ch := DBMS_LOB.SUBSTR(p, 4000, l_off);
      UTL_SMTP.WRITE_RAW_DATA(c, UTL_RAW.CAST_TO_RAW(ch));   -- جسم UTF-8
      l_off := l_off + 4000;
    END LOOP;
  END;

  PROCEDURE write_b64(b BLOB) IS
    l_len PLS_INTEGER := DBMS_LOB.GETLENGTH(b); l_off PLS_INTEGER := 1;
    l_amt PLS_INTEGER; l_raw RAW(32767);
  BEGIN
    WHILE l_off <= l_len LOOP
      l_amt := 2046;                                          -- مضاعف 3 (ينتج سطور base64 منتظمة)
      DBMS_LOB.READ(b, l_amt, l_off, l_raw);
      UTL_SMTP.WRITE_RAW_DATA(c, UTL_ENCODE.BASE64_ENCODE(l_raw));
      UTL_SMTP.WRITE_DATA(c, UTL_TCP.CRLF);
      l_off := l_off + 2046;
    END LOOP;
  END;
BEGIN
  c  := UTL_SMTP.OPEN_CONNECTION(c_host, c_port);
  rs := UTL_SMTP.EHLO(c, 'mcw.sa');
  UTL_SMTP.STARTTLS(c);
  rs := UTL_SMTP.EHLO(c, 'mcw.sa');
  UTL_SMTP.COMMAND(c, 'AUTH LOGIN');
  UTL_SMTP.COMMAND(c, UTL_RAW.CAST_TO_VARCHAR2(UTL_ENCODE.BASE64_ENCODE(UTL_RAW.CAST_TO_RAW(c_user))));
  UTL_SMTP.COMMAND(c, UTL_RAW.CAST_TO_VARCHAR2(UTL_ENCODE.BASE64_ENCODE(UTL_RAW.CAST_TO_RAW(c_pass))));
  UTL_SMTP.MAIL(c, c_from);
  UTL_SMTP.RCPT(c, p_to);
  UTL_SMTP.OPEN_DATA(c);
  wl('From: ' || c_from);
  wl('To: ' || p_to);
  wl('Subject: =?UTF-8?B?' || UTL_RAW.CAST_TO_VARCHAR2(UTL_ENCODE.BASE64_ENCODE(UTL_RAW.CAST_TO_RAW(p_subject))) || '?=');
  wl('MIME-Version: 1.0');

  IF p_blob IS NOT NULL AND DBMS_LOB.GETLENGTH(p_blob) > 0 THEN
    wl('Content-Type: multipart/mixed; boundary="' || c_bnd || '"');
    wl('');
    wl('--' || c_bnd);
    wl('Content-Type: text/html; charset=UTF-8');
    wl('Content-Transfer-Encoding: 8bit');
    wl(''); write_clob(p_html); wl('');
    wl('--' || c_bnd);
    wl('Content-Type: ' || NVL(p_mime,'application/octet-stream') || '; name="' || NVL(p_filename,'file') || '"');
    wl('Content-Transfer-Encoding: base64');
    wl('Content-Disposition: attachment; filename="' || NVL(p_filename,'file') || '"');
    wl(''); write_b64(p_blob); wl('');
    wl('--' || c_bnd || '--');
  ELSE
    wl('Content-Type: text/html; charset=UTF-8');
    wl('Content-Transfer-Encoding: 8bit');
    wl(''); write_clob(p_html);
  END IF;

  UTL_SMTP.CLOSE_DATA(c);
  UTL_SMTP.QUIT(c);
EXCEPTION WHEN OTHERS THEN
  BEGIN UTL_SMTP.QUIT(c); EXCEPTION WHEN OTHERS THEN NULL; END;
  RAISE;   -- أثناء الدراسة: أظهر الخطأ. للإنتاج داخل send_event: مُلتقَط هناك.
END;
/

-- ── الخطوة 3: ربط send_event بالإرسال المباشر (بدل طابور APEX) ────────────────
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
    l_to VARCHAR2(254);
  BEGIN
    BEGIN
      SELECT email INTO l_to FROM RE_EVENT_TYPES WHERE event_code = p_event_code AND active = 'Y';
    EXCEPTION WHEN NO_DATA_FOUND THEN RETURN; END;

    -- إرسال مباشر فوري — لا طابور، لا جلسة، لا مجموعة أمان
    RE_SEND_SMTP(l_to, p_subject, p_html, p_blob, p_filename, p_mime);
  EXCEPTION WHEN OTHERS THEN NULL;   -- لا يعطّل DML (احذفه مؤقتاً لرؤية الأخطاء)
  END;

END RE_MAIL_PKG;
/

PROMPT >> 27_utl_smtp.sql  جاهز. (تذكير: ضع App Password في RE_SEND_SMTP، وأضف ACL لـ WKSP_MCW)
