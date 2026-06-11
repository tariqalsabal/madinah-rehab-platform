"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { JobsApi } from "@/lib/api";

// صفحة الوظائف: قائمة الوظائف المنشورة مع بحث، عبر React Query + ORDS
export default function JobsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs", q],
    queryFn: () => JobsApi.list({ q: q || undefined }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-brand-dark">الوظائف المتاحة</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث بالمسمى الوظيفي…"
          className="w-64 rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {isLoading && <p className="text-muted-foreground">جارٍ التحميل…</p>}
      {error && <p className="text-red-600">تعذّر تحميل الوظائف.</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((job) => (
          <a key={job.job_id} href={`/jobs/${job.job_id}`} className="card hover:border-brand hover:shadow-md">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-brand-dark">{job.title}</h3>
              <span className="badge">{job.field_name}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{job.org_name}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>📍 {job.city || "غير محدّد"}</span>
              <span>💼 {job.employment_type}</span>
              {job.salary_min && <span>💰 {job.salary_min}–{job.salary_max} ر.س</span>}
            </div>
            <p className="mt-3 text-xs text-brand">{job.applicants ?? 0} متقدّم · {job.vacancies} شاغر</p>
          </a>
        ))}
      </div>

      {data && data.items.length === 0 && (
        <p className="text-muted-foreground">لا توجد وظائف مطابقة.</p>
      )}
    </div>
  );
}
