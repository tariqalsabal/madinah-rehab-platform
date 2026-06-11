"use client";

import { ReactNode } from "react";

export const STATUS_AR: Record<string, string> = {
  // الطلبات
  SUBMITTED: "مُقدّم", SCREENING: "قيد الفرز", SHORTLISTED: "قائمة مختصرة",
  INTERVIEW: "مقابلة", OFFER: "عرض عمل", HIRED: "تم التوظيف", ENROLLED: "مُسجّل",
  REJECTED: "مرفوض", WITHDRAWN: "مسحوب",
  // الحسابات
  ACTIVE: "نشط", PENDING: "معلّق", SUSPENDED: "موقوف", CLOSED: "مغلق",
  // الفرص
  PUBLISHED: "منشورة", DRAFT: "مسودّة", CLOSED_JOB: "مغلقة", FILLED: "مكتملة", APPROVED: "معتمد",
};

const GREEN = new Set(["HIRED", "ENROLLED", "ACTIVE", "PUBLISHED", "APPROVED", "OFFER"]);
const RED = new Set(["REJECTED", "SUSPENDED", "CLOSED", "WITHDRAWN"]);
const AMBER = new Set(["INTERVIEW", "SHORTLISTED", "PENDING", "SCREENING", "DRAFT"]);

export function Badge({ status }: { status: string }) {
  const cls = GREEN.has(status)
    ? "bg-brand-light text-brand-dark"
    : RED.has(status)
    ? "bg-red-100 text-red-700"
    : AMBER.has(status)
    ? "bg-gold-light text-gold-dark"
    : "bg-muted text-muted-foreground";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{STATUS_AR[status] || status}</span>;
}

export function Card({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="card-brand">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="font-semibold text-brand-dark">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            {head.map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
