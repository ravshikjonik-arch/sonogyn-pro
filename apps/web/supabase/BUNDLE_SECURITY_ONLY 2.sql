-- SonoGyn Pro · все миграции (порядок по имени файла)
-- Supabase Dashboard → SQL Editor → вставить и Run
-- Сгенерировано: 2026-06-09T06:27:45.602Z

-- ========== 20260608120000_security_hardening.sql ==========
-- Security hardening (safe: skips sections if tables not created yet).
-- Run anytime. After clinical_copilot migration, re-run to apply series/images policies.

-- ========== profiles (only if table exists) ==========
do $security$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop policy if exists profiles_select_roster on public.profiles';

    execute $fn$
      create or replace function public.get_doctor_display_names(p_user_ids uuid[])
      returns table (id uuid, full_name text)
      language sql
      security definer
      set search_path = public
      stable
      as $body$
        select p.id, coalesce(nullif(trim(p.full_name), ''), 'Врач') as full_name
        from public.profiles p
        where p.id = any (p_user_ids)
          and auth.uid() is not null;
      $body$;
    $fn$;

    execute 'revoke all on function public.get_doctor_display_names(uuid[]) from public';
    execute 'grant execute on function public.get_doctor_display_names(uuid[]) to authenticated';
  end if;
end
$security$;

-- ========== copilot series/images (only if tables exist) ==========
do $security$
begin
  if to_regclass('public.ultrasound_series') is not null then
    execute 'drop policy if exists series_select_own on public.ultrasound_series';
    execute 'drop policy if exists series_insert_own on public.ultrasound_series';
    execute 'drop policy if exists series_update_own on public.ultrasound_series';
    execute 'drop policy if exists series_delete_own on public.ultrasound_series';
    execute 'drop policy if exists series_select_own_study on public.ultrasound_series';
    execute 'drop policy if exists series_insert_own_study on public.ultrasound_series';
    execute 'drop policy if exists series_update_own_study on public.ultrasound_series';
    execute 'drop policy if exists series_delete_own_study on public.ultrasound_series';

    execute $pol$
      create policy series_select_own_study on public.ultrasound_series
        for select to authenticated
        using (
          exists (
            select 1 from public.studies s
            where s.id = ultrasound_series.study_id and s.created_by = auth.uid()
          )
        )
    $pol$;

    execute $pol$
      create policy series_insert_own_study on public.ultrasound_series
        for insert to authenticated
        with check (
          created_by = auth.uid()
          and exists (
            select 1 from public.studies s
            where s.id = study_id and s.created_by = auth.uid()
          )
        )
    $pol$;

    execute $pol$
      create policy series_update_own_study on public.ultrasound_series
        for update to authenticated
        using (
          exists (
            select 1 from public.studies s
            where s.id = ultrasound_series.study_id and s.created_by = auth.uid()
          )
        )
    $pol$;

    execute $pol$
      create policy series_delete_own_study on public.ultrasound_series
        for delete to authenticated
        using (
          exists (
            select 1 from public.studies s
            where s.id = ultrasound_series.study_id and s.created_by = auth.uid()
          )
        )
    $pol$;
  end if;

  if to_regclass('public.ultrasound_images') is not null then
    execute 'drop policy if exists images_select_own on public.ultrasound_images';
    execute 'drop policy if exists images_insert_own on public.ultrasound_images';
    execute 'drop policy if exists images_update_own on public.ultrasound_images';
    execute 'drop policy if exists images_delete_own on public.ultrasound_images';
    execute 'drop policy if exists images_select_own_study on public.ultrasound_images';
    execute 'drop policy if exists images_insert_own_study on public.ultrasound_images';
    execute 'drop policy if exists images_update_own_study on public.ultrasound_images';
    execute 'drop policy if exists images_delete_own_study on public.ultrasound_images';

    execute $pol$
      create policy images_select_own_study on public.ultrasound_images
        for select to authenticated
        using (
          exists (
            select 1
            from public.ultrasound_series ser
            join public.studies s on s.id = ser.study_id
            where ser.id = ultrasound_images.series_id and s.created_by = auth.uid()
          )
        )
    $pol$;

    execute $pol$
      create policy images_insert_own_study on public.ultrasound_images
        for insert to authenticated
        with check (
          created_by = auth.uid()
          and exists (
            select 1
            from public.ultrasound_series ser
            join public.studies s on s.id = ser.study_id
            where ser.id = series_id and s.created_by = auth.uid()
          )
        )
    $pol$;

    execute $pol$
      create policy images_update_own_study on public.ultrasound_images
        for update to authenticated
        using (
          exists (
            select 1
            from public.ultrasound_series ser
            join public.studies s on s.id = ser.study_id
            where ser.id = ultrasound_images.series_id and s.created_by = auth.uid()
          )
        )
    $pol$;

    execute $pol$
      create policy images_delete_own_study on public.ultrasound_images
        for delete to authenticated
        using (
          exists (
            select 1
            from public.ultrasound_series ser
            join public.studies s on s.id = ser.study_id
            where ser.id = ultrasound_images.series_id and s.created_by = auth.uid()
          )
        )
    $pol$;
  end if;
end
$security$;

-- ========== doctor chat media (only if chat table exists) ==========
do $security$
begin
  if to_regclass('public.doctor_chat_messages') is not null then
    execute 'drop policy if exists doctor_chat_media_select on storage.objects';
    execute $pol$
      create policy doctor_chat_media_select on storage.objects
        for select to authenticated
        using (
          bucket_id = 'doctor-chat-media'
          and (
            (storage.foldername(name))[1] = auth.uid()::text
            or exists (
              select 1 from public.doctor_chat_messages m
              where m.media_storage_path = name
            )
          )
        )
    $pol$;
  end if;
end
$security$;
