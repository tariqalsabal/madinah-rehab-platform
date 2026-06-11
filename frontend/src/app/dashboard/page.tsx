"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardApi } from "@/lib/api";
import type { DashboardKpis } from "@/lib/types";

// لوحة المؤشرات (Dashboard) — تعرض إحصائيات المنصة من RE_V_DASHBOARD
const KPIS: { key: keyof DashboardKpis; label: string; suffix?: string }[] = [
  { key: "total_beneficiaries", label: "إجمالي المستفيدين" },
  { key: "approved_beneficiaries", label: "مستفيدون معتمدون" },
  { key: "open_jobs", label: "وظائف منشورة" },
  { key: "open_programs", label: "برامج تدريبية" },
  { key: "companies", label: "الشركات" },
  { key: "institutes", label: "المعاهد" },
  { key: "total_hired", label: "تم توظيفهم" },
  { key: "total_trainees", label: "متدربون" },
  { key: "hire_rate_pct", label: "نسبة التوظيف", suffix: "%" },
  { key: "job_donation_units", label: "تبرعات وظيفية (وحدة)" },
  { key: "training_donation_units", label: "تبرعات تدريبية (مقعد)" },
  { key: "total_donation_value", label: "قيمة التبرعات", suffix: " ر.س" },
];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["kpis"], queryFn: DashboardApi.kpis });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">لوحة المؤشرات</h1>
      {isLoading && <p className="text-muted-foreground">جارٍ التحميل…</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.key} className="card-brand">
            <p className="text-sm text-muted-foreground">{k.label}</p>
            <p className="mt-2 text-3xl font-bold text-brand">
              {data ? `${data[k.key] ?? 0}${k.suffix ?? ""}` : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
