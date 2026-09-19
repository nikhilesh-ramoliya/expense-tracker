export const PASSWORD_RECOVERY_FLAG = "ledger.passwordRecovery";

export function markPasswordRecovery() {
  try {
    sessionStorage.setItem(PASSWORD_RECOVERY_FLAG, "1");
  } catch {
    /* private mode */
  }
}

export function clearPasswordRecoveryFlag() {
  try {
    sessionStorage.removeItem(PASSWORD_RECOVERY_FLAG);
  } catch {
    /* private mode */
  }
}

export function hasPasswordRecoveryFlag() {
  try {
    return sessionStorage.getItem(PASSWORD_RECOVERY_FLAG) === "1";
  } catch {
    return false;
  }
}

export function urlLooksLikeRecovery() {
  if (typeof window === "undefined") return false;
  const { pathname, search, hash } = window.location;
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  return (
    pathname.startsWith("/auth/update-password") ||
    query.get("type") === "recovery" ||
    fragment.get("type") === "recovery" ||
    (query.get("next") ?? "").includes("update-password")
  );
}
