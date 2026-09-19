import type { SupabaseClient } from "@supabase/supabase-js";
import { saveLedgerState, wipeLedgerState } from "@/lib/supabase/ledger";
import type { LedgerState } from "@/lib/types";
import { enqueueOp, listQueue, queueLength, removeQueueOp } from "./idb";

export function isLikelyOffline(error?: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch|networkerror|network request failed|load failed|offline|err_internet_disconnected/i.test(
    message,
  );
}

let flushing = false;

export async function enqueueSave(userId: string, state: LedgerState) {
  await enqueueOp(userId, "save", state);
}

export async function enqueueWipe(userId: string) {
  await enqueueOp(userId, "wipe", null);
}

export async function flushQueue(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ pending: number; error?: unknown }> {
  if (flushing) return { pending: await queueLength(userId) };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { pending: await queueLength(userId) };
  }

  flushing = true;
  try {
    const ops = await listQueue(userId);
    for (const op of ops) {
      try {
        if (op.kind === "wipe") {
          await wipeLedgerState(supabase, userId);
        } else if (op.state) {
          await saveLedgerState(supabase, userId, op.state);
        }
        await removeQueueOp(userId, op.id);
      } catch (error) {
        return { pending: await queueLength(userId), error };
      }
    }
    return { pending: await queueLength(userId) };
  } finally {
    flushing = false;
  }
}
