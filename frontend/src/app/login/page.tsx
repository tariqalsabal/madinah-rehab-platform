"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, ShieldCheck } from "lucide-react";

// صفحة الدخول — تخطيط احترافي بعمودين بهوية الجمعية
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setErr("بيانات الدخول غير صحيحة");
    else window.location.href = "/dashboard";
  }

  return (
    <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border shadow-sm md:grid-cols-2">
      {/* اللوحة التعريفية */}
      <div className="brand-gradient relative hidden flex-col justify-center p-10 text-white md:flex">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/20 blur-2xl" />
        <h2 className="text-2xl font-bold">أهلاً بعودتك</h2>
        <p className="mt-3 text-white/85">سجّل الدخول لإدارة ملفك، متابعة طلباتك، والوصول إلى أفضل الفرص المطابقة لك.</p>
        <ul className="mt-6 space-y-3 text-sm">
          <li className="flex items-center gap-2"><ShieldCheck size={18} /> بياناتك محميّة ومشفّرة</li>
          <li className="flex items-center gap-2"><ShieldCheck size={18} /> مطابقة ذكية للفرص</li>
          <li className="flex items-center gap-2"><ShieldCheck size={18} /> خطابات تعريف موثّقة</li>
        </ul>
      </div>

      {/* النموذج */}
      <div className="bg-white p-8 md:p-10">
        <h1 className="mb-6 text-center text-2xl font-bold text-brand-dark">تسجيل الدخول</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border px-3 focus-within:border-brand">
            <Mail size={18} className="text-muted-foreground" />
            <input type="email" required placeholder="البريد الإلكتروني" value={email}
              onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent py-2.5 outline-none" />
          </div>
          <div className="flex items-center gap-2 rounded-lg border px-3 focus-within:border-brand">
            <Lock size={18} className="text-muted-foreground" />
            <input type="password" required placeholder="كلمة المرور" value={password}
              onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent py-2.5 outline-none" />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "جارٍ الدخول…" : "دخول"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> أو <span className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-2">
          <button disabled title="يتطلب إعداد مزوّد OAuth"
            className="w-full cursor-not-allowed rounded-lg border py-2.5 text-sm font-medium text-muted-foreground opacity-60">
            الدخول عبر Google
          </button>
          <button disabled title="يتطلب إعداد مزوّد OAuth"
            className="w-full cursor-not-allowed rounded-lg border py-2.5 text-sm font-medium text-muted-foreground opacity-60">
            الدخول عبر Facebook
          </button>
        </div>

        <div className="mt-5 rounded-lg bg-brand-light p-3 text-xs text-brand-dark">
          <p className="font-semibold">حسابات تجريبية (كلمة المرور: <span dir="ltr">Madinah@2026</span>)</p>
          <p className="mt-1" dir="ltr">admin@demo.sa · company@demo.sa · institute@demo.sa · benef001@demo.sa</p>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          ليس لديك حساب؟ <Link href="/register" className="font-medium text-brand">سجّل الآن</Link>
        </p>
      </div>
    </div>
  );
}
