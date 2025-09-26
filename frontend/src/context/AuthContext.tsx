import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthSession, AuthUser } from "../types/auth";
import { clearSession, getSession, saveSession } from "../utils/auth";

type AuthContextValue = {
  session: AuthSession | null;
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  signIn: (payload: AuthSession) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    const stored = getSession();
    if (stored) {
      setSession(stored);
    }
    setReady(true);
  }, []);

  const signIn = useCallback((payload: AuthSession) => {
    saveSession(payload);
    setSession(payload);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    token: session?.accessToken ?? null,
    isReady,
    signIn,
    signOut,
  }), [session, isReady, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth باید داخل AuthProvider استفاده شود.");
  }
  return ctx;
}