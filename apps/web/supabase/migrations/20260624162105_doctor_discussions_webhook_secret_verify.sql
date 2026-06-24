-- Doctor discussions: RPC for Edge Functions to verify webhook secret (Vault-backed).

create or replace function public.verify_discussion_webhook_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = public, vault, extensions
as $$
  select coalesce(p_secret, '') <> ''
    and p_secret = public.get_discussion_vault_secret('discussions_webhook_secret');
$$;

revoke all on function public.verify_discussion_webhook_secret(text) from public;
grant execute on function public.verify_discussion_webhook_secret(text) to service_role;
