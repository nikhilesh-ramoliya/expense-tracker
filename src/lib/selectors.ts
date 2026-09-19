import { currentPeriodKey, periodKey } from "./dates";
import type { Account, LedgerState, Transaction } from "./types";

export function categoryName(state: LedgerState, id: string | null): string {
  if (!id) return "Transfer";
  return state.categories.find((c) => c.id === id)?.name ?? "Unknown";
}

export function accountName(state: LedgerState, id: string): string {
  return state.accounts.find((a) => a.id === id)?.name ?? "Account";
}

export function inPeriod(tx: Transaction, period: string, startOfMonth: number): boolean {
  return periodKey(tx.date, startOfMonth) === period;
}

export function monthTransactions(state: LedgerState): Transaction[] {
  const period = currentPeriodKey(state.settings.startOfMonth);
  return state.transactions.filter((tx) =>
    inPeriod(tx, period, state.settings.startOfMonth),
  );
}

export function sums(txs: Transaction[]): { income: number; spend: number } {
  return txs.reduce(
    (acc, tx) => {
      if (tx.type === "income") acc.income += tx.amount;
      if (tx.type === "expense") acc.spend += tx.amount;
      return acc;
    },
    { income: 0, spend: 0 },
  );
}

export function accountBalance(state: LedgerState, account: Account): number {
  let balance = account.openingBalance;
  for (const tx of state.transactions) {
    if (tx.type === "transfer") {
      if (tx.accountId === account.id) balance -= tx.amount;
      if (tx.toAccountId === account.id) balance += tx.amount;
      continue;
    }
    if (tx.accountId !== account.id) continue;
    if (tx.type === "income") balance += tx.amount;
    if (tx.type === "expense") balance -= tx.amount;
  }
  return balance;
}

export function totalBudget(state: LedgerState): number {
  return state.budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
}

export function spentInCategory(state: LedgerState, categoryId: string): number {
  const period = currentPeriodKey(state.settings.startOfMonth);
  return state.transactions
    .filter(
      (tx) =>
        tx.type === "expense" &&
        tx.categoryId === categoryId &&
        inPeriod(tx, period, state.settings.startOfMonth),
    )
    .reduce((sum, tx) => sum + tx.amount, 0);
}
