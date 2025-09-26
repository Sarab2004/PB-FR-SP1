// ساده و مینیمال
const BASE = import.meta.env.VITE_FUNCTIONS_BASE ?? "https://uoflxqdmjencqxelgbcv.supabase.co/functions/v1";
const TOKEN_KEY = "mt_token";

export const token = {
    get: () => localStorage.getItem(TOKEN_KEY) || "",
    set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
    clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function req(path: string, init: RequestInit = {}) {
    const headers: Record<string, string> = {
        "content-type": "application/json",
        ...(init.headers as Record<string, string>),
    };
    const auth = token.get();
    if (auth) headers.authorization = `Bearer ${auth}`;

    const res = await fetch(`${BASE}${path}`, { ...init, headers });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
    return data;
}

export const api = {
    // Edge Functions
    landing: () => req("/landing"),
    authLogin: (body: { role: "REQUESTER" | "MANAGER"; identifier: string; passcode: string; }) =>
        req("/auth", { method: "POST", body: JSON.stringify(body) }),

    // Requests
    listWR: () => req("/requests"),
    createWR: (body: any) => req("/requests", { method: "POST", body: JSON.stringify(body) }),
    approveWR: (id: string) => req(`/requests?action=approve&id=${id}`, { method: "POST" }),
    rejectWR: (id: string) => req(`/requests?action=reject&id=${id}`, { method: "POST" }),
    convertWR: (id: string) => req(`/requests?action=convert&id=${id}`, { method: "POST" }),

    // Purchases
    listPR: () => req("/purchases"),
    getPR: (id: string) => req(`/purchases?id=${id}`),
    patchPR: (id: string, body: any) => req(`/purchases?id=${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};
