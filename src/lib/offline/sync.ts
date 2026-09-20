import type { SupabaseClient } from "@supabase/supabase-js";
import { saveLedgerState, wipeLedgerState } from "@/lib/supabase/ledger";
import type { LedgerState } from "@/lib/types";
import { enqueueOp, listQueue, queueLength, removeQueueOp, type QueueOp } from "./idb";

const FLUSH_LOCK_MS = 25_000;

export function isLikelyOffline(error?: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (!error) return false;
  const message = formatSyncError(error);
  return /failed to fetch|networkerror|network request failed|load failed|offline|err_internet_disconnected/i.test(
    message,
  );
}

export function formatSyncError(error: unknown): string {
  if (!error) return "unknown sync error";
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const row = error as { message?: string; code?: string; details?: string; hint?: string };
    return [row.code, row.message, row.details, row.hint].filter(Boolean).join(" — ") || JSON.stringify(error);
  }
  return String(error);
}

function collapseQueue(ops: QueueOp[]): QueueOp[] {
  if (ops.length <= 1) return ops;
  const newest = ops[ops.length - 1];
  if (newest.kind === "wipe" || newest.kind === "save") return [newest];
  return ops;
}

let flushing = false;
let flushingSince = 0;

export async function enqueueSave(userId: string, state: LedgerState) {
  await enqueueOp(userId, "save", state);
}

export async function enqueueWipe(userId: string) {
  await enqueueOp(userId, "wipe", null);
}

async function applyOp(supabase: SupabaseClient, userId: string, op: QueueOp) {
  if (op.kind === "wipe") {
    await wipeLedgerState(supabase, userId);
    return;
  }
  if (op.state) {
    await saveLedgerState(supabase, userId, op.state);
  }
}

export async function flushQueue(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ pending: number; error?: unknown }> {
  if (flushing && Date.now() - flushingSince < FLUSH_LOCK_MS) {
    return { pending: await queueLength(userId) };
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { pending: await queueLength(userId) };
  }

  flushing = true;
  flushingSince = Date.now();
  try {
    const { error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[ledger sync] auth refresh failed", authError);
      return { pending: await queueLength(userId), error: authError };
    }

    const ops = collapseQueue(await listQueue(userId));
    for (const op of ops) {
      try {
        await applyOp(supabase, userId, op);
      } catch (firstError) {
        console.error("[ledger sync] flush failed", formatSyncError(firstError), firstError);
        if (op.kind === "save" && op.state && !isLikelyOffline(firstError)) {
          try {
            await applyOp(supabase, userId, op);
          } catch (retryError) {
            console.error("[ledger sync] retry failed", formatSyncError(retryError), retryError);
            return { pending: await queueLength(userId), error: retryError };
          }
        } else {
          return { pending: await queueLength(userId), error: firstError };
        }
      }
      const leftover = await listQueue(userId);
      await Promise.all(leftover.map((item) => removeQueueOp(userId, item.id)));
    }
    return { pending: await queueLength(userId) };
  } finally {
    flushing = false;
    flushingSince = 0;
  }
}
