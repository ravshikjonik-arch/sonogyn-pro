-- Storage for teaching case ultrasound images/videos (anonymized, no PHI in production policy).

insert into storage.buckets (id, name, public)
values ('teaching-case-media', 'teaching-case-media', false)
on conflict (id) do nothing;

drop policy if exists teaching_case_media_select on storage.objects;
create policy teaching_case_media_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'teaching-case-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.cases c
        where c.id::text = (storage.foldername(name))[2]
          and c.status = 'published'
          and c.is_public = true
      )
    )
  );

drop policy if exists teaching_case_media_insert on storage.objects;
create policy teaching_case_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'teaching-case-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.cases c
      where c.id::text = (storage.foldername(name))[2]
        and c.user_id = auth.uid()
    )
  );

drop policy if exists teaching_case_media_delete on storage.objects;
create policy teaching_case_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'teaching-case-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

comment on table public.case_media is 'Media attachments for teaching cases — paths in bucket teaching-case-media.';
