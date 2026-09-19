export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function formatDay(date: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

/** Period keyed by start-of-month day (1–28). */
export function periodKey(dateISO: string, startOfMonth: number): string {
  const date = new Date(`${dateISO}T12:00:00`);
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const start = Math.min(Math.max(startOfMonth, 1), 28);
  if (day >= start) {
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  }
  const prev = new Date(year, month - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

export function currentPeriodKey(startOfMonth: number): string {
  return periodKey(todayISO(), startOfMonth);
}

export function periodRange(period: string, startOfMonth: number): { start: string; end: string } {
  const [year, month] = period.split("-").map(Number);
  const startDay = Math.min(Math.max(startOfMonth, 1), 28);
  const startDate = new Date(year, month - 1, startDay);
  const next = new Date(year, month, startDay);
  next.setDate(next.getDate() - 1);
  const toISO = (d: Date) => {
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
  };
  return { start: toISO(startDate), end: toISO(next) };
}

export function weekdayLabel(dateISO: string): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
    new Date(`${dateISO}T12:00:00`),
  );
}
