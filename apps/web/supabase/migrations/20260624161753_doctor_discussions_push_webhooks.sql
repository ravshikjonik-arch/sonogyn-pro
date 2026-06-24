-- Doctor discussions: pg_net database webhooks → Edge Functions (push).
--
-- One-time setup in Vault (SQL Editor, service role) BEFORE webhooks fire:
--   select vault.create_secret('<PROJECT_REF>', 'supabase_project_ref', 'Supabase project ref for edge URLs');
--   select vault.create_secret('<openssl rand -hex 32>', 'discussions_webhook_secret', 'Webhook header for push edge functions');
-- Optional mirror for Edge Functions CLI:
--   supabase secrets set DISCUSSIONS_WEBHOOK_SECRET=<same hex> --project-ref <PROJECT_REF>

create extension if not exists pg_net with schema extensions;

create or replace function public.get_discussion_vault_secret(p_name text)
returns text
language sql
stable
security definer
set search_path = public, vault, extensions
as $$
  select decrypted_secret::text
  from vault.decrypted_secrets
  where name = p_name
  limit 1;
$$;

revoke all on function public.get_discussion_vault_secret(text) from public;
grant execute on function public.get_discussion_vault_secret(text) to service_role;

create or replace function public.discussion_push_webhook_headers()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, vault, extensions
as $$
declare
  v_secret text;
begin
  v_secret := public.get_discussion_vault_secret('discussions_webhook_secret');
  if coalesce(v_secret, '') = '' then
    raise exception 'Missing Vault secret discussions_webhook_secret';
  end if;

  return jsonb_build_object(
    'Content-Type', 'application/json',
    'x-webhook-secret', v_secret
  );
end;
$$;

create or replace function public.discussion_push_function_url(p_fn text)
returns text
language plpgsql
stable
security definer
set search_path = public, vault, extensions
as $$
declare
  v_ref text;
begin
  v_ref := public.get_discussion_vault_secret('supabase_project_ref');
  if coalesce(v_ref, '') = '' then
    raise exception 'Missing Vault secret supabase_project_ref';
  end if;

  return format('https://%s.supabase.co/functions/v1/%s', v_ref, p_fn);
end;
$$;

create or replace function public.notify_new_comment_webhook_fn()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  request_id bigint;
  payload jsonb;
begin
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW),
    'old_record', null
  );

  select net.http_post(
    url := public.discussion_push_function_url('notify-new-comment'),
    headers := public.discussion_push_webhook_headers(),
    body := payload
  ) into request_id;

  return NEW;
end;
$$;

create or replace function public.notify_new_case_question_webhook_fn()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  request_id bigint;
  payload jsonb;
begin
  if NEW.channel_id is null then
    return NEW;
  end if;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW),
    'old_record', null
  );

  select net.http_post(
    url := public.discussion_push_function_url('notify-new-case-question'),
    headers := public.discussion_push_webhook_headers(),
    body := payload
  ) into request_id;

  return NEW;
end;
$$;

drop trigger if exists notify_new_comment_webhook on public.teaching_case_comments;
create trigger notify_new_comment_webhook
after insert on public.teaching_case_comments
for each row execute function public.notify_new_comment_webhook_fn();

drop trigger if exists notify_new_case_question_webhook on public.cases;
create trigger notify_new_case_question_webhook
after insert on public.cases
for each row execute function public.notify_new_case_question_webhook_fn();
