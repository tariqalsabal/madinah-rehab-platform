-- =============================================================================
--  13_seed_demo.sql : بيانات تجريبية ضخمة + حسابات لكل نوع مستخدم
--  -----------------------------------------------------------------------------
--  ينفّذ دفعة واحدة في APEX → SQL Workshop → SQL Commands (انسخ الكتلة كاملة).
--  كل الحسابات بكلمة مرور موحّدة:  Madinah@2026
--  يُشغّل مرّة واحدة (سيُنشئ منظمات/وظائف/برامج جديدة عند كل تشغيل).
--  ملاحظة فنية: لا تُستدعى الدوال المحلية ولا عناصر المصفوفات داخل جُمل SQL؛
--               تُحسب القيم في متغيّرات سُلّمية أولاً (تفادياً لـ PLS-00231/425).
-- =============================================================================
DECLARE
  c_pwd CONSTANT VARCHAR2(40) := 'Madinah@2026';

  TYPE num_tab IS TABLE OF NUMBER INDEX BY PLS_INTEGER;
  TYPE str_tab IS TABLE OF VARCHAR2(120);

  cities     str_tab := str_tab('المدينة المنورة','جدة','الرياض','مكة المكرمة','ينبع','الدمام');
  majors     str_tab := str_tab('محاسبة','تقنية المعلومات','إدارة أعمال','تسويق','هندسة برمجيات','موارد بشرية','مبيعات','خدمة عملاء');
  fnames     str_tab := str_tab('أحمد','محمد','عبدالله','خالد','سعد','فهد','ناصر','سلطان','يوسف','إبراهيم','عمر','بدر','منى','نورة','سارة','هند');
  lnames     str_tab := str_tab('الأحمدي','الحربي','القرني','الشهري','الغامدي','العتيبي','الزهراني','المالكي');
  edus       str_tab := str_tab('SECONDARY','DIPLOMA','BACHELOR','MASTER');
  fieldcodes str_tab := str_tab('ACCOUNT','IT','HR','SALES','CS','DEV','PM','LOGISTICS');

  co_ids num_tab; inst_ids num_tab; job_ids num_tab; prog_ids num_tab; benef_ids num_tab;
  v_uid NUMBER; v_org NUMBER; v_bid NUMBER; v_job NUMBER; v_prog NUMBER; v_don NUMBER;
  -- متغيّرات سُلّمية تُملأ قبل كل INSERT
  v_field NUMBER; v_orgx NUMBER; v_donx NUMBER; v_score NUMBER;
  v_title VARCHAR2(160); v_cityx VARCHAR2(120); v_edux VARCHAR2(30);
  v_majorx VARCHAR2(120); v_namex VARCHAR2(200); v_genx VARCHAR2(6); v_curx VARCHAR2(20);

  PROCEDURE mkuser(p_email VARCHAR2, p_name VARCHAR2, p_type VARCHAR2, p_role VARCHAR2,
                   p_org NUMBER, o_uid OUT NUMBER) IS
    v_salt VARCHAR2(64);
  BEGIN
    BEGIN SELECT user_id INTO o_uid FROM RE_USERS WHERE email = LOWER(p_email); RETURN;
    EXCEPTION WHEN NO_DATA_FOUND THEN NULL; END;
    v_salt := RE_SEC_PKG.gen_salt;
    INSERT INTO RE_USERS(username,email,full_name,user_type,org_id,status,email_verified,password_salt,password_hash)
    VALUES(LOWER(p_email),LOWER(p_email),p_name,p_type,p_org,'ACTIVE','Y',v_salt,RE_SEC_PKG.hash_password(c_pwd,v_salt))
    RETURNING user_id INTO o_uid;
    INSERT INTO SEC_USER_ROLES(user_id,role_id) SELECT o_uid, role_id FROM SEC_ROLES WHERE role_code = p_role;
  END;

  FUNCTION mkorg(p_type VARCHAR2, p_name VARCHAR2, p_brand VARCHAR2, p_city VARCHAR2, p_sector VARCHAR2) RETURN NUMBER IS
    v NUMBER;
  BEGIN
    INSERT INTO RE_ORGANIZATIONS(org_type,legal_name,brand_name,city,sector,approval_status,email)
    VALUES(p_type,p_name,p_brand,p_city,p_sector,'APPROVED',LOWER(p_brand)||'@demo.sa')
    RETURNING org_id INTO v;
    RETURN v;
  END;

  FUNCTION fieldcat(p_code VARCHAR2) RETURN NUMBER IS v NUMBER;
  BEGIN SELECT category_id INTO v FROM RE_CATEGORIES WHERE cat_type='FIELD' AND code=p_code; RETURN v;
  EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL; END;

