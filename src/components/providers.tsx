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
import { getSnapshot, putSnapshot, queueLength } from "@/lib/offline/idb";
import { enqueueSave, enqueueWipe, flushQueue, isLikelyOffline } from "@/lib/offline/sync";
import { loadLedgerState } from "@/lib/supabase/ledger";
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

export type SyncStatusValue = {
  online: boolean;
  pending: number;
  syncing: boolean;
};

type LedgerContextValue = {
  ready: boolean;
  state: LedgerState;
  setState: (next: LedgerState | ((prev: LedgerState) => LedgerState)) => void;
  wipe: () => void;
  sync: SyncStatusValue;
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
  const lastLoadedJson = useRef<string | null>(null);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

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

    const applyUser = (user: { id: string; email?: string | null } | null) => {
      setSession(user ? { userId: user.id, email: user.email ?? "" } : null);
      setAuthReady(true);
    };

    const restoreSession = async () => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        const { data } = await supabase.auth.getSession();
        if (!cancelled) applyUser(data.session?.user ?? null);
        return;
      }
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data.user) {
        applyUser(data.user);
        return;
      }
      if (error) {
        const { data: fallback } = await supabase.auth.getSession();
        if (!cancelled) applyUser(fallback.session?.user ?? null);
        return;
      }
      applyUser(null);
    };

    void restoreSession();

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

  const refreshPending = useCallback(async (userId: string) => {
    setPending(await queueLength(userId));
  }, []);

  const runFlush = useCallback(
    async (userId: string) => {
      setSyncing(true);
      const result = await flushQueue(supabase, userId);
      setPending(result.pending);
      setSyncing(false);
      return result;
    },
    [supabase],
  );

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  useEffect(() => {
    if (!session || passwordRecovery) {
      setLedgerReady(false);
      return;
    }

    let cancelled = false;
    setLedgerReady(false);

    const hydrate = async () => {
      const cached = await getSnapshot(session.userId);
      if (cancelled) return;
      if (cached) {
        lastLoadedJson.current = JSON.stringify(cached);
        setLedgerState(cached);
        applyTheme(cached.settings.theme);
        setLedgerReady(true);
      }

      await refreshPending(session.userId);
      if (cancelled) return;

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        if (!cached) {
          const empty = createEmptyState();
          lastLoadedJson.current = JSON.stringify(empty);
          setLedgerState(empty);
          applyTheme(empty.settings.theme);
          setLedgerReady(true);
        }
        return;
      }

      const flushed = await runFlush(session.userId);
      if (cancelled) return;
      if (flushed.pending > 0) {
        if (!cached) {
          const empty = createEmptyState();
          lastLoadedJson.current = JSON.stringify(empty);
          setLedgerState(empty);
          applyTheme(empty.settings.theme);
          setLedgerReady(true);
        }
        return;
      }

      try {
        const loaded = await loadLedgerState(supabase, session.userId, session.email);
        if (cancelled) return;
        lastLoadedJson.current = JSON.stringify(loaded);
        setLedgerState(loaded);
        applyTheme(loaded.settings.theme);
        await putSnapshot(session.userId, loaded);
        setLedgerReady(true);
      } catch (error: unknown) {
        console.error(error);
        if (cancelled) return;
        if (!cached) {
          const fallback = createEmptyState();
          lastLoadedJson.current = JSON.stringify(fallback);
          setLedgerState(fallback);
          applyTheme(fallback.settings.theme);
        }
        setLedgerReady(true);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [session, passwordRecovery, supabase, refreshPending, runFlush]);

  useEffect(() => {
    if (!session || !ledgerReady || passwordRecovery) return;
    applyTheme(state.settings.theme);
    const serialized = JSON.stringify(state);
    void putSnapshot(session.userId, state);
    if (serialized === lastLoadedJson.current) return;

    const gen = ++persistGen.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        await enqueueSave(session.userId, state);
        if (gen !== persistGen.current) return;
        await refreshPending(session.userId);
        if (navigator.onLine) {
          const result = await runFlush(session.userId);
          if (result.error && !isLikelyOffline(result.error)) {
            console.error(result.error);
          }
        }
      })();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [session, state, ledgerReady, passwordRecovery, refreshPending, runFlush]);

  useEffect(() => {
    if (!session || !ledgerReady || passwordRecovery) return;
    const userId = session.userId;
    const kick = () => {
      void runFlush(userId);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") kick();
    };
    window.addEventListener("online", kick);
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(kick, 45_000);
    return () => {
      window.removeEventListener("online", kick);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, [session, ledgerReady, passwordRecovery, runFlush]);

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
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return "You need to be online to sign in. Cached sessions still work if you were already signed in.";
      }
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
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return { status: "error", message: "You need to be online to create an account." };
      }
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
    const fresh = createEmptyState();
    lastLoadedJson.current = null;
    setLedgerState(fresh);
    void (async () => {
      await putSnapshot(session.userId, fresh);
      await enqueueWipe(session.userId);
      await refreshPending(session.userId);
      if (navigator.onLine) await runFlush(session.userId);
    })();
  }, [session, refreshPending, runFlush]);

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

  const sync = useMemo(
    () => ({ online, pending, syncing }),
    [online, pending, syncing],
  );

  const ledgerValue = useMemo(
    () => ({ ready: ledgerReady, state, setState, wipe, sync }),
    [ledgerReady, state, setState, wipe, sync],
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
