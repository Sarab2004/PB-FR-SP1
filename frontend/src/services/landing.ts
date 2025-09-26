import { api } from "./api";

export type LandingRole = {
  key: "REQUESTER" | "MANAGER";
  label: string;
  authUrl: string;
};

export type LandingResp = {
  title: string;
  subtitle?: string;
  roles: LandingRole[];
  ctas?: {
    primary?: { href: string; label: string };
    support?: { href: string; label: string };
  };
  dashboards?: Record<string, string>;
  meta?: Record<string, unknown>;
};

// فقط یک thin wrapper روی api.landing تا type داشته باشیم
export function fetchLanding(): Promise<LandingResp> {
  return api.landing() as Promise<LandingResp>;
}
