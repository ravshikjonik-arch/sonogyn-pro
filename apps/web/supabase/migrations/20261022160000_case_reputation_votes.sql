-- Case votes (verified doctors only), case rating cache, reputation recalc (STEP 3).

alter table public.cases
  add column if not exists vote_up_count integer not null default 0,
  add column if not exists vote_down_count integer not null default 0,
  add column if not exists rating integer not null default 0;

alter table public.cases
  drop constraint if exists cases_vote_counts_nonneg;

alter table public.cases
  add constraint cases_vote_counts_nonneg check (
    vote_up_count >= 0 and vote_down_count >= 0
  );

comment on column public.cases.rating is 'vote_up_count − vote_down_count; пересчитывается триггером case_votes.';

alter table public.reputation_events
  add column if not exists actor_id uuid references auth.users (id) on delete set null;

comment on column public.reputation_events.actor_id is
  'Инициатор (например voter_id для case_upvote / vote_retracted).';

-- Несколько пар case_upvote / vote_retracted на одного voter+case допустимы (повторный голос после снятия).

-- ---------------------------------------------------------------------------
-- case_votes
-- ---------------------------------------------------------------------------
create table if not exists public.case_votes (
  case_id uuid not null references public.cases (id) on delete cascade,
  voter_id uuid not null references auth.users (id) on delete cascade,
  vote smallint not null check (vote in (1, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (case_id, voter_id)
);

create index if not exists case_votes_voter_idx on public.case_votes (voter_id);

alter table public.case_votes enable row level security;

drop policy if exists case_votes_select on public.case_votes;
create policy case_votes_select on public.case_votes
  for select to authenticated
  using (public.can_view_teaching_case(case_id));

-- Writes only via cast_case_vote() (security definer).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.profile_is_verified(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_verified from public.profiles p where p.id = p_user_id),
    false
  );
$$;

revoke all on function public.profile_is_verified(uuid) from public;
grant execute on function public.profile_is_verified(uuid) to authenticated;

create or replace function public.sync_case_rating(p_case_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_up int;
  v_down int;
begin
  select
    count(*) filter (where vote = 1),
    count(*) filter (where vote = -1)
  into v_up, v_down
  from public.case_votes
  where case_id = p_case_id;

  update public.cases
  set
    vote_up_count = coalesce(v_up, 0),
    vote_down_count = coalesce(v_down, 0),
    rating = coalesce(v_up, 0) - coalesce(v_down, 0)
  where id = p_case_id;
end;
$$;

create or replace function public.recalculate_reputation(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rep integer;
  v_cases integer;
  v_row public.profiles;
begin
  if p_user_id is null then
    raise exception 'user_id required' using errcode = '22023';
  end if;

  select coalesce(sum(points), 0)::integer into v_rep
  from public.reputation_events
  where user_id = p_user_id;

  select count(*)::integer into v_cases
  from public.cases
  where user_id = p_user_id
    and status = 'published';

  update public.profiles
  set
    reputation = greatest(v_rep, 0),
    cases_count = v_cases,
    updated_at = now()
  where id = p_user_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.recalculate_reputation(uuid) from public;
grant execute on function public.recalculate_reputation(uuid) to service_role;

create or replace function public.cast_case_vote(p_case_id uuid, p_vote smallint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voter uuid := auth.uid();
  v_author uuid;
  v_old smallint;
begin
  if v_voter is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  if p_vote not in (-1, 0, 1) then
    raise exception 'invalid vote' using errcode = '22023';
  end if;

  if not public.profile_is_verified(v_voter) then
    raise exception 'only verified doctors can vote' using errcode = '42501';
  end if;

  select c.user_id into v_author
  from public.cases c
  where c.id = p_case_id;

  if v_author is null then
    raise exception 'case not found' using errcode = 'P0002';
  end if;

  if not public.can_view_teaching_case(p_case_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select cv.vote into v_old
  from public.case_votes cv
  where cv.case_id = p_case_id and cv.voter_id = v_voter;

  if coalesce(v_old, 0) = 1 then
    insert into public.reputation_events (user_id, event_type, points, reference_id, actor_id)
    values (v_author, 'vote_retracted', -2, p_case_id, v_voter);
  end if;

  if p_vote = 0 then
    delete from public.case_votes
    where case_id = p_case_id and voter_id = v_voter;
  elsif v_old is null then
    insert into public.case_votes (case_id, voter_id, vote)
    values (p_case_id, v_voter, p_vote);
  else
    update public.case_votes
    set vote = p_vote, updated_at = now()
    where case_id = p_case_id and voter_id = v_voter;
  end if;

  if p_vote = 1 and coalesce(v_old, 0) <> 1 then
    insert into public.reputation_events (user_id, event_type, points, reference_id, actor_id)
    values (v_author, 'case_upvote', 2, p_case_id, v_voter);
  end if;

  perform public.sync_case_rating(p_case_id);
  perform public.recalculate_reputation(v_author);

  return jsonb_build_object(
    'case_id', p_case_id,
    'vote', case when p_vote = 0 then null else p_vote end
  );
end;
$$;

revoke all on function public.cast_case_vote(uuid, smallint) from public;
grant execute on function public.cast_case_vote(uuid, smallint) to authenticated;

create or replace function public.award_case_featured(p_case_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
begin
  if not public.is_admin() and not public.is_moderator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select user_id into v_author from public.cases where id = p_case_id;
  if v_author is null then
    raise exception 'case not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.reputation_events
    where user_id = v_author and event_type = 'case_featured' and reference_id = p_case_id
  ) then
    return;
  end if;

  insert into public.reputation_events (user_id, event_type, points, reference_id)
  values (v_author, 'case_featured', 25, p_case_id);

  perform public.recalculate_reputation(v_author);
end;
$$;

revoke all on function public.award_case_featured(uuid) from public;
grant execute on function public.award_case_featured(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Publish → +10 reputation (once per case)
-- ---------------------------------------------------------------------------
create or replace function public.trg_award_case_published_reputation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    tg_op = 'UPDATE'
    and old.status is distinct from 'published'
    and new.status = 'published'
  ) or (
    tg_op = 'INSERT'
    and new.status = 'published'
  ) then
    if not exists (
      select 1
      from public.reputation_events e
      where e.user_id = new.user_id
        and e.event_type = 'case_published'
        and e.reference_id = new.id
    ) then
      insert into public.reputation_events (user_id, event_type, points, reference_id)
      values (new.user_id, 'case_published', 10, new.id);
      perform public.recalculate_reputation(new.user_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cases_published_reputation on public.cases;
create trigger trg_cases_published_reputation
  after insert or update of status on public.cases
  for each row execute function public.trg_award_case_published_reputation();

-- Safety net: keep rating in sync if votes mutated via service_role
create or replace function public.trg_case_votes_sync_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case uuid;
begin
  v_case := coalesce(new.case_id, old.case_id);
  perform public.sync_case_rating(v_case);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_case_votes_sync_rating on public.case_votes;
create trigger trg_case_votes_sync_rating
  after insert or update or delete on public.case_votes
  for each row execute function public.trg_case_votes_sync_rating();
