// بنّاء بريد HTML أنيق بهوية الجمعية (يُستخدم خادمياً في /api/notify)

function kvRows(rows: [string, any][]): string {
  return rows
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="color:#7a8a82;padding:11px 4px;border-bottom:1px solid #eef2f0;width:38%;font-size:13px">${k}</td>` +
        `<td style="color:#14331f;font-weight:bold;padding:11px 4px;border-bottom:1px solid #eef2f0;font-size:14px">${escapeHtml(String(v))}</td></tr>`
    )
    .join("");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

export function buildEmail(badge: string, title: string, rows: [string, any][]): string {
  return (
    `<div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;background:#eef3f0;padding:24px;margin:0">` +
    `<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e9e5">` +
    `<div style="background:linear-gradient(135deg,#136138 0%,#1f8a4c 55%,#5cb335 100%);padding:26px 24px;text-align:center;color:#fff">` +
    `<div style="font-size:21px;font-weight:bold">منصة التأهيل والتوظيف</div>` +
    `<div style="font-size:13px;color:#f6eecf;margin-top:3px">جمعية مستودع المدينة المنورة الخيري</div>` +
    `</div>` +
    `<div style="padding:26px 24px">` +
    `<span style="display:inline-block;background:#e7f4ec;color:#136138;padding:5px 16px;border-radius:30px;font-size:13px;font-weight:bold">${escapeHtml(badge)}</span>` +
    `<h2 style="color:#136138;margin:14px 0 6px;font-size:19px">${escapeHtml(title)}</h2>` +
    `<table style="width:100%;border-collapse:collapse;margin-top:10px">${kvRows(rows)}</table>` +
    `</div>` +
    `<div style="background:#f6eecf;height:5px"></div>` +
    `<div style="background:#136138;color:#cfe6d8;padding:16px;text-align:center;font-size:12px">إشعار آليّ من منصة التأهيل والتوظيف · info@mcw.sa</div>` +
    `</div></div>`
  );
}
