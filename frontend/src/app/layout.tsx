import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

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
          <Header />
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
