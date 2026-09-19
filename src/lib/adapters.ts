import type { LedgerState, Session } from "./types";

/**
 * Storage contract for a future Supabase adapter.
 * Local implementation lives in storage.ts + providers.tsx.
 */
export type LedgerAdapter = {
  getSession(): Promise<Session | null>;
  signIn(email: string, password: string): Promise<Session>;
  signUp(email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;
  load(userId: string): Promise<LedgerState>;
  save(userId: string, state: LedgerState): Promise<void>;
};

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}
