"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { DashboardApi, AdminApi } from "@/lib/api";
import type { DashboardKpis } from "@/lib/types";
import { Badge, Card, Table, Empty, exportCsv } from "./shared";

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

const TABS = [["users", "الحسابات"], ["benef", "المستفيدون"], ["apps", "الطلبات"], ["donations", "التبرعات"], ["messages", "الرسائل"]] as const;

function filterRows(rows: any[] | undefined, q: string) {
  if (!rows) return [];
  if (!q.trim()) return rows;
  const s = q.trim().toLowerCase();
  return rows.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(s)));
}

export default function AdminDashboard({ actor }: { actor: number }) {
  const [tab, setTab] = useState<typeof TABS[number][0]>("users");
  const [q, setQ] = useState("");
  const qc = useQueryClient();
  const { data: kpis } = useQuery({ queryKey: ["kpis"], queryFn: DashboardApi.kpis });
  const users = useQuery({ queryKey: ["admin-users", actor], queryFn: () => AdminApi.users(actor), enabled: tab === "users" });
  const benef = useQuery({ queryKey: ["admin-benef", actor], queryFn: () => AdminApi.beneficiaries(actor), enabled: tab === "benef" });
  const apps = useQuery({ queryKey: ["admin-apps", actor], queryFn: () => AdminApi.applications(actor), enabled: tab === "apps" });
  const dons = useQuery({ queryKey: ["admin-dons", actor], queryFn: () => AdminApi.donations(actor), enabled: tab === "donations" });
  const msgs = useQuery({ queryKey: ["admin-msgs", actor], queryFn: () => AdminApi.messages(actor), enabled: tab === "messages", refetchInterval: 20000 });

  const setUserStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => AdminApi.setUserStatus(id, status, actor),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users", actor] }),
  });
  const approve = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => AdminApi.approveBeneficiary(id, status, actor),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-benef", actor] }),
  });

  const current = tab === "users" ? users.data : tab === "benef" ? benef.data : tab === "apps" ? apps.data : tab === "messages" ? msgs.data : dons.data;
  const filtered = useMemo(() => filterRows(current, q), [current, q]);

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

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => { setTab(k); setQ(""); }}
            className={`rounded-full px-4 py-1.5 text-sm ${tab === k ? "bg-brand text-white" : "bg-brand-light text-brand-dark"}`}>{l}</button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث…" className="ms-auto w-48 rounded-lg border px-3 py-1.5 text-sm" />
        <button onClick={() => exportCsv(filtered, `${tab}.csv`)} className="rounded-lg border px-3 py-1.5 text-sm text-brand">تصدير CSV ⬇</button>
      </div>

      {tab === "users" && (
        <Card title={`الحسابات (${filtered.length})`}>
          {users.isLoading ? <Empty text="جارٍ التحميل…" /> : !filtered.length ? <Empty text="لا نتائج" /> : (
            <Table head={["الاسم", "البريد", "النوع", "الحالة", "إجراء"]}>
              {filtered.map((u: any) => (
                <tr key={u.user_id} className="border-b">
                  <td className="px-2 py-2">{u.full_name}</td>
                  <td className="px-2 py-2 text-muted-foreground" dir="ltr">{u.email}</td>
                  <td className="px-2 py-2">{u.user_type}</td>
                  <td className="px-2 py-2"><Badge status={u.status} /></td>
                  <td className="px-2 py-2">
                    {u.status === "SUSPENDED"
                      ? <button onClick={() => setUserStatus.mutate({ id: u.user_id, status: "ACTIVE" })} className="text-xs text-brand">تفعيل</button>
                      : <button onClick={() => setUserStatus.mutate({ id: u.user_id, status: "SUSPENDED" })} className="text-xs text-red-600">إيقاف</button>}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === "benef" && (
        <Card title={`المستفيدون (${filtered.length})`}>
          {benef.isLoading ? <Empty text="جارٍ التحميل…" /> : !filtered.length ? <Empty text="لا نتائج" /> : (
            <Table head={["الاسم", "المدينة", "المؤهل", "الطلبات", "الاكتمال", "الحالة", "اعتماد"]}>
              {filtered.map((b: any) => (
                <tr key={b.benef_id} className="border-b">
                  <td className="px-2 py-2"><a href={`/beneficiaries/${b.benef_id}`} className="text-brand hover:underline">{b.full_name}</a></td>
                  <td className="px-2 py-2">{b.city}</td>
                  <td className="px-2 py-2">{b.education_level}</td>
                  <td className="px-2 py-2">{b.applications_count}</td>
                  <td className="px-2 py-2">{b.completeness_pct}%</td>
                  <td className="px-2 py-2"><Badge status={b.approval_status} /></td>
                  <td className="px-2 py-2">
                    {b.approval_status !== "APPROVED"
                      ? <button onClick={() => approve.mutate({ id: b.benef_id, status: "APPROVED" })} className="text-xs text-brand">اعتماد</button>
                      : <button onClick={() => approve.mutate({ id: b.benef_id, status: "REJECTED" })} className="text-xs text-red-600">إلغاء</button>}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === "apps" && (
        <Card title={`الطلبات (${filtered.length})`}>
          {apps.isLoading ? <Empty text="جارٍ التحميل…" /> : !filtered.length ? <Empty text="لا نتائج" /> : (
            <Table head={["المستفيد", "النوع", "الفرصة", "التوافق", "الحالة"]}>
              {filtered.map((a: any) => (
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
        <Card title={`التبرعات (${filtered.length})`}>
          {dons.isLoading ? <Empty text="جارٍ التحميل…" /> : !filtered.length ? <Empty text="لا نتائج" /> : (
            <Table head={["العنوان", "النوع", "المانح", "الوحدات", "المستهلك", "الحالة"]}>
              {filtered.map((d: any) => (
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

      {tab === "messages" && (
        <Card title={`كل الرسائل (${filtered.length})`}>
          {msgs.isLoading ? <Empty text="جارٍ التحميل…" /> : !filtered.length ? <Empty text="لا رسائل" /> : (
            <Table head={["من", "إلى", "الرسالة", "التاريخ"]}>
              {filtered.map((m: any) => (
                <tr key={m.message_id} className="border-b">
                  <td className="px-2 py-2 font-medium text-brand-dark">{m.from_name}</td>
                  <td className="px-2 py-2">{m.to_name}</td>
                  <td className="px-2 py-2 text-muted-foreground">{m.body}</td>
                  <td className="px-2 py-2 text-xs text-muted-foreground" dir="ltr">{m.created_at}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
