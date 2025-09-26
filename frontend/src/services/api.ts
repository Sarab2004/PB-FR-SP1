import type { AuthSession } from "../types/auth";
import { api as httpApi } from "./http";

type JsonBody = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

type RequestOptions = {
  auth?: boolean;
};

function toJson(body: JsonBody | undefined): string | undefined {
  if (body === undefined) return undefined;
  return typeof body === "string" ? body : JSON.stringify(body);
}

function get<T>(path: string, opts: RequestOptions = {}) {
  return httpApi<T>(path, {
    method: "GET",
    auth: opts.auth ?? true,
  });
}

function post<T>(path: string, body?: JsonBody, opts: RequestOptions = {}) {
  return httpApi<T>(path, {
    method: "POST",
    body: toJson(body),
    auth: opts.auth ?? true,
  });
}

function patch<T>(path: string, body?: JsonBody, opts: RequestOptions = {}) {
  return httpApi<T>(path, {
    method: "PATCH",
    body: toJson(body),
    auth: opts.auth ?? true,
  });
}

export const api = {
  get,
  post,
  patch,
  landing: () => get("/landing", { auth: false }),
  authLogin: (payload: { role: string; identifier: string; passcode: string }) =>
    post<AuthSession>("/auth", payload, { auth: false }),
};
