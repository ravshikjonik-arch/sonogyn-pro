-- Push: new message in doctor live chat → subscribers of the channel (Expo).

create or replace function public.notify_new_chat_message_webhook_fn()
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
    url := public.discussion_push_function_url('notify-new-chat-message'),
    headers := public.discussion_push_webhook_headers(),
    body := payload
  ) into request_id;

  return NEW;
end;
$$;

drop trigger if exists notify_new_chat_message_webhook on public.doctor_chat_messages;
create trigger notify_new_chat_message_webhook
after insert on public.doctor_chat_messages
for each row execute function public.notify_new_chat_message_webhook_fn();

comment on function public.notify_new_chat_message_webhook_fn() is
  'pg_net webhook → Edge Function notify-new-chat-message for channel subscribers.';
