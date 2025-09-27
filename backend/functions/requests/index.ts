// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, ok } from "./respond.ts";
import { getBearerToken, verifyAccessToken } from "./jwt.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") return ok();

  const token = getBearerToken(req);
  if (!token) {
    return json(401, { message: "No token" });
  }

  const claims = await verifyAccessToken(token);
  if (!claims?.sub || !claims?.role) {
    return json(401, { message: "Invalid token" });
  }

  const userId = String(claims.sub);
  const role = String(claims.role);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const url = new URL(req.url);
  const wrId = url.searchParams.get("id");
  const action = (url.searchParams.get("action") || "").toLowerCase();
  const show = (url.searchParams.get("show") || "active").toLowerCase();
  const includeArchived = show === "all";
  const statusFilter = (url.searchParams.get("status") || "").toUpperCase();

  // ---------- GET /requests ----------
  if (req.method === "GET") {
    if (role === "MANAGER") {
      let query = supabase
        .from("warehouse_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (!includeArchived) {
        query = query.eq("is_archived", false);
      }

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        return json(500, { message: "DB error", detail: error.message });
      }

      return json(200, { items: data });
    }

    const { data, error } = await supabase
      .from("warehouse_requests")
      .select("*")
      .eq("requester_id", userId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      return json(500, { message: "DB error", detail: error.message });
    }

    return json(200, { items: data });
  }

  // ---------- POST /requests ----------
  if (req.method === "POST") {
    if (wrId && role === "MANAGER") {
      if (action === "approve") {
        const { error } = await supabase.rpc("approve_request", {
          p_wr_id: wrId,
          p_manager_id: userId,
        });
        if (error) {
          return json(500, { message: "approve failed", detail: error.message });
        }
        return json(200, { ok: true });
      }

      if (action === "reject") {
        const { error } = await supabase.rpc("reject_request", {
          p_wr_id: wrId,
          p_manager_id: userId,
        });
        if (error) {
          return json(500, { message: "reject failed", detail: error.message });
        }
        return json(200, { ok: true });
      }

      if (action === "convert") {
        const { data, error } = await supabase.rpc("convert_request", {
          p_wr_id: wrId,
          p_manager_id: userId,
        });
        if (error) {
          return json(500, { message: "convert failed", detail: error.message });
        }
        return json(200, { ok: true, purchase_request_id: data });
      }

      if (action === "archive") {
        const { error } = await supabase.rpc("archive_wrequest", {
          p_wr_id: wrId,
          p_manager_id: userId,
        });
        if (error) {
          return json(500, { message: "archive failed", detail: error.message });
        }
        return json(200, { ok: true });
      }

      return json(400, { message: "unknown action" });
    }

    if (role !== "REQUESTER") {
      return json(403, { message: "Only REQUESTER can create" });
    }

    const body = await req.json().catch(() => ({}));
    let {
      title,
      description,
      item_code,
      specs,
      usage_location,
      priority,
      items,
      required_date,
    } = body || {};

    if (!title || !items) {
      return json(400, { message: "title and items are required" });
    }

    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch {
        // ignore parse error, validation below will handle
      }
    }

    if (!Array.isArray(items)) {
      return json(400, { message: "items must be an array (JSON)" });
    }

    const insert = {
      requester_id: userId,
      title,
      description: description ?? null,
      item_code: item_code ?? null,
      specs: specs ?? null,
      usage_location: usage_location ?? null,
      priority: priority ?? null,
      items,
      required_date: required_date ?? null,
      status: "SUBMITTED",
    };

    const { data, error } = await supabase
      .from("warehouse_requests")
      .insert(insert)
      .select("id")
      .single();

    if (error) {
      return json(500, { message: "create failed", detail: error.message });
    }

    return json(200, { id: data.id });
  }

  return json(405, { message: "Method Not Allowed" });
});