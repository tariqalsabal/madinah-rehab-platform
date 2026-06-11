// عن الجمعية
export default function AboutPage() {
  const values = [
    { t: "الموثوقية", d: "الجمعية وسيط معتمد بين المستفيد وصاحب الفرصة، يضمن جدّية الطرفين." },
    { t: "الكرامة", d: "نحفظ خصوصية المستفيد ونمنحه خيار إخفاء هويته حتى يطمئن." },
    { t: "الأثر", d: "تبرّعٌ يصنع وظائف ومقاعد تدريب حقيقية، لا مجرّد أرقام." },
    { t: "التمكين", d: "تأهيل وتدريب يسبق التوظيف، ليصل المستفيد جاهزاً لسوق العمل." },
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <section className="brand-gradient rounded-3xl p-10 text-center text-white">
        <h1 className="text-3xl font-bold">عن المنصة</h1>
        <p className="mx-auto mt-4 max-w-2xl text-white/85">
          منصة التأهيل والتوظيف إحدى مبادرات جمعية مستودع المدينة المنورة الخيري، تهدف إلى ربط
          المستفيدين بفرص التدريب والتأهيل والتوظيف عبر شبكة من الشركات والمعاهد وشركات التوظيف
          والجهات المانحة، ضمن منظومة موثوقة تحفظ كرامة المستفيد وتصنع له مساراً مهنياً مستداماً.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card-brand">
          <h2 className="text-lg font-bold text-brand-dark">رؤيتنا</h2>
          <p className="mt-2 text-sm text-muted-foreground">أن نكون الجسر الأوثق الذي يحوّل العطاء الخيري إلى فرص عملٍ كريمة في المدينة المنورة وما حولها.</p>
        </div>
        <div className="card-brand">
          <h2 className="text-lg font-bold text-brand-dark">رسالتنا</h2>
          <p className="mt-2 text-sm text-muted-foreground">تمكين المستفيدين عبر مطابقة ذكية بين قدراتهم والفرص المتاحة، ودعمهم بالتدريب والتوصية والمتابعة حتى التوظيف.</p>
        </div>
      </section>

      <section>
        <h2 className="mb-5 text-center text-2xl font-bold text-brand-dark">قيمنا</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.t} className="card-brand border-t-4 border-t-gold">
              <h3 className="font-semibold text-brand-dark">{v.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
