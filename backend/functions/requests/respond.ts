// @ts-nocheck
const base = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS"
};
export const json = (status, body, extra = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    ...base,
    ...extra
  }
});
export const ok = () => new Response(null, {
  status: 204,
  headers: base
});
