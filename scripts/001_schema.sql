-- UniMart complete schema, RLS, RPCs, storage, and seed.
-- Run once in the Supabase SQL editor for project nuawiekbevbtwghcyttb.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  university text,
  campus text,
  bio text,
  avatar_url text,
  role text not null default 'student' check (role in ('student', 'moderator', 'admin')),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null check (category in ('Products', 'Services', 'Rentals', 'Gigs')),
  price numeric(14, 2) not null check (price >= 0),
  currency text not null default 'UGX',
  location text not null default '',
  condition text not null default 'good',
  status text not null default 'active' check (status in ('draft', 'pending', 'active', 'sold', 'archived', 'removed')),
  featured_until timestamptz,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  body text not null default '',
  type text not null default 'Community',
  cover_color text not null default '#e4dbee',
  accent_color text not null default '#745a8e',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  reported_user_id uuid references public.profiles (id) on delete set null,
  reason text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  event_name text not null,
  listing_id uuid references public.listings (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  listing_id uuid references public.listings (id) on delete set null,
  conversation_id uuid references public.conversations (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique,
  platform text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  provider text not null check (provider in ('paytota', 'dpo')),
  purpose text not null default 'listing_feature',
  amount integer not null check (amount > 0),
  currency text not null default 'UGX',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled', 'expired')),
  provider_payment_id text,
  provider_reference text,
  checkout_url text,
  raw jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists listings_status_created_idx on public.listings (status, created_at desc);
create index if not exists listings_category_idx on public.listings (category);
create index if not exists listings_owner_idx on public.listings (owner_id);
create index if not exists listings_featured_idx on public.listings (featured_until desc);
create index if not exists listing_media_listing_idx on public.listing_media (listing_id);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists analytics_created_idx on public.analytics_events (created_at desc);
create index if not exists payments_provider_id_idx on public.payments (provider, provider_payment_id);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and current_setting('unimart.allow_role_change', true) is distinct from 'on' then
    raise exception 'Role can only be changed by an admin';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
before update on public.profiles
for each row execute procedure public.protect_profile_role();

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at before update on public.listings
for each row execute procedure public.set_updated_at();

drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at before update on public.articles
for each row execute procedure public.set_updated_at();

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
for each row execute procedure public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members
    where conversation_id = p_conversation_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  updated public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_user_id is null then
    raise exception 'A user is required';
  end if;
  if p_role not in ('student', 'moderator', 'admin') then
    raise exception 'Invalid role';
  end if;

  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role is distinct from 'admin' then
    raise exception 'Only admins can change roles';
  end if;
  if p_user_id = auth.uid() and p_role is distinct from 'admin' then
    raise exception 'You cannot remove your own admin access';
  end if;

  perform set_config('unimart.allow_role_change', 'on', true);

  update public.profiles
  set role = p_role
  where id = p_user_id
  returning * into updated;

  if updated.id is null then
    raise exception 'User not found';
  end if;

  return updated;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, 'student'), '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.profiles (id, display_name, avatar_url)
select
  id,
  coalesce(
    nullif(raw_user_meta_data ->> 'display_name', ''),
    nullif(raw_user_meta_data ->> 'full_name', ''),
    nullif(raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(email, 'student'), '@', 1)
  ),
  coalesce(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
from auth.users
on conflict (id) do nothing;

create or replace function public.get_or_create_conversation(p_recipient uuid, p_listing uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  cid uuid;
begin
  if uid is null then
    raise exception 'Authentication required';
  end if;
  if p_recipient is null or p_recipient = uid then
    raise exception 'A valid recipient is required';
  end if;

  select c.id into cid
  from public.conversations c
  join public.conversation_members a on a.conversation_id = c.id and a.user_id = uid
  join public.conversation_members b on b.conversation_id = c.id and b.user_id = p_recipient
  where c.listing_id is not distinct from p_listing
    and (select count(*) from public.conversation_members m where m.conversation_id = c.id) = 2
  order by c.updated_at desc
  limit 1;

  if cid is not null then
    return cid;
  end if;

  insert into public.conversations (listing_id) values (p_listing) returning id into cid;
  insert into public.conversation_members (conversation_id, user_id)
  values (cid, uid), (cid, p_recipient);
  return cid;
end;
$$;

create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
  sender_name text;
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;

  select display_name into sender_name from public.profiles where id = new.sender_id;

  for recipient in
    select user_id from public.conversation_members
    where conversation_id = new.conversation_id and user_id <> new.sender_id
  loop
    insert into public.notifications (user_id, type, title, body, conversation_id)
    values (
      recipient,
      'message',
      coalesce(sender_name, 'New message'),
      left(new.body, 140),
      new.conversation_id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
after insert on public.messages
for each row execute procedure public.touch_conversation();

create or replace function public.fulfill_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pay public.payments%rowtype;
begin
  select * into pay from public.payments where id = p_payment_id;
  if not found or pay.status = 'paid' then
    return;
  end if;

  update public.payments
  set status = 'paid', paid_at = coalesce(paid_at, now())
  where id = p_payment_id;

  if pay.purpose = 'listing_feature' and pay.listing_id is not null then
    update public.listings
    set featured_until = greatest(coalesce(featured_until, now()), now()) + interval '7 days'
    where id = pay.listing_id;
  end if;
end;
$$;

create or replace function public.expire_featured_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.listings
  set featured_until = null
  where featured_until is not null and featured_until < now();
  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.increment_listing_views(p_listing_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings set view_count = view_count + 1 where id = p_listing_id;
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_conversation_member(uuid) to anon, authenticated;
grant execute on function public.get_or_create_conversation(uuid, uuid) to authenticated;
grant execute on function public.increment_listing_views(uuid) to anon, authenticated;
grant execute on function public.set_user_role(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_media enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.articles enable row level security;
alter table public.reports enable row level security;
alter table public.analytics_events enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;
alter table public.push_tokens enable row level security;
alter table public.payments enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (true);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid() or public.is_admin());

drop policy if exists listings_select on public.listings;
create policy listings_select on public.listings for select using (
  status = 'active' or owner_id = auth.uid() or public.is_admin()
);

drop policy if exists listings_insert on public.listings;
create policy listings_insert on public.listings for insert with check (owner_id = auth.uid());

drop policy if exists listings_update on public.listings;
create policy listings_update on public.listings for update using (owner_id = auth.uid() or public.is_admin());

drop policy if exists listings_delete on public.listings;
create policy listings_delete on public.listings for delete using (owner_id = auth.uid() or public.is_admin());

drop policy if exists listing_media_select on public.listing_media;
create policy listing_media_select on public.listing_media for select using (
  exists (
    select 1 from public.listings l
    where l.id = listing_id and (l.status = 'active' or l.owner_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists listing_media_insert on public.listing_media;
create policy listing_media_insert on public.listing_media for insert with check (
  owner_id = auth.uid()
  and exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid())
);

drop policy if exists listing_media_delete on public.listing_media;
create policy listing_media_delete on public.listing_media for delete using (owner_id = auth.uid() or public.is_admin());

drop policy if exists favorites_all on public.favorites;
create policy favorites_all on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations for select using (
  public.is_conversation_member(id)
  or public.is_admin()
);

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations for insert with check (auth.uid() is not null);

drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations for update using (
  public.is_conversation_member(id)
);

drop policy if exists conversation_members_select on public.conversation_members;
create policy conversation_members_select on public.conversation_members for select using (
  user_id = auth.uid()
  or public.is_conversation_member(conversation_id)
  or public.is_admin()
);

drop policy if exists conversation_members_insert on public.conversation_members;
create policy conversation_members_insert on public.conversation_members for insert with check (auth.uid() is not null);

drop policy if exists conversation_members_update on public.conversation_members;
create policy conversation_members_update on public.conversation_members for update using (user_id = auth.uid());

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select using (
  public.is_conversation_member(conversation_id)
  or public.is_admin()
);

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert with check (
  sender_id = auth.uid()
  and public.is_conversation_member(conversation_id)
);

drop policy if exists articles_select on public.articles;
create policy articles_select on public.articles for select using (
  status = 'published' or author_id = auth.uid() or public.is_admin()
);

drop policy if exists articles_insert on public.articles;
create policy articles_insert on public.articles for insert with check (author_id = auth.uid());

drop policy if exists articles_update on public.articles;
create policy articles_update on public.articles for update using (author_id = auth.uid() or public.is_admin());

drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports for select using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert with check (reporter_id = auth.uid());

drop policy if exists reports_update on public.reports;
create policy reports_update on public.reports for update using (public.is_admin());

drop policy if exists analytics_insert on public.analytics_events;
create policy analytics_insert on public.analytics_events for insert with check (user_id is null or user_id = auth.uid());

drop policy if exists analytics_select on public.analytics_events;
create policy analytics_select on public.analytics_events for select using (public.is_admin());

drop policy if exists follows_select on public.follows;
create policy follows_select on public.follows for select using (true);

drop policy if exists follows_write on public.follows;
create policy follows_write on public.follows for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update using (user_id = auth.uid());

drop policy if exists push_tokens_all on public.push_tokens;
create policy push_tokens_all on public.push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments for insert with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('listing-media', 'listing-media', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists listing_media_public_read on storage.objects;
create policy listing_media_public_read on storage.objects
for select using (bucket_id in ('listing-media', 'avatars'));

drop policy if exists listing_media_owner_write on storage.objects;
create policy listing_media_owner_write on storage.objects
for insert with check (
  bucket_id in ('listing-media', 'avatars')
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists listing_media_owner_delete on storage.objects;
create policy listing_media_owner_delete on storage.objects
for delete using (
  bucket_id in ('listing-media', 'avatars')
  and (auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

do $$
begin
  execute 'alter publication supabase_realtime add table public.messages';
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.notifications';
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Seed magazine content
-- ---------------------------------------------------------------------------

insert into public.articles (title, slug, excerpt, body, type, cover_color, accent_color, status, published_at)
values
  (
    'The student guide to living well in Kampala',
    'student-guide-living-well-kampala',
    'A thoughtful field note from the community, made for the people building their next chapter.',
    'Campus life in Kampala rewards people who know where to look. This guide covers housing, food, transport, and the quiet corners that make student life work.',
    'Campus life',
    '#dce8dc',
    '#4e7259',
    'published',
    now()
  ),
  (
    'How to build a side hustle before graduation',
    'side-hustle-before-graduation',
    'Turn a skill you already have into income the campus can find.',
    'Start with one offer, one price, and one campus. UniMart is built so your first customers can be the people already around you.',
    'Money & work',
    '#f0dfc8',
    '#a76d38',
    'published',
    now()
  ),
  (
    'Meet the makers shaping our campus culture',
    'makers-shaping-campus-culture',
    'Profiles from the people making student life more interesting.',
    'Designers, tutors, photographers, and hosts are already trading on campus. This is how they started, and how you can too.',
    'Community',
    '#e4dbee',
    '#745a8e',
    'published',
    now()
  )
on conflict (slug) do nothing;

-- Promote the first admin after you sign up (run both lines together):
-- select set_config('unimart.allow_role_change', 'on', true);
-- update public.profiles set role = 'admin' where id = '<your-user-uuid>';
-- After the first admin exists, promote others from the admin dashboard Users tab.
