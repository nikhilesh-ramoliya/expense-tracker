-- Upgrade path: create these tables in Supabase, enable Auth, then swap
-- src/lib/storage.ts for a supabase-js adapter. RLS uses auth.uid().

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('cash', 'card', 'bank')),
  opening_balance numeric not null default 0
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense', 'income'))
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null check (amount > 0),
  type text not null check (type in ('expense', 'income', 'transfer')),
  category_id uuid references public.categories (id),
  account_id uuid not null references public.accounts (id),
  to_account_id uuid references public.accounts (id),
  date date not null,
  note text not null default '',
  merchant text not null default ''
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  monthly_limit numeric not null default 0
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  currency text not null default 'INR',
  theme text not null default 'system',
  start_of_month int not null default 1
);

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.user_settings enable row level security;

create policy "own profiles" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own accounts" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own categories" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own budgets" on public.budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own settings" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
