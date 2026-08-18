-- Magazine article cover photos set by editors.

alter table public.articles
  add column if not exists cover_url text;
