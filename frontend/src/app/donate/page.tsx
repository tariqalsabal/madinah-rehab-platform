"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Briefcase, GraduationCap, HandHeart, ShieldCheck, FileCheck2, HeartHandshake } from "lucide-react";
import { useMe } from "@/lib/useMe";

const TYPES = [
  {
    key: "JOB", icon: Briefcase, title: "تبرّع وظيفي",
    desc: "تتبرّع منشأتك بعددٍ من الوظائف لمسمّى محدّد (مثال: 10 محاسبين، 20 موظف مبيعات)، فتُتاح لمستفيدين مؤهّلين عبر المنصة.",
    steps: ["سجّل منشأتك كجهة مانحة أو شركة.", "من لوحتك اختر «تسجيل تبرّع» ثم النوع «وظيفي».", "حدّد المسمّى وعدد الوظائف والقيمة التقديرية.", "تتولّى الجمعية ترشيح المستفيدين ومتابعة التوظيف."],
  },
  {
    key: "TRAINING", icon: GraduationCap, title: "تبرّع تدريبي",
    desc: "يقدّم معهدك مقاعد تدريبية مجانية أو بخصم (50%/100%) أو منحاً، لتأهيل المستفيدين قبل دخولهم سوق العمل.",
    steps: ["سجّل معهدك أو مركز التدريب.", "أنشئ برنامجاً تدريبياً وحدّد نسبة الدعم أو المجانية.", "سجّل التبرّع بعدد المقاعد المتاحة.", "تُرشّح الجمعية المتدرّبين وتتابع إتمامهم وتخريجهم."],
  },
  {
    key: "RECRUITMENT", icon: HandHeart, title: "تبرّع توظيفي",
    desc: "توفّر شركة التوظيف عدداً من الفرص أو ترعى عملية التوظيف كاملة، فتربط الباحثين عن عمل بأصحاب الفرص.",
    steps: ["سجّل شركة التوظيف لديك.", "اختر «تسجيل تبرّع» ثم النوع «توظيفي».", "حدّد عدد الفرص أو نطاق الرعاية.", "تنسّق الجمعية مع المستفيدين حتى إتمام التوظيف."],
  },
];

function DonateContent() {
  const sp = useSearchParams();
  const filter = sp.get("type");
  const { sessionStatus, primaryRole } = useMe();
  const isOrg = ["COMPANY", "INSTITUTE", "DONOR"].includes(primaryRole);
  const shown = filter ? TYPES.filter((t) => t.key === filter) : TYPES;

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <section className="brand-gradient rounded-3xl p-10 text-center text-white md:p-14">
        <span className="inline-block rounded-full bg-white/15 px-4 py-1 text-sm">مفهوم جديد للتبرّع</span>
        <h1 className="mt-4 text-3xl font-bold md:text-4xl">تبرّعك يصنع وظيفةً ومستقبلاً</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-8 text-white/90">
          لا تتوقّف عند المبلغ — تبرّعٌ يتحوّل إلى فرص عملٍ ومقاعد تدريبٍ حقيقية، فيكون أثره ممتدّاً في
          حياة أسرةٍ كاملة. <span className="font-semibold text-gold-light">«مَن دلَّ على خيرٍ فله مثل أجر فاعله».</span>
        </p>
      </section>

      <section className="space-y-6">
        {shown.map((t) => (
          <div key={t.key} id={t.key} className="card-brand">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-light text-gold-dark"><t.icon size={24} /></span>
              <h2 className="text-xl font-bold text-brand-dark">{t.title}</h2>
            </div>
            <p className="mt-3 leading-7 text-muted-foreground">{t.desc}</p>
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-brand-dark">خطوات التبرّع:</p>
              <ol className="space-y-2">
                {t.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {sessionStatus === "authenticated" && isOrg ? (
                <Link href="/dashboard" className="btn-primary text-sm">سجّل التبرّع من لوحتك</Link>
              ) : (
                <Link href="/register?type=DONOR" className="btn-primary text-sm">سجّل كجهة مانحة</Link>
              )}
              <Link href="/contact" className="rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand">تواصل مع الجمعية</Link>
            </div>
          </div>
        ))}
      </section>

      {/* الأجر والأثر */}
      <section className="rounded-3xl bg-brand-light p-8 md:p-10">
        <div className="mb-6 flex items-center justify-center gap-2 text-brand-dark"><HeartHandshake size={24} /><h2 className="text-2xl font-bold">الأجر والأثر</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { t: "صدقة جارية", d: "وظيفةٌ تُعيل أسرةً أثرها ممتدٌّ ما دام صاحبها ينتفع بها." },
            { t: "تمكين لا إعالة", d: "تنقل المستفيد من الحاجة إلى الاكتفاء والعطاء." },
            { t: "تنمية مجتمع", d: "كل فرصةٍ ترفع الأسرة وتُعزّز اقتصاد المدينة المنورة." },
          ].map((b) => (
            <div key={b.t} className="rounded-xl bg-white p-5 text-center">
              <h3 className="font-semibold text-brand-dark">{b.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* الشفافية */}
      <section className="card-brand">
        <div className="mb-3 flex items-center gap-2 text-brand-dark"><ShieldCheck size={22} /><h2 className="text-xl font-bold">التزامنا بالشفافية</h2></div>
        <p className="leading-7 text-muted-foreground">
          تلتزم جمعية مستودع المدينة المنورة الخيري بأعلى معايير الشفافية والحوكمة. تُزوّدك الجمعية بكل
          ما يلزم لضمان سير عملك وأثر تبرّعك:
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            "تقارير دورية عن أثر التبرّع وعدد المستفيدين منه.",
            "شهادات وخطابات شكر معتمدة للجهة المانحة.",
            "متابعة موثّقة لكل وظيفة أو مقعد حتى إتمامه.",
            "إفصاح واضح عن آلية الترشيح والصرف.",
          ].map((x, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <FileCheck2 size={18} className="mt-0.5 shrink-0 text-brand" /> {x}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function DonatePage() {
  return <Suspense fallback={<p className="text-center text-muted-foreground">…</p>}><DonateContent /></Suspense>;
}
