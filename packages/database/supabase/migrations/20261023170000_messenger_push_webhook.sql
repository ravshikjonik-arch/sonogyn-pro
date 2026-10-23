-- Messenger v2 INSERT → same Edge Function as v1 chat push (Expo + Web Push).

create or replace function public.notify_messenger_message_webhook_fn()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  request_id bigint;
  payload jsonb;
begin
  if NEW.deleted_at is not null then
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
    url := public.discussion_push_function_url('notify-new-chat-message'),
    headers := public.discussion_push_webhook_headers(),
    body := payload
  ) into request_id;

  return NEW;
end;
$$;

drop trigger if exists notify_messenger_message_webhook on public.messenger_messages;
create trigger notify_messenger_message_webhook
after insert on public.messenger_messages
for each row execute function public.notify_messenger_message_webhook_fn();

comment on function public.notify_messenger_message_webhook_fn() is
  'pg_net webhook → notify-new-chat-message (channel_subscriptions + Expo/Web Push).';
