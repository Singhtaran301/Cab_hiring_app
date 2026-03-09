create extension if not exists pgcrypto;

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  uber_balance numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('savings', 'credit_card')),
  label text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.linked_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('wallet', 'bank', 'card')),
  name text not null,
  balance numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('to_uber', 'from_uber')),
  counterparty text not null,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  title text not null,
  description text not null,
  discount_text text not null,
  enrolled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, code)
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  dob text not null,
  address text not null,
  marketing_emails boolean not null default true,
  kyc_name_status text not null default 'approved' check (kyc_name_status in ('approved', 'pending')),
  kyc_dob_status text not null default 'approved' check (kyc_dob_status in ('approved', 'pending')),
  kyc_address_status text not null default 'approved' check (kyc_address_status in ('approved', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallets enable row level security;
alter table public.payment_methods enable row level security;
alter table public.linked_accounts enable row level security;
alter table public.transfers enable row level security;
alter table public.promotions enable row level security;
alter table public.profiles enable row level security;

drop policy if exists wallets_own_all on public.wallets;
create policy wallets_own_all on public.wallets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists payment_methods_own_all on public.payment_methods;
create policy payment_methods_own_all on public.payment_methods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists linked_accounts_own_all on public.linked_accounts;
create policy linked_accounts_own_all on public.linked_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists transfers_own_all on public.transfers;
create policy transfers_own_all on public.transfers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists promotions_own_all on public.promotions;
create policy promotions_own_all on public.promotions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists profiles_own_all on public.profiles;
create policy profiles_own_all on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
