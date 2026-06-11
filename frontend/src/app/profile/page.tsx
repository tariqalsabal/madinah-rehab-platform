"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/lib/useMe";
import { ProfileApi, OrgProfileApi, docDownloadUrl } from "@/lib/api";
import { Card, Input, SelectField, EDU_OPTIONS, Empty } from "@/components/dashboards/shared";

const TYPE_AR: Record<string, string> = {
  ADMIN: "مدير النظام", STAFF: "موظف الجمعية", BENEFICIARY: "مستفيد",
  COMPANY: "شركة", INSTITUTE: "معهد", RECRUITER: "شركة توظيف", DONOR: "جهة مانحة",
};
const YN = [{ v: "Y", l: "نعم" }, { v: "N", l: "لا" }];

export default function ProfilePage() {
  const { sessionStatus, userId, primaryRole, me, loading, roles } = useMe();
  if (sessionStatus === "loading" || loading) return <p className="text-center text-muted-foreground">جارٍ التحميل…</p>;
  if (sessionStatus === "unauthenticated")
    return <div className="mx-auto max-w-md card-brand text-center"><Link href="/login" className="btn-primary">سجّل الدخول</Link></div>;

  const isOrg = ["COMPANY", "INSTITUTE", "DONOR"].includes(primaryRole);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-dark">ملفي الشخصي</h1>
        <Link href="/dashboard" className="text-sm text-brand">→ لوحتي</Link>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">{(me?.full_name || "؟").slice(0, 1)}</span>
          <div>
            <p className="text-lg font-semibold text-brand-dark">{me?.full_name}</p>
            <p className="text-sm text-muted-foreground" dir="ltr">{me?.email}</p>
            <p className="mt-1 text-xs text-brand">{TYPE_AR[me?.user_type] || me?.user_type} · {roles.join("، ")}</p>
          </div>
        </div>
      </Card>

      {primaryRole === "BENEFICIARY" && me?.benef_id && <BeneficiaryProfile userId={userId} benefId={me.benef_id} />}
      {isOrg && <OrgProfile userId={userId} orgType={primaryRole} />}
      {(primaryRole === "ADMIN" || primaryRole === "STAFF") && (
        <Card title="معلومات الحساب"><p className="text-sm text-muted-foreground">حساب إداري — الإدارة الكاملة من لوحة التحكم.</p></Card>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: any }) {
  return <Card title={title}><div className="grid gap-3 sm:grid-cols-2">{children}</div></Card>;
}

function BeneficiaryProfile({ userId, benefId }: { userId: number; benefId: number }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["profile-full", benefId], queryFn: () => ProfileApi.getFull(benefId, userId) });
  const docs = useQuery({ queryKey: ["my-docs", userId], queryFn: () => ProfileApi.documents(userId) });
  const [f, setF] = useState<any>({});
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: any) => { setF((s: any) => ({ ...s, [k]: v })); setSaved(false); };
  useEffect(() => { if (data) setF(data); }, [data]);
  const save = useMutation({ mutationFn: () => ProfileApi.update(userId, f), onSuccess: () => { setSaved(true); qc.invalidateQueries({ queryKey: ["profile-full", benefId] }); } });
  if (isLoading) return <Empty text="جارٍ التحميل…" />;

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary text-sm disabled:opacity-60">
          {save.isPending ? "حفظ…" : saved ? "✓ تم الحفظ" : "حفظ كل التعديلات"}
        </button>
      </div>

      <Section title="البيانات الشخصية">
        <Input label="رقم الهوية/الإقامة" value={f.national_id || ""} onChange={(e: any) => set("national_id", e.target.value)} />
        <SelectField label="الجنس" value={f.gender || "MALE"} onChange={(e: any) => set("gender", e.target.value)} options={[{ v: "MALE", l: "ذكر" }, { v: "FEMALE", l: "أنثى" }]} />
        <SelectField label="الجنسية" value={f.is_saudi || "Y"} onChange={(e: any) => set("is_saudi", e.target.value)} options={[{ v: "Y", l: "سعودي" }, { v: "N", l: "مقيم" }]} />
        {f.is_saudi === "N" && <Input label="نوع الإقامة" value={f.residency_type || ""} onChange={(e: any) => set("residency_type", e.target.value)} />}
        <SelectField label="الحالة الاجتماعية" value={f.marital_status || ""} onChange={(e: any) => set("marital_status", e.target.value)} options={[{ v: "", l: "—" }, { v: "SINGLE", l: "أعزب" }, { v: "MARRIED", l: "متزوج" }]} />
        <Input label="المدينة" value={f.city || ""} onChange={(e: any) => set("city", e.target.value)} />
        <Input label="المنطقة" value={f.region || ""} onChange={(e: any) => set("region", e.target.value)} />
      </Section>

      <Section title="التعليم">
        <SelectField label="المؤهل" value={f.education_level || "BACHELOR"} onChange={(e: any) => set("education_level", e.target.value)} options={EDU_OPTIONS} />
        <Input label="التخصص" value={f.major || ""} onChange={(e: any) => set("major", e.target.value)} />
        <Input label="الجامعة/الجهة" value={f.university || ""} onChange={(e: any) => set("university", e.target.value)} />
        <Input label="المعدل (GPA)" value={f.gpa || ""} onChange={(e: any) => set("gpa", e.target.value)} />
        <Input label="سنة التخرج" type="number" value={f.graduation_year || ""} onChange={(e: any) => set("graduation_year", e.target.value)} />
        <Input label="اللغات" value={f.languages || ""} onChange={(e: any) => set("languages", e.target.value)} placeholder="العربية، الإنجليزية…" />
      </Section>

      <Section title="الخبرة الحالية">
        <Input label="سنوات الخبرة" type="number" value={f.experience_years ?? 0} onChange={(e: any) => set("experience_years", e.target.value)} />
        <SelectField label="الحالة" value={f.current_status || "SEEKER"} onChange={(e: any) => set("current_status", e.target.value)} options={[{ v: "SEEKER", l: "باحث عن عمل" }, { v: "FRESH_GRAD", l: "حديث تخرج" }, { v: "EMPLOYED", l: "موظف" }, { v: "TRAINEE", l: "متدرب" }]} />
        <Input label="المسمّى الحالي" value={f.current_job_title || ""} onChange={(e: any) => set("current_job_title", e.target.value)} />
        <Input label="جهة العمل الحالية" value={f.current_employer || ""} onChange={(e: any) => set("current_employer", e.target.value)} />
        <Input label="فترة الإشعار" value={f.notice_period || ""} onChange={(e: any) => set("notice_period", e.target.value)} placeholder="فوري / شهر…" />
        <SelectField label="رخصة قيادة" value={f.has_license || "N"} onChange={(e: any) => set("has_license", e.target.value)} options={YN} />
        <SelectField label="سيارة خاصة" value={f.has_car || "N"} onChange={(e: any) => set("has_car", e.target.value)} options={YN} />
      </Section>

      <Section title="الرغبات وبيئة العمل">
        <Input label="المسميات المرغوبة" value={f.desired_titles || ""} onChange={(e: any) => set("desired_titles", e.target.value)} />
        <Input label="المدينة المفضّلة" value={f.desired_city || ""} onChange={(e: any) => set("desired_city", e.target.value)} />
        <Input label="الراتب المتوقّع" type="number" value={f.desired_min_salary || ""} onChange={(e: any) => set("desired_min_salary", e.target.value)} />
        <SelectField label="نوع العمل" value={f.work_type_pref || "FULL"} onChange={(e: any) => set("work_type_pref", e.target.value)} options={[{ v: "FULL", l: "دوام كامل" }, { v: "PART", l: "جزئي" }, { v: "REMOTE", l: "عن بُعد" }, { v: "HYBRID", l: "هجين" }, { v: "TEMP", l: "مؤقت" }]} />
        <SelectField label="قابلية الانتقال" value={f.willing_relocate || "N"} onChange={(e: any) => set("willing_relocate", e.target.value)} options={YN} />
        <Input label="بيئة العمل المناسبة" value={f.work_env_pref || ""} onChange={(e: any) => set("work_env_pref", e.target.value)} />
      </Section>

      <Section title="روابط واحتياجات">
        <Input label="LinkedIn" value={f.linkedin_url || ""} onChange={(e: any) => set("linkedin_url", e.target.value)} />
        <Input label="ملف الأعمال (Portfolio)" value={f.portfolio_url || ""} onChange={(e: any) => set("portfolio_url", e.target.value)} />
        <SelectField label="من ذوي الاحتياجات" value={f.special_needs || "N"} onChange={(e: any) => set("special_needs", e.target.value)} options={YN} />
        {f.special_needs === "Y" && <Input label="نوع الاحتياج" value={f.special_needs_type || ""} onChange={(e: any) => set("special_needs_type", e.target.value)} />}
      </Section>

      <Card title="نبذة تعريفية">
        <textarea value={f.summary || ""} onChange={(e: any) => set("summary", e.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-brand" />
      </Card>

      <Card title="الخصوصية">
        <p className="mb-3 text-xs text-muted-foreground">أخفِ اسمك ورقمك عن الشركات حتى تطمئن؛ يظهر ملفك باسم مرجعي، ويبقى التواصل عبر الرسائل.</p>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.hide_name === "Y"} onChange={(e) => set("hide_name", e.target.checked ? "Y" : "N")} /> إخفاء اسمي عن الشركات</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.hide_phone === "Y"} onChange={(e) => set("hide_phone", e.target.checked ? "Y" : "N")} /> إخفاء رقم جوالي عن الشركات</label>
        </div>
      </Card>

      <DocumentsCard
        docs={docs.data}
        types={[{ v: "CV", l: "السيرة الذاتية" }, { v: "ID", l: "الهوية/الإقامة" }, { v: "CERTIFICATE", l: "شهادة" }, { v: "OTHER", l: "أخرى" }]}
        onUpload={(t, ti, file) => ProfileApi.uploadDocument(userId, t, ti, file)}
        onAdd={(t, ti, u) => ProfileApi.addDocument(userId, t, ti, u)}
        onAdded={() => qc.invalidateQueries({ queryKey: ["my-docs", userId] })}
      />
    </>
  );
}

