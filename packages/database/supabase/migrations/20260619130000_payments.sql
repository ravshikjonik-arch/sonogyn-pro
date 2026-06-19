-- Payments (ЮKassa). Таблица orders/payments для webhook.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'yookassa_payments'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'payments'
  ) then
    alter table public.yookassa_payments rename to payments;
    alter table public.payments rename column amount_rub to amount;
    alter index if exists yookassa_payments_user_id_idx rename to payments_user_id_idx;
    alter index if exists yookassa_payments_status_idx rename to payments_status_idx;
  elsif not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'payments'
  ) then
    create table public.payments (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      yookassa_id text not null unique,
      amount numeric(12, 2) not null,
      status text not null default 'pending',
      description text,
      confirmation_url text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create index payments_user_id_idx on public.payments (user_id);
    create index payments_status_idx on public.payments (status);
  end if;
end $$;

alter table public.payments enable row level security;

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments
  for select
  to authenticated
  using (auth.uid() = user_id);
