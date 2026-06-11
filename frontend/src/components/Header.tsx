"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu, X, LogOut, LayoutDashboard, Bell, MessageCircle } from "lucide-react";
import { NotificationsApi, MessagesApi } from "@/lib/api";

const NAV = [
  { h: "/jobs", t: "الوظائف" },
  { h: "/programs", t: "البرامج التدريبية" },
  { h: "/companies", t: "الشركاء" },
  { h: "/dashboard", t: "لوحة التحكم" },
];

export function Header() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const qc = useQueryClient();
  const name = (session?.user?.name as string) || "";
  const uid = Number((session as any)?.userId);
  const authed = status === "authenticated" && uid > 0;

  const notifs = useQuery({ queryKey: ["notifs", uid], queryFn: () => NotificationsApi.list(uid), enabled: authed, refetchInterval: 20000 });
  const convos = useQuery({ queryKey: ["convos-hdr", uid], queryFn: () => MessagesApi.conversations(uid), enabled: authed, refetchInterval: 20000 });
  const unreadN = notifs.data?.filter((n: any) => n.is_read === "N").length || 0;
  const unreadM = convos.data?.reduce((s: number, c: any) => s + Number(c.unread || 0), 0) || 0;

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
          {NAV.map((n) => <Link key={n.h} href={n.h} className="transition hover:text-gold-light">{n.t}</Link>)}
        </nav>

        <div className="flex items-center gap-3">
          {authed ? (
            <>
              <Link href="/messages" className="relative hidden sm:block" aria-label="الرسائل">
                <MessageCircle size={22} />
                {unreadM > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-gold px-1.5 text-[10px] font-bold text-brand-dark">{unreadM}</span>}
              </Link>
              <div className="relative hidden sm:block">
                <button onClick={() => setBellOpen((o) => !o)} aria-label="الإشعارات"><Bell size={22} />
                  {unreadN > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-gold px-1.5 text-[10px] font-bold text-brand-dark">{unreadN}</span>}
                </button>
                {bellOpen && (
                  <div className="absolute left-0 top-9 z-50 w-72 rounded-xl bg-white p-2 text-foreground shadow-xl">
                    <div className="mb-1 flex items-center justify-between px-2 text-xs">
                      <span className="font-semibold text-brand-dark">الإشعارات</span>
                      <button onClick={() => { NotificationsApi.read(uid).then(() => qc.invalidateQueries({ queryKey: ["notifs", uid] })); }} className="text-brand">تعليم الكل مقروء</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {!notifs.data?.length ? <p className="p-3 text-center text-xs text-muted-foreground">لا إشعارات</p> :
                        notifs.data.slice(0, 12).map((n: any) => (
                          <Link key={n.notif_id} href={n.link || "#"} onClick={() => setBellOpen(false)}
                            className={`block rounded-lg p-2 text-xs hover:bg-muted ${n.is_read === "N" ? "bg-brand-light/50" : ""}`}>
                            <span className="block font-medium text-brand-dark">{n.title}</span>
                            <span className="block text-muted-foreground">{n.body}</span>
                            <span className="block text-[10px] text-muted-foreground">{n.created_at}</span>
                          </Link>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <Link href="/dashboard" className="hidden items-center gap-1.5 text-sm hover:text-gold-light sm:flex">
                <LayoutDashboard size={16} /> {name?.split("@")[0] || "حسابي"}
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="hidden items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm transition hover:bg-white/25 sm:flex">
                <LogOut size={16} /> خروج
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-gold text-sm">دخول</Link>
          )}
          <button onClick={() => setOpen((o) => !o)} className="lg:hidden" aria-label="القائمة">{open ? <X /> : <Menu />}</button>
        </div>
      </div>

      {open && (
        <nav className="container flex flex-col gap-1 pb-4 text-sm lg:hidden">
          {NAV.map((n) => <Link key={n.h} href={n.h} onClick={() => setOpen(false)} className="rounded-md px-2 py-2 hover:bg-white/10">{n.t}</Link>)}
          {authed && <Link href="/messages" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 hover:bg-white/10">الرسائل {unreadM > 0 ? `(${unreadM})` : ""}</Link>}
          {authed
            ? <button onClick={() => signOut({ callbackUrl: "/" })} className="rounded-md px-2 py-2 text-right hover:bg-white/10">خروج</button>
            : <Link href="/login" onClick={() => setOpen(false)} className="rounded-md px-2 py-2 hover:bg-white/10">دخول</Link>}
        </nav>
      )}
    </header>
  );
}
