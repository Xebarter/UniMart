-- Newsletter: footer and settings email subscriptions.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'subscribed'
    check (status in ('pending', 'subscribed', 'unsubscribed')),
  source text not null default 'footer',
  user_id uuid references public.profiles (id) on delete set null,
  confirm_token text unique,
  unsubscribe_token text not null unique,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_unique unique (email)
);

create index if not exists newsletter_subscribers_created_idx
  on public.newsletter_subscribers (created_at desc);

create index if not exists newsletter_subscribers_status_idx
  on public.newsletter_subscribers (status, created_at desc);

create index if not exists newsletter_subscribers_user_idx
  on public.newsletter_subscribers (user_id)
  where user_id is not null;

create index if not exists newsletter_subscribers_source_idx
  on public.newsletter_subscribers (source, created_at desc);

drop trigger if exists newsletter_subscribers_updated_at on public.newsletter_subscribers;
create trigger newsletter_subscribers_updated_at before update on public.newsletter_subscribers
for each row execute procedure public.set_updated_at();

alter table public.newsletter_subscribers enable row level security;

drop policy if exists newsletter_subscribers_select on public.newsletter_subscribers;
create policy newsletter_subscribers_select on public.newsletter_subscribers
  for select using (public.is_admin());

drop policy if exists newsletter_subscribers_insert on public.newsletter_subscribers;
create policy newsletter_subscribers_insert on public.newsletter_subscribers
  for insert with check (public.is_admin());

drop policy if exists newsletter_subscribers_update on public.newsletter_subscribers;
create policy newsletter_subscribers_update on public.newsletter_subscribers
  for update using (public.is_admin());

drop policy if exists newsletter_subscribers_delete on public.newsletter_subscribers;
create policy newsletter_subscribers_delete on public.newsletter_subscribers
  for delete using (public.is_admin());

grant select, insert, update, delete on public.newsletter_subscribers to authenticated;
