-- Contact phones on profiles: shown on listings so buyers can call.
-- phone_primary is required to create a listing or open a shop.
-- Phone-signup users are backfilled from auth.users.phone.

alter table public.profiles
  add column if not exists phone_primary text;

alter table public.profiles
  add column if not exists phone_secondary text;

comment on column public.profiles.phone_primary is
  'Primary contact number in E.164. Required to post a listing or open a shop.';
comment on column public.profiles.phone_secondary is
  'Optional second contact number in E.164.';

create or replace function public.require_phone_for_listing()
returns trigger
language plpgsql
as $$
declare
  number text;
begin
  select phone_primary into number
  from public.profiles
  where id = new.owner_id;

  if number is null or btrim(number) = '' then
    raise exception 'A phone number is required to post a listing.';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_require_phone on public.listings;
create trigger listings_require_phone
  before insert on public.listings
  for each row execute procedure public.require_phone_for_listing();

create or replace function public.require_phone_for_shop()
returns trigger
language plpgsql
as $$
declare
  number text;
begin
  select phone_primary into number
  from public.profiles
  where id = new.owner_id;

  if number is null or btrim(number) = '' then
    raise exception 'A phone number is required to open a shop.';
  end if;
  return new;
end;
$$;

drop trigger if exists shops_require_phone on public.shops;
create trigger shops_require_phone
  before insert on public.shops
  for each row execute procedure public.require_phone_for_shop();
