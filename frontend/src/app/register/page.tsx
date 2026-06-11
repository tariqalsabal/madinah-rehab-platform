"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Phone, Lock, CheckCircle2 } from "lucide-react";
import { AuthApi } from "@/lib/api";
import { notifyEvent } from "@/lib/notify";

const USER_TYPES = [
  { key: "BENEFICIARY", label: "مستفيد" },
  { key: "COMPANY", label: "شركة" },
  { key: "INSTITUTE", label: "معهد / مركز تدريب" },
  { key: "RECRUITER", label: "شركة توظيف" },
  { key: "DONOR", label: "جهة مانحة" },
];

function Field({ icon: Icon, ...props }: any) {
  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 focus-within:border-brand">
      <Icon size={18} className="text-muted-foreground" />
      <input {...props} className="w-full bg-transparent py-2.5 outline-none" />
    </div>
  );
}

function RegisterForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "",
    user_type: sp.get("type") || "BENEFICIARY",
  });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      await AuthApi.register(form);
      const typeAr = USER_TYPES.find((t) => t.key === form.user_type)?.label || form.user_type;
      notifyEvent("تسجيل جديد", `${typeAr}: ${form.full_name}`, [
        ["نوع الحساب", typeAr], ["الاسم", form.full_name], ["البريد", form.email], ["الجوال", form.phone],
      ]);
      setOk(true);
      setTimeout(() => router.push("/login"), 1600);
    } catch (e: any) {
      setErr(e.message || "تعذّر إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  }

  if (ok)
    return (
      <div className="card-brand flex flex-col items-center text-center">
        <CheckCircle2 size={48} className="text-brand" />
        <p className="mt-3 text-lg font-semibold text-brand-dark">تم إنشاء حسابك بنجاح</p>
        <p className="mt-2 text-sm text-muted-foreground">حسابك قيد المراجعة. جارٍ تحويلك لتسجيل الدخول…</p>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border shadow-sm md:grid-cols-2">
      <div className="brand-gradient relative hidden flex-col justify-center p-10 text-white md:flex">
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-gold/20 blur-2xl" />
        <h2 className="text-2xl font-bold">انضمّ إلينا اليوم</h2>
        <p className="mt-3 text-white/85">سواء كنت باحثاً عن فرصة أو جهة تقدّم فرصاً، حسابك الموحّد يربطك بالمنظومة كاملة.</p>
      </div>

      <div className="bg-white p-8 md:p-10">
        <h1 className="mb-6 text-center text-2xl font-bold text-brand-dark">إنشاء حساب</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <select value={form.user_type} onChange={(e) => set("user_type", e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5 outline-none focus:border-brand">
            {USER_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <Field icon={User} required placeholder="الاسم الكامل" value={form.full_name} onChange={(e: any) => set("full_name", e.target.value)} />
          <Field icon={Mail} type="email" required placeholder="البريد الإلكتروني" value={form.email} onChange={(e: any) => set("email", e.target.value)} />
          <Field icon={Phone} placeholder="رقم الجوال (اختياري)" value={form.phone} onChange={(e: any) => set("phone", e.target.value)} />
          <Field icon={Lock} type="password" required minLength={6} placeholder="كلمة المرور (6 أحرف على الأقل)" value={form.password} onChange={(e: any) => set("password", e.target.value)} />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "جارٍ الإنشاء…" : "تسجيل"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          لديك حساب؟ <Link href="/login" className="font-medium text-brand">سجّل الدخول</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="text-center text-muted-foreground">…</p>}>
      <RegisterForm />
    </Suspense>
  );
}
