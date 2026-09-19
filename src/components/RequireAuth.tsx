"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./providers";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !session) router.replace("/");
  }, [ready, session, router]);

  if (!ready || !session) {
    return <p className="empty">Opening your ledger…</p>;
  }

  return <>{children}</>;
}
