import { FUNCTIONS_BASE } from "./config";
import { getToken } from "../utils/auth";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = RequestInit & { auth?: boolean };

export async function api<T>(path: string, opts: RequestOptions = {}) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };

  if (opts.auth) {
    const token = getToken();
    if (!token) {
      throw new HttpError(401, "برای ادامه باید وارد شوید.");
    }
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${FUNCTIONS_BASE}${path}`, { ...opts, headers });
  const raw = await response.text();

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = raw ? (JSON.parse(raw) as { message?: string }) : null;
      if (data?.message) {
        message = data.message;
      }
    } catch (error) {
      // ignore JSON parse errors
    }
    throw new HttpError(response.status, message);
  }

  if (!raw) {
    return undefined as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new HttpError(500, "خطا در پردازش پاسخ سرور.");
  }
}