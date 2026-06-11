"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ProfileApi } from "@/lib/api";
import { useMe } from "@/lib/useMe";
import { Card, Empty } from "@/components/dashboards/shared";

const WORK_AR: Record<string, string> = { FULL: "دوام كامل", PART: "جزئي", REMOTE: "عن بُعد", HYBRID: "هجين", TEMP: "مؤقت" };
const STAT_AR: Record<string, string> = { SEEKER: "باحث عن عمل", FRESH_GRAD: "حديث تخرج", EMPLOYED: "موظف", TRAINEE: "متدرب" };

// عرض ملف المتقدّم للشركات/الأدمن (يحترم خصوصية المستفيد)
export default function BeneficiaryProfileView() {
  const params = useParams();
  const benefId = Number(params?.id);
  const { sessionStatus, userId, primaryRole } = useMe();

  const allowed = sessionStatus === "authenticated" && ["ADMIN", "STAFF", "COMPANY", "INSTITUTE"].includes(primaryRole);
  const { data: p, isLoading, error } = useQuery({
    queryKey: ["benef-profile", benefId, userId],
    queryFn: () => ProfileApi.getFull(benefId, userId),
    enabled: allowed && Number.isFinite(benefId),
  });

  if (sessionStatus === "loading") return <p className="text-center text-muted-foreground">جارٍ التحميل…</p>;
  if (!allowed) return <Empty text="لا تملك صلاحية عرض ملفات المستفيدين." />;
  if (isLoading) return <p className="text-center text-muted-foreground">جارٍ التحميل…</p>;
  if (error || !p) return <p className="text-red-600">تعذّر تحميل الملف.</p>;

  const rows: [string, any][] = [
    ["المدينة", p.city], ["المنطقة", p.region], ["الجنسية", p.is_saudi === "Y" ? "سعودي" : "مقيم"],
    ["رقم الهوية", p.national_id], ["الحالة الاجتماعية", p.marital_status],
    ["المؤهل", p.education_level], ["التخصص", p.major], ["الجامعة", p.university], ["المعدل", p.gpa], ["سنة التخرج", p.graduation_year],
    ["اللغات", p.languages], ["الخبرة (سنوات)", p.experience_years], ["الحالة", STAT_AR[p.current_status] || p.current_status],
    ["المسمّى الحالي", p.current_job_title], ["جهة العمل الحالية", p.current_employer], ["فترة الإشعار", p.notice_period],
    ["رخصة قيادة", p.has_license === "Y" ? "نعم" : null], ["سيارة خاصة", p.has_car === "Y" ? "نعم" : null],
    ["من ذوي الاحتياجات", p.special_needs === "Y" ? (p.special_needs_type || "نعم") : null],
    ["المسميات المرغوبة", p.desired_titles], ["الراتب المتوقّع", p.desired_min_salary],
    ["نوع العمل المفضّل", WORK_AR[p.work_type_pref] || p.work_type_pref], ["بيئة العمل", p.work_env_pref],
    ["المهارات", p.skills], ["LinkedIn", p.linkedin_url], ["نبذة", p.summary],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/dashboard" className="text-sm text-brand">→ لوحتي</Link>
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
              {(p.full_name || "؟").slice(0, 1)}
            </span>
            <div>
              <p className="text-lg font-semibold text-brand-dark">{p.full_name}</p>
              {p.is_anonymous === "Y" && <p className="text-xs text-gold-dark">ملف مموّه (اختار المستفيد إخفاء هويته)</p>}
              {p.phone && <p className="text-sm text-muted-foreground" dir="ltr">{p.phone}</p>}
              {p.email && <p className="text-sm text-muted-foreground" dir="ltr">{p.email}</p>}
            </div>
          </div>
          <Link href={`/messages?peer=${p.user_id}`} className="btn-primary text-sm">مراسلة</Link>
        </div>
        <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {rows.filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-dashed pb-2 text-sm">
              <dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{String(v)}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
