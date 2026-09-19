"use client";

import { FormEvent } from "react";
import { formatMoney } from "@/lib/money";
import { spentInCategory } from "@/lib/selectors";
import { useLedger } from "@/components/providers";

export function BudgetsScreen() {
  const { ready, state, setState } = useLedger();
  if (!ready) return <p className="empty">Loading envelopes…</p>;

  const expenseCats = state.categories.filter((c) => c.kind === "expense");

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const budgets = expenseCats.map((c) => {
      const existing = state.budgets.find((b) => b.categoryId === c.id);
      const raw = Number(data.get(`budget-${c.id}`));
      return {
        id: existing?.id ?? crypto.randomUUID(),
        categoryId: c.id,
        monthlyLimit: Number.isFinite(raw) && raw >= 0 ? raw : 0,
      };
    });
    setState({ ...state, budgets });
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">This period</p>
          <h1 className="page-title">Envelopes</h1>
        </div>
      </header>
      <p className="lede">Set a monthly ceiling per category. Progress uses this period’s expenses.</p>

      {expenseCats.length === 0 ? (
        <p className="empty">No categories yet. Add them in Settings, then set envelopes here.</p>
      ) : null}

      <form className="stack" onSubmit={save}>
        {expenseCats.map((c) => {
          const budget = state.budgets.find((b) => b.categoryId === c.id)?.monthlyLimit ?? 0;
          const spent = spentInCategory(state, c.id);
          const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
          const over = budget > 0 && spent > budget;
          return (
            <div key={c.id} className="card budget-card">
              <div className="block-head">
                <h2>{c.name}</h2>
                <p className="muted-copy">
                  {formatMoney(spent, state.settings.currency)} of{" "}
                  {formatMoney(budget, state.settings.currency)}
                </p>
              </div>
              <div
                className="meter"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                aria-label={`${c.name} budget ${pct} percent used`}
              >
                <span className={over ? "meter-fill over" : "meter-fill"} style={{ width: `${pct}%` }} />
              </div>
              <label className="field-label" htmlFor={`budget-${c.id}`}>
                Monthly limit
              </label>
              <input
                id={`budget-${c.id}`}
                name={`budget-${c.id}`}
                className="field"
                type="number"
                min="0"
                step="1"
                defaultValue={budget || ""}
              />
            </div>
          );
        })}
        {expenseCats.length > 0 ? (
          <button type="submit" className="add-btn full">
            Save envelopes
          </button>
        ) : null}
      </form>
    </>
  );
}
