-- Contact CMS: public page copy, channels, topics, and inquiries.

create table if not exists public.contact_page_settings (
  id int primary key default 1 check (id = 1),
  headline text not null default 'We are here to help.',
  intro text not null default 'Whether you have a question about an account, a listing, safety, press, or anything else — send a note and we will get back to you.',
  response_note text not null default 'We typically reply within one business day.',
  office_label text not null default 'Kampala, Uganda',
  office_address text not null default 'By appointment',
  hours text not null default 'Monday–Friday, 9:00–17:00 EAT',
  accept_inquiries boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.contact_page_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.contact_channels (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  value text not null default '',
  href text not null default '',
  icon text not null default 'mail',
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_topics (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  description text not null default '',
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.contact_topics (id) on delete set null,
  name text not null,
  email text not null,
  phone text not null default '',
  subject text not null default '',
  message text not null,
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'replied', 'closed')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_channels_sort_idx
  on public.contact_channels (published desc, sort_order, created_at);

create index if not exists contact_topics_sort_idx
  on public.contact_topics (published desc, sort_order, created_at);

create index if not exists contact_inquiries_created_idx
  on public.contact_inquiries (created_at desc);

create index if not exists contact_inquiries_status_idx
  on public.contact_inquiries (status, created_at desc);

create index if not exists contact_inquiries_topic_idx
  on public.contact_inquiries (topic_id, created_at desc);

drop trigger if exists contact_page_settings_updated_at on public.contact_page_settings;
create trigger contact_page_settings_updated_at before update on public.contact_page_settings
for each row execute procedure public.set_updated_at();

drop trigger if exists contact_channels_updated_at on public.contact_channels;
create trigger contact_channels_updated_at before update on public.contact_channels
for each row execute procedure public.set_updated_at();

drop trigger if exists contact_topics_updated_at on public.contact_topics;
create trigger contact_topics_updated_at before update on public.contact_topics
for each row execute procedure public.set_updated_at();

drop trigger if exists contact_inquiries_updated_at on public.contact_inquiries;
create trigger contact_inquiries_updated_at before update on public.contact_inquiries
for each row execute procedure public.set_updated_at();

alter table public.contact_page_settings enable row level security;
alter table public.contact_channels enable row level security;
alter table public.contact_topics enable row level security;
alter table public.contact_inquiries enable row level security;

drop policy if exists contact_page_settings_select on public.contact_page_settings;
create policy contact_page_settings_select on public.contact_page_settings
  for select using (true);

drop policy if exists contact_page_settings_update on public.contact_page_settings;
create policy contact_page_settings_update on public.contact_page_settings
  for update using (public.is_admin());

drop policy if exists contact_channels_select on public.contact_channels;
create policy contact_channels_select on public.contact_channels
  for select using (published = true or public.is_admin());

drop policy if exists contact_channels_insert on public.contact_channels;
create policy contact_channels_insert on public.contact_channels
  for insert with check (public.is_admin());

drop policy if exists contact_channels_update on public.contact_channels;
create policy contact_channels_update on public.contact_channels
  for update using (public.is_admin());

drop policy if exists contact_channels_delete on public.contact_channels;
create policy contact_channels_delete on public.contact_channels
  for delete using (public.is_admin());

drop policy if exists contact_topics_select on public.contact_topics;
create policy contact_topics_select on public.contact_topics
  for select using (published = true or public.is_admin());

drop policy if exists contact_topics_insert on public.contact_topics;
create policy contact_topics_insert on public.contact_topics
  for insert with check (public.is_admin());

drop policy if exists contact_topics_update on public.contact_topics;
create policy contact_topics_update on public.contact_topics
  for update using (public.is_admin());

drop policy if exists contact_topics_delete on public.contact_topics;
create policy contact_topics_delete on public.contact_topics
  for delete using (public.is_admin());

drop policy if exists contact_inquiries_select on public.contact_inquiries;
create policy contact_inquiries_select on public.contact_inquiries
  for select using (public.is_admin());

drop policy if exists contact_inquiries_insert on public.contact_inquiries;
create policy contact_inquiries_insert on public.contact_inquiries
  for insert with check (true);

drop policy if exists contact_inquiries_update on public.contact_inquiries;
create policy contact_inquiries_update on public.contact_inquiries
  for update using (public.is_admin());

grant select on public.contact_page_settings to anon, authenticated;
grant update on public.contact_page_settings to authenticated;

grant select on public.contact_channels to anon, authenticated;
grant insert, update, delete on public.contact_channels to authenticated;

grant select on public.contact_topics to anon, authenticated;
grant insert, update, delete on public.contact_topics to authenticated;

grant insert on public.contact_inquiries to anon, authenticated;
grant select, update on public.contact_inquiries to authenticated;

insert into public.contact_channels (title, description, value, href, icon, sort_order, published)
select * from (
  values
    ('Email', 'General inquiries and support', 'hello@unimart.app', 'mailto:hello@unimart.app', 'mail', 10, true),
    ('In-app messaging', 'Chat with us from your Messages tab', 'Open messages', '/messages', 'message', 20, true),
    ('Office', 'Kampala, Uganda', 'By appointment', '', 'map', 30, true),
    ('Legal', 'Terms, privacy, and rights requests', 'legal@unimart.app', 'mailto:legal@unimart.app', 'shield', 40, true),
    ('Press', 'Media, interviews, and brand assets', 'press@unimart.app', 'mailto:press@unimart.app', 'newspaper', 50, true)
) as seed(title, description, value, href, icon, sort_order, published)
where not exists (select 1 from public.contact_channels);

insert into public.contact_topics (label, description, sort_order, published)
select * from (
  values
    ('Account & access', 'Sign-in, profile, or verification help', 10, true),
    ('Listings & shops', 'Posts, shops, and marketplace activity', 20, true),
    ('Safety & reports', 'Suspicious listings, scams, or harassment', 30, true),
    ('Payments', 'Checkout, receipts, or billing questions', 40, true),
    ('Press & partnerships', 'Media, campus, and collaboration requests', 50, true),
    ('Legal', 'Privacy, terms, and copyright', 60, true),
    ('Other', 'Anything else we can help with', 70, true)
) as seed(label, description, sort_order, published)
where not exists (select 1 from public.contact_topics);
