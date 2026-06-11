"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/lib/useMe";
import { ProfileApi } from "@/lib/api";
import { Card, Input, SelectField, FIELD_OPTIONS, EDU_OPTIONS, Empty } from "@/components/dashboards/shared";

const TYPE_AR: Record<string, string> = {
  ADMIN: "مدير النظام", STAFF: "موظف الجمعية", BENEFICIARY: "مستفيد",
  COMPANY: "شركة", INSTITUTE: "معهد", RECRUITER: "شركة توظيف", DONOR: "جهة مانحة",
};

export default function ProfilePage() {
  const { sessionStatus, userId, primaryRole, me, loading, roles } = useMe();

  if (sessionStatus === "loading" || loading) return <p className="text-center text-muted-foreground">جارٍ التحميل…</p>;
  if (sessionStatus === "unauthenticated")
    return <div className="mx-auto max-w-md card-brand text-center"><Link href="/login" className="btn-primary">سجّل الدخول</Link></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-dark">ملفي الشخصي</h1>
        <Link href="/dashboard" className="text-sm text-brand">→ لوحتي</Link>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
            {(me?.full_name || "؟").slice(0, 1)}
          </span>
          <div>
            <p className="text-lg font-semibold text-brand-dark">{me?.full_name}</p>
            <p className="text-sm text-muted-foreground" dir="ltr">{me?.email}</p>
            <p className="mt-1 text-xs text-brand">{TYPE_AR[me?.user_type] || me?.user_type} · {roles.join("، ")}</p>
          </div>
        </div>
      </Card>

      {primaryRole === "BENEFICIARY" && me?.benef_id
        ? <BeneficiaryProfile userId={userId} benefId={me.benef_id} />
        : <Card title="معلومات الحساب"><p className="text-sm text-muted-foreground">
            حسابك من نوع {TYPE_AR[me?.user_type]}. إدارة بيانات المنظمة والفرص من لوحة التحكم.
          </p></Card>}
    </div>
  );
}

function BeneficiaryProfile({ userId, benefId }: { userId: number; benefId: number }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["profile-full", benefId], queryFn: () => ProfileApi.getFull(benefId, userId) });
  const docs = useQuery({ queryKey: ["my-docs", userId], queryFn: () => ProfileApi.documents(userId) });
  const [f, setF] = useState<any>({});
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: any) => { setF((s: any) => ({ ...s, [k]: v })); setSaved(false); };

  useEffect(() => { if (data) setF(data); }, [data]);

  const save = useMutation({
    mutationFn: () => ProfileApi.update(userId, f),
    onSuccess: () => { setSaved(true); qc.invalidateQueries({ queryKey: ["profile-full", benefId] }); },
  });

  if (isLoading) return <Empty text="جارٍ التحميل…" />;

  return (
    <>
      <Card title="البيانات الشخصية والمهنية" action={
        <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary text-sm disabled:opacity-60">
          {save.isPending ? "حفظ…" : saved ? "✓ تم الحفظ" : "حفظ"}
        </button>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="الجنسية" value={f.is_saudi || "Y"} onChange={(e: any) => set("is_saudi", e.target.value)}
            options={[{ v: "Y", l: "سعودي" }, { v: "N", l: "مقيم" }]} />
          {f.is_saudi === "N" && <Input label="نوع الإقامة" value={f.residency_type || ""} onChange={(e: any) => set("residency_type", e.target.value)} />}
          <Input label="المدينة" value={f.city || ""} onChange={(e: any) => set("city", e.target.value)} />
          <SelectField label="المؤهل" value={f.education_level || "BACHELOR"} onChange={(e: any) => set("education_level", e.target.value)} options={EDU_OPTIONS} />
          <Input label="التخصص" value={f.major || ""} onChange={(e: any) => set("major", e.target.value)} />
          <Input label="سنة التخرج" type="number" value={f.graduation_year || ""} onChange={(e: any) => set("graduation_year", e.target.value)} />
          <Input label="سنوات الخبرة" type="number" value={f.experience_years || 0} onChange={(e: any) => set("experience_years", e.target.value)} />
          <SelectField label="الحالة" value={f.current_status || "SEEKER"} onChange={(e: any) => set("current_status", e.target.value)}
            options={[{ v: "SEEKER", l: "باحث عن عمل" }, { v: "FRESH_GRAD", l: "حديث تخرج" }, { v: "EMPLOYED", l: "موظف" }, { v: "TRAINEE", l: "متدرب" }]} />
        </div>
      </Card>

      <Card title="الرغبات الوظيفية وبيئة العمل">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="المسميات المرغوبة" value={f.desired_titles || ""} onChange={(e: any) => set("desired_titles", e.target.value)} />
          <Input label="المدينة المفضّلة" value={f.desired_city || ""} onChange={(e: any) => set("desired_city", e.target.value)} />
          <SelectField label="نوع العمل المفضّل" value={f.work_type_pref || "FULL"} onChange={(e: any) => set("work_type_pref", e.target.value)}
            options={[{ v: "FULL", l: "دوام كامل" }, { v: "PART", l: "دوام جزئي" }, { v: "REMOTE", l: "عن بُعد" }, { v: "HYBRID", l: "هجين" }, { v: "TEMP", l: "مؤقت" }]} />
          <Input label="بيئة العمل المناسبة" value={f.work_env_pref || ""} onChange={(e: any) => set("work_env_pref", e.target.value)} placeholder="مثال: مكتبي هادئ، فريق صغير…" />
        </div>
        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-muted-foreground">نبذة تعريفية</span>
          <textarea value={f.summary || ""} onChange={(e: any) => set("summary", e.target.value)} rows={3}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-brand" />
        </label>
      </Card>

      <Card title="الخصوصية">
        <p className="mb-3 text-xs text-muted-foreground">يمكنك إخفاء اسمك ورقمك عن الشركات حتى تطمئن؛ يظهر ملفك لهم باسم مرجعي، ويبقى التواصل عبر الرسائل.</p>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={f.hide_name === "Y"} onChange={(e) => set("hide_name", e.target.checked ? "Y" : "N")} />
            إخفاء اسمي عن الشركات
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={f.hide_phone === "Y"} onChange={(e) => set("hide_phone", e.target.checked ? "Y" : "N")} />
            إخفاء رقم جوالي عن الشركات
          </label>
        </div>
      </Card>

      <DocumentsCard userId={userId} docs={docs.data} onAdded={() => qc.invalidateQueries({ queryKey: ["my-docs", userId] })} />
    </>
  );
}

