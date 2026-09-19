"use client";

import { FormEvent, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { todayISO } from "@/lib/dates";
import { parseAmount } from "@/lib/money";
import { useLedger } from "@/components/providers";
import type { Transaction, TxType } from "@/lib/types";

export function TransactionForm({ id }: { id?: string }) {
  const { ready, state, setState } = useLedger();
  const router = useRouter();
  const formId = useId();
  const existing = id ? state.transactions.find((tx) => tx.id === id) : undefined;
  const [type, setType] = useState<TxType>(existing?.type ?? "expense");
  const [error, setError] = useState("");

  const categories = useMemo(
    () => state.categories.filter((c) => (type === "income" ? c.kind === "income" : c.kind === "expense")),
    [state.categories, type],
  );

  if (!ready) return <p className="empty">Loading form…</p>;
  if (id && !existing) return <p className="empty">That entry was not found.</p>;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const amount = parseAmount(String(data.get("amount") ?? ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    const nextType = String(data.get("type")) as TxType;
    const accountId = String(data.get("accountId"));
    const toAccountId = nextType === "transfer" ? String(data.get("toAccountId")) : null;
    if (nextType === "transfer" && toAccountId === accountId) {
      setError("Choose two different wallets for a transfer.");
      return;
    }
    const categoryId = nextType === "transfer" ? null : String(data.get("categoryId"));
    const tx: Transaction = {
      id: existing?.id ?? crypto.randomUUID(),
      amount,
      type: nextType,
      categoryId,
      accountId,
      toAccountId,
      date: String(data.get("date") ?? todayISO()),
      note: String(data.get("note") ?? "").trim(),
      merchant: String(data.get("merchant") ?? "").trim(),
    };
    setState((prev) => ({
      ...prev,
      transactions: existing
        ? prev.transactions.map((item) => (item.id === tx.id ? tx : item))
        : [tx, ...prev.transactions],
    }));
    router.push("/transactions");
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">{existing ? "Edit" : "New"}</p>
          <h1 className="page-title">{existing ? "Update entry" : "Add entry"}</h1>
        </div>
      </header>

      <form className="sheet-form card" onSubmit={onSubmit} noValidate>
        <fieldset className="type-set">
          <legend>Type</legend>
          {(["expense", "income", "transfer"] as const).map((value) => (
            <label key={value} className="radio-chip">
              <input
                type="radio"
                name="type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
              />
              {value}
            </label>
          ))}
        </fieldset>

        <label htmlFor={`${formId}-amount`}>Amount</label>
        <input
          id={`${formId}-amount`}
          name="amount"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          required
          defaultValue={existing?.amount}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${formId}-error` : undefined}
        />

        {type !== "transfer" ? (
          <>
            <label htmlFor={`${formId}-category`}>Category</label>
            <select
              id={`${formId}-category`}
              name="categoryId"
              defaultValue={existing?.categoryId ?? categories[0]?.id}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </>
        ) : null}

        <label htmlFor={`${formId}-account`}>
          {type === "transfer" ? "From wallet" : "Wallet"}
        </label>
        <select id={`${formId}-account`} name="accountId" defaultValue={existing?.accountId} required>
          {state.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {type === "transfer" ? (
          <>
            <label htmlFor={`${formId}-to`}>To wallet</label>
            <select
              id={`${formId}-to`}
              name="toAccountId"
              defaultValue={existing?.toAccountId ?? state.accounts[1]?.id}
              required
            >
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </>
        ) : null}

        <label htmlFor={`${formId}-date`}>Date</label>
        <input
          id={`${formId}-date`}
          name="date"
          type="date"
          required
          defaultValue={existing?.date ?? todayISO()}
        />

        <label htmlFor={`${formId}-merchant`}>Merchant</label>
        <input
          id={`${formId}-merchant`}
          name="merchant"
          type="text"
          maxLength={80}
          defaultValue={existing?.merchant}
          autoComplete="organization"
        />

        <label htmlFor={`${formId}-note`}>Note</label>
        <input id={`${formId}-note`} name="note" type="text" maxLength={120} defaultValue={existing?.note} />

        {error ? (
          <p id={`${formId}-error`} className="error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="add-btn full">
          Save
        </button>
      </form>
    </>
  );
}
