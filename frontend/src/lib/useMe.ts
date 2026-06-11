"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { MeApi } from "./api";

// خطّاف موحّد: يُرجع جلسة المستخدم + بياناته من /me (الدور، benef_id، org_id)
export function useMe() {
  const { data: session, status } = useSession();
  const userId = Number((session as any)?.userId);
  const roles: string[] = (session as any)?.roles || [];

  const me = useQuery({
    queryKey: ["me", userId],
    queryFn: () => MeApi.get(userId),
    enabled: Number.isFinite(userId) && userId > 0,
  });

  const has = (...codes: string[]) => codes.some((c) => roles.includes(c));
  const primaryRole =
    has("ADMIN") ? "ADMIN" :
    has("STAFF") ? "STAFF" :
    has("COMPANY_ADMIN", "COMPANY_HR", "RECRUITER") ? "COMPANY" :
    has("INSTITUTE") ? "INSTITUTE" :
    has("DONOR") ? "DONOR" :
    "BENEFICIARY";

  return {
    sessionStatus: status,
    userId,
    roles,
    primaryRole,
    me: me.data,            // { user_id, full_name, email, user_type, org_id, benef_id, roles }
    loading: me.isLoading,
  };
}
