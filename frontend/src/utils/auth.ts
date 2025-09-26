import type { AuthSession, AuthUser } from "../types/auth";

const KEY = "mvp.auth";

export function saveSession(session: AuthSession) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch (error) {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function getToken(): string | null {
  return getSession()?.accessToken ?? null;
}

export function getUser(): AuthUser | null {
  return getSession()?.user ?? null;
}