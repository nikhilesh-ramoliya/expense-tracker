"use client";

import { FormEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useLedger } from "@/components/providers";
import { CURRENCIES, type CategoryKind, type ThemeMode } from "@/lib/types";

export function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { ready, state, setState, wipe } = useLedger();
  const router = useRouter();
  const formId = useId();
  const [catName, setCatName] = useState("");
  const [catKind, setCatKind] = useState<CategoryKind>("expense");
  const [hint, setHint] = useState(false);

  if (!ready) return <p className="empty">Loading settings…</p>;

  function exportCsv() {
    const rows = [
      ["id", "date", "type", "amount", "category", "account", "toAccount", "merchant", "note"],
      ...state.transactions.map((tx) => [
        tx.id,
        tx.date,
        tx.type,
        String(tx.amount),
        tx.categoryId ?? "",
        tx.accountId,
        tx.toAccountId ?? "",
        tx.merchant,
        tx.note,
      ]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ledger-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function addCategory(event: FormEvent) {
    event.preventDefault();
    const name = catName.trim();
    if (!name) return;
    setState({
      ...state,
      categories: [...state.categories, { id: crypto.randomUUID(), name, kind: catKind }],
    });
    setCatName("");
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">{session?.email}</p>
          <h1 className="page-title">Settings</h1>
        </div>
      </header>

      <section className="card stack">
        <h2>Preferences</h2>
        <label className="field-label" htmlFor={`${formId}-currency`}>
          Currency
        </label>
        <select
          id={`${formId}-currency`}
          className="field"
          value={state.settings.currency}
          onChange={(e) =>
            setState({ ...state, settings: { ...state.settings, currency: e.target.value } })
          }
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <fieldset className="type-set">
          <legend>Theme</legend>
          {(["light", "dark", "system"] as ThemeMode[]).map((theme) => (
            <label key={theme} className="radio-chip">
              <input
                type="radio"
                name="theme"
                checked={state.settings.theme === theme}
                onChange={() =>
                  setState({ ...state, settings: { ...state.settings, theme } })
                }
              />
              {theme}
            </label>
          ))}
        </fieldset>

        <label className="field-label" htmlFor={`${formId}-som`}>
          Start of month (day)
        </label>
        <input
          id={`${formId}-som`}
          className="field"
          type="number"
          min={1}
          max={28}
          value={state.settings.startOfMonth}
          onChange={(e) =>
            setState({
              ...state,
              settings: { ...state.settings, startOfMonth: Number(e.target.value) || 1 },
            })
          }
        />
      </section>

      <section className="card stack">
        <h2>Categories</h2>
        <ul className="chip-list">
          {state.categories.map((c) => (
            <li key={c.id}>
              <span>
                {c.name} <small>({c.kind})</small>
              </span>
              <button
                type="button"
                className="delete-btn"
                onClick={() =>
                  setState({
                    ...state,
                    categories: state.categories.filter((item) => item.id !== c.id),
                    budgets: state.budgets.filter((b) => b.categoryId !== c.id),
                  })
                }
                aria-label={`Remove ${c.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <form className="inline-form" onSubmit={addCategory}>
          <label className="sr-only" htmlFor={`${formId}-cat`}>
            New category
          </label>
          <input
            id={`${formId}-cat`}
            className="field"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="Name"
          />
          <select
            className="field"
            value={catKind}
            onChange={(e) => setCatKind(e.target.value as CategoryKind)}
            aria-label="Category kind"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <button type="submit" className="add-btn">
            Add
          </button>
        </form>
      </section>

      <section className="card stack">
        <h2>iPhone Home Screen</h2>
        <p className="muted-copy">
          In Safari: tap Share, then <strong>Add to Home Screen</strong>. Ledger opens like a native
          app with the cedar status bar.
        </p>
        <button type="button" className="ghost-btn" onClick={() => setHint((v) => !v)}>
          {hint ? "Hide steps" : "Show install help"}
        </button>
        {hint ? (
          <ol className="help-list">
            <li>Open this site in Safari (not in-app browsers).</li>
            <li>Tap the share sheet in the toolbar.</li>
            <li>Choose Add to Home Screen, then Add.</li>
          </ol>
        ) : null}
      </section>

      <ul className="plain-list settings-actions">
        <li>
          <button type="button" className="row-grow text-btn" onClick={exportCsv}>
            Export CSV
          </button>
        </li>
        <li>
          <button
            type="button"
            className="row-grow text-btn"
            onClick={() => {
              signOut();
              router.replace("/");
            }}
          >
            Sign out
          </button>
        </li>
        <li>
          <button
            type="button"
            className="row-grow delete-btn"
            onClick={() => {
              if (window.confirm("Replace this account’s data with a fresh demo month?")) wipe();
            }}
          >
            Wipe and restore demo data
          </button>
        </li>
      </ul>
    </>
  );
}
