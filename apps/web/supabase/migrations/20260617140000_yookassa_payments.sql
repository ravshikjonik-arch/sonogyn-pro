-- ЮKassa payments (РФ billing). Server writes via service role only.

create table if not exists public.yookassa_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  yookassa_id text not null unique,
  amount_rub numeric(12, 2) not null,
  status text not null default 'pending',
  description text,
  confirmation_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists yookassa_payments_user_id_idx on public.yookassa_payments (user_id);
create index if not exists yookassa_payments_status_idx on public.yookassa_payments (status);

alter table public.yookassa_payments enable row level security;

drop policy if exists "yookassa_payments_select_own" on public.yookassa_payments;
create policy "yookassa_payments_select_own"
  on public.yookassa_payments
  for select
  to authenticated
  using (auth.uid() = user_id);
