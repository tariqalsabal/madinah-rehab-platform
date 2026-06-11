"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MeApi, MatchApi } from "@/lib/api";
import { Badge, Card, Table, Empty } from "./shared";

// لوحة المستفيد: طلباته + أفضل المطابقات + رابط ملفه
export default function BeneficiaryDashboard({ userId, benefId, name }: { userId: number; benefId?: number; name?: string }) {
  const apps = useQuery({ queryKey: ["my-apps", userId], queryFn: () => MeApi.applications(userId) });
  const matches = useQuery({
    queryKey: ["my-matches", benefId],
    queryFn: () => MatchApi.forBeneficiary(benefId!).then((d) => d.items || []),
    enabled: !!benefId,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-dark">مرحباً، {name?.split("@")[0] || "بك"}</h1>
        <Link href="/profile" className="btn-primary text-sm">ملفي الشخصي</Link>
      </div>

      <Card title="طلباتي">
        {apps.isLoading ? <Empty text="جارٍ التحميل…" /> : !apps.data?.length ? <Empty text="لم تقدّم على أي فرصة بعد. تصفّح الوظائف وابدأ!" /> : (
          <Table head={["الفرصة", "النوع", "التوافق", "الحالة", "التاريخ"]}>
            {apps.data.map((a: any) => (
              <tr key={a.application_id} className="border-b">
                <td className="px-2 py-2">{a.job_title || a.program_title}</td>
                <td className="px-2 py-2">{a.target_type === "JOB" ? "وظيفة" : "تدريب"}</td>
                <td className="px-2 py-2">{a.match_score ?? "—"}%</td>
                <td className="px-2 py-2"><Badge status={a.status} /></td>
                <td className="px-2 py-2 text-xs text-muted-foreground">{String(a.created_at).slice(0, 10)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="أفضل الفرص المطابقة لك">
        {matches.isLoading ? <Empty text="جارٍ التحميل…" /> : !matches.data?.length ? <Empty text="لا توجد مطابقات بعد." /> : (
          <div className="grid gap-3 md:grid-cols-2">
            {matches.data.slice(0, 6).map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-brand-dark">{m.job_title || m.program_title}</p>
                  <p className="text-xs text-muted-foreground">{m.job_org || (m.target_type === "TRAINING" ? "برنامج تدريبي" : "")}</p>
                </div>
                <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">{Math.round(m.score)}%</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
