"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ProgramsApi, ApplicationsApi } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { notifyEvent } from "@/lib/notify";

// تفاصيل البرنامج التدريبي + تسجيل المستفيد فيه
export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const { sessionStatus, primaryRole, me } = useMe();
  const [state, setState] = useState<"idle" | "loading" | "done" | "dup" | "error">("idle");
  const [msg, setMsg] = useState("");

  const { data: p, isLoading, error } = useQuery({
    queryKey: ["program", id],
    queryFn: () => ProgramsApi.get(id),
    enabled: Number.isFinite(id),
  });

  async function onApply() {
    if (sessionStatus !== "authenticated") { router.push(`/login?callbackUrl=/programs/${id}`); return; }
    if (primaryRole !== "BENEFICIARY" || !me?.benef_id) { setState("error"); setMsg("التسجيل متاح لحسابات المستفيدين فقط."); return; }
    setState("loading");
    try {
      await ApplicationsApi.applyProgram(me.benef_id, id);
      notifyEvent("تسجيل جديد في برنامج", `${me.full_name} → ${(p as any).title}`, [
        ["المتدرّب", me.full_name], ["البرنامج", (p as any).title], ["المعهد", (p as any).org_name],
      ]);
      setState("done");
    }
    catch (e: any) {
      if (String(e.message).includes("سبق") || String(e.message).includes("409")) setState("dup");
      else { setState("error"); setMsg(e.message || "تعذّر التسجيل"); }
    }
  }

  if (isLoading) return <p className="text-muted-foreground">جارٍ التحميل…</p>;
  if (error || !p) return <p className="text-red-600">تعذّر العثور على البرنامج.</p>;

  const rows: [string, any][] = [
    ["المعهد", p.org_name], ["المدينة", p.city], ["نمط التقديم", p.delivery_mode],
    ["المستوى", p.prog_level], ["المدة (ساعات)", p.duration_hours],
    ["المقاعد المتاحة", p.seats_available], ["الرسوم", p.is_free === "Y" ? "مجاني" : `${p.original_fee} ر.س (خصم ${p.discount_pct}%)`],
    ["شهادة", p.certificate === "Y" ? "نعم" : "لا"], ["تاريخ البدء", p.start_date ? String(p.start_date).slice(0, 10) : "—"],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => router.back()} className="text-sm text-brand">→ رجوع</button>
      <div className="card-brand">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold text-brand-dark">{p.title}</h1>
          {p.is_free === "Y" ? <span className="badge-gold">مجاني</span> : p.discount_pct > 0 ? <span className="badge-gold">خصم {p.discount_pct}%</span> : null}
        </div>
        <p className="mt-1 text-muted-foreground">{p.org_name}</p>

        <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {rows.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-dashed pb-2 text-sm">
              <dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{String(v)}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6">
          {sessionStatus === "authenticated" && primaryRole !== "BENEFICIARY" ? (
            <p className="rounded-lg bg-muted px-4 py-3 text-center text-sm text-muted-foreground">التسجيل متاح لحسابات المستفيدين فقط.</p>
          ) : state === "done" ? (
            <p className="rounded-lg bg-brand-light px-4 py-3 text-center text-brand-dark">✅ تم تسجيلك في البرنامج! تابعه من لوحتك.</p>
          ) : state === "dup" ? (
            <p className="rounded-lg bg-gold-light px-4 py-3 text-center text-gold-dark">سبق أن سجّلت في هذا البرنامج.</p>
          ) : (
            <>
              <button onClick={onApply} disabled={state === "loading" || p.seats_available <= 0} className="btn-primary disabled:opacity-60">
                {p.seats_available <= 0 ? "اكتملت المقاعد" : state === "loading" ? "جارٍ التسجيل…" : "التسجيل في البرنامج"}
              </button>
              {state === "error" && <p className="mt-2 text-sm text-red-600">{msg}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
