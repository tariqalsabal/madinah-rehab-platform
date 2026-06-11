-- =============================================================================
--  16_training_apply.sql : التقديم/التسجيل على البرامج التدريبية + تفاصيل برنامج
--  ينفّذ مرّة واحدة في SQL Commands (كتلة BEGIN…END; /).
-- =============================================================================
BEGIN
  -- POST /applications/program  body:{ benef_id, program_id }
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'applications/program');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'applications/program', p_method=>'POST',
    p_source_type=>ORDS.source_type_plsql, p_source=>q'[
      DECLARE v_id NUMBER;
      BEGIN
        v_id := RE_APP_PKG.apply_program(:benef_id, :program_id);
        :status_code := 201; HTP.P(JSON_OBJECT('application_id' VALUE v_id));
      EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN :status_code := 409; HTP.P('{"error":"سبق التسجيل في هذا البرنامج"}');
        WHEN OTHERS THEN :status_code := 400; HTP.P(JSON_OBJECT('error' VALUE SQLERRM));
      END; ]');

  -- GET /programs/:id  : تفاصيل برنامج واحد
  ORDS.DEFINE_TEMPLATE(p_module_name=>'rehab.api.v1', p_pattern=>'programs/:id');
  ORDS.DEFINE_HANDLER(p_module_name=>'rehab.api.v1', p_pattern=>'programs/:id', p_method=>'GET',
    p_source_type=>ORDS.source_type_collection_feed, p_source=>q'[
      SELECT program_id, title, org_name, city, delivery_mode, prog_level, duration_hours,
             seats_total, seats_available, original_fee, discount_pct, is_free, certificate,
             field_name, start_date, end_date
        FROM RE_V_TRAINING WHERE program_id = :id ]');
  COMMIT;
END;
/
PROMPT >> 16_training_apply.sql  تم: التقديم على التدريب + تفاصيل البرنامج.
