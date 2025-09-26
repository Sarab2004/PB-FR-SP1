// src/services/http.ts
import { FUNCTIONS_BASE } from "../services/config";
import { getToken } from "../utils/auth";

export async function api<T>(
    path: string,
    opts: RequestInit & { auth?: boolean } = {}
): Promise<T> {
    const headers: Record<string, string> = {
        "content-type": "application/json",
        ...(opts.headers as any),
    };
    if (opts.auth) {
        const token = getToken();
        if (!token) throw new Error("توکن وجود ندارد. ابتدا وارد شوید.");
        headers.authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${FUNCTIONS_BASE}${path}`, { ...opts, headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `HTTP ${res.status}`);
    }
    return (await res.json()) as T;
}
