-- Клинические настройки врача (шаблоны протоколов и др.) — синхронизация между устройствами.

alter table public.profiles
  add column if not exists clinical_preferences jsonb not null default '{}'::jsonb;

comment on column public.profiles.clinical_preferences is
  'Doctor UI prefs: fmfSecondThirdProtocolTemplate (yakubov-2023 | sonogyn-compact), etc.';
