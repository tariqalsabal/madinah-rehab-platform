"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { DashboardApi, AdminApi } from "@/lib/api";
import type { DashboardKpis } from "@/lib/types";
import { Badge, Card, Table, Empty } from "./shared";

const KPIS: { key: keyof DashboardKpis; label: string; suffix?: string }[] = [
  { key: "total_beneficiaries", label: "المستفيدون" },
  { key: "open_jobs", label: "وظائف منشورة" },
  { key: "open_programs", label: "برامج" },
  { key: "companies", label: "الشركات" },
  { key: "total_hired", label: "تم توظيفهم" },
  { key: "total_trainees", label: "متدربون" },
  { key: "hire_rate_pct", label: "نسبة التوظيف", suffix: "%" },
  { key: "total_donation_value", label: "قيمة التبرعات", suffix: " ر.س" },
];

// لوحة الأدمن: مؤشرات + إدارة الحسابات + الطلبات + التبرعات
export default function AdminDashboard({ actor }: { actor: number }) {
  const [tab, setTab] = useState<"users" | "apps" | "donations">("users");
  const qc = useQueryClient();
  const { data: kpis } = useQuery({ queryKey: ["kpis"], queryFn: DashboardApi.kpis });
  const users = useQuery({ queryKey: ["admin-users", actor], queryFn: () => AdminApi.users(actor), enabled: tab === "users" });
  const apps = useQuery({ queryKey: ["admin-apps", actor], queryFn: () => AdminApi.applications(actor), enabled: tab === "apps" });
  const dons = useQuery({ queryKey: ["admin-dons", actor], queryFn: () => AdminApi.donations(actor), enabled: tab === "donations" });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => AdminApi.setUserStatus(id, status, actor),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users", actor] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">لوحة الأدمن</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.key} className="card-brand">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-1 text-2xl font-bold text-brand">{kpis ? `${kpis[k.key] ?? 0}${k.suffix ?? ""}` : "—"}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {[["users", "الحسابات"], ["apps", "الطلبات"], ["donations", "التبرعات"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`rounded-full px-4 py-1.5 text-sm ${tab === k ? "bg-brand text-white" : "bg-brand-light text-brand-dark"}`}>{l}</button>
        ))}
      </div>

      {tab === "users" && (
        <Card title="إدارة الحسابات">
          {users.isLoading ? <Empty text="جارٍ التحميل…" /> : !users.data?.length ? <Empty text="لا توجد حسابات" /> : (
            <Table head={["الاسم", "البريد", "النوع", "الحالة", "إجراء"]}>
              {users.data.map((u: any) => (
                <tr key={u.user_id} className="border-b">
                  <td className="px-2 py-2">{u.full_name}</td>
                  <td className="px-2 py-2 text-muted-foreground" dir="ltr">{u.email}</td>
                  <td className="px-2 py-2">{u.user_type}</td>
                  <td className="px-2 py-2"><Badge status={u.status} /></td>
                  <td className="px-2 py-2">
                    {u.status === "SUSPENDED" ? (
                      <button onClick={() => setStatus.mutate({ id: u.user_id, status: "ACTIVE" })} className="text-xs text-brand">تفعيل</button>
                    ) : (
                      <button onClick={() => setStatus.mutate({ id: u.user_id, status: "SUSPENDED" })} className="text-xs text-red-600">إيقاف</button>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === "apps" && (
        <Card title="كل الطلبات">
          {apps.isLoading ? <Empty text="جارٍ التحميل…" /> : !apps.data?.length ? <Empty text="لا توجد طلبات" /> : (
            <Table head={["المستفيد", "النوع", "الفرصة", "التوافق", "الحالة"]}>
              {apps.data.map((a: any) => (
                <tr key={a.application_id} className="border-b">
                  <td className="px-2 py-2">{a.beneficiary_name}</td>
                  <td className="px-2 py-2">{a.target_type === "JOB" ? "وظيفة" : "تدريب"}</td>
                  <td className="px-2 py-2">{a.job_title || a.program_title}</td>
                  <td className="px-2 py-2">{a.match_score ?? "—"}%</td>
                  <td className="px-2 py-2"><Badge status={a.status} /></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === "donations" && (
        <Card title="كل التبرعات">
          {dons.isLoading ? <Empty text="جارٍ التحميل…" /> : !dons.data?.length ? <Empty text="لا توجد تبرعات" /> : (
            <Table head={["العنوان", "النوع", "المانح", "الوحدات", "المستهلك", "الحالة"]}>
              {dons.data.map((d: any) => (
                <tr key={d.donation_id} className="border-b">
                  <td className="px-2 py-2">{d.title}</td>
                  <td className="px-2 py-2">{d.donation_type === "JOB" ? "وظيفي" : d.donation_type === "TRAINING" ? "تدريبي" : "توظيفي"}</td>
                  <td className="px-2 py-2">{d.donor_name}</td>
                  <td className="px-2 py-2">{d.units_pledged}</td>
                  <td className="px-2 py-2">{d.units_consumed} ({d.consumed_pct}%)</td>
                  <td className="px-2 py-2"><Badge status={d.status} /></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
