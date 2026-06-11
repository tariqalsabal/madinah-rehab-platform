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
};

export const MatchApi = {
  forBeneficiary: (benefId: number) =>
    api.get<OrdsFeed<MatchResult>>(`/beneficiaries/${benefId}/matches`).then((r) => r.data),
};

export const ApplicationsApi = {
  applyJob: (benef_id: number, job_id: number, cover_note?: string) =>
    api.post<{ application_id: number }>("/applications/job", { benef_id, job_id, cover_note }).then((r) => r.data),
};

export const DashboardApi = {
  kpis: () => api.get<DashboardKpis>("/dashboard/kpis").then((r) => r.data),
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
