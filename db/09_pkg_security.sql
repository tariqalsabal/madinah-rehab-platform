-- =============================================================================
--  09_pkg_security.sql : المصادقة (hashing) + JWT + فحص الصلاحيات (RBAC)
--  -----------------------------------------------------------------------------
--  ملاحظات إنتاجية:
--   * يُفضّل توقيع/تحقق JWT عبر ORDS OAuth2 أو في طبقة الواجهة (NextAuth).
--     هنا نوفّر توليد/تحقق HS256 داخل القاعدة لاستخدامه عند الحاجة، إضافةً
--     لتجزئة كلمات المرور (PBKDF2 عبر DBMS_CRYPTO) وفحص الصلاحيات.
--   * المفتاح السري يُقرأ من سياق التطبيق RE_CTX (لا يُخزَّن في الكود).
-- =============================================================================

CREATE OR REPLACE PACKAGE RE_SEC_PKG AS
  -- كلمات المرور
  FUNCTION gen_salt        RETURN VARCHAR2;
  FUNCTION hash_password   (p_password IN VARCHAR2, p_salt IN VARCHAR2) RETURN VARCHAR2;
  FUNCTION verify_password (p_password IN VARCHAR2, p_salt IN VARCHAR2, p_hash IN VARCHAR2) RETURN BOOLEAN;

  -- JWT (HS256)
  FUNCTION sign_jwt   (p_claims_json IN CLOB, p_secret IN VARCHAR2, p_ttl_seconds IN NUMBER DEFAULT 3600) RETURN VARCHAR2;
  FUNCTION verify_jwt (p_token IN VARCHAR2, p_secret IN VARCHAR2) RETURN CLOB;  -- يُرجع الـ payload أو يرفع خطأ

  -- RBAC
  FUNCTION user_roles      (p_user_id IN NUMBER) RETURN VARCHAR2;  -- CSV بأكواد الأدوار
  FUNCTION has_permission  (p_user_id IN NUMBER, p_perm_code IN VARCHAR2) RETURN BOOLEAN;
  PROCEDURE assert_permission(p_user_id IN NUMBER, p_perm_code IN VARCHAR2);

  -- تسجيل تدقيق
  PROCEDURE audit(p_user_id IN NUMBER, p_action IN VARCHAR2, p_entity IN VARCHAR2 DEFAULT NULL,
                  p_entity_id IN NUMBER DEFAULT NULL, p_detail IN CLOB DEFAULT NULL);
END RE_SEC_PKG;
/

