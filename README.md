# منصة التأهيل والتوظيف — مستودع المدينة المنورة الخيري

منصة احترافية تربط المستفيدين بفرص **التدريب والتأهيل والتوظيف** المقدّمة من الشركات
والمعاهد وشركات التوظيف والجهات المانحة، مع الجمعية كوسيط موثوق.

## المكدّس التقني
- **الخلفية**: Oracle Database 23ai · APEX · ORDS · REST · JWT · RBAC
- **الواجهة**: Next.js 15 · TypeScript · Tailwind · ShadCN · React Query · Axios · NextAuth · PWA
- **النشر**: Vercel (واجهة) · Oracle Cloud OCI (خلفية) · Cloudflare (DNS/SSL) · GitHub Actions

## بنية المستودع
```
rehab_employment/
├── db/                     سكربتات Oracle (مرقّمة بترتيب التنفيذ)
│   ├── 00_install_all.sql  المُثبّت الرئيسي
│   ├── 01_schema_core.sql  المستخدمون + RBAC + التوكنات + التدقيق
│   ├── 02_schema_entities.sql   المنظمات/المستفيدون/التصنيفات/المهارات/الوثائق
│   ├── 03_schema_opportunities.sql  الوظائف/البرامج/التبرعات
│   ├── 04_schema_applications.sql   الطلبات/المطابقة/المقابلات/العروض/الخطابات/الإشعارات
│   ├── 05_constraints_fk.sql   العلاقات (Foreign Keys)
│   ├── 06_seed_data.sql    البيانات المرجعية والتجريبية
│   ├── 07_views.sql        العروض (Views) للوحات والتقارير
│   ├── 08_pkg_matching.sql محرك المطابقة الذكي (0–100)
│   ├── 09_pkg_security.sql تجزئة كلمات المرور + JWT + RBAC
│   ├── 10_pkg_business.sql التسجيل/الطلبات/الخطابات/الإشعارات/التبرعات
│   └── 11_ords_rest.sql    تعريف REST APIs عبر ORDS
├── frontend/               تطبيق Next.js 15
│   ├── src/app/            الصفحات (home, jobs, dashboard, login, ...)
│   ├── src/lib/            api.ts · auth.ts · types.ts (طبقة التكامل)
│   ├── src/middleware.ts   حماية المسارات (RBAC)
│   └── Dockerfile · vercel.json
├── deploy/                 docker-compose (Oracle + ORDS + الواجهة)
├── docs/                   التحليل · ERD · دليل النشر · OpenAPI/Swagger
└── .github/workflows/ci.yml  خط CI/CD
```

## التشغيل السريع
### الخلفية (قاعدة البيانات)
```bash
sql rehab/<pwd>@//host:1521/FREEPDB1
@db/00_install_all.sql
-- بعد تفعيل ORDS على السكيمة:
@db/11_ords_rest.sql
```
### الواجهة
```bash
cd frontend
cp .env.example .env.local   # واضبط القيم
npm install
npm run dev                  # http://localhost:3000
```
### الكل عبر Docker
```bash
cd deploy && docker compose up -d
```

## حسابات تجريبية (بعد seed)
| المستخدم | النوع | البريد |
|---------|------|--------|
| admin | مدير النظام | admin@madinah-rehab.sa |
| staff1 | موظف الجمعية | staff@madinah-rehab.sa |
| ahmed | مستفيد | ahmed@example.com |

> كلمات المرور التجريبية في seed وهمية (hash ثابت)؛ أنشئ مستخدمين حقيقيين عبر
> `RE_APP_PKG.register_user` الذي يولّد التجزئة بشكل صحيح.

## محرك المطابقة
`RE_MATCH_PKG.score_job(benef_id, job_id)` يُرجع درجة 0–100 بأوزان:
التخصص 30 · المهارات 30 · المؤهل 15 · الخبرة 10 · المدينة 10 · الرغبات 5.

## الحالة الحالية وما يلي
هذا **أساس جاهز للتشغيل** يغطي: قاعدة البيانات كاملة، طبقة REST، وواجهة بصفحات تمثيلية.
الخطوات التالية المقترحة (مراحل لاحقة):
- توسعة صفحات الواجهة: تفاصيل الوظيفة/البرنامج، ملف المستفيد، لوحات الشركة/المعهد/المانح، الإدارة.
- مكوّنات ShadCN UI كاملة + الرسوم البيانية (recharts) في التقارير.
- توليد PDF للخطابات + QR، وتكامل قنوات الإشعارات (SMS/WhatsApp/Email/Push).
- اختبارات (Jest/Playwright) وتغطية CI أوسع.
```
