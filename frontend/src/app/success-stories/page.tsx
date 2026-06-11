// قصص النجاح
const STORIES = [
  { name: "أحمد · محاسب", city: "المدينة المنورة", text: "سجّلت في المنصة بعد تخرّجي، ووصلتني فرصة محاسب بنسبة توافق 88%. بعد مقابلة واحدة حصلت على الوظيفة، وكانت ضمن تبرّع وظيفي من إحدى الشركات." },
  { name: "نورة · خدمة عملاء", city: "جدة", text: "ترددت في البداية خوفاً من ظهور اسمي، لكن خيار إخفاء الهوية طمأنني. تواصلت معي الشركة عبر الرسائل، ثم كشفت هويتي بثقة وتم توظيفي." },
  { name: "خالد · تقنية معلومات", city: "ينبع", text: "لم تكن لديّ خبرة كافية، فالتحقت ببرنامج تدريبي مجاني عبر منحة من معهد، وبعد إتمامه رشّحتني الجمعية لوظيفة دعم فني." },
];

export default function SuccessStoriesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand-dark">قصص نجاح</h1>
        <p className="mt-2 text-muted-foreground">نماذج لأثر المنصة في حياة المستفيدين.</p>
      </div>
      <div className="space-y-5">
        {STORIES.map((s) => (
          <div key={s.name} className="card-brand border-r-4 border-r-gold">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-xl font-bold text-white">{s.name.slice(0, 1)}</span>
              <div>
                <p className="font-semibold text-brand-dark">{s.name}</p>
                <p className="text-xs text-muted-foreground">📍 {s.city}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">«{s.text}»</p>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">* قصص توضيحية تمثّل نماذج الاستفادة من المنصة.</p>
    </div>
  );
}
