"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createEmptyState } from "@/lib/seed";
import { loadLedgerState, saveLedgerState, wipeLedgerState } from "@/lib/supabase/ledger";
import type { LedgerState, Session, ThemeMode } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

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

function authMessage(error: { message?: string } | null, fallback: string) {
  return error?.message || fallback;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [ledgerReady, setLedgerReady] = useState(false);
  const [state, setLedgerState] = useState<LedgerState>(createEmptyState);
  const persistGen = useRef(0);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const user = data.user;
      setSession(user ? { userId: user.id, email: user.email ?? "" } : null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      const user = next?.user;
      setSession(user ? { userId: user.id, email: user.email ?? "" } : null);
      setAuthReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!session) {
      setLedgerReady(false);
      return;
    }

    let cancelled = false;
    setLedgerReady(false);
    loadLedgerState(supabase, session.userId, session.email)
      .then((loaded) => {
        if (cancelled) return;
        setLedgerState(loaded);
        applyTheme(loaded.settings.theme);
        setLedgerReady(true);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (cancelled) return;
        const fallback = createEmptyState();
        setLedgerState(fallback);
        applyTheme(fallback.settings.theme);
        setLedgerReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [session, supabase]);

  useEffect(() => {
    if (!session || !ledgerReady) return;
    applyTheme(state.settings.theme);
    const gen = ++persistGen.current;
    const timer = window.setTimeout(() => {
      saveLedgerState(supabase, session.userId, state).catch((error: unknown) => {
        if (gen === persistGen.current) console.error(error);
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [session, state, ledgerReady, supabase]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (state.settings.theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [state.settings.theme]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error || !data.user) return authMessage(error, "Email or password is incorrect.");
      setSession({ userId: data.user.id, email: data.user.email ?? email.trim().toLowerCase() });
      return null;
    },
    [supabase],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const normalized = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return "Enter a valid email address.";
      }
      if (password.length < 8) {
        return "Use at least 8 characters for your password.";
      }
      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
      });
      if (error) return authMessage(error, "Could not create that account.");
      if (!data.session || !data.user) {
        return "Check your email to confirm the account, then sign in.";
      }
      setSession({ userId: data.user.id, email: data.user.email ?? normalized });
      return null;
    },
    [supabase],
  );

  const signOut = useCallback(() => {
    void supabase.auth.signOut();
    setSession(null);
  }, [supabase]);

  const setState = useCallback(
    (next: LedgerState | ((prev: LedgerState) => LedgerState)) => {
      setLedgerState((prev) => (typeof next === "function" ? next(prev) : next));
    },
    [],
  );

  const wipe = useCallback(() => {
    if (!session) return;
    void wipeLedgerState(supabase, session.userId).then((fresh) => {
      setLedgerState(fresh);
    });
  }, [session, supabase]);

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
