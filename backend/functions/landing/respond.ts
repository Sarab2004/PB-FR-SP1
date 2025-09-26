// @ts-nocheck
const base = {
  "content-type": "application/json; charset=utf-8",
  // CORS
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "GET, OPTIONS",
  "vary": "Origin"
};
export const json = (status, body, extra = {})=>new Response(JSON.stringify(body), {
    status,
    headers: {
      ...base,
      ...extra
    }
  });
export const ok = ()=>new Response(null, {
    status: 204,
    headers: base
  });
