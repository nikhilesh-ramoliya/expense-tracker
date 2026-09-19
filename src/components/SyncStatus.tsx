"use client";

import { useLedger } from "./providers";

export function SyncStatus() {
  const { sync } = useLedger();
  const label = !sync.online
    ? "Offline"
    : sync.pending > 0
      ? `Pending sync (${sync.pending})`
      : sync.syncing
        ? "Syncing"
        : "Synced";

  return (
    <p className="sync-status" role="status" aria-live="polite">
      {label}
    </p>
  );
}
