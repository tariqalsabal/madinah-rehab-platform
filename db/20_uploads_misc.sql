-- =============================================================================
--  20_uploads_misc.sql : رفع الملفات المباشر (BLOB) + بروفايل عام + جهة تواصل
--  ينفّذ مرّة واحدة (كتلة BEGIN…END; /).
-- =============================================================================
BEGIN
  -- POST /documents/upload?uid=&doc_type=&title=&filename=&content_type=  (الجسم = الملف)
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'documents/upload');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'documents/upload', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      DECLARE v_bid NUMBER;
      BEGIN
        SELECT benef_id INTO v_bid FROM RE_BENEFICIARIES WHERE user_id=:uid;
        INSERT INTO RE_DOCUMENTS(owner_type,owner_id,doc_type,title,storage_kind,mime_type,file_name,content,uploaded_by)
        VALUES('BENEFICIARY', v_bid, :doc_type, :title, 'BLOB', :content_type, :filename, :body, :uid);
        :status_code := 201; HTP.P('{"ok":true}');
      EXCEPTION WHEN OTHERS THEN :status_code := 400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  -- POST /org/documents/upload : رفع مرفق منظمة مباشر
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'org/documents/upload');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'org/documents/upload', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      DECLARE v_org NUMBER;
      BEGIN
        SELECT org_id INTO v_org FROM RE_USERS WHERE user_id=:uid;
        INSERT INTO RE_DOCUMENTS(owner_type,owner_id,doc_type,title,storage_kind,mime_type,file_name,content,uploaded_by)
        VALUES('ORG', v_org, :doc_type, :title, 'BLOB', :content_type, :filename, :body, :uid);
        :status_code := 201; HTP.P('{"ok":true}');
      EXCEPTION WHEN OTHERS THEN :status_code := 400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  -- GET /documents/:id/download : تنزيل الملف المخزّن
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'documents/:id/download');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'documents/:id/download', p_method=>'GET',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      DECLARE l_blob BLOB; l_mime VARCHAR2(150); l_name VARCHAR2(260);
      BEGIN
        SELECT content, NVL(mime_type,'application/octet-stream'), NVL(file_name,'file')
          INTO l_blob, l_mime, l_name FROM RE_DOCUMENTS WHERE doc_id=:id AND storage_kind='BLOB';
        OWA_UTIL.mime_header(l_mime, FALSE);
        HTP.P('Content-Length: '||DBMS_LOB.getlength(l_blob));
        HTP.P('Content-Disposition: inline; filename="'||l_name||'"');
        OWA_UTIL.http_header_close;
        WPG_DOCLOAD.download_file(l_blob);
      EXCEPTION WHEN NO_DATA_FOUND THEN :status_code := 404;
      END; ]');

  -- GET /organizations/:id : بروفايل عام للمنظمة + معرّف مستخدم التواصل
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'organizations/:id');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'organizations/:id', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT o.org_id, o.org_type, o.legal_name, o.brand_name, o.sector, o.city, o.region,
             o.website, o.about, o.logo_url, o.established_year, o.employees_count,
             (SELECT MIN(user_id) FROM RE_USERS WHERE org_id=o.org_id) AS contact_user_id
        FROM RE_ORGANIZATIONS o WHERE o.org_id=:id ]');

  -- GET /support-contact : معرّف مستخدم الجمعية للتواصل (أول أدمن/موظف)
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'support-contact');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'support-contact', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT MIN(user_id) AS user_id, MIN(full_name) AS full_name FROM (
        SELECT u.user_id, u.full_name FROM RE_USERS u
         WHERE u.user_type IN ('STAFF','ADMIN') AND u.status='ACTIVE'
         ORDER BY CASE WHEN u.user_type='STAFF' THEN 0 ELSE 1 END FETCH FIRST 1 ROW ONLY) ]');

  COMMIT;
END;
/
PROMPT >> 20_uploads_misc.sql  تم: الرفع المباشر + البروفايل العام + جهة التواصل.
