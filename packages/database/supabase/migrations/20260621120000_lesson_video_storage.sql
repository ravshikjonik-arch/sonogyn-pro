-- Video upload fields for S3/Yandex Object Storage + HLS

alter table public.course_lessons
  add column if not exists video_file_key text,
  add column if not exists video_file_url text,
  add column if not exists hls_playlist_key text,
  add column if not exists video_processing_status text not null default 'none'
    check (video_processing_status in ('none', 'uploading', 'processing', 'ready', 'failed')),
  add column if not exists video_mime_type text,
  add column if not exists video_size_bytes bigint check (video_size_bytes is null or video_size_bytes >= 0),
  add column if not exists video_upload_error text;

create index if not exists idx_course_lessons_video_status
  on public.course_lessons (video_processing_status)
  where lesson_type = 'video';
