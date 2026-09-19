import type { LedgerState } from "./types";

/** Optional names the user can add in Settings — never auto-inserted with spend. */
export const CATEGORY_TEMPLATES: { name: string; kind: "expense" | "income" }[] = [
  { name: "Food", kind: "expense" },
  { name: "Travel", kind: "expense" },
  { name: "Home", kind: "expense" },
  { name: "Health", kind: "expense" },
  { name: "Fun", kind: "expense" },
  { name: "Bills", kind: "expense" },
  { name: "Other", kind: "expense" },
  { name: "Salary", kind: "income" },
  { name: "Freelance", kind: "income" },
];

export function createEmptyState(): LedgerState {
  return {
    settings: { currency: "INR", theme: "system", startOfMonth: 1 },
    accounts: [],
    categories: [],
    budgets: [],
    transactions: [],
  };
}
