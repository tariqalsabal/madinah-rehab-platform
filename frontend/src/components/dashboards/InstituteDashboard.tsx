"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { OrgApi, MeApi } from "@/lib/api";
import { Badge, Card, Table, Empty } from "./shared";

// لوحة المعهد: برامجه + المسجّلون + تبرعاته التدريبية
export default function InstituteDashboard({ orgId }: { orgId?: number }) {
  const [openProg, setOpenProg] = useState<number | null>(null);
  const programs = useQuery({ queryKey: ["org-programs", orgId], queryFn: () => OrgApi.programs(orgId!), enabled: !!orgId });
  const donations = useQuery({ queryKey: ["org-dons", orgId], queryFn: () => MeApi.donations(orgId!), enabled: !!orgId });
  const enrollees = useQuery({ queryKey: ["enrollees", openProg], queryFn: () => OrgApi.enrollees(openProg!), enabled: !!openProg });

  if (!orgId) return <Empty text="لا يوجد معهد مرتبط بحسابك. تواصل مع إدارة الجمعية." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">لوحة المعهد</h1>

      <Card title="برامجي التدريبية">
        {programs.isLoading ? <Empty text="جارٍ التحميل…" /> : !programs.data?.length ? <Empty text="لم تنشر أي برنامج بعد." /> : (
          <Table head={["البرنامج", "المدينة", "المقاعد", "المتاح", "الحالة", ""]}>
            {programs.data.map((p: any) => (
              <tr key={p.program_id} className="border-b">
                <td className="px-2 py-2 font-medium">{p.title}</td>
                <td className="px-2 py-2">{p.city}</td>
                <td className="px-2 py-2">{p.seats_total}</td>
                <td className="px-2 py-2">{p.seats_available}</td>
                <td className="px-2 py-2"><Badge status={p.status} /></td>
                <td className="px-2 py-2">
                  <button onClick={() => setOpenProg(openProg === p.program_id ? null : p.program_id)} className="text-xs text-brand">
                    {openProg === p.program_id ? "إخفاء" : "المسجّلون"}
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {openProg && (
        <Card title="المسجّلون في البرنامج">
          {enrollees.isLoading ? <Empty text="جارٍ التحميل…" /> : !enrollees.data?.length ? <Empty text="لا يوجد مسجّلون بعد." /> : (
            <Table head={["المتدرّب", "البريد", "الحالة", "التاريخ"]}>
              {enrollees.data.map((e: any) => (
                <tr key={e.application_id} className="border-b">
                  <td className="px-2 py-2">{e.beneficiary_name}</td>
                  <td className="px-2 py-2 text-muted-foreground" dir="ltr">{e.beneficiary_email}</td>
                  <td className="px-2 py-2"><Badge status={e.status} /></td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{String(e.created_at).slice(0, 10)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      <Card title="تبرعاتي التدريبية">
        {donations.isLoading ? <Empty text="جارٍ التحميل…" /> : !donations.data?.length ? <Empty text="لا توجد تبرعات." /> : (
          <Table head={["العنوان", "المقاعد", "المستهلك", "الحالة"]}>
            {donations.data.map((d: any) => (
              <tr key={d.donation_id} className="border-b">
                <td className="px-2 py-2">{d.title}</td>
                <td className="px-2 py-2">{d.units_pledged}</td>
                <td className="px-2 py-2">{d.units_consumed} ({d.consumed_pct}%)</td>
                <td className="px-2 py-2"><Badge status={d.status} /></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
