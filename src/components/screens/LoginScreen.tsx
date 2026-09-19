"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers";

export function LoginScreen() {
  const { ready, session, signIn, signUp } = useAuth();
  const router = useRouter();
  const formId = useId();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && session) router.replace("/dashboard");
  }, [ready, session, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const result = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setPending(false);
    if (result) {
      setError(result);
      return;
    }
    router.replace("/dashboard");
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
          Track spend, wallets, and envelopes on your phone. New accounts start with a sample month so
          charts are ready on day one.
        </p>
      </header>

      <section id="login" className="card">
        <h2>{mode === "in" ? "Sign in" : "Create account"}</h2>
        <p className="muted-copy">
          Accounts stay on this device. Add Supabase keys later to sync — see{" "}
          <code>.env.example</code>.
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
          <button type="submit" className="add-btn full" disabled={pending}>
            {pending ? "Working…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>
        <p className="switch-auth">
          {mode === "in" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="text-btn"
            onClick={() => {
              setError("");
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
