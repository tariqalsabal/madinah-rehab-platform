"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { JobsApi, ApplicationsApi } from "@/lib/api";
import { useMe } from "@/lib/useMe";

// صفحة تفاصيل الوظيفة + تقديم فعلي (يحلّ benef_id من الجلسة)
export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const { sessionStatus, primaryRole, me } = useMe();
  const [applyState, setApplyState] = useState<"idle" | "loading" | "done" | "dup" | "error">("idle");
  const [applyMsg, setApplyMsg] = useState("");

  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: () => JobsApi.get(id),
    enabled: Number.isFinite(id),
  });

  async function onApply() {
    if (sessionStatus !== "authenticated") {
      router.push(`/login?callbackUrl=/jobs/${id}`);
      return;
    }
    if (primaryRole !== "BENEFICIARY" || !me?.benef_id) {
      setApplyState("error");
      setApplyMsg("التقديم متاح لحسابات المستفيدين فقط.");
      return;
    }
    setApplyState("loading");
    try {
      await ApplicationsApi.applyJob(me.benef_id, id);
      setApplyState("done");
    } catch (e: any) {
      if (String(e.message).includes("سبق") || String(e.message).includes("409")) {
        setApplyState("dup");
      } else {
        setApplyState("error");
        setApplyMsg(e.message || "تعذّر التقديم");
      }
    }
  }

  if (isLoading) return <p className="text-muted-foreground">جارٍ التحميل…</p>;
  if (error || !job) return <p className="text-red-600">تعذّر العثور على الوظيفة.</p>;

  const j = job as any;
  const rows: [string, any][] = [
    ["الجهة", j.org_name], ["المدينة", j.city], ["نمط العمل", j.work_mode],
    ["نوع التوظيف", j.employment_type], ["المجال", j.field_name], ["المسمّى الوظيفي", j.function_name],
    ["المؤهل الأدنى", j.min_education], ["الخبرة (سنوات)", j.min_experience],
    ["الراتب", j.salary_min ? `${j.salary_min} – ${j.salary_max} ر.س` : "غير محدّد"],
    ["عدد الشواغر", j.vacancies], ["المتقدّمون", j.applicants ?? 0],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => router.back()} className="text-sm text-brand">→ رجوع</button>
      <div className="card-brand">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold text-brand-dark">{j.title}</h1>
          {j.field_name && <span className="badge-gold">{j.field_name}</span>}
        </div>
        <p className="mt-1 text-muted-foreground">{j.org_name}</p>

        <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {rows.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-dashed pb-2 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium">{String(v)}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6">
          {/* التقديم متاح للمستفيدين فقط؛ يُخفى عن باقي الأدوار */}
          {sessionStatus === "authenticated" && primaryRole !== "BENEFICIARY" ? (
            <p className="rounded-lg bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
              التقديم متاح لحسابات المستفيدين فقط.
            </p>
          ) : applyState === "done" ? (
            <p className="rounded-lg bg-brand-light px-4 py-3 text-center text-brand-dark">✅ تم تقديم طلبك بنجاح! تابعه من لوحتك.</p>
          ) : applyState === "dup" ? (
            <p className="rounded-lg bg-gold-light px-4 py-3 text-center text-gold-dark">سبق أن قدّمت على هذه الوظيفة.</p>
          ) : (
            <>
              <button onClick={onApply} disabled={applyState === "loading"} className="btn-primary disabled:opacity-60">
                {applyState === "loading" ? "جارٍ التقديم…" : "التقديم على الوظيفة"}
              </button>
              {applyState === "error" && <p className="mt-2 text-sm text-red-600">{applyMsg}</p>}
              {sessionStatus !== "authenticated" && (
                <p className="mt-2 text-xs text-muted-foreground">سيُطلب تسجيل الدخول كمستفيد لإتمام التقديم.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
