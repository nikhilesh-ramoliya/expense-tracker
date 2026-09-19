# Ledger

Phone-first multipage expense tracker (PWA). Add it to an iPhone Home Screen from Safari: **Share → Add to Home Screen**.

## Run

```bash
npm install
npm run dev
```

Open the local URL. Create an account (email + password, 8+ characters). New accounts receive a sample month so Insights and envelopes are not empty.

Data and sessions live in `localStorage` on this device.

## Auth

**Local demo accounts** — email/password hashed with SHA-256 in the browser, session persisted.

Supabase Auth is ready to plug in: the plugin’s only project (`nikhilesh-ramoliya's Project`) is **INACTIVE**. Copy `.env.example`, restore or create a project, run `src/lib/supabase/schema.sql`, then swap `src/lib/storage.ts` for supabase-js.

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Sign in / sign up |
| `/dashboard` | Month total, income vs spend, remaining budget, recent activity, quick add |
| `/transactions` | Search, category/date filters, edit, delete |
| `/transactions/new` | Add expense, income, or transfer |
| `/transactions/[id]` | Edit |
| `/insights` | Category donut, daily/weekly bars, month trend (Recharts) |
| `/budgets` | Per-category monthly envelopes |
| `/accounts` | Cash / card / bank wallets |
| `/settings` | Currency, theme, start-of-month, categories, CSV, install help, sign out, wipe |

```
npm run build
```
