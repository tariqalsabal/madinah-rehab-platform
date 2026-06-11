import Link from "next/link";
import { StatsBand } from "@/components/StatsBand";
import {
  Users, Building2, GraduationCap, Briefcase, HandHeart,
  Search, FileCheck, Award, UserPlus, ArrowLeft,
} from "lucide-react";

// الصفحة الرئيسية — تصميم احترافي بهوية الجمعية
export default function HomePage() {
  const audiences = [
    { icon: Users, t: "المستفيدون", d: "أنشئ ملفك، ارفع سيرتك، وتقدّم على الفرص المناسبة لك.", href: "/register?type=BENEFICIARY" },
    { icon: Building2, t: "الشركات", d: "انشر وظائفك واستعرض المرشحين المؤهّلين عبر الجمعية.", href: "/register?type=COMPANY" },
    { icon: GraduationCap, t: "المعاهد", d: "أضف برامجك التدريبية وقدّم مقاعد ومنحاً مدعومة.", href: "/register?type=INSTITUTE" },
    { icon: HandHeart, t: "الجهات المانحة", d: "تبرّع بوظائف أو مقاعد تدريبية وتابع أثر عطائك.", href: "/register?type=DONOR" },
  ];
  const steps = [
    { icon: UserPlus, t: "سجّل وأنشئ ملفك", d: "حساب موحّد لكل الأطراف مع تحقّق واعتماد من الجمعية." },
    { icon: Search, t: "مطابقة ذكية", d: "محرك يحسب نسبة توافقك مع كل فرصة من 0 إلى 100%." },
    { icon: FileCheck, t: "تقديم ومتابعة", d: "قدّم على الوظائف والبرامج وتابع حالتك لحظياً." },
    { icon: Award, t: "توظيف وخطابات", d: "خطابات تعريف موثّقة برمز QR ومتابعة حتى التوظيف." },
  ];
  const donations = [
    { icon: Briefcase, t: "تبرع وظيفي", d: "شركة تتبرّع بعدد وظائف (مثال: 10 محاسب، 20 مبيعات)." },
    { icon: GraduationCap, t: "تبرع تدريبي", d: "معهد يقدّم مقاعد مجانية أو خصماً 50%/100% أو منحة." },
    { icon: HandHeart, t: "تبرع توظيفي", d: "شركة توظيف توفّر فرصاً أو ترعى عملية التوظيف كاملة." },
  ];

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="brand-gradient relative overflow-hidden rounded-3xl p-10 text-center text-white md:p-16">
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <span className="relative inline-block rounded-full bg-white/15 px-4 py-1 text-sm">جمعية مستودع المدينة المنورة الخيري</span>
        <h1 className="relative mt-5 text-3xl font-bold leading-snug md:text-5xl">
          جسرٌ موثوق بين المستفيدين<br className="hidden md:block" /> وفرص العمل والتأهيل
        </h1>
        <p className="relative mx-auto mt-5 max-w-2xl text-white/85 md:text-lg">
          نربط المستفيدين بالشركات والمعاهد وشركات التوظيف والجهات المانحة، عبر محرك مطابقة ذكي
          ونظام تبرعات وظيفية وتدريبية يصنع أثراً حقيقياً.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/jobs" className="btn-gold flex items-center gap-2">تصفّح الوظائف <ArrowLeft size={18} /></Link>
          <Link href="/programs" className="rounded-lg border border-white/70 px-5 py-2 font-medium text-white transition hover:bg-white/10">
            البرامج التدريبية
          </Link>
        </div>
      </section>

      {/* إحصائيات حيّة */}
      <StatsBand />

      {/* كيف تعمل المنصة */}
      <section>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-brand-dark md:text-3xl">كيف تعمل المنصة؟</h2>
          <p className="mt-2 text-muted-foreground">أربع خطوات من التسجيل إلى التوظيف.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.t} className="card-brand relative">
              <span className="absolute left-4 top-4 text-3xl font-bold text-brand-light">{i + 1}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
                <s.icon size={24} />
              </span>
              <h3 className="mt-4 font-semibold text-brand-dark">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* أنواع التبرعات */}
      <section className="rounded-3xl bg-brand-light p-8 md:p-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-brand-dark md:text-3xl">مفهوم جديد للتبرّع</h2>
          <p className="mt-2 text-muted-foreground">عطاءٌ يصنع وظائف وفرص تدريب، لا مجرّد مبالغ.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {donations.map((d) => (
            <div key={d.t} className="rounded-xl border-t-4 border-t-gold bg-white p-6 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-light text-gold-dark">
                <d.icon size={24} />
              </span>
              <h3 className="mt-4 font-semibold text-brand-dark">{d.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* الجمهور المستهدف */}
      <section>
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-brand-dark md:text-3xl">انضمّ إلى المنصة</h2>
          <p className="mt-2 text-muted-foreground">اختر دورك وابدأ الآن.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
          {audiences.map((a) => (
            <Link key={a.t} href={a.href} className="card-brand group hover:-translate-y-1 hover:shadow-md">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand transition group-hover:bg-brand group-hover:text-white">
                <a.icon size={24} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-brand-dark">{a.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{a.d}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="brand-gradient flex flex-col items-center gap-4 rounded-3xl p-10 text-center text-white">
        <h2 className="text-2xl font-bold md:text-3xl">جاهز لتبدأ رحلتك؟</h2>
        <p className="max-w-xl text-white/85">سجّل اليوم وكن جزءاً من منظومة تأهيل وتوظيف موثوقة في المدينة المنورة.</p>
        <Link href="/register" className="btn-gold mt-2">إنشاء حساب مجاني</Link>
      </section>
    </div>
  );
}
