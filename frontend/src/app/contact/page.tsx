"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PublicApi } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { Card } from "@/components/dashboards/shared";

// تواصل بنا — يتيح لأي حساب مراسلة الجمعية مباشرةً
export default function ContactPage() {
  const { sessionStatus } = useMe();
  const support = useQuery({ queryKey: ["support"], queryFn: () => PublicApi.support() });

  const info = [
    { t: "البريد الإلكتروني", v: "info@mcw.sa" },
    { t: "المقر", v: "منطقة المدينة المنورة — المملكة العربية السعودية" },
    { t: "الفروع", v: "14 فرعاً تغطي المنطقة" },
    { t: "أوقات العمل", v: "الأحد – الخميس، 8 ص – 4 م" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="brand-gradient rounded-3xl p-10 text-center text-white">
        <h1 className="text-3xl font-bold">تواصل بنا</h1>
        <p className="mx-auto mt-3 max-w-xl text-white/85">فريق الجمعية جاهز لمساعدتك في أي استفسار يخص التسجيل أو الفرص أو التبرع.</p>
        {sessionStatus === "authenticated" && support.data?.user_id && (
          <Link href={`/messages?peer=${support.data.user_id}`} className="btn-gold mt-6 inline-block">مراسلة الجمعية الآن</Link>
        )}
        {sessionStatus !== "authenticated" && <Link href="/login" className="btn-gold mt-6 inline-block">سجّل الدخول للمراسلة</Link>}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {info.map((i) => (
          <Card key={i.t}>
            <p className="text-sm text-muted-foreground">{i.t}</p>
            <p className="mt-1 font-medium text-brand-dark" dir="auto">{i.v}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
