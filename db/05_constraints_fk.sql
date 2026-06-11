-- =============================================================================
--  05_constraints_fk.sql : المفاتيح الأجنبية (العلاقات بين الجداول)
--  تُطبّق بعد إنشاء كل الجداول لتجنّب مشاكل الترتيب.
-- =============================================================================

-- المستخدمون <-> المنظمات
ALTER TABLE RE_USERS            ADD CONSTRAINT re_users_org_fk      FOREIGN KEY (org_id)        REFERENCES RE_ORGANIZATIONS (org_id);

-- RBAC
ALTER TABLE SEC_ROLE_PERMISSIONS ADD CONSTRAINT sec_rp_role_fk     FOREIGN KEY (role_id)       REFERENCES SEC_ROLES (role_id)        ON DELETE CASCADE;
ALTER TABLE SEC_ROLE_PERMISSIONS ADD CONSTRAINT sec_rp_perm_fk     FOREIGN KEY (perm_id)       REFERENCES SEC_PERMISSIONS (perm_id)  ON DELETE CASCADE;
ALTER TABLE SEC_USER_ROLES       ADD CONSTRAINT sec_ur_user_fk     FOREIGN KEY (user_id)       REFERENCES RE_USERS (user_id)         ON DELETE CASCADE;
ALTER TABLE SEC_USER_ROLES       ADD CONSTRAINT sec_ur_role_fk     FOREIGN KEY (role_id)       REFERENCES SEC_ROLES (role_id)        ON DELETE CASCADE;
ALTER TABLE SEC_USER_ROLES       ADD CONSTRAINT sec_ur_scope_fk    FOREIGN KEY (scope_org)     REFERENCES RE_ORGANIZATIONS (org_id);
ALTER TABLE SEC_TOKENS           ADD CONSTRAINT sec_tok_user_fk    FOREIGN KEY (user_id)       REFERENCES RE_USERS (user_id)         ON DELETE CASCADE;
ALTER TABLE SEC_OTP              ADD CONSTRAINT sec_otp_user_fk    FOREIGN KEY (user_id)       REFERENCES RE_USERS (user_id)         ON DELETE CASCADE;

-- المستفيدون
ALTER TABLE RE_BENEFICIARIES        ADD CONSTRAINT re_benef_user_fk    FOREIGN KEY (user_id)        REFERENCES RE_USERS (user_id)        ON DELETE CASCADE;
ALTER TABLE RE_BENEFICIARIES        ADD CONSTRAINT re_benef_officer_fk FOREIGN KEY (case_officer_id) REFERENCES RE_USERS (user_id);
ALTER TABLE RE_BENEFICIARY_CATEGORIES ADD CONSTRAINT re_bc_benef_fk    FOREIGN KEY (benef_id)       REFERENCES RE_BENEFICIARIES (benef_id) ON DELETE CASCADE;
ALTER TABLE RE_BENEFICIARY_CATEGORIES ADD CONSTRAINT re_bc_cat_fk      FOREIGN KEY (category_id)    REFERENCES RE_CATEGORIES (category_id) ON DELETE CASCADE;
ALTER TABLE RE_BENEFICIARY_SKILLS   ADD CONSTRAINT re_bs_benef_fk      FOREIGN KEY (benef_id)       REFERENCES RE_BENEFICIARIES (benef_id) ON DELETE CASCADE;
ALTER TABLE RE_BENEFICIARY_SKILLS   ADD CONSTRAINT re_bs_skill_fk      FOREIGN KEY (skill_id)       REFERENCES RE_SKILLS (skill_id)        ON DELETE CASCADE;

-- التصنيفات (هرمية)
ALTER TABLE RE_CATEGORIES           ADD CONSTRAINT re_cat_parent_fk    FOREIGN KEY (parent_id)      REFERENCES RE_CATEGORIES (category_id);

-- الوظائف
ALTER TABLE RE_JOBS                 ADD CONSTRAINT re_job_org_fk       FOREIGN KEY (org_id)         REFERENCES RE_ORGANIZATIONS (org_id);
ALTER TABLE RE_JOBS                 ADD CONSTRAINT re_job_func_fk      FOREIGN KEY (function_cat)   REFERENCES RE_CATEGORIES (category_id);
ALTER TABLE RE_JOBS                 ADD CONSTRAINT re_job_field_fk     FOREIGN KEY (field_cat)      REFERENCES RE_CATEGORIES (category_id);
ALTER TABLE RE_JOBS                 ADD CONSTRAINT re_job_sen_fk       FOREIGN KEY (seniority_cat)  REFERENCES RE_CATEGORIES (category_id);
ALTER TABLE RE_JOBS                 ADD CONSTRAINT re_job_don_fk       FOREIGN KEY (donation_id)    REFERENCES RE_DONATIONS (donation_id);
ALTER TABLE RE_JOB_SKILLS           ADD CONSTRAINT re_js_job_fk        FOREIGN KEY (job_id)         REFERENCES RE_JOBS (job_id)            ON DELETE CASCADE;
ALTER TABLE RE_JOB_SKILLS           ADD CONSTRAINT re_js_skill_fk      FOREIGN KEY (skill_id)       REFERENCES RE_SKILLS (skill_id)        ON DELETE CASCADE;

