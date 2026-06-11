import axios, { AxiosInstance } from "axios";
import { getSession } from "next-auth/react";

// طبقة تكامل الـ API: عميل Axios موحّد يحقن JWT تلقائياً
// ويعالج تجديد التوكن وأخطاء 401.

const baseURL = process.env.NEXT_PUBLIC_API_BASE || "/api/backend";

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// حقن رمز الوصول من جلسة NextAuth
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    const session = await getSession();
    const token = (session as any)?.accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// معالجة موحّدة للأخطاء
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      // التوكن منتهٍ — أعد التوجيه لتسجيل الدخول
      window.location.href = "/login?expired=1";
    }
    return Promise.reject(
      new Error(error?.response?.data?.error || error.message || "خطأ في الاتصال بالخادم")
    );
  }
);

// ===== دوال مساعدة لكل مورد =====
import type { Job, TrainingProgram, MatchResult, DashboardKpis, OrdsFeed, Organization } from "./types";

export const CompaniesApi = {
  list: (params?: { type?: string }) =>
    api.get<OrdsFeed<Organization>>("/companies", { params }).then((r) => r.data),
};

export const JobsApi = {
  list: (params?: { q?: string; city?: string; offset?: number }) =>
    api.get<OrdsFeed<Job>>("/jobs", { params }).then((r) => r.data),
  get: (id: number) => api.get<Job>(`/jobs/${id}`).then((r) => r.data),
};

export const ProgramsApi = {
  list: (params?: { offset?: number }) =>
    api.get<OrdsFeed<TrainingProgram>>("/programs", { params }).then((r) => r.data),
  get: (id: number) => api.get(`/programs/${id}`).then((r) => one<any>(r.data)),
};

export const MatchApi = {
  forBeneficiary: (benefId: number) =>
    api.get<OrdsFeed<MatchResult>>(`/beneficiaries/${benefId}/matches`).then((r) => r.data),
};

export const ApplicationsApi = {
  applyJob: (benef_id: number, job_id: number, cover_note?: string) =>
    api.post<{ application_id: number }>("/applications/job", { benef_id, job_id, cover_note }).then((r) => r.data),
  applyProgram: (benef_id: number, program_id: number) =>
    api.post<{ application_id: number }>("/applications/program", { benef_id, program_id }).then((r) => r.data),
};

// بعض نقاط ORDS تُغلّف النتيجة المفردة داخل items[] — نفكّها بأمان.
function one<T>(d: any): T {
  return (d && Array.isArray(d.items) ? d.items[0] : d) as T;
}
function feed<T>(d: any): T[] {
  return (d && Array.isArray(d.items) ? d.items : Array.isArray(d) ? d : []) as T[];
}

export const DashboardApi = {
  kpis: () => api.get("/dashboard/kpis").then((r) => one<DashboardKpis>(r.data)),
};

// المستخدم الحالي وبياناته المخصّصة
export const MeApi = {
  get: (uid: number) => api.get(`/me`, { params: { uid } }).then((r) => one<any>(r.data)),
  applications: (uid: number) => api.get(`/me/applications`, { params: { uid } }).then((r) => feed<any>(r.data)),
  donations: (orgId: number) => api.get(`/me/donations`, { params: { org_id: orgId } }).then((r) => feed<any>(r.data)),
};

// المنظمة (شركة/معهد)
export const OrgApi = {
  jobs: (orgId: number) => api.get(`/org/jobs`, { params: { org_id: orgId } }).then((r) => feed<any>(r.data)),
  programs: (orgId: number) => api.get(`/org/programs`, { params: { org_id: orgId } }).then((r) => feed<any>(r.data)),
  applicants: (jobId: number) => api.get(`/jobs/${jobId}/applicants`).then((r) => feed<any>(r.data)),
  enrollees: (programId: number) => api.get(`/programs/${programId}/enrollees`).then((r) => feed<any>(r.data)),
  createJob: (payload: any) => api.post(`/org/jobs`, payload).then((r) => r.data),
  createProgram: (payload: any) => api.post(`/org/programs`, payload).then((r) => r.data),
};

// التبرعات (إنشاء)
export const DonationApi = {
  create: (payload: any) => api.post(`/donations`, payload).then((r) => r.data),
};

// إدارة حالة الطلبات (شركة/موظف/أدمن)
export const AppApi = {
  setStatus: (application_id: number, new_status: string, actor: number, note?: string) =>
    api.post(`/applications/status`, { application_id, new_status, actor, note }).then((r) => r.data),
};

// البروفايل والمرفقات
export const ProfileApi = {
  update: (uid: number, payload: any) => api.post(`/me/profile`, { uid, ...payload }).then((r) => r.data),
  getFull: (benefId: number, viewer: number) =>
    api.get(`/beneficiaries/${benefId}/profile`, { params: { viewer } }).then((r) => one<any>(r.data)),
  documents: (uid: number) => api.get(`/me/documents`, { params: { uid } }).then((r) => feed<any>(r.data)),
  addDocument: (uid: number, doc_type: string, title: string, url: string) =>
    api.post(`/documents`, { uid, doc_type, title, url }).then((r) => r.data),
};

// المراسلات الداخلية
export const MessagesApi = {
  conversations: (uid: number) => api.get(`/me/conversations`, { params: { uid } }).then((r) => feed<any>(r.data)),
  thread: (uid: number, peer: number) => api.get(`/messages`, { params: { uid, peer } }).then((r) => (Array.isArray(r.data) ? r.data : [])),
  send: (from_uid: number, to_uid: number, body: string, application_id?: number) =>
    api.post(`/messages`, { from_uid, to_uid, body, application_id }).then((r) => r.data),
};

// الإشعارات
export const NotificationsApi = {
  list: (uid: number) => api.get(`/me/notifications`, { params: { uid } }).then((r) => feed<any>(r.data)),
  read: (uid: number, notif_id?: number) => api.post(`/notifications/read`, { uid, notif_id: notif_id ?? null }).then((r) => r.data),
};

// لوحة الأدمن
export const AdminApi = {
  users: (actor: number) => api.get(`/admin/users`, { params: { actor } }).then((r) => feed<any>(r.data)),
  setUserStatus: (user_id: number, status: string, actor: number) =>
    api.post(`/admin/users/status`, { user_id, status, actor }).then((r) => r.data),
  applications: (actor: number) => api.get(`/admin/applications`, { params: { actor } }).then((r) => feed<any>(r.data)),
  donations: (actor: number) => api.get(`/admin/donations`, { params: { actor } }).then((r) => feed<any>(r.data)),
  beneficiaries: (actor: number) => api.get(`/admin/beneficiaries`, { params: { actor } }).then((r) => feed<any>(r.data)),
  approveBeneficiary: (benef_id: number, status: string, actor: number) =>
    api.post(`/beneficiaries/approve`, { benef_id, status, actor }).then((r) => r.data),
};

export const AuthApi = {
  register: (payload: {
    email: string;
    full_name: string;
    password: string;
    user_type?: string;
    phone?: string;
  }) => api.post<{ user_id: number; status: string }>("/auth/register", payload).then((r) => r.data),
};

export const LettersApi = {
  verify: (code: string) => api.get(`/letters/verify/${code}`).then((r) => r.data),
};
