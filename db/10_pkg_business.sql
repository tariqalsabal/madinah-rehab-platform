-- =============================================================================
--  10_pkg_business.sql : منطق الأعمال (التسجيل، الطلبات، الخطابات، الإشعارات،
--                        استهلاك التبرعات)
-- =============================================================================

CREATE OR REPLACE PACKAGE RE_APP_PKG AS
  -- التسجيل والدخول
  FUNCTION register_user(p_email IN VARCHAR2, p_full_name IN VARCHAR2, p_password IN VARCHAR2,
                         p_user_type IN VARCHAR2 DEFAULT 'BENEFICIARY', p_phone IN VARCHAR2 DEFAULT NULL)
           RETURN NUMBER;  -- يُرجع user_id
  FUNCTION authenticate(p_email IN VARCHAR2, p_password IN VARCHAR2) RETURN NUMBER; -- user_id أو NULL

  -- دورة حياة الطلب
  FUNCTION apply_job(p_benef_id IN NUMBER, p_job_id IN NUMBER, p_cover IN CLOB DEFAULT NULL) RETURN NUMBER;
  FUNCTION apply_program(p_benef_id IN NUMBER, p_program_id IN NUMBER) RETURN NUMBER;
  PROCEDURE change_application_status(p_application_id IN NUMBER, p_new_status IN VARCHAR2,
                                      p_actor IN NUMBER, p_note IN VARCHAR2 DEFAULT NULL);

  -- الخطابات
  FUNCTION issue_letter(p_letter_type IN VARCHAR2, p_benef_id IN NUMBER, p_issued_by IN NUMBER,
                        p_subject IN VARCHAR2, p_body IN CLOB, p_related_org IN NUMBER DEFAULT NULL,
                        p_related_job IN NUMBER DEFAULT NULL) RETURN NUMBER; -- letter_id
  FUNCTION verify_letter(p_verify_code IN VARCHAR2) RETURN VARCHAR2; -- JSON بنتيجة التحقق

  -- الإشعارات
  PROCEDURE notify(p_user_id IN NUMBER, p_title IN VARCHAR2, p_body IN VARCHAR2 DEFAULT NULL,
                   p_channel IN VARCHAR2 DEFAULT 'INAPP', p_category IN VARCHAR2 DEFAULT 'SYSTEM',
                   p_link IN VARCHAR2 DEFAULT NULL);
END RE_APP_PKG;
/

