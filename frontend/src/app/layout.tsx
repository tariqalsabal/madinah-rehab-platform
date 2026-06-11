import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });
const tajawal = Tajawal({ subsets: ["arabic"], weight: ["400", "500", "700"], variable: "--font-tajawal" });

export const metadata: Metadata = {
  title: "منصة التأهيل والتوظيف | مستودع المدينة المنورة الخيري",
  description:
    "ربط المستفيدين بفرص التدريب والتأهيل والتوظيف عبر الشركات والمعاهد وشركات التوظيف والجهات المانحة.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Providers>
          <Header />
          <main className="container w-full flex-1 py-8">{children}</main>
          <footer className="mt-auto border-t-4 border-t-gold bg-brand-dark py-8 text-center text-sm text-white/90">
            <p className="font-semibold">جمعية مستودع المدينة المنورة الخيري</p>
            <p className="mt-1 text-xs text-white/70">جمعية خيرية غير ربحية — مسجّلة برقم 626 · info@mcw.sa</p>
            <nav className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs">
              <a href="/about" className="hover:text-gold-light">عن الجمعية</a>
              <a href="/jobs" className="hover:text-gold-light">الوظائف</a>
              <a href="/programs" className="hover:text-gold-light">البرامج</a>
              <a href="/faq" className="hover:text-gold-light">الأسئلة</a>
              <a href="/contact" className="hover:text-gold-light">تواصل بنا</a>
            </nav>
            <p className="mt-3 text-white/60">
              © {new Date().getFullYear()} منصة التأهيل والتوظيف — جميع الحقوق محفوظة
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
