"use client";

import { FormEvent, useId, useState } from "react";
import Link from "next/link";
import { passwordResetRedirectTo } from "@/lib/site-url";
import { createClient } from "@/utils/supabase/client";

const GENERIC_SENT =
  "If an account exists for that email, you’ll get a reset link shortly. Check inbox and spam.";

export function ForgotPasswordScreen() {
  const formId = useId();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setPending(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setPending(false);
      setError("Enter a valid email address.");
      return;
    }
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: passwordResetRedirectTo(),
    });
    setPending(false);
    if (resetError) {
      setError(resetError.message || "Could not send a reset email. Try again in a moment.");
      return;
    }
    setNotice(GENERIC_SENT);
  }

  return (
    <div className="app-shell auth-shell">
      <a className="skip-link" href="#forgot">
        Skip to reset form
      </a>
      <header className="auth-hero">
        <p className="eyebrow">Personal ledger</p>
        <h1 className="display">Ledger</h1>
        <p className="lede">Request a link to choose a new password. We won’t say whether the email is registered.</p>
      </header>

      <section id="forgot" className="card">
        <h2>Forgot password</h2>
        <p className="muted-copy">Enter the email you use to sign in.</p>
        <form className="sheet-form" onSubmit={onSubmit} noValidate>
          <label htmlFor={`${formId}-email`}>Email</label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="username"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${formId}-error` : notice ? `${formId}-notice` : undefined}
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
          <button type="submit" className="add-btn full" disabled={pending}>
            {pending ? "Working…" : "Send reset link"}
          </button>
        </form>
        <p className="switch-auth">
          Remembered it?{" "}
          <Link href="/" className="text-btn">
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
}