CREATE OR REPLACE PACKAGE BODY RE_APP_PKG AS

  FUNCTION register_user(p_email IN VARCHAR2, p_full_name IN VARCHAR2, p_password IN VARCHAR2,
                         p_user_type IN VARCHAR2 DEFAULT 'BENEFICIARY', p_phone IN VARCHAR2 DEFAULT NULL)
           RETURN NUMBER IS
    v_salt VARCHAR2(64);
    v_uid  NUMBER;
    v_role VARCHAR2(40);
  BEGIN
    v_salt := RE_SEC_PKG.gen_salt;
    INSERT INTO RE_USERS (username, email, full_name, phone, password_hash, password_salt, user_type, status)
    VALUES (LOWER(p_email), LOWER(p_email), p_full_name, p_phone,
            RE_SEC_PKG.hash_password(p_password, v_salt), v_salt, p_user_type, 'PENDING')
    RETURNING user_id INTO v_uid;

    -- منح الدور الافتراضي حسب النوع
    v_role := CASE p_user_type
                WHEN 'BENEFICIARY' THEN 'BENEFICIARY'
                WHEN 'COMPANY'     THEN 'COMPANY_ADMIN'
                WHEN 'INSTITUTE'   THEN 'INSTITUTE'
                WHEN 'RECRUITER'   THEN 'RECRUITER'
                WHEN 'DONOR'       THEN 'DONOR'
                WHEN 'STAFF'       THEN 'STAFF'
                ELSE 'BENEFICIARY' END;
    INSERT INTO SEC_USER_ROLES (user_id, role_id)
    SELECT v_uid, role_id FROM SEC_ROLES WHERE role_code = v_role;

    -- إنشاء ملف مستفيد فارغ تلقائياً
    IF p_user_type = 'BENEFICIARY' THEN
      INSERT INTO RE_BENEFICIARIES (user_id) VALUES (v_uid);
    END IF;

    RE_SEC_PKG.audit(v_uid, 'REGISTER', 'RE_USERS', v_uid);
    RETURN v_uid;
  END;

  FUNCTION authenticate(p_email IN VARCHAR2, p_password IN VARCHAR2) RETURN NUMBER IS
    v RE_USERS%ROWTYPE;
  BEGIN
    SELECT * INTO v FROM RE_USERS WHERE email = LOWER(p_email);
    IF v.status = 'SUSPENDED' OR v.status = 'CLOSED' THEN RETURN NULL; END IF;
    IF RE_SEC_PKG.verify_password(p_password, v.password_salt, v.password_hash) THEN
      UPDATE RE_USERS SET last_login_at = SYSTIMESTAMP, failed_logins = 0 WHERE user_id = v.user_id;
      RE_SEC_PKG.audit(v.user_id, 'LOGIN', 'RE_USERS', v.user_id);
      RETURN v.user_id;
    ELSE
      UPDATE RE_USERS SET failed_logins = failed_logins + 1 WHERE user_id = v.user_id;
      RETURN NULL;
    END IF;
  EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL;
  END;

  FUNCTION apply_job(p_benef_id IN NUMBER, p_job_id IN NUMBER, p_cover IN CLOB DEFAULT NULL) RETURN NUMBER IS
    v_id    NUMBER;
    v_score NUMBER;
    v_user  NUMBER;
  BEGIN
    v_score := RE_MATCH_PKG.score_job(p_benef_id, p_job_id);
    INSERT INTO RE_APPLICATIONS (benef_id, target_type, job_id, match_score, cover_note, status, source)
    VALUES (p_benef_id, 'JOB', p_job_id, v_score, p_cover, 'SUBMITTED', 'SELF')
    RETURNING application_id INTO v_id;
    INSERT INTO RE_APPLICATION_EVENTS (application_id, to_status, note) VALUES (v_id, 'SUBMITTED', 'تقديم جديد');
    -- إشعار صاحب الوظيفة
    SELECT u.user_id INTO v_user FROM RE_JOBS j JOIN RE_USERS u ON u.org_id = j.org_id
      WHERE j.job_id = p_job_id AND ROWNUM = 1;
    notify(v_user, 'متقدّم جديد على وظيفة', 'تم استلام طلب توظيف جديد', 'INAPP', 'APPLICATION', '/applications/'||v_id);
    RETURN v_id;
  END;

  FUNCTION apply_program(p_benef_id IN NUMBER, p_program_id IN NUMBER) RETURN NUMBER IS
    v_id NUMBER; v_score NUMBER;
  BEGIN
    v_score := RE_MATCH_PKG.score_program(p_benef_id, p_program_id);
    INSERT INTO RE_APPLICATIONS (benef_id, target_type, program_id, match_score, status, source)
    VALUES (p_benef_id, 'TRAINING', p_program_id, v_score, 'SUBMITTED', 'SELF')
    RETURNING application_id INTO v_id;
    INSERT INTO RE_APPLICATION_EVENTS (application_id, to_status, note) VALUES (v_id, 'SUBMITTED', 'تقديم على برنامج');
    RETURN v_id;
  END;

  -- استهلاك وحدة من التبرع المرتبط عند التوظيف/التسجيل
  PROCEDURE consume_donation_for_app(p_application_id IN NUMBER) IS
    v_don NUMBER;
  BEGIN
    SELECT COALESCE(j.donation_id, p.donation_id) INTO v_don
      FROM RE_APPLICATIONS a
      LEFT JOIN RE_JOBS j              ON j.job_id     = a.job_id
      LEFT JOIN RE_TRAINING_PROGRAMS p ON p.program_id = a.program_id
     WHERE a.application_id = p_application_id;
    IF v_don IS NOT NULL THEN
      UPDATE RE_DONATIONS
         SET units_consumed = units_consumed + 1,
             status = CASE WHEN units_consumed + 1 >= units_pledged THEN 'EXHAUSTED' ELSE status END
       WHERE donation_id = v_don AND units_consumed < units_pledged;
    END IF;
  END;

  PROCEDURE change_application_status(p_application_id IN NUMBER, p_new_status IN VARCHAR2,
                                      p_actor IN NUMBER, p_note IN VARCHAR2 DEFAULT NULL) IS
    v_old   VARCHAR2(20);
    v_benef NUMBER;
    v_uid   NUMBER;
  BEGIN
    SELECT status, benef_id INTO v_old, v_benef FROM RE_APPLICATIONS WHERE application_id = p_application_id FOR UPDATE;
    UPDATE RE_APPLICATIONS SET status = p_new_status, status_reason = p_note, updated_at = SYSTIMESTAMP
     WHERE application_id = p_application_id;
    INSERT INTO RE_APPLICATION_EVENTS (application_id, from_status, to_status, note, actor_user_id)
    VALUES (p_application_id, v_old, p_new_status, p_note, p_actor);

    -- آثار جانبية: عند التوظيف/التسجيل استهلك تبرعاً وحدّث المقاعد
    IF p_new_status = 'HIRED' THEN
      consume_donation_for_app(p_application_id);
    ELSIF p_new_status = 'ENROLLED' THEN
      consume_donation_for_app(p_application_id);
      UPDATE RE_TRAINING_PROGRAMS SET seats_taken = seats_taken + 1
       WHERE program_id = (SELECT program_id FROM RE_APPLICATIONS WHERE application_id = p_application_id)
         AND seats_taken < seats_total;
    END IF;

    -- إشعار المستفيد
    SELECT user_id INTO v_uid FROM RE_BENEFICIARIES WHERE benef_id = v_benef;
    notify(v_uid, 'تحديث حالة طلبك', 'الحالة الجديدة: ' || p_new_status, 'INAPP', 'APPLICATION',
           '/applications/'||p_application_id);
    RE_SEC_PKG.audit(p_actor, 'APP_STATUS', 'RE_APPLICATIONS', p_application_id, p_new_status);
  END;

  FUNCTION issue_letter(p_letter_type IN VARCHAR2, p_benef_id IN NUMBER, p_issued_by IN NUMBER,
                        p_subject IN VARCHAR2, p_body IN CLOB, p_related_org IN NUMBER DEFAULT NULL,
                        p_related_job IN NUMBER DEFAULT NULL) RETURN NUMBER IS
    v_id   NUMBER;
    v_ref  VARCHAR2(40);
    v_code VARCHAR2(64);
    v_seq  NUMBER;
  BEGIN
    SELECT COUNT(*) + 1 INTO v_seq FROM RE_LETTERS;
    v_ref  := 'MR-' || TO_CHAR(SYSDATE, 'YYYY') || '-' || LPAD(v_seq, 5, '0');
    v_code := LOWER(RAWTOHEX(DBMS_CRYPTO.RANDOMBYTES(16)));
    INSERT INTO RE_LETTERS (letter_type, benef_id, ref_number, verify_code, related_org, related_job,
                            subject, body, issued_by, valid_until)
    VALUES (p_letter_type, p_benef_id, v_ref, v_code, p_related_org, p_related_job,
            p_subject, p_body, p_issued_by, ADD_MONTHS(SYSDATE, 6))
    RETURNING letter_id INTO v_id;
    RE_SEC_PKG.audit(p_issued_by, 'LETTER_ISSUE', 'RE_LETTERS', v_id, v_ref);
    RETURN v_id;
  END;

  FUNCTION verify_letter(p_verify_code IN VARCHAR2) RETURN VARCHAR2 IS
    v RE_LETTERS%ROWTYPE;
    v_name VARCHAR2(200);
  BEGIN
    SELECT * INTO v FROM RE_LETTERS WHERE verify_code = p_verify_code;
    SELECT u.full_name INTO v_name FROM RE_BENEFICIARIES b JOIN RE_USERS u ON u.user_id=b.user_id
      WHERE b.benef_id = v.benef_id;
    RETURN JSON_OBJECT(
      'valid'        VALUE CASE WHEN v.status='ISSUED' AND (v.valid_until IS NULL OR v.valid_until >= SYSDATE) THEN 'true' ELSE 'false' END FORMAT JSON,
      'ref_number'   VALUE v.ref_number,
      'letter_type'  VALUE v.letter_type,
      'beneficiary'  VALUE v_name,
      'issued_at'    VALUE TO_CHAR(v.issued_at, 'YYYY-MM-DD'),
      'valid_until'  VALUE TO_CHAR(v.valid_until, 'YYYY-MM-DD'),
      'status'       VALUE v.status);
  EXCEPTION WHEN NO_DATA_FOUND THEN
    RETURN JSON_OBJECT('valid' VALUE 'false' FORMAT JSON, 'error' VALUE 'رمز تحقق غير موجود');
  END;

  PROCEDURE notify(p_user_id IN NUMBER, p_title IN VARCHAR2, p_body IN VARCHAR2 DEFAULT NULL,
                   p_channel IN VARCHAR2 DEFAULT 'INAPP', p_category IN VARCHAR2 DEFAULT 'SYSTEM',
                   p_link IN VARCHAR2 DEFAULT NULL) IS
  BEGIN
    INSERT INTO RE_NOTIFICATIONS (user_id, channel, title, body, category, link, delivery)
    VALUES (p_user_id, p_channel, p_title, p_body, p_category, p_link,
            CASE WHEN p_channel='INAPP' THEN 'SENT' ELSE 'PENDING' END);
    -- القنوات الخارجية (EMAIL/SMS/WHATSAPP/PUSH) تُلتقط من جدول الإشعارات
    -- عبر مهمّة DBMS_SCHEDULER أو تكامل APEX_MAIL/Power Automate (انظر دليل النشر).
  END;

END RE_APP_PKG;
/

PROMPT >> 10_pkg_business.sql  تم إنشاء حزمة منطق الأعمال RE_APP_PKG.