const DOC_TYPES = [
  { v: "CV", l: "السيرة الذاتية" }, { v: "ID", l: "الهوية/الإقامة" },
  { v: "CERTIFICATE", l: "شهادة" }, { v: "OTHER", l: "أخرى" },
];

function DocumentsCard({ userId, docs, onAdded }: { userId: number; docs: any[]; onAdded: () => void }) {
  const [f, setF] = useState({ doc_type: "CV", title: "", url: "" });
  const add = useMutation({
    mutationFn: () => ProfileApi.addDocument(userId, f.doc_type, f.title, f.url),
    onSuccess: () => { setF({ doc_type: "CV", title: "", url: "" }); onAdded(); },
  });
  return (
    <Card title="المرفقات (السيرة، الهوية، الشهادات)">
      <p className="mb-3 text-xs text-muted-foreground">أضف رابط الملف (Drive/أي مستضيف). رفع الملفات المباشر قيد الإضافة.</p>
      {docs?.length ? (
        <ul className="mb-4 space-y-2">
          {docs.map((d) => (
            <li key={d.doc_id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <span><span className="badge">{DOC_TYPES.find((t) => t.v === d.doc_type)?.l || d.doc_type}</span> {d.title}</span>
              {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-brand">فتح ↗</a>}
            </li>
          ))}
        </ul>
      ) : <p className="mb-4 text-sm text-muted-foreground">لا مرفقات بعد.</p>}
      <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="grid gap-2 sm:grid-cols-4">
        <SelectField value={f.doc_type} onChange={(e: any) => setF({ ...f, doc_type: e.target.value })} options={DOC_TYPES} />
        <Input placeholder="عنوان الملف" value={f.title} onChange={(e: any) => setF({ ...f, title: e.target.value })} />
        <Input placeholder="رابط الملف" value={f.url} onChange={(e: any) => setF({ ...f, url: e.target.value })} />
        <button type="submit" disabled={add.isPending || !f.url} className="btn-primary text-sm disabled:opacity-60">إضافة</button>
      </form>
    </Card>
  );
}
