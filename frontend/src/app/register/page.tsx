"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api";

const USER_TYPES: { key: string; label: string }[] = [
  { key: "BENEFICIARY", label: "مستفيد" },
  { key: "COMPANY", label: "شركة" },
  { key: "INSTITUTE", label: "معهد / مركز تدريب" },
  { key: "RECRUITER", label: "شركة توظيف" },
  { key: "DONOR", label: "جهة مانحة" },
];

function RegisterForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
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
      setOk(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (e: any) {
      setErr(e.message || "تعذّر إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  }

  if (ok)
    return (
      <div className="card-brand text-center">
        <p className="text-lg font-semibold text-brand-dark">تم إنشاء حسابك بنجاح ✅</p>
        <p className="mt-2 text-sm text-muted-foreground">حسابك قيد المراجعة. جارٍ تحويلك لتسجيل الدخول…</p>
      </div>
    );

  return (
    <div className="card-brand">
      <h1 className="mb-6 text-center text-2xl font-bold text-brand-dark">إنشاء حساب</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <select value={form.user_type} onChange={(e) => set("user_type", e.target.value)}
          className="w-full rounded-md border px-3 py-2">
          {USER_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <input required placeholder="الاسم الكامل" value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)} className="w-full rounded-md border px-3 py-2" />
        <input type="email" required placeholder="البريد الإلكتروني" value={form.email}
          onChange={(e) => set("email", e.target.value)} className="w-full rounded-md border px-3 py-2" />
        <input placeholder="رقم الجوال (اختياري)" value={form.phone}
          onChange={(e) => set("phone", e.target.value)} className="w-full rounded-md border px-3 py-2" />
        <input type="password" required minLength={6} placeholder="كلمة المرور (6 أحرف على الأقل)"
          value={form.password} onChange={(e) => set("password", e.target.value)} className="w-full rounded-md border px-3 py-2" />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? "جارٍ الإنشاء…" : "تسجيل"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        لديك حساب؟ <a href="/login" className="text-brand">سجّل الدخول</a>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <Suspense fallback={<p className="text-center text-muted-foreground">…</p>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
