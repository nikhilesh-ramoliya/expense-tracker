"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function UpdatePasswordScreen({ linkError = false }: { linkError?: boolean }) {
  const formId = useId();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState(linkError ? "This reset link is invalid or expired." : "");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function hydrate(code: string | null) {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) {
          setError("This reset link is invalid or expired.");
          setHasSession(false);
          setReady(true);
          return;
        }
        window.history.replaceState(null, "", "/auth/update-password");
      }
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setHasSession(Boolean(data.user));
      setReady(true);
    }

    const params = new URLSearchParams(window.location.search);
    void hydrate(params.get("code"));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session?.user) {
        setHasSession(true);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (updateError) {
      setError(updateError.message || "Could not update your password.");
      return;
    }
    router.replace("/dashboard");
  }

  return (
    <div className="app-shell auth-shell">
      <a className="skip-link" href="#update-password">
        Skip to new password
      </a>
      <header className="auth-hero">
        <p className="eyebrow">Personal ledger</p>
        <h1 className="display">Ledger</h1>
        <p className="lede">Choose a new password for your account.</p>
      </header>

      <section id="update-password" className="card">
        <h2>Set a new password</h2>
        {!ready ? <p className="muted-copy">Checking your reset link…</p> : null}
        {ready && !hasSession ? (
          <>
            <p className="error" role="alert">
              {error || "Open the link from your email to set a new password. Links expire after a short time."}
            </p>
            <p className="switch-auth">
              <Link href="/auth/forgot-password" className="text-btn">
                Request a new link
              </Link>
            </p>
            <p className="switch-auth">
              <Link href="/" className="text-btn">
                Sign in
              </Link>
            </p>
          </>
        ) : null}
        {ready && hasSession ? (
          <form className="sheet-form" onSubmit={onSubmit} noValidate>
            <label htmlFor={`${formId}-password`}>New password</label>
            <input
              id={`${formId}-password`}
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${formId}-error` : undefined}
            />
            <label htmlFor={`${formId}-confirm`}>Confirm password</label>
            <input
              id={`${formId}-confirm`}
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            {error ? (
              <p id={`${formId}-error`} className="error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="add-btn full" disabled={pending}>
              {pending ? "Working…" : "Update password"}
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
