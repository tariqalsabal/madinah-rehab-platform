"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { PublicApi } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { Card, Empty, Badge, Table } from "@/components/dashboards/shared";

const TYPE_AR: Record<string, string> = { COMPANY: "شركة", INSTITUTE: "معهد", RECRUITER: "شركة توظيف", DONOR: "جهة مانحة" };
const DON_AR: Record<string, string> = { JOB: "وظيفي", TRAINING: "تدريبي", RECRUITMENT: "توظيفي" };

// بروفايل عام للمنظمة — يفتحه أي طرف ويبدأ المراسلة ويرى فرصها
export default function OrgPublicProfile() {
  const params = useParams();
  const id = Number(params?.id);
  const { sessionStatus } = useMe();
  const { data: o, isLoading, error } = useQuery({ queryKey: ["org-public", id], queryFn: () => PublicApi.org(id), enabled: Number.isFinite(id) });
  const jobs = useQuery({ queryKey: ["org-pub-jobs", id], queryFn: () => PublicApi.orgJobs(id), enabled: Number.isFinite(id) });
  const programs = useQuery({ queryKey: ["org-pub-programs", id], queryFn: () => PublicApi.orgPrograms(id), enabled: Number.isFinite(id) });
  const donations = useQuery({ queryKey: ["org-pub-dons", id], queryFn: () => PublicApi.orgDonations(id), enabled: Number.isFinite(id) });

  if (isLoading) return <p className="text-center text-muted-foreground">جارٍ التحميل…</p>;
  if (error || !o) return <Empty text="تعذّر العثور على المنظمة." />;

  const rows: [string, any][] = [
    ["النوع", TYPE_AR[o.org_type]], ["القطاع", o.sector], ["المدينة", o.city], ["المنطقة", o.region],
    ["سنة التأسيس", o.established_year], ["عدد الموظفين", o.employees_count],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/companies" className="text-sm text-brand">→ الشركاء</Link>
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-brand-light">
              {o.logo_url ? <img src={o.logo_url} alt="" className="h-full w-full object-contain" /> : <span className="text-2xl font-bold text-brand">{(o.brand_name || o.legal_name || "؟").slice(0, 1)}</span>}
            </span>
            <div>
              <p className="text-lg font-semibold text-brand-dark">{o.brand_name || o.legal_name}</p>
              <p className="text-sm text-muted-foreground">{o.legal_name}</p>
              {o.website && <a href={o.website} target="_blank" rel="noreferrer" className="text-xs text-brand">{o.website} ↗</a>}
            </div>
          </div>
          {sessionStatus === "authenticated" && o.contact_user_id && (
            <Link href={`/messages?peer=${o.contact_user_id}`} className="btn-primary text-sm">إرسال رسالة</Link>
          )}
        </div>

        {o.about && <p className="mt-4 text-sm text-muted-foreground">{o.about}</p>}

        <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {rows.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-dashed pb-2 text-sm">
              <dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{String(v)}</dd>
            </div>
          ))}
        </dl>

        {sessionStatus !== "authenticated" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">سجّل الدخول لإرسال رسالة لهذه الجهة.</p>
        )}
      </Card>

      {/* الوظائف المعلنة */}
      {!!jobs.data?.length && (
        <Card title={`الوظائف (${jobs.data.length})`}>
          <Table head={["الوظيفة", "المدينة", "الشواغر", "المتقدّمون", "الحالة"]}>
            {jobs.data.map((j: any) => (
              <tr key={j.job_id} className="border-b">
                <td className="px-2 py-2"><a href={`/jobs/${j.job_id}`} className="text-brand hover:underline">{j.title}</a></td>
                <td className="px-2 py-2">{j.city}</td>
                <td className="px-2 py-2">{j.vacancies}</td>
                <td className="px-2 py-2">{j.applicants}</td>
                <td className="px-2 py-2"><Badge status={j.status} /></td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {/* البرامج التدريبية */}
      {!!programs.data?.length && (
        <Card title={`البرامج التدريبية (${programs.data.length})`}>
          <Table head={["البرنامج", "المدينة", "المقاعد المتاحة", "مجاني", "الحالة"]}>
            {programs.data.map((p: any) => (
              <tr key={p.program_id} className="border-b">
                <td className="px-2 py-2"><a href={`/programs/${p.program_id}`} className="text-brand hover:underline">{p.title}</a></td>
                <td className="px-2 py-2">{p.city}</td>
                <td className="px-2 py-2">{p.seats_available}</td>
                <td className="px-2 py-2">{p.is_free === "Y" ? "نعم" : "لا"}</td>
                <td className="px-2 py-2"><Badge status={p.status} /></td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {/* المبادرات/التبرعات */}
      {!!donations.data?.length && (
        <Card title={`المبادرات والتبرّعات (${donations.data.length})`}>
          <Table head={["المبادرة", "النوع", "الوحدات", "المستهلك", "الحالة"]}>
            {donations.data.map((d: any) => (
              <tr key={d.donation_id} className="border-b">
                <td className="px-2 py-2">{d.title}</td>
                <td className="px-2 py-2">{DON_AR[d.donation_type]}</td>
                <td className="px-2 py-2">{d.units_pledged}</td>
                <td className="px-2 py-2">{d.units_consumed} ({d.consumed_pct}%)</td>
                <td className="px-2 py-2"><Badge status={d.status} /></td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}