function OrgProfile({ userId, orgType }: { userId: number; orgType: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["org-profile", userId], queryFn: () => OrgProfileApi.getMine(userId) });
  const docs = useQuery({ queryKey: ["org-docs", userId], queryFn: () => OrgProfileApi.documents(userId) });
  const [f, setF] = useState<any>({});
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: any) => { setF((s: any) => ({ ...s, [k]: v })); setSaved(false); };
  useEffect(() => { if (data) setF(data); }, [data]);
  const save = useMutation({ mutationFn: () => OrgProfileApi.update(userId, f), onSuccess: () => { setSaved(true); qc.invalidateQueries({ queryKey: ["org-profile", userId] }); } });
  if (isLoading) return <Empty text="جارٍ التحميل…" />;
  if (!data) return <Empty text="لا توجد منظمة مرتبطة بحسابك. تواصل مع إدارة الجمعية." />;

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary text-sm disabled:opacity-60">
          {save.isPending ? "حفظ…" : saved ? "✓ تم الحفظ" : "حفظ كل التعديلات"}
        </button>
      </div>

      <Section title="البيانات الأساسية">
        <Input label="الاسم القانوني" value={f.legal_name || ""} onChange={(e: any) => set("legal_name", e.target.value)} />
        <Input label="الاسم التجاري" value={f.brand_name || ""} onChange={(e: any) => set("brand_name", e.target.value)} />
        <Input label="القطاع" value={f.sector || ""} onChange={(e: any) => set("sector", e.target.value)} />
        <Input label="سنة التأسيس" type="number" value={f.established_year || ""} onChange={(e: any) => set("established_year", e.target.value)} />
        <Input label="عدد الموظفين" type="number" value={f.employees_count || ""} onChange={(e: any) => set("employees_count", e.target.value)} />
        <Input label="الموقع الإلكتروني" value={f.website || ""} onChange={(e: any) => set("website", e.target.value)} />
      </Section>

      <Section title="البيانات القانونية والرسمية">
        <Input label="رقم السجل التجاري" value={f.cr_number || ""} onChange={(e: any) => set("cr_number", e.target.value)} />
        <Input label="الرقم الموحّد (700)" value={f.unified_number || ""} onChange={(e: any) => set("unified_number", e.target.value)} />
        <Input label="الرقم الضريبي (VAT)" value={f.vat_number || ""} onChange={(e: any) => set("vat_number", e.target.value)} />
        <Input label="رقم الترخيص" value={f.license_number || ""} onChange={(e: any) => set("license_number", e.target.value)} />
        <Input label="العنوان الوطني" value={f.national_address || ""} onChange={(e: any) => set("national_address", e.target.value)} />
        <Input label="المدينة" value={f.city || ""} onChange={(e: any) => set("city", e.target.value)} />
      </Section>

      <Section title="البيانات البنكية">
        <Input label="الآيبان (IBAN)" value={f.iban || ""} onChange={(e: any) => set("iban", e.target.value)} />
        <Input label="اسم البنك" value={f.bank_name || ""} onChange={(e: any) => set("bank_name", e.target.value)} />
      </Section>

      <Section title="جهة التواصل">
        <Input label="اسم المسؤول" value={f.contact_person || ""} onChange={(e: any) => set("contact_person", e.target.value)} />
        <Input label="جوال المسؤول" value={f.contact_phone || ""} onChange={(e: any) => set("contact_phone", e.target.value)} />
        <Input label="بريد التواصل" value={f.contact_email || ""} onChange={(e: any) => set("contact_email", e.target.value)} />
        <Input label="هاتف المنظمة" value={f.phone || ""} onChange={(e: any) => set("phone", e.target.value)} />
      </Section>

      <DocumentsCard
        docs={docs.data}
        types={[{ v: "CR", l: "السجل التجاري" }, { v: "NATIONAL_ADDRESS", l: "العنوان الوطني" }, { v: "IBAN", l: "شهادة الآيبان" }, { v: "BANK", l: "الشهادة البنكية" }, { v: "LICENSE", l: "الترخيص" }, { v: "OTHER", l: "أخرى" }]}
        onUpload={(t, ti, file) => OrgProfileApi.uploadDocument(userId, t, ti, file)}
        onAdd={(t, ti, u) => OrgProfileApi.addDocument(userId, t, ti, u)}
        onAdded={() => qc.invalidateQueries({ queryKey: ["org-docs", userId] })}
      />
    </>
  );
}

