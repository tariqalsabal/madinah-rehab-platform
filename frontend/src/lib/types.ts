// أنواع البيانات المشتركة (تطابق عروض/جداول القاعدة)

export type UserType =
  | "ADMIN" | "STAFF" | "BENEFICIARY" | "COMPANY" | "INSTITUTE" | "RECRUITER" | "DONOR";

export interface AuthUser {
  user_id: number;
  full_name?: string;
  roles: string[];
  access_token: string;
}

export interface Job {
  job_id: number;
  title: string;
  org_name: string;
  org_brand?: string;
  city?: string;
  work_mode: "ONSITE" | "REMOTE" | "HYBRID";
  employment_type: "FULL" | "PART" | "CONTRACT" | "TEMP";
  salary_min?: number;
  salary_max?: number;
  vacancies: number;
  field_name?: string;
  function_name?: string;
  published_at?: string;
  applicants?: number;
}

export interface TrainingProgram {
  program_id: number;
  title: string;
  org_name: string;
  city?: string;
  delivery_mode: "ONSITE" | "ONLINE" | "HYBRID";
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  seats_available: number;
  is_free: "Y" | "N";
  discount_pct: number;
  certificate: "Y" | "N";
  start_date?: string;
  field_name?: string;
}

export interface MatchResult {
  target_type: "JOB" | "TRAINING";
  score: number;
  breakdown?: string; // JSON
  job_title?: string;
  job_org?: string;
  program_title?: string;
}

export interface DashboardKpis {
  total_beneficiaries: number;
  approved_beneficiaries: number;
  open_jobs: number;
  open_programs: number;
  companies: number;
  institutes: number;
  recruiters: number;
  total_hired: number;
  total_trainees: number;
  job_donation_units: number;
  training_donation_units: number;
  total_donation_value: number;
  hire_rate_pct: number;
}

// استجابة ORDS القياسية للمجموعات
export interface OrdsFeed<T> {
  items: T[];
  hasMore: boolean;
  limit: number;
  offset: number;
  count: number;
}
