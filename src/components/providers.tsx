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
import { usePathname, useRouter } from "next/navigation";
import { createEmptyState } from "@/lib/seed";
import {
  clearPasswordRecoveryFlag,
  hasPasswordRecoveryFlag,
  markPasswordRecovery,
  urlLooksLikeRecovery,
} from "@/lib/password-recovery";
import { loadLedgerState, saveLedgerState, wipeLedgerState } from "@/lib/supabase/ledger";
import type { LedgerState, Session, ThemeMode } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

export type SignUpOutcome =
  | { status: "ok" }
  | { status: "error"; message: string }
  | { status: "exists"; message: string }
  | { status: "confirm"; message: string; email: string };

type AuthContextValue = {
  ready: boolean;
  session: Session | null;
  passwordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<SignUpOutcome>;
  resendConfirmation: (email: string) => Promise<string | null>;
  finishPasswordRecovery: () => void;
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
  const router = useRouter();
  const pathname = usePathname();
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [ledgerReady, setLedgerReady] = useState(false);
  const [state, setLedgerState] = useState<LedgerState>(createEmptyState);
  const persistGen = useRef(0);

  useEffect(() => {
    if (hasPasswordRecoveryFlag() || urlLooksLikeRecovery()) {
      markPasswordRecovery();
      setPasswordRecovery(true);
    }
  }, []);

  useEffect(() => {
    if (pathname?.startsWith("/auth/update-password")) {
      markPasswordRecovery();
      setPasswordRecovery(true);
    }
  }, [pathname]);

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
    } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "PASSWORD_RECOVERY") {
        markPasswordRecovery();
        setPasswordRecovery(true);
        if (window.location.pathname !== "/auth/update-password") {
          router.replace("/auth/update-password");
        }
      }
      const user = next?.user;
      setSession(user ? { userId: user.id, email: user.email ?? "" } : null);
      setAuthReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  useEffect(() => {
    if (!session || passwordRecovery) {
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
  }, [session, passwordRecovery, supabase]);

  useEffect(() => {
    if (!session || !ledgerReady || passwordRecovery) return;
    applyTheme(state.settings.theme);
    const gen = ++persistGen.current;
    const timer = window.setTimeout(() => {
      saveLedgerState(supabase, session.userId, state).catch((error: unknown) => {
        if (gen === persistGen.current) console.error(error);
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [session, state, ledgerReady, passwordRecovery, supabase]);

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
    async (email: string, password: string): Promise<SignUpOutcome> => {
      const normalized = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return { status: "error", message: "Enter a valid email address." };
      }
      if (password.length < 8) {
        return { status: "error", message: "Use at least 8 characters for your password." };
      }
      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
      });
      if (error) return { status: "error", message: authMessage(error, "Could not create that account.") };
      if (data.session && data.user) {
        setSession({ userId: data.user.id, email: data.user.email ?? normalized });
        return { status: "ok" };
      }
      // Already-registered users get a 200 with no session (and often empty identities).
      const identities = data.user?.identities ?? [];
      if (!data.user || identities.length === 0 || data.user.email_confirmed_at) {
        return {
          status: "exists",
          message: "This email already has an account. Sign in instead — no new confirmation email is sent.",
        };
      }
      return {
        status: "confirm",
        email: normalized,
        message:
          "Confirm email is on, and this project uses Supabase’s default mailer (often delayed or filtered). Check inbox and spam for a message from noreply@mail.app.supabase.io, or resend below.",
      };
    },
    [supabase],
  );

  const resendConfirmation = useCallback(
    async (email: string) => {
      const normalized = email.trim().toLowerCase();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalized,
      });
      if (error) return authMessage(error, "Could not resend the confirmation email.");
      return null;
    },
    [supabase],
  );

  const finishPasswordRecovery = useCallback(() => {
    clearPasswordRecoveryFlag();
    setPasswordRecovery(false);
  }, []);

  const signOut = useCallback(() => {
    clearPasswordRecoveryFlag();
    setPasswordRecovery(false);
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
    () => ({
      ready: authReady,
      session,
      passwordRecovery,
      signIn,
      signUp,
      resendConfirmation,
      finishPasswordRecovery,
      signOut,
    }),
    [
      authReady,
      session,
      passwordRecovery,
      signIn,
      signUp,
      resendConfirmation,
      finishPasswordRecovery,
      signOut,
    ],
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
