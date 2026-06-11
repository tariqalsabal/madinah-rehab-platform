import { Building2, Users, CalendarHeart, BadgeCheck, Target, HeartHandshake, Sparkles } from "lucide-react";

// عن الجمعية — محتوى رسمي
const STATS = [
  { icon: Building2, n: "14", l: "فرعاً للجمعية" },
  { icon: Users, n: "+10,000", l: "أسرة مستفيدة" },
  { icon: CalendarHeart, n: "30", l: "عاماً من العطاء" },
  { icon: BadgeCheck, n: "626", l: "رقم التسجيل" },
];

const TIMELINE = [
  { y: "1413هـ", e: "تأسيس فرع المدينة، وتشييد إدارة الخدمات، وإطلاق المنتج الخيري الأول (السلة الغذائية)." },
  { y: "1415هـ", e: "إنشاء مشروع هدية المدينة للزوار والحجاج." },
  { y: "1417هـ", e: "تأسيس فروع: الحناكية، العيص، المهد، النخيل، الواسطة." },
  { y: "1419هـ", e: "تأسيس فرع محافظة وادي الفرع." },
  { y: "1420هـ", e: "تأسيس فرعي العُلا وخيبر." },
  { y: "1422هـ", e: "تأسيس فرع محافظة بدر." },
  { y: "1423هـ", e: "تحويل المستودع إلى جمعية تابعة لوزارة الموارد البشرية، وإطلاق الهوية الجديدة، والخطة الإستراتيجية الأولى، وتأسيس فرع الرايس، وتدشين 90 منتجاً خيرياً." },
  { y: "1434هـ", e: "تأسيس فرعي وادي ريم وينبع النخل." },
  { y: "1436هـ", e: "افتتاح مصنع المياه، وإطلاق الخطة الإستراتيجية الثانية." },
  { y: "1440هـ", e: "تدشين وافتتاح مشروع حفظ النعمة." },
  { y: "1445هـ", e: "إطلاق الخطة الإستراتيجية الثالثة." },
  { y: "1446هـ", e: "تحديث الخطة التشغيلية والإستراتيجية." },
];

const VALUES = [
  { t: "نحن فريق عمل مبادر", d: "روح المبادرة والمبادأة في خدمة المستفيدين." },
  { t: "نعمل بإتقان وإبداع", d: "جودة في الأداء وابتكار في الحلول." },
  { t: "الاحتساب والشفافية", d: "نيّة خالصة ووضوح في كل ما نقدّم." },
];

const GOALS = [
  "تقديم المساعدات المادية والعينية للفئات المحتاجة.",
  "تحسين المستوى المعيشي للفئة المستفيدة.",
  "تأهيل الأسر المستفيدة وتمكينهم للاعتماد على أنفسهم.",
  "تدريب أبناء المستفيدين وتأهيلهم لسوق العمل.",
  "تنفيذ ودعم المشاريع والبرامج الموسمية.",
  "تقديم المساعدات الطارئة في أوقات الكوارث والأزمات.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-14">
      {/* من نحن */}
      <section className="brand-gradient rounded-3xl p-10 text-center text-white md:p-14">
        <span className="inline-block rounded-full bg-white/15 px-4 py-1 text-sm">من نحن</span>
        <h1 className="mt-4 text-3xl font-bold md:text-4xl">جمعية مستودع المدينة المنورة الخيري</h1>
        <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/90">
          جمعية خيرية غير ربحية مسجّلة بالمركز الوطني لتنمية القطاع غير الربحي برقم <b>626</b>، أُنشئت
          عام <b>1415هـ</b> لترعى الأسر المستفيدة وتغطي احتياجات منطقة المدينة المنورة الجغرافية كاملة،
          ضمن تصنيف قطاع التنمية والإسكان، عبر <b>14 فرعاً</b>.
        </p>
      </section>

      {/* أرقام */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.l} className="card-brand text-center">
            <s.icon className="mx-auto text-brand" size={28} />
            <p className="mt-2 text-2xl font-bold text-brand-dark">{s.n}</p>
            <p className="text-xs text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </section>

      {/* الرؤية والرسالة */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="card-brand border-t-4 border-t-gold">
          <div className="flex items-center gap-2 text-brand-dark"><Sparkles size={20} /><h2 className="text-lg font-bold">رؤية الجمعية: 5%+</h2></div>
          <p className="mt-2 text-sm text-muted-foreground">العمل خلال السنوات الثلاث القادمة على زيادة:</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• تحسين الظروف المعيشية للأسر المستفيدة بنسبة 5%.</li>
            <li>• المشاركة التنموية بنسبة 5%.</li>
            <li>• المشاركة الاجتماعية بنسبة 5%.</li>
          </ul>
        </div>
        <div className="card-brand border-t-4 border-t-gold">
          <div className="flex items-center gap-2 text-brand-dark"><HeartHandshake size={20} /><h2 className="text-lg font-bold">رسالة الجمعية</h2></div>
          <p className="mt-3 leading-8 text-sm text-muted-foreground">
            «المساهمة الفاعلة والمستدامة في تحسين الظروف المعيشية للأسر المستفيدة، وتعزيز مشاركتنا
            التنموية والاجتماعية».
          </p>
        </div>
      </section>

      {/* قصة الجمعية */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-brand-dark">قصة الجمعية</h2>
        <div className="relative space-y-5 border-r-2 border-brand-light pr-6">
          {TIMELINE.map((t) => (
            <div key={t.y} className="relative">
              <span className="absolute -right-[31px] top-1 h-3 w-3 rounded-full bg-gold ring-4 ring-brand-light" />
              <p className="font-bold text-brand">{t.y}</p>
              <p className="text-sm text-muted-foreground">{t.e}</p>
            </div>
          ))}
        </div>
      </section>

      {/* القيم */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-brand-dark">قيمنا المؤسسية</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.t} className="card-brand text-center">
              <h3 className="font-semibold text-brand-dark">{v.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* الأهداف */}
      <section className="rounded-3xl bg-brand-light p-8 md:p-10">
        <div className="mb-6 flex items-center justify-center gap-2 text-brand-dark"><Target size={24} /><h2 className="text-2xl font-bold">الأهداف</h2></div>
        <div className="grid gap-3 md:grid-cols-2">
          {GOALS.map((g, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-white p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <p className="text-sm text-muted-foreground">{g}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
