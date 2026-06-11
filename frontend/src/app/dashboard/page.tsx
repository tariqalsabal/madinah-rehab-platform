"use client";

import Link from "next/link";
import { useMe } from "@/lib/useMe";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import BeneficiaryDashboard from "@/components/dashboards/BeneficiaryDashboard";
import CompanyDashboard from "@/components/dashboards/CompanyDashboard";
import InstituteDashboard from "@/components/dashboards/InstituteDashboard";
import DonorDashboard from "@/components/dashboards/DonorDashboard";

// موجّه لوحة التحكم: يعرض اللوحة المناسبة لدور المستخدم فقط (خصوصية البيانات)
export default function DashboardPage() {
  const { sessionStatus, userId, primaryRole, me, loading } = useMe();

  if (sessionStatus === "loading" || loading)
    return <p className="text-center text-muted-foreground">جارٍ التحميل…</p>;

  if (sessionStatus === "unauthenticated")
    return (
      <div className="mx-auto max-w-md card-brand text-center">
        <p className="text-lg font-semibold text-brand-dark">يلزم تسجيل الدخول</p>
        <p className="mt-2 text-sm text-muted-foreground">سجّل الدخول للوصول إلى لوحتك.</p>
        <Link href="/login" className="btn-primary mt-4 inline-block">دخول</Link>
      </div>
    );

  switch (primaryRole) {
    case "ADMIN":
    case "STAFF":
      return <AdminDashboard actor={userId} />;
    case "COMPANY":
      return <CompanyDashboard orgId={me?.org_id} actor={userId} />;
    case "INSTITUTE":
      return <InstituteDashboard orgId={me?.org_id} />;
    case "DONOR":
      return <DonorDashboard orgId={me?.org_id} />;
    default:
      return <BeneficiaryDashboard userId={userId} benefId={me?.benef_id} name={me?.full_name} />;
  }
}
