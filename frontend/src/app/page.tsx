import Link from "next/link";

// الصفحة الرئيسية (Home)
export default function HomePage() {
  const audiences = [
    { t: "المستفيدون", d: "أنشئ ملفك، ارفع سيرتك، وتقدّم على الفرص المناسبة.", href: "/register?type=BENEFICIARY" },
    { t: "الشركات", d: "انشر وظائفك واستعرض المرشحين المؤهّلين عبر الجمعية.", href: "/register?type=COMPANY" },
    { t: "المعاهد", d: "أضف برامجك التدريبية وقدّم مقاعد ومنحاً مدعومة.", href: "/register?type=INSTITUTE" },
    { t: "شركات التوظيف", d: "اربط الباحثين عن عمل بالفرص المتاحة.", href: "/register?type=RECRUITER" },
  ];
  return (
    <div className="space-y-12">
      <section className="brand-gradient relative overflow-hidden rounded-3xl p-10 text-center text-white md:p-16">
        {/* لمسة ذهبية من القمح */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-gold/20 blur-2xl" />
        <h1 className="relative text-3xl font-bold md:text-4xl">
          جسرٌ موثوق بين المستفيدين وفرص العمل والتأهيل
        </h1>
        <p className="relative mx-auto mt-4 max-w-2xl text-white/85">
          منصة جمعية مستودع المدينة المنورة الخيري لربط المستفيدين بالشركات والمعاهد وشركات التوظيف
          والجهات المانحة، عبر محرك مطابقة ذكي ونظام تبرعات وظيفية وتدريبية.
        </p>
        <div className="relative mt-7 flex justify-center gap-3">
          <Link href="/jobs" className="btn-gold">تصفّح الوظائف</Link>
          <Link href="/programs" className="rounded-lg border border-white/70 px-4 py-2 font-medium text-white transition hover:bg-white/10">
            البرامج التدريبية
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-4">
        {audiences.map((a) => (
          <Link key={a.t} href={a.href} className="card-brand hover:-translate-y-1 hover:shadow-md">
            <h3 className="text-lg font-semibold text-brand-dark">{a.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{a.d}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