BEGIN
  -- ===== حسابات لكل نوع مستخدم =====
  mkuser('admin@demo.sa', 'مدير النظام',  'ADMIN', 'ADMIN', NULL, v_uid);
  mkuser('staff@demo.sa', 'موظف الجمعية', 'STAFF', 'STAFF', NULL, v_uid);

  -- ===== المنظمات =====
  FOR i IN 1..5 LOOP
    co_ids(i) := mkorg('COMPANY', 'شركة '||majors(1+MOD(i,majors.COUNT))||' '||i, 'company'||i, cities(1+MOD(i,cities.COUNT)), 'قطاع خاص');
  END LOOP;
  FOR i IN 1..3 LOOP
    inst_ids(i) := mkorg('INSTITUTE', 'معهد التدريب '||i, 'institute'||i, cities(1+MOD(i,cities.COUNT)), 'تدريب');
  END LOOP;
  v_org := mkorg('RECRUITER', 'شركة التوظيف الأولى', 'recruiter1', 'الرياض', 'توظيف');
  v_org := mkorg('DONOR',     'مؤسسة العطاء المانحة', 'donor1',     'جدة',    'أوقاف');

  -- موظفو المنظمات
  mkuser('company@demo.sa',   'مدير حساب الشركة',  'COMPANY',   'COMPANY_ADMIN', co_ids(1), v_uid);
  mkuser('hr@demo.sa',        'موظف موارد بشرية',  'COMPANY',   'COMPANY_HR',    co_ids(1), v_uid);
  mkuser('institute@demo.sa', 'مدير المعهد',       'INSTITUTE', 'INSTITUTE',     inst_ids(1), v_uid);
  mkuser('recruiter@demo.sa', 'مدير شركة التوظيف', 'RECRUITER', 'RECRUITER',     NULL, v_uid);
  mkuser('donor@demo.sa',     'ممثل الجهة المانحة','DONOR',     'DONOR',         NULL, v_uid);

  -- ===== تبرعات =====
  v_orgx := co_ids(1);
  INSERT INTO RE_DONATIONS(donor_org_id,donation_type,title,target_role,units_pledged,status,monetary_value)
  VALUES(v_orgx,'JOB','تبرع بـ 15 وظيفة','موظف',15,'ACTIVE',900000) RETURNING donation_id INTO v_don;
  v_orgx := inst_ids(1);
  INSERT INTO RE_DONATIONS(donor_org_id,donation_type,title,units_pledged,discount_pct,status,monetary_value)
  VALUES(v_orgx,'TRAINING','منحة 50 مقعد تدريبي',50,100,'ACTIVE',100000);

  -- ===== وظائف (15) =====
  FOR i IN 1..15 LOOP
    v_orgx  := co_ids(1+MOD(i,co_ids.COUNT));
    v_title := majors(1+MOD(i,majors.COUNT));
    v_cityx := cities(1+MOD(i,cities.COUNT));
    v_edux  := edus(1+MOD(i,edus.COUNT));
    v_field := fieldcat(fieldcodes(1+MOD(i,fieldcodes.COUNT)));
    v_donx  := CASE WHEN MOD(i,3)=0 THEN v_don ELSE NULL END;
    INSERT INTO RE_JOBS(org_id,title,city,min_education,min_experience,salary_min,salary_max,vacancies,status,published_at,field_cat,donation_id)
    VALUES(v_orgx, v_title, v_cityx, v_edux, MOD(i,4), 4000+MOD(i,5)*1000, 8000+MOD(i,5)*1500, 1+MOD(i,4), 'PUBLISHED', SYSTIMESTAMP, v_field, v_donx)
    RETURNING job_id INTO v_job;
    job_ids(i) := v_job;
    INSERT INTO RE_JOB_SKILLS(job_id,skill_id,weight,mandatory)
    SELECT v_job, skill_id, 3, 'N' FROM (SELECT skill_id FROM RE_SKILLS ORDER BY DBMS_RANDOM.VALUE) WHERE ROWNUM<=2;
  END LOOP;

  -- ===== برامج تدريبية (8) =====
  FOR i IN 1..8 LOOP
    v_orgx  := inst_ids(1+MOD(i,inst_ids.COUNT));
    v_title := 'برنامج '||majors(1+MOD(i,majors.COUNT));
    v_cityx := cities(1+MOD(i,cities.COUNT));
    v_field := fieldcat(fieldcodes(1+MOD(i,fieldcodes.COUNT)));
    INSERT INTO RE_TRAINING_PROGRAMS(org_id,title,city,seats_total,original_fee,discount_pct,is_free,status,published_at,field_cat,start_date,duration_hours,level)
    VALUES(v_orgx, v_title, v_cityx, 20+MOD(i,30), 1500, CASE WHEN MOD(i,2)=0 THEN 100 ELSE 50 END,
           CASE WHEN MOD(i,2)=0 THEN 'Y' ELSE 'N' END, 'PUBLISHED', SYSTIMESTAMP, v_field, SYSDATE+7+i, 40+MOD(i,60), 'BEGINNER')
    RETURNING program_id INTO v_prog;
    prog_ids(i) := v_prog;
  END LOOP;

  -- ===== مستفيدون (40) =====
  FOR i IN 1..40 LOOP
    v_namex := fnames(1+MOD(i,fnames.COUNT))||' '||lnames(1+MOD(i,lnames.COUNT));
    mkuser('benef'||LPAD(i,3,'0')||'@demo.sa', v_namex, 'BENEFICIARY','BENEFICIARY',NULL,v_uid);
    BEGIN
      SELECT benef_id INTO v_bid FROM RE_BENEFICIARIES WHERE user_id=v_uid;
    EXCEPTION WHEN NO_DATA_FOUND THEN
      v_genx   := CASE WHEN MOD(i,2)=0 THEN 'MALE' ELSE 'FEMALE' END;
      v_edux   := edus(1+MOD(i,edus.COUNT));
      v_majorx := majors(1+MOD(i,majors.COUNT));
      v_curx   := CASE WHEN MOD(i,3)=0 THEN 'FRESH_GRAD' ELSE 'SEEKER' END;
      v_cityx  := cities(1+MOD(i,cities.COUNT));
      v_field  := fieldcat(fieldcodes(1+MOD(i,fieldcodes.COUNT)));
      INSERT INTO RE_BENEFICIARIES(user_id,gender,education_level,major,experience_years,current_status,city,desired_titles,approval_status,completeness_pct)
      VALUES(v_uid, v_genx, v_edux, v_majorx, MOD(i,8), v_curx, v_cityx, v_majorx, 'APPROVED', 70+MOD(i,30))
      RETURNING benef_id INTO v_bid;
      INSERT INTO RE_BENEFICIARY_CATEGORIES(benef_id,category_id) VALUES(v_bid, v_field);
      INSERT INTO RE_BENEFICIARY_SKILLS(benef_id,skill_id,proficiency,years)
      SELECT v_bid, skill_id, 3+MOD(i,3), MOD(i,5) FROM (SELECT skill_id FROM RE_SKILLS ORDER BY DBMS_RANDOM.VALUE) WHERE ROWNUM<=3;
    END;
    benef_ids(i) := v_bid;
  END LOOP;

  -- ===== طلبات توظيف (وظيفتان لكل مستفيد بحالات متنوّعة) =====
  FOR i IN 1..benef_ids.COUNT LOOP
    v_bid := benef_ids(i);
    FOR k IN 0..1 LOOP
      v_job   := job_ids(1+MOD(i+k*5, job_ids.COUNT));
      v_score := RE_MATCH_PKG.score_job(v_bid, v_job);
      BEGIN
        INSERT INTO RE_APPLICATIONS(benef_id,target_type,job_id,match_score,status,source)
        VALUES(v_bid,'JOB',v_job, v_score,
               CASE MOD(i+k,5) WHEN 0 THEN 'HIRED' WHEN 1 THEN 'INTERVIEW' WHEN 2 THEN 'SHORTLISTED' ELSE 'SUBMITTED' END,'SELF');
      EXCEPTION WHEN DUP_VAL_ON_INDEX THEN NULL; END;
    END LOOP;
  END LOOP;

  -- ===== تسجيلات تدريب =====
  FOR i IN 1..benef_ids.COUNT LOOP
    IF MOD(i,3)=0 THEN
      v_bid   := benef_ids(i);
      v_prog  := prog_ids(1+MOD(i,prog_ids.COUNT));
      v_score := RE_MATCH_PKG.score_program(v_bid, v_prog);
      BEGIN
        INSERT INTO RE_APPLICATIONS(benef_id,target_type,program_id,match_score,status,source)
        VALUES(v_bid,'TRAINING',v_prog, v_score,'ENROLLED','SELF');
      EXCEPTION WHEN DUP_VAL_ON_INDEX THEN NULL; END;
    END IF;
  END LOOP;

  COMMIT;

  -- إعادة احتساب المطابقات
  FOR i IN 1..benef_ids.COUNT LOOP
    RE_MATCH_PKG.refresh_matches_for_benef(benef_ids(i));
  END LOOP;

  DBMS_OUTPUT.PUT_LINE('تم إنشاء البيانات التجريبية الضخمة بنجاح: 40 مستفيد، 15 وظيفة، 8 برامج، وحسابات لكل نوع.');
END;
/
