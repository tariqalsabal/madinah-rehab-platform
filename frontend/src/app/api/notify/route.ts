import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { buildEmail } from "@/lib/emailTemplate";

// إرسال بريد الأحداث إلى قناة Teams عبر M365 SMTP (خادمي)
// متغيّرات البيئة على Vercel: SMTP_USER, SMTP_PASS, NOTIFY_TO
export async function POST(req: Request) {
  try {
    const { badge, title, rows } = await req.json();
    const to = process.env.NOTIFY_TO;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!to || !user || !pass) {
      return NextResponse.json({ skipped: "email not configured" });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.office365.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false, // STARTTLS على 587
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: user, // M365 يتطلب أن يطابق المُرسِل الحساب المُصادَق
      to,
      subject: title || "إشعار من منصة التأهيل والتوظيف",
      html: buildEmail(badge || "إشعار", title || "حدث جديد", Array.isArray(rows) ? rows : []),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "send failed" }, { status: 500 });
  }
}
