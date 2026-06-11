"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardApi } from "@/lib/api";
import { Users, Briefcase, GraduationCap, HandHeart } from "lucide-react";

// شريط إحصائيات حيّ من قاعدة البيانات (RE_V_DASHBOARD)
export function StatsBand() {
  const { data } = useQuery({ queryKey: ["home-kpis"], queryFn: DashboardApi.kpis });
  const items = [
    { icon: Users, label: "مستفيد", value: data?.total_beneficiaries },
    { icon: Briefcase, label: "وظيفة منشورة", value: data?.open_jobs },
    { icon: GraduationCap, label: "برنامج تدريبي", value: data?.open_programs },
    { icon: HandHeart, label: "تبرع وظيفي/تدريبي", value: (data ? (data.job_donation_units + data.training_donation_units) : undefined) },
  ];
  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="card-brand flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand">
            <it.icon size={22} />
          </span>
          <div>
            <div className="text-2xl font-bold text-brand">{it.value ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{it.label}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
