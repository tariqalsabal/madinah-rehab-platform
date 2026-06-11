"use client";

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { OrgApi, MeApi, DonationApi } from "@/lib/api";
import { Badge, Card, Table, Empty, Modal, Input, SelectField, FIELD_OPTIONS } from "./shared";

export default function InstituteDashboard({ orgId, actor }: { orgId?: number; actor: number }) {
  const qc = useQueryClient();
  const [openProg, setOpenProg] = useState<number | null>(null);
  const [form, setForm] = useState<"" | "program" | "donation">("");
  const programs = useQuery({ queryKey: ["org-programs", orgId], queryFn: () => OrgApi.programs(orgId!), enabled: !!orgId });
  const donations = useQuery({ queryKey: ["org-dons", orgId], queryFn: () => MeApi.donations(orgId!), enabled: !!orgId });
  const enrollees = useQuery({ queryKey: ["enrollees", openProg], queryFn: () => OrgApi.enrollees(openProg!), enabled: !!openProg });

  if (!orgId) return <Empty text="لا يوجد معهد مرتبط بحسابك. تواصل مع إدارة الجمعية." />;
  const refresh = () => { setForm(""); qc.invalidateQueries({ queryKey: ["org-programs", orgId] }); qc.invalidateQueries({ queryKey: ["org-dons", orgId] }); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">لوحة المعهد</h1>

      <Card title="برامجي التدريبية" action={<button onClick={() => setForm("program")} className="btn-primary text-sm">+ إنشاء برنامج</button>}>
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
            <Table head={["المتدرّب", "البريد", "الحالة", "التاريخ", ""]}>
              {enrollees.data.map((e: any) => (
                <tr key={e.application_id} className="border-b">
                  <td className="px-2 py-2"><a href={`/beneficiaries/${e.benef_id}`} className="text-brand hover:underline">{e.beneficiary_name}</a></td>
                  <td className="px-2 py-2 text-muted-foreground" dir="ltr">{e.beneficiary_email}</td>
                  <td className="px-2 py-2"><Badge status={e.status} /></td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">{String(e.created_at).slice(0, 10)}</td>
                  <td className="px-2 py-2"><a href={`/messages?peer=${e.benef_user_id}`} className="text-xs text-brand-dark">مراسلة</a></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      <Card title="تبرعاتي التدريبية" action={<button onClick={() => setForm("donation")} className="btn-gold text-sm">+ تسجيل تبرّع</button>}>
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

      {form === "program" && <ProgramForm orgId={orgId} actor={actor} onClose={() => setForm("")} onDone={refresh} />}
      {form === "donation" && <DonationForm orgId={orgId} actor={actor} type="TRAINING" onClose={() => setForm("")} onDone={refresh} />}
    </div>
  );
}

function ProgramForm({ orgId, actor, onClose, onDone }: any) {
  const [f, setF] = useState<any>({ title: "", city: "", field_code: "IT", seats_total: 20, original_fee: 0, discount_pct: 100, is_free: "Y", start_date: "" });
  const [err, setErr] = useState("");
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
  const m = useMutation({ mutationFn: () => OrgApi.createProgram({ ...f, org_id: orgId, actor }), onSuccess: onDone, onError: (e: any) => setErr(e.message) });
  return (
    <Modal title="إنشاء برنامج تدريبي" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); setErr(""); m.mutate(); }} className="space-y-3">
        <Input label="عنوان البرنامج" required value={f.title} onChange={(e: any) => set("title", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="المدينة" value={f.city} onChange={(e: any) => set("city", e.target.value)} />
          <SelectField label="المجال" value={f.field_code} onChange={(e: any) => set("field_code", e.target.value)} options={FIELD_OPTIONS} />
          <Input label="عدد المقاعد" type="number" min={1} value={f.seats_total} onChange={(e: any) => set("seats_total", e.target.value)} />
          <Input label="نسبة الدعم %" type="number" min={0} max={100} value={f.discount_pct} onChange={(e: any) => set("discount_pct", e.target.value)} />
          <SelectField label="مجاني؟" value={f.is_free} onChange={(e: any) => set("is_free", e.target.value)} options={[{ v: "Y", l: "نعم" }, { v: "N", l: "لا" }]} />
          <Input label="تاريخ البدء" type="date" value={f.start_date} onChange={(e: any) => set("start_date", e.target.value)} />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit" disabled={m.isPending} className="btn-primary w-full disabled:opacity-60">{m.isPending ? "جارٍ…" : "إنشاء"}</button>
      </form>
    </Modal>
  );
}

export function DonationForm({ orgId, actor, type, onClose, onDone }: any) {
  const [f, setF] = useState<any>({ title: "", donation_type: type || "JOB", target_role: "", units_pledged: 10, discount_pct: "", monetary_value: "" });
  const [err, setErr] = useState("");
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
  const m = useMutation({ mutationFn: () => DonationApi.create({ ...f, donor_org_id: orgId, actor }), onSuccess: onDone, onError: (e: any) => setErr(e.message) });
  return (
    <Modal title="تسجيل تبرّع جديد" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); setErr(""); m.mutate(); }} className="space-y-3">
        <Input label="عنوان التبرّع" required value={f.title} onChange={(e: any) => set("title", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="النوع" value={f.donation_type} onChange={(e: any) => set("donation_type", e.target.value)}
            options={[{ v: "JOB", l: "وظيفي" }, { v: "TRAINING", l: "تدريبي" }, { v: "RECRUITMENT", l: "توظيفي" }]} />
          <Input label="عدد الوحدات" type="number" min={1} value={f.units_pledged} onChange={(e: any) => set("units_pledged", e.target.value)} />
          <Input label="الدور المستهدف" value={f.target_role} onChange={(e: any) => set("target_role", e.target.value)} />
          <Input label="القيمة التقديرية (ر.س)" type="number" value={f.monetary_value} onChange={(e: any) => set("monetary_value", e.target.value)} />
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit" disabled={m.isPending} className="btn-gold w-full disabled:opacity-60">{m.isPending ? "جارٍ…" : "تسجيل التبرّع"}</button>
      </form>
    </Modal>
  );
}
