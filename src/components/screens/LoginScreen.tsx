"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";

export function LoginScreen() {
  const { ready, session, signIn, signUp, resendConfirmation } = useAuth();
  const router = useRouter();
  const formId = useId();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && session) router.replace("/dashboard");
  }, [ready, session, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setPendingConfirmEmail("");
    setPending(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    if (mode === "in") {
      const result = await signIn(email, password);
      setPending(false);
      if (result) {
        setError(result);
        return;
      }
      router.replace("/dashboard");
      return;
    }
    const result = await signUp(email, password);
    setPending(false);
    if (result.status === "ok") {
      router.replace("/dashboard");
      return;
    }
    if (result.status === "confirm") {
      setNotice(result.message);
      setPendingConfirmEmail(result.email);
      return;
    }
    if (result.status === "exists") {
      setError(result.message);
      setMode("in");
      return;
    }
    setError(result.message);
  }

  async function onResend() {
    if (!pendingConfirmEmail) return;
    setPending(true);
    setError("");
    const result = await resendConfirmation(pendingConfirmEmail);
    setPending(false);
    setNotice(
      result
        ? result
        : "If the account still needs confirming, another email was requested. Check inbox and spam.",
    );
  }

  return (
    <div className="app-shell auth-shell">
      <a className="skip-link" href="#login">
        Skip to sign in
      </a>
      <header className="auth-hero">
        <p className="eyebrow">Personal ledger</p>
        <h1 className="display">Ledger</h1>
        <p className="lede">
          Track spend, wallets, and envelopes on your phone. Your data lives in your account — nothing
          is pre-filled.
        </p>
      </header>

      <section id="login" className="card">
        <h2>{mode === "in" ? "Sign in" : "Create account"}</h2>
        <p className="muted-copy">
          Sign in with email and password. New accounts start empty until you add entries.
        </p>
        <form className="sheet-form" onSubmit={onSubmit} noValidate>
          <label htmlFor={`${formId}-email`}>Email</label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="username"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${formId}-error` : undefined}
          />
          <label htmlFor={`${formId}-password`}>Password</label>
          <input
            id={`${formId}-password`}
            name="password"
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            required
            minLength={8}
          />
          {error ? (
            <p id={`${formId}-error`} className="error" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p id={`${formId}-notice`} className="muted-copy" role="status">
              {notice}
            </p>
          ) : null}
          {pendingConfirmEmail ? (
            <button type="button" className="text-btn" disabled={pending} onClick={() => void onResend()}>
              Resend confirmation email
            </button>
          ) : null}
          <button type="submit" className="add-btn full" disabled={pending}>
            {pending ? "Working…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>
        {mode === "in" ? (
          <p className="switch-auth">
            <Link href="/auth/forgot-password" className="text-btn">
              Forgot password?
            </Link>
          </p>
        ) : null}
        <p className="switch-auth">
          {mode === "in" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              setError("");
              setNotice("");
              setPendingConfirmEmail("");
              setMode(mode === "in" ? "up" : "in");
            }}
          >
            {mode === "in" ? "Create one" : "Sign in"}
          </button>
        </p>
      </section>
    </div>
  );
}
