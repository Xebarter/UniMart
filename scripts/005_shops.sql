-- Opt-in storefronts. One shop per profile. Listings stay on listings.owner_id.

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 2 and 60),
  bio text,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shops_slug_idx on public.shops (slug);
create index if not exists shops_owner_id_idx on public.shops (owner_id);

alter table public.shops enable row level security;

drop policy if exists shops_select on public.shops;
create policy shops_select on public.shops for select using (true);

drop policy if exists shops_insert on public.shops;
create policy shops_insert on public.shops for insert with check (owner_id = auth.uid());

drop policy if exists shops_update on public.shops;
create policy shops_update on public.shops for update using (owner_id = auth.uid() or public.is_admin());

grant select on public.shops to anon, authenticated;
grant insert, update on public.shops to authenticated;