-- البرامج التدريبية
ALTER TABLE RE_TRAINING_PROGRAMS    ADD CONSTRAINT re_tp_org_fk        FOREIGN KEY (org_id)         REFERENCES RE_ORGANIZATIONS (org_id);
ALTER TABLE RE_TRAINING_PROGRAMS    ADD CONSTRAINT re_tp_field_fk      FOREIGN KEY (field_cat)      REFERENCES RE_CATEGORIES (category_id);
ALTER TABLE RE_TRAINING_PROGRAMS    ADD CONSTRAINT re_tp_don_fk        FOREIGN KEY (donation_id)    REFERENCES RE_DONATIONS (donation_id);

-- التبرعات
ALTER TABLE RE_DONATIONS            ADD CONSTRAINT re_don_org_fk       FOREIGN KEY (donor_org_id)   REFERENCES RE_ORGANIZATIONS (org_id);

-- الطلبات
ALTER TABLE RE_APPLICATIONS         ADD CONSTRAINT re_app_benef_fk     FOREIGN KEY (benef_id)       REFERENCES RE_BENEFICIARIES (benef_id) ON DELETE CASCADE;
ALTER TABLE RE_APPLICATIONS         ADD CONSTRAINT re_app_job_fk       FOREIGN KEY (job_id)         REFERENCES RE_JOBS (job_id);
ALTER TABLE RE_APPLICATIONS         ADD CONSTRAINT re_app_prog_fk      FOREIGN KEY (program_id)     REFERENCES RE_TRAINING_PROGRAMS (program_id);
ALTER TABLE RE_APPLICATION_EVENTS   ADD CONSTRAINT re_appev_app_fk     FOREIGN KEY (application_id) REFERENCES RE_APPLICATIONS (application_id) ON DELETE CASCADE;

-- المطابقة
ALTER TABLE RE_MATCHES              ADD CONSTRAINT re_match_benef_fk   FOREIGN KEY (benef_id)       REFERENCES RE_BENEFICIARIES (benef_id) ON DELETE CASCADE;
ALTER TABLE RE_MATCHES              ADD CONSTRAINT re_match_job_fk     FOREIGN KEY (job_id)         REFERENCES RE_JOBS (job_id)            ON DELETE CASCADE;
ALTER TABLE RE_MATCHES              ADD CONSTRAINT re_match_prog_fk    FOREIGN KEY (program_id)     REFERENCES RE_TRAINING_PROGRAMS (program_id) ON DELETE CASCADE;

-- المقابلات والعروض
ALTER TABLE RE_INTERVIEWS           ADD CONSTRAINT re_iv_app_fk        FOREIGN KEY (application_id) REFERENCES RE_APPLICATIONS (application_id) ON DELETE CASCADE;
ALTER TABLE RE_OFFERS               ADD CONSTRAINT re_offer_app_fk     FOREIGN KEY (application_id) REFERENCES RE_APPLICATIONS (application_id) ON DELETE CASCADE;

-- الخطابات
ALTER TABLE RE_LETTERS              ADD CONSTRAINT re_let_benef_fk     FOREIGN KEY (benef_id)       REFERENCES RE_BENEFICIARIES (benef_id);
ALTER TABLE RE_LETTERS              ADD CONSTRAINT re_let_org_fk       FOREIGN KEY (related_org)    REFERENCES RE_ORGANIZATIONS (org_id);
ALTER TABLE RE_LETTERS              ADD CONSTRAINT re_let_job_fk       FOREIGN KEY (related_job)    REFERENCES RE_JOBS (job_id);
ALTER TABLE RE_LETTERS              ADD CONSTRAINT re_let_pdf_fk       FOREIGN KEY (pdf_doc_id)     REFERENCES RE_DOCUMENTS (doc_id);

-- الإشعارات
ALTER TABLE RE_NOTIFICATIONS        ADD CONSTRAINT re_notif_user_fk    FOREIGN KEY (user_id)        REFERENCES RE_USERS (user_id)         ON DELETE CASCADE;

PROMPT >> 05_constraints_fk.sql  تم تطبيق جميع العلاقات (Foreign Keys).
