// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, ok } from "./respond.ts";
import { getBearerToken, verifyAccessToken } from "./jwt.ts";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
// فقط این وضعیت‌ها اجازه‌ی آپدیت دارند (Enum دیتابیس)
const allowedStatuses = new Set([
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED"
]);
serve(async (req)=>{
  if (req.method === "OPTIONS") return ok();
  // احراز هویت
  const token = getBearerToken(req);
  if (!token) return json(401, {
    message: "No token"
  });
  const claims = await verifyAccessToken(token);
  if (!claims?.role || claims.role !== "MANAGER") {
    return json(403, {
      message: "Only MANAGER allowed"
    });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const url = new URL(req.url);
  const prId = url.searchParams.get("id") || null;
  try {
    // --- GET ---
    if (req.method === "GET") {
      if (prId) {
        const { data, error } = await supabase.from("purchase_requests").select("*").eq("id", prId).maybeSingle();
        if (error) return json(500, {
          message: "DB error",
          detail: error.message
        });
        if (!data) return json(404, {
          message: "Not found"
        });
        return json(200, data);
      }
      const { data, error } = await supabase.from("purchase_requests").select("id, source_wrequest_id, manager_id, vendor, total, usage_location, priority, status, created_at").order("created_at", {
        ascending: false
      });
      if (error) return json(500, {
        message: "DB error",
        detail: error.message
      });
      return json(200, {
        items: data
      });
    }
    // --- PATCH ---
    if (req.method === "PATCH") {
      if (!prId) return json(400, {
        message: "id is required"
      });
      const body = await req.json().catch(()=>({}));
      const update = {};
      if ("items" in body) update.items = body.items; // JSON/Array
      if ("vendor" in body) update.vendor = body.vendor ?? null;
      if ("total" in body) update.total = body.total ?? null;
      if ("usage_location" in body) update.usage_location = body.usage_location ?? null;
      if ("priority" in body) update.priority = body.priority ?? null;
      if ("status" in body) {
        const st = String(body.status || "");
        if (!allowedStatuses.has(st)) return json(400, {
          message: "invalid status"
        });
        update.status = st;
      }
      if (Object.keys(update).length === 0) {
        return json(400, {
          message: "no fields to update"
        });
      }
      const { data, error } = await supabase.from("purchase_requests").update(update).eq("id", prId).select("id").maybeSingle();
      if (error) return json(500, {
        message: "update failed",
        detail: error.message
      });
      if (!data) return json(404, {
        message: "Not found"
      });
      return json(200, {
        ok: true,
        id: data.id
      });
    }
    return json(405, {
      message: "Method Not Allowed"
    });
  } catch (e) {
    return json(500, {
      message: "Internal error",
      detail: String(e)
    });
  }
});
