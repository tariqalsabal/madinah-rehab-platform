"use client";

import Link from "next/link";
import { useMe } from "@/lib/useMe";
import { Card } from "@/components/dashboards/shared";

const TYPE_AR: Record<string, string> = {
  ADMIN: "مدير النظام", STAFF: "موظف الجمعية", BENEFICIARY: "مستفيد",
  COMPANY: "شركة", INSTITUTE: "معهد", RECRUITER: "شركة توظيف", DONOR: "جهة مانحة",
};

// الملف الشخصي: يعرض بيانات الحساب الحالي فقط
export default function ProfilePage() {
  const { sessionStatus, me, loading, roles } = useMe();

  if (sessionStatus === "loading" || loading) return <p className="text-center text-muted-foreground">جارٍ التحميل…</p>;
  if (sessionStatus === "unauthenticated")
    return <div className="mx-auto max-w-md card-brand text-center"><Link href="/login" className="btn-primary">سجّل الدخول</Link></div>;

  const rows: [string, any][] = [
    ["الاسم", me?.full_name],
    ["البريد", me?.email],
    ["النوع", TYPE_AR[me?.user_type] || me?.user_type],
    ["الأدوار", roles.join("، ")],
    ["الحالة", me?.status === "ACTIVE" ? "نشط" : me?.status],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-dark">ملفي الشخصي</h1>
        <Link href="/dashboard" className="text-sm text-brand">→ لوحتي</Link>
      </div>
      <Card>
        <div className="mb-4 flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
            {(me?.full_name || "؟").slice(0, 1)}
          </span>
          <div>
            <p className="text-lg font-semibold text-brand-dark">{me?.full_name}</p>
            <p className="text-sm text-muted-foreground" dir="ltr">{me?.email}</p>
          </div>
        </div>
        <dl className="divide-y">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex justify-between py-2.5 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium">{String(v)}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <p className="text-center text-xs text-muted-foreground">لتحديث بياناتك أو رفع سيرتك الذاتية، تواصل مع إدارة الجمعية (قيد التطوير).</p>
    </div>
  );
}
