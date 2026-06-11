"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MeApi } from "@/lib/api";
import { Badge, Card, Table, Empty } from "./shared";
import { DonationForm } from "./InstituteDashboard";

// لوحة الجهة المانحة: تبرعاتها وأثرها
export default function DonorDashboard({ orgId, actor }: { orgId?: number; actor: number }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const donations = useQuery({ queryKey: ["org-dons", orgId], queryFn: () => MeApi.donations(orgId!), enabled: !!orgId });
  if (!orgId) return <Empty text="لا توجد جهة مانحة مرتبطة بحسابك. تواصل مع إدارة الجمعية." />;

  const total = donations.data?.reduce((s: number, d: any) => s + (d.monetary_value || 0), 0) || 0;
  const units = donations.data?.reduce((s: number, d: any) => s + (d.units_pledged || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">لوحة الجهة المانحة</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="card-brand"><p className="text-xs text-muted-foreground">إجمالي القيمة</p><p className="mt-1 text-2xl font-bold text-brand">{total.toLocaleString()} ر.س</p></div>
        <div className="card-brand"><p className="text-xs text-muted-foreground">إجمالي الوحدات</p><p className="mt-1 text-2xl font-bold text-brand">{units}</p></div>
        <div className="card-brand"><p className="text-xs text-muted-foreground">عدد التبرعات</p><p className="mt-1 text-2xl font-bold text-brand">{donations.data?.length || 0}</p></div>
      </div>

      <Card title="تبرعاتي" action={<button onClick={() => setShowForm(true)} className="btn-gold text-sm">+ تسجيل تبرّع</button>}>
        {donations.isLoading ? <Empty text="جارٍ التحميل…" /> : !donations.data?.length ? <Empty text="لا توجد تبرعات بعد." /> : (
          <Table head={["العنوان", "النوع", "الوحدات", "المستهلك", "الأثر", "الحالة"]}>
            {donations.data.map((d: any) => (
              <tr key={d.donation_id} className="border-b">
                <td className="px-2 py-2">{d.title}</td>
                <td className="px-2 py-2">{d.donation_type === "JOB" ? "وظيفي" : d.donation_type === "TRAINING" ? "تدريبي" : "توظيفي"}</td>
                <td className="px-2 py-2">{d.units_pledged}</td>
                <td className="px-2 py-2">{d.units_consumed}</td>
                <td className="px-2 py-2">{d.consumed_pct}%</td>
                <td className="px-2 py-2"><Badge status={d.status} /></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {showForm && (
        <DonationForm orgId={orgId} actor={actor} onClose={() => setShowForm(false)}
          onDone={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["org-dons", orgId] }); }} />
      )}
    </div>
  );
}
