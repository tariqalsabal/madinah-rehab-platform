"use client";

import { useQuery } from "@tanstack/react-query";
import { ProgramsApi } from "@/lib/api";

// صفحة البرامج التدريبية — تعتمد على GET /programs
export default function ProgramsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["programs"],
    queryFn: () => ProgramsApi.list(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">البرامج التدريبية</h1>
      {isLoading && <p className="text-muted-foreground">جارٍ التحميل…</p>}
      {error && <p className="text-red-600">تعذّر تحميل البرامج.</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((p) => (
          <div key={p.program_id} className="card-brand">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-brand-dark">{p.title}</h3>
              {p.is_free === "Y" ? (
                <span className="badge-gold">مجاني</span>
              ) : p.discount_pct > 0 ? (
                <span className="badge-gold">خصم {p.discount_pct}%</span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.org_name}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>📍 {p.city || "—"}</span>
              <span>🎓 {p.prog_level}</span>
              <span>🖥️ {p.delivery_mode}</span>
              {p.certificate === "Y" && <span>📜 بشهادة</span>}
            </div>
            <p className="mt-3 text-xs text-brand">
              مقاعد متاحة: {p.seats_available}
              {p.start_date ? ` · يبدأ ${String(p.start_date).slice(0, 10)}` : ""}
            </p>
          </div>
        ))}
      </div>

      {data && data.items.length === 0 && (
        <p className="text-muted-foreground">لا توجد برامج منشورة حالياً.</p>
      )}
    </div>
  );
}
