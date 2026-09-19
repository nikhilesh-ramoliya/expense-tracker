"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./providers";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, session, passwordRecovery } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (passwordRecovery) {
      router.replace("/auth/update-password");
      return;
    }
    if (!session) router.replace("/");
  }, [ready, session, passwordRecovery, router]);

  if (!ready || passwordRecovery || !session) {
    return <p className="empty">Opening your ledger…</p>;
  }

  return <>{children}</>;
}
