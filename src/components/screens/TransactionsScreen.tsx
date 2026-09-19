"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { categoryName } from "@/lib/selectors";
import { useLedger } from "@/components/providers";

export function TransactionsScreen() {
  const { ready, state, setState } = useLedger();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");

  const list = useMemo(() => {
    return [...state.transactions]
      .filter((tx) => {
        if (category !== "all" && tx.categoryId !== category) return false;
        if (from && tx.date < from) return false;
        if (to && tx.date > to) return false;
        const hay = `${tx.note} ${tx.merchant} ${categoryName(state, tx.categoryId)}`.toLowerCase();
        if (query && !hay.includes(query.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [state, query, category, from, to]);

  if (!ready) return <p className="empty">Loading activity…</p>;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Ledger</p>
          <h1 className="page-title">Activity</h1>
        </div>
        <Link href="/transactions/new" className="add-btn">
          New
        </Link>
      </header>

      <div className="filters-stack">
        <label className="field-label" htmlFor="search">
          Search
        </label>
        <input
          id="search"
          className="field"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Merchant, note, category"
        />
        <label className="field-label" htmlFor="cat">
          Category
        </label>
        <select id="cat" className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {state.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="date-row">
          <div>
            <label className="field-label" htmlFor="from">
              From
            </label>
            <input id="from" className="field" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="to">
              To
            </label>
            <input id="to" className="field" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {status}
      </p>

      {list.length === 0 ? (
        <p className="empty">Nothing matches those filters.</p>
      ) : (
        <ul className="plain-list">
          {list.map((tx) => (
            <li key={tx.id} className="row">
              <Link href={`/transactions/${tx.id}`} className="row-grow">
                <p className="row-amount">
                  {tx.type === "income" ? "+" : tx.type === "expense" ? "−" : "↔"}{" "}
                  {formatMoney(tx.amount, state.settings.currency)}
                </p>
                <p className="row-meta">
                  {categoryName(state, tx.categoryId)} · {formatDay(tx.date)}
                  {tx.merchant ? ` · ${tx.merchant}` : ""}
                </p>
                {tx.note ? <p className="row-note">{tx.note}</p> : null}
              </Link>
              <button
                type="button"
                className="delete-btn"
                onClick={() => {
                  setState({
                    ...state,
                    transactions: state.transactions.filter((item) => item.id !== tx.id),
                  });
                  setStatus(`Deleted ${formatMoney(tx.amount, state.settings.currency)}.`);
                }}
                aria-label={`Delete ${formatMoney(tx.amount, state.settings.currency)} ${categoryName(state, tx.categoryId)}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
