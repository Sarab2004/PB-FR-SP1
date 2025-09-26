import type { Role } from "../types/auth";

export const FUNCTIONS_BASE =
  (import.meta.env.VITE_FUNCTIONS_BASE as string) ||
  "https://uoflxqdmjencqxelgbcv.supabase.co/functions/v1";

export const SUPPORT_URL =
  (import.meta.env.VITE_SUPPORT_URL as string) ||
  "/support";

export const DASHBOARD_ROUTES: Record<Role, string> = {
  REQUESTER: "/dashboard/requester",
  MANAGER: "/dashboard/manager",
};