function DocumentsCard({ docs, types, onUpload, onAdd, onAdded }: {
  docs: any[]; types: { v: string; l: string }[];
  onUpload: (t: string, ti: string, file: File) => Promise<any>;
  onAdd: (t: string, ti: string, u: string) => Promise<any>; onAdded: () => void;
}) {
  const [docType, setDocType] = useState(types[0].v);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      if (file) await onUpload(docType, title || file.name, file);
      else if (url) await onAdd(docType, title, url);
      setTitle(""); setUrl(""); setFile(null); onAdded();
    } catch (e: any) { setErr(e.message || "تعذّر الرفع"); } finally { setBusy(false); }
  }

  return (
    <Card title="المرفقات">
      <p className="mb-3 text-xs text-muted-foreground">ارفع الملف مباشرةً، أو أضف رابطاً.</p>
      {docs?.length ? (
        <ul className="mb-4 space-y-2">
          {docs.map((d) => (
            <li key={d.doc_id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <span><span className="badge">{types.find((t) => t.v === d.doc_type)?.l || d.doc_type}</span> {d.title}</span>
              <a href={d.file_url || docDownloadUrl(d.doc_id)} target="_blank" rel="noreferrer" className="text-xs text-brand">فتح ↗</a>
            </li>
          ))}
        </ul>
      ) : <p className="mb-4 text-sm text-muted-foreground">لا مرفقات بعد.</p>}
      <form onSubmit={submit} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <SelectField value={docType} onChange={(e: any) => setDocType(e.target.value)} options={types} />
          <Input placeholder="عنوان الملف (اختياري)" value={title} onChange={(e: any) => setTitle(e.target.value)} />
        </div>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm file:me-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-white" />
        {!file && <Input placeholder="أو الصق رابط الملف" value={url} onChange={(e: any) => setUrl(e.target.value)} />}
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit" disabled={busy || (!file && !url)} className="btn-primary text-sm disabled:opacity-60">
          {busy ? "جارٍ الرفع…" : "إضافة المرفق"}
        </button>
      </form>
    </Card>
  );
}
