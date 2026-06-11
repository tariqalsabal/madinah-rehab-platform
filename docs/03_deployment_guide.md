# دليل النشر (Deployment Guide)

## نظرة عامة على البنية
```
[المستخدم] → Cloudflare DNS/SSL → Vercel (Next.js) → /api/backend (rewrite)
                                                     → ORDS على Oracle Cloud (OCI)
                                                     → Oracle Database 23ai
```

## 1) قاعدة البيانات (Oracle 23ai على OCI)
1. أنشئ Autonomous Database (ATP) أو DB System على OCI.
2. أنشئ سكيمة التطبيق ومنحها الصلاحيات اللازمة:
   ```sql
   CREATE USER rehab IDENTIFIED BY "<strong-pwd>";
   GRANT CONNECT, RESOURCE, CREATE VIEW, CREATE PROCEDURE, CREATE SEQUENCE TO rehab;
   ALTER USER rehab QUOTA UNLIMITED ON DATA;
   GRANT EXECUTE ON DBMS_CRYPTO TO rehab;
   ```
3. شغّل السكربتات بالترتيب: `@db/00_install_all.sql` ثم فعّل ORDS ونفّذ `11_ords_rest.sql`.
4. اضبط المفتاح السري لـ JWT عبر سياق تطبيق (Application Context) باسم `RE_CTX.JWT_SECRET`
   من Vault/متغير بيئة — لا تتركه في الكود.

## 2) ORDS (Oracle REST Data Services)
- ثبّت ORDS وفعّل السكيمة: راجع رأس `db/11_ords_rest.sql`.
- فعّل OAuth2 (client_credentials) للمسارات المحمية وأنشئ عميلاً:
  ```sql
  OAUTH.create_client('rehab-frontend', 'منصة', NULL, NULL, NULL, 'rehab.priv.secured');
  OAUTH.grant_client_role('rehab-frontend', 'rehab_user');
  ```
- وثّق المسارات عبر Swagger: ORDS يولّد OpenAPI تلقائياً على
  `/ords/rehab/api/v1/open-api-catalog/` (انظر أيضاً `docs/openapi.yaml`).

## 3) الواجهة (Vercel)
1. اربط مستودع GitHub بمشروع Vercel، اضبط Root Directory = `frontend`.
2. أضف متغيرات البيئة (من `.env.example`): `BACKEND_API_URL`, `NEXTAUTH_SECRET`, مزوّدو الدخول.
3. النشر تلقائي عبر GitHub Actions (`.github/workflows/ci.yml`) عند الدمج في `main`.

## 4) Cloudflare (DNS + SSL)
- أضف الدومين، ووجّه:
  - `app.madinah-rehab.sa`  → Vercel (CNAME).
  - `api.madinah-rehab.sa`  → عنوان OCI لـ ORDS (A/CNAME) خلف Cloudflare Proxy.
- فعّل SSL/TLS = Full (Strict)، وقواعد WAF الأساسية، وHSTS.

## 5) الإشعارات الخارجية
- البريد: `APEX_MAIL` أو SMTP. واتساب/SMS: مزوّد (Twilio/Unifonic) عبر مهمة
  `DBMS_SCHEDULER` تقرأ `RE_NOTIFICATIONS` ذات `delivery='PENDING'`.
- Push: Web Push من الواجهة (Service Worker للـ PWA).

## 6) تشغيل محلي سريع (Docker)
```bash
cd deploy
ORACLE_PWD=Rehab_2026 docker compose up -d
# بعد إقلاع القاعدة، نفّذ السكربتات داخل الحاوية:
docker exec -it rehab-oracle sqlplus rehab/pwd@//localhost:1521/FREEPDB1 @/db/00_install_all.sql
# الواجهة على http://localhost:3000  | ORDS على http://localhost:8080/ords
```

## 7) النسخ الاحتياطي والمراقبة
- نسخ احتياطي تلقائي لـ ATP، وتفعيل Audit Trail (لدينا `SEC_AUDIT_LOG`).
- مراقبة عبر OCI Monitoring + Vercel Analytics.
