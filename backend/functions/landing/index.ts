// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { json, ok } from "./respond.ts";
serve((req)=>{
  if (req.method === "OPTIONS") return ok(); // برای Preflight
  if (req.method !== "GET") {
    return json(405, {
      message: "Method Not Allowed"
    });
  }
  // خروجی لندینگ
  const payload = {
    title: "سیستم درخواست کالا/خرید (MVP)",
    subtitle: "برای شروع نقش‌تان را انتخاب کنید و وارد داشبورد شوید.",
    roles: [
      {
        key: "REQUESTER",
        label: "Requester",
        authUrl: "/auth?role=requester"
      },
      {
        key: "MANAGER",
        label: "Warehouse Manager",
        authUrl: "/auth?role=manager"
      }
    ],
    ctas: {
      primary: {
        href: "/auth",
        label: "ورود به داشبورد"
      },
      support: {
        href: "/support",
        label: "تماس با پشتیبانی"
      }
    },
    dashboards: {
      REQUESTER: "/dashboard/requester",
      MANAGER: "/dashboard/manager"
    },
    meta: {
      version: "landing-1.0",
      now: new Date().toISOString()
    }
  };
  return json(200, payload);
});
