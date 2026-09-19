"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { hashPassword } from "@/lib/crypto";
import { createSeedState } from "@/lib/seed";
import {
  loadLedger,
  loadSession,
  loadUsers,
  saveLedger,
  saveSession,
  saveUsers,
  wipeUserData,
} from "@/lib/storage";
import type { LedgerState, Session, ThemeMode } from "@/lib/types";

type AuthContextValue = {
  ready: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => void;
};

type LedgerContextValue = {
  ready: boolean;
  state: LedgerState;
  setState: (next: LedgerState | ((prev: LedgerState) => LedgerState)) => void;
  wipe: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const LedgerContext = createContext<LedgerContextValue | null>(null);

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  root.dataset.theme = dark ? "dark" : "light";
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [ledgerReady, setLedgerReady] = useState(false);
  const [state, setLedgerState] = useState<LedgerState>(createSeedState);

  useEffect(() => {
    setSession(loadSession());
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!session) {
      setLedgerReady(false);
      return;
    }
    const loaded = loadLedger(session.userId);
    setLedgerState(loaded);
    applyTheme(loaded.settings.theme);
    setLedgerReady(true);
  }, [session]);

  useEffect(() => {
    if (!session || !ledgerReady) return;
    saveLedger(session.userId, state);
    applyTheme(state.settings.theme);
  }, [session, state, ledgerReady]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (state.settings.theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [state.settings.theme]);

  const signIn = useCallback(async (email: string, password: string) => {
    const users = loadUsers();
    const hash = await hashPassword(password);
    const user = users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.passwordHash !== hash) {
      return "Email or password is incorrect.";
    }
    const next = { userId: user.id, email: user.email };
    saveSession(next);
    setSession(next);
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return "Enter a valid email address.";
    }
    if (password.length < 8) {
      return "Use at least 8 characters for your password.";
    }
    const users = loadUsers();
    if (users.some((u) => u.email === normalized)) {
      return "An account with that email already exists.";
    }
    const user = {
      id: crypto.randomUUID(),
      email: normalized,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, user]);
    saveLedger(user.id, createSeedState());
    const next = { userId: user.id, email: user.email };
    saveSession(next);
    setSession(next);
    return null;
  }, []);

  const signOut = useCallback(() => {
    saveSession(null);
    setSession(null);
  }, []);

  const setState = useCallback(
    (next: LedgerState | ((prev: LedgerState) => LedgerState)) => {
      setLedgerState((prev) => (typeof next === "function" ? next(prev) : next));
    },
    [],
  );

  const wipe = useCallback(() => {
    if (!session) return;
    const fresh = createSeedState();
    wipeUserData(session.userId);
    saveLedger(session.userId, fresh);
    setLedgerState(fresh);
  }, [session]);

  const authValue = useMemo(
    () => ({ ready: authReady, session, signIn, signUp, signOut }),
    [authReady, session, signIn, signUp, signOut],
  );

  const ledgerValue = useMemo(
    () => ({ ready: ledgerReady, state, setState, wipe }),
    [ledgerReady, state, setState, wipe],
  );

  return (
    <AuthContext.Provider value={authValue}>
      <LedgerContext.Provider value={ledgerValue}>{children}</LedgerContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AppProviders");
  return ctx;
}

export function useLedger() {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used within AppProviders");
  return ctx;
}
