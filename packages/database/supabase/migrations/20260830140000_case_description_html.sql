-- Rich-text case description (TipTap HTML, sanitized on write).

alter table public.cases
  add column if not exists description_html text;

comment on column public.cases.description_html is
  'Optional sanitized HTML from clinical editor; plain description remains for search/fallback.';
