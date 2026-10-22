-- Idempotent comment 👍 reputation: не дублировать +1 без промежуточного −1.

create or replace function public.apply_comment_thumb_reputation(
  p_comment_id uuid,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voter uuid := auth.uid();
  v_author uuid;
  v_has_active_credit boolean;
begin
  if v_voter is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  if not public.profile_is_verified(v_voter) then
    raise exception 'only verified doctors can award comment reputation' using errcode = '42501';
  end if;

  select c.author_id into v_author
  from public.teaching_case_comments c
  where c.id = p_comment_id;

  if v_author is null then
    raise exception 'comment not found' using errcode = 'P0002';
  end if;

  if v_author = v_voter then
    return;
  end if;

  select exists (
    select 1
    from public.reputation_events e
    where e.event_type = 'comment_upvote'
      and e.actor_id = v_voter
      and e.reference_id = p_comment_id
      and not exists (
        select 1
        from public.reputation_events r
        where r.event_type = 'vote_retracted'
          and r.actor_id = v_voter
          and r.reference_id = p_comment_id
          and r.created_at > e.created_at
      )
  ) into v_has_active_credit;

  if p_active then
    if not exists (
      select 1
      from public.teaching_case_comment_reactions r
      where r.comment_id = p_comment_id
        and r.user_id = v_voter
        and r.emoji = '👍'
    ) then
      raise exception 'thumb reaction missing' using errcode = '22023';
    end if;

    if v_has_active_credit then
      return;
    end if;

    insert into public.reputation_events (user_id, event_type, points, reference_id, actor_id)
    values (v_author, 'comment_upvote', 1, p_comment_id, v_voter);
  else
    if not v_has_active_credit then
      return;
    end if;

    insert into public.reputation_events (user_id, event_type, points, reference_id, actor_id)
    values (v_author, 'vote_retracted', -1, p_comment_id, v_voter);
  end if;

  perform public.recalculate_reputation(v_author);
end;
$$;
