"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CompaniesApi } from "@/lib/api";

const TYPES: { key: string; label: string }[] = [
  { key: "", label: "الكل" },
  { key: "COMPANY", label: "الشركات" },
  { key: "INSTITUTE", label: "المعاهد" },
  { key: "RECRUITER", label: "شركات التوظيف" },
  { key: "DONOR", label: "الجهات المانحة" },
];

const TYPE_LABEL: Record<string, string> = {
  COMPANY: "شركة", INSTITUTE: "معهد", RECRUITER: "شركة توظيف", DONOR: "جهة مانحة",
};

// صفحة الشركاء (الشركات/المعاهد/شركات التوظيف) — GET /companies
export default function CompaniesPage() {
  const [type, setType] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["companies", type],
    queryFn: () => CompaniesApi.list({ type: type || undefined }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">الشركاء المعتمدون</h1>

      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              type === t.key ? "bg-brand text-white" : "bg-brand-light text-brand-dark"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">جارٍ التحميل…</p>}
      {error && <p className="text-red-600">تعذّر تحميل الشركاء.</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((o) => (
          <div key={o.org_id} className="card-brand">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-brand-dark">{o.brand_name || o.legal_name}</h3>
              <span className="badge">{TYPE_LABEL[o.org_type]}</span>
            </div>
            {o.brand_name && <p className="mt-1 text-xs text-muted-foreground">{o.legal_name}</p>}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {o.sector && <span>🏷️ {o.sector}</span>}
              {o.city && <span>📍 {o.city}</span>}
            </div>
            {o.website && (
              <a href={o.website} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-brand">
                الموقع الإلكتروني ↗
              </a>
            )}
          </div>
        ))}
      </div>

      {data && data.items.length === 0 && (
        <p className="text-muted-foreground">لا يوجد شركاء في هذا التصنيف بعد.</p>
      )}
    </div>
  );
}
