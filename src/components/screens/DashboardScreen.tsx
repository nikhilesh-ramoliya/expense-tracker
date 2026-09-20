"use client";

import Link from "next/link";
import { currentPeriodKey, formatDay, formatMonthLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import {
  accountBalance,
  categoryName,
  monthTransactions,
  sums,
  totalBudget,
} from "@/lib/selectors";
import { useLedger } from "@/components/providers";

export function DashboardScreen() {
  const { ready, state } = useLedger();
  if (!ready) return <p className="empty">Loading your month…</p>;

  const period = currentPeriodKey(state.settings.startOfMonth);
  const month = monthTransactions(state);
  const { income, spend } = sums(month);
  const budget = totalBudget(state);
  const remaining = budget - spend;
  const recent = [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 5);
  const cash = state.accounts.reduce((sum, a) => sum + accountBalance(state, a), 0);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">{formatMonthLabel(period)}</p>
          <h1 className="total">{formatMoney(spend, state.settings.currency)}</h1>
          <p className="count">Spent this period</p>
        </div>
        <Link href="/transactions/new" className="add-btn">
          Add
        </Link>
      </header>

      <ul className="stat-grid">
        <li className="stat">
          <p className="stat-label">Income</p>
          <p className="stat-value">{formatMoney(income, state.settings.currency)}</p>
        </li>
        <li className="stat">
          <p className="stat-label">Left in envelopes</p>
          <p className="stat-value">{formatMoney(remaining, state.settings.currency)}</p>
        </li>
        <li className="stat">
          <p className="stat-label">Across wallets</p>
          <p className="stat-value">{formatMoney(cash, state.settings.currency)}</p>
        </li>
      </ul>

      <section className="block">
        <div className="block-head">
          <h2>Recent</h2>
          <Link href="/transactions" className="text-btn">
            See all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="empty">No activity yet.</p>
        ) : (
          <ul className="plain-list">
            {recent.map((tx) => (
              <li key={tx.id}>
                <Link href={`/transactions/${tx.id}`} className="row row-link">
                  <div>
                    <p className="row-amount">
                      <span className="txt">
                        {tx.type === "income" ? "+" : tx.type === "expense" ? "−" : "↔"}{" "}
                        {formatMoney(tx.amount, state.settings.currency)}
                      </span>
                    </p>
                    <p className="row-meta">
                      <span className="txt">
                        {categoryName(state, tx.categoryId)} · {formatDay(tx.date)}
                        {tx.merchant ? ` · ${tx.merchant}` : ""}
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="quick-links">
        <Link href="/accounts" className="ghost-btn">
          Wallets
        </Link>
        <Link href="/insights" className="ghost-btn">
          Charts
        </Link>
        <Link href="/budgets" className="ghost-btn">
          Envelopes
        </Link>
      </p>
    </>
  );
}
