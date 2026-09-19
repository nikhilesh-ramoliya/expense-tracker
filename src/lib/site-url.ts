function trimOrigin(value: string) {
  return value.replace(/\/+$/, "");
}

/** Canonical origin for auth emails. Prefer NEXT_PUBLIC_SITE_URL so a local
 * request still emails a Vercel link the phone can open. */
export function publicSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return trimOrigin(configured);
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export function passwordResetRedirectTo() {
  return `${publicSiteOrigin()}/auth/callback?next=/auth/update-password`;
}
