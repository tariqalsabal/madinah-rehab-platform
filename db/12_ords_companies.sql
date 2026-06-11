-- =============================================================================
--  12_ords_companies.sql : إضافة مسار GET /companies إلى وحدة rehab.api.v1
--  (يُنفّذ في سكيمة التطبيق بعد أن أصبحت الوحدة موجودة ومفعّلة)
-- =============================================================================
BEGIN
  ORDS.DEFINE_TEMPLATE(p_module_name => 'rehab.api.v1', p_pattern => 'companies');
  ORDS.DEFINE_HANDLER(
    p_module_name => 'rehab.api.v1', p_pattern => 'companies', p_method => 'GET',
    p_source_type => ORDS.source_type_collection_feed,
    p_source => q'[
      SELECT org_id, org_type, legal_name, brand_name, sector, city, region, logo_url, website
        FROM RE_ORGANIZATIONS
       WHERE approval_status = 'APPROVED'
         AND (:type IS NULL OR org_type = :type)
       ORDER BY legal_name ]',
    p_items_per_page => 25);
  COMMIT;
END;
/
PROMPT >> 12_ords_companies.sql  تم إضافة مسار /companies.
