// مساعد إرسال بريد حدث (fire-and-forget) — لا يعطّل تجربة المستخدم
export function notifyEvent(badge: string, title: string, rows: [string, any][]) {
  try {
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        badge,
        title,
        rows: rows.filter(([, v]) => v !== null && v !== undefined && v !== ""),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* تجاهل */
  }
}
