"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

// صفحة الدخول: بريد/كلمة مرور (عبر ORDS) + Google + Facebook
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
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="mb-6 text-center text-2xl font-bold text-brand-dark">تسجيل الدخول</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="email" required placeholder="البريد الإلكتروني" value={email}
            onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border px-3 py-2" />
          <input type="password" required placeholder="كلمة المرور" value={password}
            onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border px-3 py-2" />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
            {loading ? "جارٍ الدخول…" : "دخول"}
          </button>
        </form>

        <div className="my-4 text-center text-xs text-muted-foreground">أو</div>
        <div className="space-y-2">
          <button disabled title="يتطلب إعداد مزوّد OAuth"
            className="w-full cursor-not-allowed rounded-md border py-2 text-sm font-medium text-muted-foreground opacity-60">
            الدخول عبر Google
          </button>
          <button disabled title="يتطلب إعداد مزوّد OAuth"
            className="w-full cursor-not-allowed rounded-md border py-2 text-sm font-medium text-muted-foreground opacity-60">
            الدخول عبر Facebook
          </button>
          <p className="text-center text-[11px] text-muted-foreground">
            الدخول عبر Google/Facebook سيُفعّل بعد ربط مفاتيح OAuth.
          </p>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          ليس لديك حساب؟ <a href="/register" className="text-brand">سجّل الآن</a>
        </p>
      </div>
    </div>
  );
}
