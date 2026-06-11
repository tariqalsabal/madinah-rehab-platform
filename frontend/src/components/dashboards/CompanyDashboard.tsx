"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { OrgApi, MeApi, AppApi } from "@/lib/api";
import { Badge, Card, Table, Empty, Modal, Input, SelectField, FIELD_OPTIONS, EDU_OPTIONS } from "./shared";

const ACTIONS = [
  { status: "SHORTLISTED", label: "قائمة مختصرة", cls: "text-gold-dark" },
  { status: "INTERVIEW", label: "مقابلة", cls: "text-gold-dark" },
  { status: "HIRED", label: "توظيف", cls: "text-brand" },
  { status: "REJECTED", label: "رفض", cls: "text-red-600" },
];

export default function CompanyDashboard({ orgId, actor }: { orgId?: number; actor: number }) {
  const qc = useQueryClient();
  const [openJob, setOpenJob] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const jobs = useQuery({ queryKey: ["org-jobs", orgId], queryFn: () => OrgApi.jobs(orgId!), enabled: !!orgId });
  const donations = useQuery({ queryKey: ["org-dons", orgId], queryFn: () => MeApi.donations(orgId!), enabled: !!orgId });
  const applicants = useQuery({ queryKey: ["applicants", openJob], queryFn: () => OrgApi.applicants(openJob!), enabled: !!openJob });

  const act = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => AppApi.setStatus(id, status, actor),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["applicants", openJob] }); qc.invalidateQueries({ queryKey: ["org-jobs", orgId] }); },
  });

  if (!orgId) return <Empty text="لا توجد منظمة مرتبطة بحسابك. تواصل مع إدارة الجمعية." />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">لوحة الشركة</h1>

      <Card title="وظائفي" action={<button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ نشر وظيفة</button>}>
        {jobs.isLoading ? <Empty text="جارٍ التحميل…" /> : !jobs.data?.length ? <Empty text="لم تنشر أي وظيفة بعد." /> : (
          <Table head={["الوظيفة", "المدينة", "الشواغر", "المتقدّمون", "الحالة", ""]}>
            {jobs.data.map((j: any) => (
              <tr key={j.job_id} className="border-b">
                <td className="px-2 py-2 font-medium">{j.title}</td>
                <td className="px-2 py-2">{j.city}</td>
                <td className="px-2 py-2">{j.vacancies}</td>
                <td className="px-2 py-2">{j.applicants}</td>
                <td className="px-2 py-2"><Badge status={j.status} /></td>
                <td className="px-2 py-2">
                  <button onClick={() => setOpenJob(openJob === j.job_id ? null : j.job_id)} className="text-xs text-brand">
                    {openJob === j.job_id ? "إخفاء" : "المتقدّمون"}
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {openJob && (
        <Card title="المتقدّمون على الوظيفة">
          {applicants.isLoading ? <Empty text="جارٍ التحميل…" /> : !applicants.data?.length ? <Empty text="لا يوجد متقدّمون بعد." /> : (
            <Table head={["المرشّح", "البريد", "التوافق", "الحالة", "الإجراء"]}>
              {applicants.data.map((a: any) => (
                <tr key={a.application_id} className="border-b">
                  <td className="px-2 py-2">{a.beneficiary_name}</td>
                  <td className="px-2 py-2 text-muted-foreground" dir="ltr">{a.beneficiary_email}</td>
                  <td className="px-2 py-2">{a.match_score ?? "—"}%</td>
                  <td className="px-2 py-2"><Badge status={a.status} /></td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      {ACTIONS.map((ac) => (
                        <button key={ac.status} disabled={act.isPending}
                          onClick={() => act.mutate({ id: a.application_id, status: ac.status })}
                          className={`text-xs ${ac.cls} disabled:opacity-50`}>{ac.label}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      <Card title="تبرعاتي">
        {donations.isLoading ? <Empty text="جارٍ التحميل…" /> : !donations.data?.length ? <Empty text="لا توجد تبرعات." /> : (
          <Table head={["العنوان", "النوع", "الوحدات", "المستهلك", "الحالة"]}>
            {donations.data.map((d: any) => (
              <tr key={d.donation_id} className="border-b">
                <td className="px-2 py-2">{d.title}</td>
                <td className="px-2 py-2">{d.donation_type === "JOB" ? "وظيفي" : "تدريبي"}</td>
                <td className="px-2 py-2">{d.units_pledged}</td>
                <td className="px-2 py-2">{d.units_consumed} ({d.consumed_pct}%)</td>
                <td className="px-2 py-2"><Badge status={d.status} /></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {showForm && <JobForm orgId={orgId} actor={actor} onClose={() => setShowForm(false)}
        onDone={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["org-jobs", orgId] }); }} />}
    </div>
  );
}

function JobForm({ orgId, actor, onClose, onDone }: { orgId: number; actor: number; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState<any>({ title: "", city: "", field_code: "ACCOUNT", min_education: "BACHELOR", min_experience: 0, salary_min: "", salary_max: "", vacancies: 1 });
  const [err, setErr] = useState("");
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
  const m = useMutation({
    mutationFn: () => OrgApi.createJob({ ...f, org_id: orgId, actor }),
    onSuccess: onDone,
    onError: (e: any) => setErr(e.message || "تعذّر النشر"),
  });
  return (
    <Modal title="نشر وظيفة جديدة" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); setErr(""); m.mutate(); }} className="space-y-3">
        <Input label="المسمّى الوظيفي" required value={f.title} onChange={(e: any) => set("title", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="المدينة" value={f.city} onChange={(e: any) => set("city", e.target.value)} />
          <SelectField label="المجال" value={f.field_code} onChange={(e: any) => set("field_code", e.target.value)} options={FIELD_OPTIONS} />
          <SelectField label="المؤهل الأدنى" value={f.min_education} onChange={(e: any) => set("min_education", e.target.value)} options={EDU_OPTIONS} />
          <Input label="الخبرة (سنوات)" type="number" min={0} value={f.min_experience} onChange={(e: any) => set("min_experience", e.target.value)} />
          <Input label="أقل راتب" type="number" value={f.salary_min} onChange={(e: any) => set("salary_min", e.target.value)} />
          <Input label="أعلى راتب" type="number" value={f.salary_max} onChange={(e: any) => set("salary_max", e.target.value)} />
          <Input label="عدد الشواغر" type="number" min={1} value={f.vacancies} onChange={(e: any) => set("vacancies", e.target.value)} />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit" disabled={m.isPending} className="btn-primary w-full disabled:opacity-60">
          {m.isPending ? "جارٍ النشر…" : "نشر الوظيفة"}
        </button>
      </form>
    </Modal>
  );
}
