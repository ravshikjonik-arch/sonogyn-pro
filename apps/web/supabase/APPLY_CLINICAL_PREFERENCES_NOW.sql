-- Prod hotfix: колонка для шаблонов протоколов в личном кабинете.
-- Supabase Dashboard → SQL Editor → Run (один раз).

alter table public.profiles
  add column if not exists clinical_preferences jsonb not null default '{}'::jsonb;

comment on column public.profiles.clinical_preferences is
  'Doctor UI prefs: fmfSecondThirdProtocolTemplate (yakubov-2023 | sonogyn-compact), etc.';
