"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { JobsApi } from "@/lib/api";

// صفحة تفاصيل الوظيفة — تعتمد على GET /jobs/:id
export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const { data: job, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: () => JobsApi.get(id),
    enabled: Number.isFinite(id),
  });

  if (isLoading) return <p className="text-muted-foreground">جارٍ التحميل…</p>;
  if (error || !job) return <p className="text-red-600">تعذّر العثور على الوظيفة.</p>;

  const j = job as any; // العرض RE_V_JOBS يحوي حقولاً إضافية
  const rows: [string, any][] = [
    ["الجهة", j.org_name],
    ["المدينة", j.city],
    ["نمط العمل", j.work_mode],
    ["نوع التوظيف", j.employment_type],
    ["المجال", j.field_name],
    ["المسمّى الوظيفي", j.function_name],
    ["المؤهل الأدنى", j.min_education],
    ["الخبرة (سنوات)", j.min_experience],
    ["الراتب", j.salary_min ? `${j.salary_min} – ${j.salary_max} ر.س` : "غير محدّد"],
    ["عدد الشواغر", j.vacancies],
    ["المتقدّمون", j.applicants ?? 0],
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

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push(`/login?callbackUrl=/jobs/${id}`)}
            className="btn-primary"
          >
            التقديم على الوظيفة
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          يتطلب التقديم تسجيل الدخول كمستفيد معتمد.
        </p>
      </div>
    </div>
  );
}
