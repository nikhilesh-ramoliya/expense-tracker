import { createEmptyState } from "./seed";
import type { LedgerState, Session, UserRecord } from "./types";

const USERS_KEY = "ledger.users.v2";
const SESSION_KEY = "ledger.session.v2";
const dataKey = (userId: string) => `ledger.data.v2.${userId}`;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadUsers(): UserRecord[] {
  return readJson<UserRecord[]>(USERS_KEY, []);
}

export function saveUsers(users: UserRecord[]): void {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loadSession(): Session | null {
  return readJson<Session | null>(SESSION_KEY, null);
}

export function saveSession(session: Session | null): void {
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadLedger(userId: string): LedgerState {
  const stored = readJson<LedgerState | null>(dataKey(userId), null);
  if (stored && Array.isArray(stored.transactions)) return stored;
  return createEmptyState();
}

export function saveLedger(userId: string, state: LedgerState): void {
  window.localStorage.setItem(dataKey(userId), JSON.stringify(state));
}

export function wipeUserData(userId: string): void {
  window.localStorage.removeItem(dataKey(userId));
}
