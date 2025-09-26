// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT } from "npm:jose@5";
import { json, ok } from "./respond.ts";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPPORT_URL = Deno.env.get("SUPPORT_URL") ?? "/support";
const secretStr = Deno.env.get("JWT_SECRET") ?? Deno.env.get("SUPABASE_JWT_SECRET");
if (!secretStr) throw new Error("Missing JWT secret env (JWT_SECRET)");
const SECRET = new TextEncoder().encode(secretStr);
async function signAccessToken(payload, ttlSec = 60 * 60 * 24) {
  return await new SignJWT(payload).setProtectedHeader({
    alg: "HS256"
  }).setIssuedAt() // ⬇️ مدت‌دارِ نسبی (مثلاً "86400s") تا انقضا درست محاسبه بشه
  .setExpirationTime(`${ttlSec}s`).sign(SECRET);
}
serve(async (req)=>{
  if (req.method === "OPTIONS") return ok();
  if (req.method !== "POST") return json(405, {
    message: "Method Not Allowed"
  });
  try {
    // فقط role, identifier, passcode می‌گیرد — Bearer Token لازم نیست
    const { role, identifier, passcode } = await req.json().catch(()=>({}));
    if (!role || !identifier || !passcode) {
      return json(400, {
        message: "role, identifier, passcode are required"
      });
    }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json(500, {
        message: "Missing SUPABASE_URL or SUPABASE_ANON_KEY envs"
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // جست‌وجوی کاربر با ایمیل/تلفن/کدملی
    const { data: user, error } = await supabase.from("users").select("id, email, phone, national_id, role, passcode, is_active").or(`email.eq.${identifier},phone.eq.${identifier},national_id.eq.${identifier}`).maybeSingle();
    if (error) return json(500, {
      message: "DB error",
      detail: error.message
    });
    if (!user || !user.is_active) {
      return json(401, {
        message: "حساب کاربری یافت نشد یا غیرفعال است",
        support_url: SUPPORT_URL
      });
    }
    if (String(user.role) !== String(role)) {
      return json(401, {
        message: "نقش انتخابی صحیح نیست",
        support_url: SUPPORT_URL
      });
    }
    if (String(user.passcode) !== String(passcode)) {
      return json(401, {
        message: "کد عبور نادرست است",
        support_url: SUPPORT_URL
      });
    }
    // ساخت JWT
    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
      national_id: user.national_id
    });
    return json(200, {
      accessToken,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        phone: user.phone,
        national_id: user.national_id
      }
    });
  } catch (e) {
    return json(500, {
      message: "Internal error",
      detail: String(e)
    });
  }
});
