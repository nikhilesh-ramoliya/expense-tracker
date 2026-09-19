"use client";

import { FormEvent, useId, useState } from "react";
import Link from "next/link";
import { formatMoney, parseAmount } from "@/lib/money";
import { accountBalance } from "@/lib/selectors";
import { useLedger } from "@/components/providers";
import { ACCOUNT_KINDS, type AccountKind } from "@/lib/types";

export function AccountsScreen() {
  const { ready, state, setState } = useLedger();
  const formId = useId();
  const [error, setError] = useState("");

  if (!ready) return <p className="empty">Loading wallets…</p>;

  function addWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const kind = String(data.get("kind")) as AccountKind;
    const opening = parseAmount(String(data.get("opening") ?? "0"));
    if (!name) {
      setError("Name the wallet.");
      return;
    }
    setState({
      ...state,
      accounts: [
        ...state.accounts,
        {
          id: crypto.randomUUID(),
          name,
          kind,
          openingBalance: Number.isFinite(opening) ? opening : 0,
        },
      ],
    });
    event.currentTarget.reset();
    setError("");
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Cash, card, bank</p>
          <h1 className="page-title">Wallets</h1>
        </div>
        <Link href="/transactions/new" className="add-btn">
          Spend
        </Link>
      </header>
      <p className="lede">
        Spend from a wallet when you add an expense. Transfers move money between wallets without
        changing your spend total.
      </p>

      <ul className="plain-list">
        {state.accounts.map((account) => (
          <li key={account.id} className="row">
            <div>
              <p className="row-amount">{formatMoney(accountBalance(state, account), state.settings.currency)}</p>
              <p className="row-meta">
                {account.name} · {ACCOUNT_KINDS.find((k) => k.id === account.kind)?.label}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <form className="card sheet-form" onSubmit={addWallet}>
        <h2>Add wallet</h2>
        <label htmlFor={`${formId}-name`}>Name</label>
        <input id={`${formId}-name`} name="name" required />
        <label htmlFor={`${formId}-kind`}>Kind</label>
        <select id={`${formId}-kind`} name="kind" defaultValue="cash">
          {ACCOUNT_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
        <label htmlFor={`${formId}-open`}>Opening balance</label>
        <input id={`${formId}-open`} name="opening" type="number" step="0.01" defaultValue="0" />
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="add-btn full">
          Add wallet
        </button>
      </form>
    </>
  );
}
