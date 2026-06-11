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

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand-dark">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-brand">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Input({ label, ...rest }: any) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block text-muted-foreground">{label}</span>}
      <input {...rest} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-brand" />
    </label>
  );
}

export function SelectField({ label, value, onChange, options }: { label?: string; value: any; onChange: any; options: { v: string; l: string }[] }) {
  return (
    <label className="block text-sm">
      {label && <span className="mb-1 block text-muted-foreground">{label}</span>}
      <select value={value} onChange={onChange} className="w-full rounded-lg border px-3 py-2 outline-none focus:border-brand">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

export const FIELD_OPTIONS = [
  { v: "ACCOUNT", l: "محاسبة" }, { v: "IT", l: "تقنية المعلومات" }, { v: "HR", l: "موارد بشرية" },
  { v: "SALES", l: "مبيعات" }, { v: "CS", l: "خدمة عملاء" }, { v: "DEV", l: "برمجة" },
  { v: "PM", l: "إدارة مشاريع" }, { v: "LOGISTICS", l: "لوجستيات" }, { v: "ADMIN", l: "إداري" },
];
export const EDU_OPTIONS = [
  { v: "SECONDARY", l: "ثانوية" }, { v: "DIPLOMA", l: "دبلوم" }, { v: "BACHELOR", l: "بكالوريوس" }, { v: "MASTER", l: "ماجستير" },
];

// تصدير مصفوفة كائنات إلى CSV (UTF-8 BOM للعربية)
export function exportCsv(rows: any[], filename: string) {
  if (!rows?.length) return;
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
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
