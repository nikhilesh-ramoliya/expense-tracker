import type { SupabaseClient } from "@supabase/supabase-js";
import { createEmptyState } from "@/lib/seed";
import type { LedgerState, ThemeMode } from "@/lib/types";

function num(value: unknown) {
  return Number(value ?? 0);
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuidOrNull(value: string | null | undefined): string | null {
  if (!value || value === "null" || value === "undefined") return null;
  return UUID.test(value) ? value : null;
}

export async function loadLedgerState(
  supabase: SupabaseClient,
  userId: string,
  email: string,
): Promise<LedgerState> {
  const [settingsRes, accountsRes, categoriesRes, budgetsRes, txsRes] = await Promise.all([
    supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("categories").select("*").eq("user_id", userId),
    supabase.from("budgets").select("*").eq("user_id", userId),
    supabase.from("transactions").select("*").eq("user_id", userId),
  ]);

  const firstError =
    settingsRes.error ??
    accountsRes.error ??
    categoriesRes.error ??
    budgetsRes.error ??
    txsRes.error;
  if (firstError) throw firstError;

  if (!settingsRes.data && (accountsRes.data?.length ?? 0) === 0) {
    const empty = createEmptyState();
    await saveLedgerState(supabase, userId, empty);
    await supabase.from("profiles").upsert({ id: userId, email });
    return empty;
  }

  await supabase.from("profiles").upsert({ id: userId, email });

  return {
    settings: {
      currency: settingsRes.data?.currency ?? "INR",
      theme: (settingsRes.data?.theme ?? "system") as ThemeMode,
      startOfMonth: settingsRes.data?.start_of_month ?? 1,
    },
    accounts: (accountsRes.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      kind: row.kind,
      openingBalance: num(row.opening_balance),
    })),
    categories: (categoriesRes.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      kind: row.kind,
    })),
    budgets: (budgetsRes.data ?? []).map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      monthlyLimit: num(row.monthly_limit),
    })),
    transactions: (txsRes.data ?? []).map((row) => ({
      id: row.id,
      amount: num(row.amount),
      type: row.type,
      categoryId: row.category_id,
      accountId: row.account_id,
      toAccountId: row.to_account_id,
      date: row.date,
      note: row.note ?? "",
      merchant: row.merchant ?? "",
    })),
  };
}

export async function saveLedgerState(
  supabase: SupabaseClient,
  userId: string,
  state: LedgerState,
): Promise<void> {
  const [
    { data: existingAccounts, error: existingAccountsError },
    { data: existingCategories, error: existingCategoriesError },
    { data: existingBudgets, error: existingBudgetsError },
    { data: existingTxs, error: existingTxsError },
  ] = await Promise.all([
    supabase.from("accounts").select("id").eq("user_id", userId),
    supabase.from("categories").select("id").eq("user_id", userId),
    supabase.from("budgets").select("id").eq("user_id", userId),
    supabase.from("transactions").select("id").eq("user_id", userId),
  ]);

  const existingError =
    existingAccountsError ?? existingCategoriesError ?? existingBudgetsError ?? existingTxsError;
  if (existingError) throw existingError;

  const keep = (rows: { id: string }[]) => new Set(rows.map((r) => r.id));
  const accountIds = keep(state.accounts);
  const categoryIds = keep(state.categories);
  const budgetIds = keep(state.budgets);
  const txIds = keep(state.transactions);

  const staleTxs = (existingTxs ?? []).filter((r) => !txIds.has(r.id)).map((r) => r.id);
  const staleBudgets = (existingBudgets ?? []).filter((r) => !budgetIds.has(r.id)).map((r) => r.id);
  const staleAccounts = (existingAccounts ?? []).filter((r) => !accountIds.has(r.id)).map((r) => r.id);
  const staleCategories = (existingCategories ?? [])
    .filter((r) => !categoryIds.has(r.id))
    .map((r) => r.id);

  if (staleTxs.length) {
    const { error } = await supabase.from("transactions").delete().in("id", staleTxs);
    if (error) throw error;
  }
  if (staleBudgets.length) {
    const { error } = await supabase.from("budgets").delete().in("id", staleBudgets);
    if (error) throw error;
  }
  if (staleAccounts.length) {
    const { error } = await supabase.from("accounts").delete().in("id", staleAccounts);
    if (error) throw error;
  }
  if (staleCategories.length) {
    const { error } = await supabase.from("categories").delete().in("id", staleCategories);
    if (error) throw error;
  }

  const { error: settingsError } = await supabase.from("user_settings").upsert({
    user_id: userId,
    currency: state.settings.currency,
    theme: state.settings.theme,
    start_of_month: state.settings.startOfMonth,
  });
  if (settingsError) throw settingsError;

  if (state.accounts.length) {
    const { error } = await supabase.from("accounts").upsert(
      state.accounts.map((a) => ({
        id: a.id,
        user_id: userId,
        name: a.name,
        kind: a.kind,
        opening_balance: a.openingBalance,
      })),
    );
    if (error) throw error;
  }

  if (state.categories.length) {
    const { error } = await supabase.from("categories").upsert(
      state.categories.map((c) => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        kind: c.kind,
      })),
    );
    if (error) throw error;
  }

  if (state.budgets.length) {
    const { error } = await supabase.from("budgets").upsert(
      state.budgets.map((b) => ({
        id: b.id,
        user_id: userId,
        category_id: b.categoryId,
        monthly_limit: b.monthlyLimit,
      })),
    );
    if (error) throw error;
  }

  const rows = state.transactions
    .map((tx) => {
      const accountId = uuidOrNull(tx.accountId);
      if (!accountId || !accountIds.has(accountId)) {
        throw new Error(`Cannot sync transaction ${tx.id}: wallet ${tx.accountId ?? "missing"} is not in the ledger`);
      }
      return {
        id: tx.id,
        user_id: userId,
        amount: tx.amount,
        type: tx.type,
        category_id: uuidOrNull(tx.categoryId) && categoryIds.has(tx.categoryId ?? "") ? tx.categoryId : null,
        account_id: accountId,
        to_account_id:
          tx.type === "transfer" && uuidOrNull(tx.toAccountId) && accountIds.has(tx.toAccountId ?? "")
            ? tx.toAccountId
            : null,
        date: tx.date,
        note: tx.note ?? "",
        merchant: tx.merchant ?? "",
      };
    });

  if (rows.length) {
    const { error } = await supabase.from("transactions").upsert(rows);
    if (error) throw error;
  }
}

export async function wipeLedgerState(supabase: SupabaseClient, userId: string) {
  await supabase.from("transactions").delete().eq("user_id", userId);
  await supabase.from("budgets").delete().eq("user_id", userId);
  await supabase.from("accounts").delete().eq("user_id", userId);
  await supabase.from("categories").delete().eq("user_id", userId);
  await supabase.from("user_settings").delete().eq("user_id", userId);
  const empty = createEmptyState();
  await saveLedgerState(supabase, userId, empty);
  return empty;
}
