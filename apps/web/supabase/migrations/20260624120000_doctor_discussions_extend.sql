-- Doctor discussions: extend cases / teaching_case_comments / doctor_chat_channels.
-- channel_id IS NULL → teaching library case; channel_id IS NOT NULL → colleague question.

alter table public.cases
  add column if not exists channel_id uuid references public.doctor_chat_channels (id) on delete set null;

create index if not exists idx_cases_channel_id on public.cases (channel_id);

alter table public.teaching_case_comments
  add column if not exists is_best_answer boolean not null default false;

-- Push subscription tables
create table if not exists public.channel_subscriptions (
  user_id uuid not null references auth.users (id) on delete cascade,
  channel_id uuid not null references public.doctor_chat_channels (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);

create table if not exists public.case_subscriptions (
  user_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, case_id)
);

alter table public.channel_subscriptions enable row level security;
alter table public.case_subscriptions enable row level security;

drop policy if exists channel_subscriptions_own on public.channel_subscriptions;
create policy channel_subscriptions_own on public.channel_subscriptions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists case_subscriptions_own on public.case_subscriptions;
create policy case_subscriptions_own on public.case_subscriptions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Expo push tokens (mobile registers via authenticated client)
create table if not exists public.user_push_tokens (
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  primary key (user_id, expo_push_token)
);

alter table public.user_push_tokens enable row level security;

drop policy if exists user_push_tokens_own on public.user_push_tokens;
create policy user_push_tokens_own on public.user_push_tokens
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-subscribe comment authors (and case author on new question)
create or replace function public.bump_case_subscriptions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.case_subscriptions (user_id, case_id)
  values (new.author_id, new.case_id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_bump_case_subscriptions on public.teaching_case_comments;
create trigger trg_bump_case_subscriptions
after insert on public.teaching_case_comments
for each row execute function public.bump_case_subscriptions();

create or replace function public.bump_case_subscriptions_on_case()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.channel_id is not null then
    insert into public.case_subscriptions (user_id, case_id)
    values (new.user_id, new.id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bump_case_subscriptions_on_case on public.cases;
create trigger trg_bump_case_subscriptions_on_case
after insert on public.cases
for each row execute function public.bump_case_subscriptions_on_case();

-- Mark best answer: case author only (RPC)
create or replace function public.mark_best_comment(p_case_id uuid, p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.cases where id = p_case_id and user_id = auth.uid()
  ) then
    raise exception 'only case author can mark best answer';
  end if;

  if not exists (
    select 1 from public.teaching_case_comments
    where id = p_comment_id and case_id = p_case_id
  ) then
    raise exception 'comment not found for case';
  end if;

  update public.teaching_case_comments
  set is_best_answer = (id = p_comment_id)
  where case_id = p_case_id;
end;
$$;

revoke all on function public.mark_best_comment(uuid, uuid) from public;
grant execute on function public.mark_best_comment(uuid, uuid) to authenticated;

-- Specialty sections (slug unique for ON CONFLICT)
create unique index if not exists doctor_chat_channels_slug_key on public.doctor_chat_channels (slug);

insert into public.doctor_chat_channels (id, slug, title, description, sort_order)
values
  (gen_random_uuid(), 'iota-orads', 'IOTA / O-RADS', 'Яичник, IOTA 2026, O-RADS US', 10),
  (gen_random_uuid(), 'fast-efast', 'FAST / EFAST', 'ЭFAST, свободная жидкость, травма', 20),
  (gen_random_uuid(), 'cervix-pathology', 'Патология шейки', 'Кольпоскопия, CIN, шейка матки', 30),
  (gen_random_uuid(), 'breast-us', 'Молочная железа', 'BI-RADS US, МЖ, допплер', 40),
  (gen_random_uuid(), 'vascular-us', 'Сосуды', 'Допплер, вены, артерии', 50)
on conflict (slug) do nothing;

comment on column public.cases.channel_id is 'NULL = teaching library; NOT NULL = colleague question in doctor_chat_channels section.';
comment on column public.teaching_case_comments.is_best_answer is 'Best answer marker; only case author may set via mark_best_comment RPC.';
