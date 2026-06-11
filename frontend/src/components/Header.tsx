"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";

const NAV = [
  { h: "/jobs", t: "الوظائف" },
  { h: "/programs", t: "البرامج التدريبية" },
  { h: "/companies", t: "الشركاء" },
  { h: "/dashboard", t: "لوحة التحكم" },
];

// هيدر ذكي يعكس حالة الجلسة (اسم المستخدم + خروج) ويدعم الجوال
export function Header() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const name = (session?.user?.name as string) || "";

  return (
    <header className="brand-gradient text-white shadow-md">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white/95 shadow">
            <img src="/logo.png" alt="شعار الجمعية" className="h-11 w-11 object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold">منصة التأهيل والتوظيف</span>
            <span className="block text-xs text-gold-light">مستودع المدينة المنورة الخيري</span>
          </span>
        </Link>

        <nav className="hidden gap-7 text-sm font-medium lg:flex">
          {NAV.map((n) => (
            <Link key={n.h} href={n.h} className="transition hover:text-gold-light">{n.t}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {status === "authenticated" ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link href="/dashboard" className="flex items-center gap-1.5 text-sm hover:text-gold-light">
                <LayoutDashboard size={16} /> {name?.split("@")[0] || "حسابي"}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm transition hover:bg-white/25"
              >
                <LogOut size={16} /> خروج
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-gold text-sm">دخول</Link>
          )}
          <button onClick={() => setOpen((o) => !o)} className="lg:hidden" aria-label="القائمة">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="container flex flex-col gap-1 pb-4 text-sm lg:hidden">
          {NAV.map((n) => (
            <Link key={n.h} href={n.h} onClick={() => setOpen(false)} className="rounded-md px-2 py-2 hover:bg-white/10">{n.t}</Link>
          ))}
          {status === "authenticated" ? (
            <button onClick={() => signOut({ callbackUrl: "/" })} className="rounded-md px-2 py-2 text-right hover:bg-white/10">خروج</button>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 hover:bg-white/10">دخول</Link>
          )}
        </nav>
      )}
    </header>
  );
}
