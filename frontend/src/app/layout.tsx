import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "منصة التأهيل والتوظيف | مستودع المدينة المنورة الخيري",
  description:
    "ربط المستفيدين بفرص التدريب والتأهيل والتوظيف عبر الشركات والمعاهد وشركات التوظيف والجهات المانحة.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <header className="brand-gradient text-white shadow-md">
            <div className="container flex h-20 items-center justify-between">
              <a href="/" className="flex items-center gap-3">
                {/* ضع شعار الجمعية في frontend/public/logo.png */}
                <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white/95 shadow">
                  <img src="/logo.png" alt="شعار جمعية مستودع المدينة المنورة الخيري" className="h-11 w-11 object-contain" />
                </span>
                <span className="leading-tight">
                  <span className="block text-base font-bold">منصة التأهيل والتوظيف</span>
                  <span className="block text-xs text-gold-light">مستودع المدينة المنورة الخيري</span>
                </span>
              </a>
              <nav className="hidden gap-7 text-sm font-medium md:flex">
                <a href="/jobs" className="transition hover:text-gold-light">الوظائف</a>
                <a href="/programs" className="transition hover:text-gold-light">البرامج التدريبية</a>
                <a href="/companies" className="transition hover:text-gold-light">الشركات</a>
                <a href="/dashboard" className="transition hover:text-gold-light">لوحة التحكم</a>
              </nav>
              <a href="/login" className="btn-gold text-sm">دخول</a>
            </div>
          </header>
          <main className="container py-8">{children}</main>
          <footer className="mt-12 border-t-4 border-t-gold bg-brand-dark py-8 text-center text-sm text-white/90">
            <p className="font-semibold">جمعية مستودع المدينة المنورة الخيري</p>
            <p className="mt-1 text-white/70">
              © {new Date().getFullYear()} منصة التأهيل والتوظيف — جميع الحقوق محفوظة
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
