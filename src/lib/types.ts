export type TxType = "expense" | "income" | "transfer";
export type AccountKind = "cash" | "card" | "bank";
export type CategoryKind = "expense" | "income";
export type ThemeMode = "light" | "dark" | "system";

export type Account = {
  id: string;
  name: string;
  kind: AccountKind;
  openingBalance: number;
};

export type Category = {
  id: string;
  name: string;
  kind: CategoryKind;
};

export type Transaction = {
  id: string;
  amount: number;
  type: TxType;
  categoryId: string | null;
  accountId: string;
  toAccountId: string | null;
  date: string;
  note: string;
  merchant: string;
};

export type Budget = {
  id: string;
  categoryId: string;
  monthlyLimit: number;
};

export type Settings = {
  currency: string;
  theme: ThemeMode;
  startOfMonth: number;
};

export type LedgerState = {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  settings: Settings;
};

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type Session = {
  userId: string;
  email: string;
};

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD"] as const;

export const ACCOUNT_KINDS: { id: AccountKind; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "bank", label: "Bank" },
];