CREATE OR REPLACE PACKAGE BODY RE_SEC_PKG AS

  -- Base64URL (بدون padding) — مطلوب لـ JWT
  FUNCTION b64url(p_raw IN RAW) RETURN VARCHAR2 IS
    v VARCHAR2(32767);
  BEGIN
    v := UTL_RAW.CAST_TO_VARCHAR2(UTL_ENCODE.BASE64_ENCODE(p_raw));
    v := REPLACE(REPLACE(v, CHR(13)), CHR(10));   -- إزالة فواصل الأسطر
    v := REPLACE(REPLACE(REPLACE(v, '+','-'), '/','_'), '=', '');
    RETURN v;
  END;

  FUNCTION gen_salt RETURN VARCHAR2 IS
  BEGIN
    RETURN LOWER(RAWTOHEX(DBMS_CRYPTO.RANDOMBYTES(16)));
  END;

  FUNCTION hash_password(p_password IN VARCHAR2, p_salt IN VARCHAR2) RETURN VARCHAR2 IS
    v_raw RAW(64);
  BEGIN
    -- PBKDF2-like: تكرار SHA-512 على (salt||password)
    v_raw := DBMS_CRYPTO.HASH(UTL_RAW.CAST_TO_RAW(p_salt || p_password), DBMS_CRYPTO.HASH_SH512);
    FOR i IN 1 .. 1000 LOOP
      v_raw := DBMS_CRYPTO.HASH(v_raw, DBMS_CRYPTO.HASH_SH512);
    END LOOP;
    RETURN LOWER(RAWTOHEX(v_raw));
  END;

  FUNCTION verify_password(p_password IN VARCHAR2, p_salt IN VARCHAR2, p_hash IN VARCHAR2) RETURN BOOLEAN IS
  BEGIN
    RETURN hash_password(p_password, p_salt) = LOWER(p_hash);
  END;

  FUNCTION sign_jwt(p_claims_json IN CLOB, p_secret IN VARCHAR2, p_ttl_seconds IN NUMBER DEFAULT 3600) RETURN VARCHAR2 IS
    c_header  CONSTANT VARCHAR2(100) := '{"alg":"HS256","typ":"JWT"}';
    v_now     NUMBER := (CAST(SYS_EXTRACT_UTC(SYSTIMESTAMP) AS DATE) - DATE '1970-01-01') * 86400;
    v_payload CLOB;
    v_head_b64 VARCHAR2(4000);
    v_pay_b64  VARCHAR2(8000);
    v_sign_in  VARCHAR2(12000);
    v_sig      RAW(64);
  BEGIN
    -- حقن iat/exp في الـ claims
    SELECT JSON_TRANSFORM(p_claims_json,
             SET '$.iat' = v_now,
             SET '$.exp' = v_now + p_ttl_seconds)
      INTO v_payload FROM DUAL;
    v_head_b64 := b64url(UTL_RAW.CAST_TO_RAW(c_header));
    v_pay_b64  := b64url(UTL_RAW.CAST_TO_RAW(v_payload));
    v_sign_in  := v_head_b64 || '.' || v_pay_b64;
    v_sig := DBMS_CRYPTO.MAC(UTL_RAW.CAST_TO_RAW(v_sign_in), DBMS_CRYPTO.HMAC_SH256, UTL_RAW.CAST_TO_RAW(p_secret));
    RETURN v_sign_in || '.' || b64url(v_sig);
  END;

  FUNCTION verify_jwt(p_token IN VARCHAR2, p_secret IN VARCHAR2) RETURN CLOB IS
    v_p1 PLS_INTEGER := INSTR(p_token, '.');
    v_p2 PLS_INTEGER := INSTR(p_token, '.', 1, 2);
    v_signing VARCHAR2(12000);
    v_sig_in  VARCHAR2(4000);
    v_expect  VARCHAR2(4000);
    v_pay_b64 VARCHAR2(8000);
    v_payload CLOB;
    v_exp     NUMBER;
    v_now     NUMBER := (CAST(SYS_EXTRACT_UTC(SYSTIMESTAMP) AS DATE) - DATE '1970-01-01') * 86400;
  BEGIN
    IF v_p1 = 0 OR v_p2 = 0 THEN RAISE_APPLICATION_ERROR(-20401, 'صيغة التوكن غير صحيحة'); END IF;
    v_signing := SUBSTR(p_token, 1, v_p2 - 1);
    v_sig_in  := SUBSTR(p_token, v_p2 + 1);
    v_expect  := b64url(DBMS_CRYPTO.MAC(UTL_RAW.CAST_TO_RAW(v_signing), DBMS_CRYPTO.HMAC_SH256, UTL_RAW.CAST_TO_RAW(p_secret)));
    IF v_sig_in <> v_expect THEN RAISE_APPLICATION_ERROR(-20402, 'توقيع التوكن غير صالح'); END IF;
    -- فك الـ payload
    v_pay_b64 := SUBSTR(v_signing, v_p1 + 1);
    -- إعادة الـ padding وتحويل base64url -> base64
    v_pay_b64 := REPLACE(REPLACE(v_pay_b64, '-','+'), '_','/');
    v_pay_b64 := v_pay_b64 || RPAD('=', MOD(4 - MOD(LENGTH(v_pay_b64),4), 4), '=');
    v_payload := UTL_RAW.CAST_TO_VARCHAR2(UTL_ENCODE.BASE64_DECODE(UTL_RAW.CAST_TO_RAW(v_pay_b64)));
    SELECT JSON_VALUE(v_payload, '$.exp' RETURNING NUMBER) INTO v_exp FROM DUAL;
    IF v_exp IS NOT NULL AND v_exp < v_now THEN RAISE_APPLICATION_ERROR(-20403, 'انتهت صلاحية التوكن'); END IF;
    RETURN v_payload;
  END;

  FUNCTION user_roles(p_user_id IN NUMBER) RETURN VARCHAR2 IS
    v VARCHAR2(400);
  BEGIN
    SELECT LISTAGG(r.role_code, ',') WITHIN GROUP (ORDER BY r.role_code)
      INTO v FROM SEC_USER_ROLES ur JOIN SEC_ROLES r ON r.role_id = ur.role_id
     WHERE ur.user_id = p_user_id;
    RETURN v;
  END;

  FUNCTION has_permission(p_user_id IN NUMBER, p_perm_code IN VARCHAR2) RETURN BOOLEAN IS
    v_cnt NUMBER;
  BEGIN
    SELECT COUNT(*) INTO v_cnt
      FROM SEC_USER_ROLES ur
      JOIN SEC_ROLE_PERMISSIONS rp ON rp.role_id = ur.role_id
      JOIN SEC_PERMISSIONS p       ON p.perm_id  = rp.perm_id
     WHERE ur.user_id = p_user_id AND p.perm_code = p_perm_code;
    RETURN v_cnt > 0;
  END;

  PROCEDURE assert_permission(p_user_id IN NUMBER, p_perm_code IN VARCHAR2) IS
  BEGIN
    IF NOT has_permission(p_user_id, p_perm_code) THEN
      RAISE_APPLICATION_ERROR(-20405, 'لا تملك صلاحية: ' || p_perm_code);
    END IF;
  END;

  PROCEDURE audit(p_user_id IN NUMBER, p_action IN VARCHAR2, p_entity IN VARCHAR2 DEFAULT NULL,
                  p_entity_id IN NUMBER DEFAULT NULL, p_detail IN CLOB DEFAULT NULL) IS
    PRAGMA AUTONOMOUS_TRANSACTION;
  BEGIN
    INSERT INTO SEC_AUDIT_LOG (user_id, action, entity, entity_id, detail)
    VALUES (p_user_id, p_action, p_entity, p_entity_id, p_detail);
    COMMIT;
  END;

END RE_SEC_PKG;
/

PROMPT >> 09_pkg_security.sql  تم إنشاء حزمة الأمان RE_SEC_PKG (hash + JWT + RBAC).
