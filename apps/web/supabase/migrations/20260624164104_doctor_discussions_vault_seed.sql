-- One-time legacy path: copy hardcoded webhook secret into Vault (prod already migrated).
-- Fresh installs: create secrets manually BEFORE 20260624161753 (see functions/README.md).

do $$
declare
  v_secret text;
begin
  if exists (select 1 from vault.secrets where name = 'discussions_webhook_secret') then
    return;
  end if;

  begin
    v_secret := (select public.discussion_push_webhook_headers() ->> 'x-webhook-secret');
  exception
    when others then
      v_secret := null;
  end;

  if coalesce(v_secret, '') <> '' then
    perform vault.create_secret(
      v_secret,
      'discussions_webhook_secret',
      'Doctor discussions webhook header secret'
    );
  end if;
end $$;
