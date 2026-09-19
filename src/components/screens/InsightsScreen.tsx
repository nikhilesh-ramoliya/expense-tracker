"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { addDays, currentPeriodKey, periodKey, todayISO, weekdayLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { categoryName, monthTransactions } from "@/lib/selectors";
import { useLedger } from "@/components/providers";

const COLORS = ["#2f5d50", "#9a3b28", "#c4a35a", "#4a6fa5", "#6b4f3a", "#3d6b7a", "#7a4d6b"];

type Mode = "category" | "daily" | "weekly" | "trend";

export function InsightsScreen() {
  const { ready, state } = useLedger();
  const [mode, setMode] = useState<Mode>("category");
  const currency = state.settings.currency;

  const month = useMemo(() => (ready ? monthTransactions(state) : []), [ready, state]);

  const pie = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of month.filter((t) => t.type === "expense")) {
      const key = categoryName(state, tx.categoryId);
      map.set(key, (map.get(key) ?? 0) + tx.amount);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [month, state]);

  const daily = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(todayISO(), i - 6));
    return days.map((date) => ({
      name: weekdayLabel(date),
      spend: month.filter((t) => t.type === "expense" && t.date === date).reduce((s, t) => s + t.amount, 0),
    }));
  }, [month]);

  const weekly = useMemo(() => {
    const buckets = [0, 0, 0, 0];
    for (const tx of month.filter((t) => t.type === "expense")) {
      const d = new Date(`${tx.date}T12:00:00`).getDate();
      buckets[Math.min(3, Math.floor((d - 1) / 7))] += tx.amount;
    }
    return buckets.map((spend, i) => ({ name: `Week ${i + 1}`, spend }));
  }, [month]);

  const trend = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of state.transactions.filter((t) => t.type === "expense")) {
      const key = periodKey(tx.date, state.settings.startOfMonth);
      map.set(key, (map.get(key) ?? 0) + tx.amount);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([name, spend]) => ({ name, spend }));
  }, [state]);

  if (!ready) return <p className="empty">Drawing charts…</p>;

  const period = currentPeriodKey(state.settings.startOfMonth);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">{period}</p>
          <h1 className="page-title">Insights</h1>
        </div>
      </header>

      <div className="filters segmented" role="tablist" aria-label="Visualization">
        {(
          [
            ["category", "Categories"],
            ["daily", "Last 7 days"],
            ["weekly", "Weeks"],
            ["trend", "Months"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            className={mode === id ? "chip chip-on" : "chip"}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="chart-card" aria-live="polite">
        {mode === "category" &&
          (pie.length === 0 ? (
            <p className="empty">No spending to chart this period.</p>
          ) : (
            <figure>
              <figcaption className="sr-only">
                Category share:{" "}
                {pie.map((p) => `${p.name} ${formatMoney(p.value, currency)}`).join(", ")}
              </figcaption>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={2}>
                    {pie.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(Number(v), currency)} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="legend">
                {pie.map((p, i) => (
                  <li key={p.name}>
                    <span className="swatch" style={{ background: COLORS[i % COLORS.length] }} />
                    {p.name} · {formatMoney(p.value, currency)}
                  </li>
                ))}
              </ul>
            </figure>
          ))}

        {mode === "daily" && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="name" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />
              <Tooltip formatter={(v) => formatMoney(Number(v), currency)} />
              <Bar dataKey="spend" fill="#2f5d50" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {mode === "weekly" && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="name" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />
              <Tooltip formatter={(v) => formatMoney(Number(v), currency)} />
              <Bar dataKey="spend" fill="#9a3b28" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {mode === "trend" && (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="name" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />
              <Tooltip formatter={(v) => formatMoney(Number(v), currency)} />
              <Line type="monotone" dataKey="spend" stroke="#2f5d50" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}
