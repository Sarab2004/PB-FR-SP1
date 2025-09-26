// @ts-nocheck
import { jwtVerify } from "npm:jose@5";
const secretStr = Deno.env.get("JWT_SECRET") ?? Deno.env.get("SUPABASE_JWT_SECRET");
if (!secretStr) throw new Error("Missing JWT secret env (JWT_SECRET)");
const SECRET = new TextEncoder().encode(secretStr);
export async function verifyAccessToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      algorithms: [
        "HS256"
      ]
    });
    return payload; // { sub, role, ... }
  } catch  {
    return null;
  }
}
export function getBearerToken(req) {
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}
