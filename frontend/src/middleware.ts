export { default } from "next-auth/middleware";

// حماية المسارات (RBAC على مستوى المسار): أي مسار هنا يتطلّب جلسة صالحة.
// التحقق الدقيق من الصلاحيات لكل دور يتم في الصفحة/الـ API الخلفي.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/applications/:path*",
    "/admin/:path*",
  ],
};
