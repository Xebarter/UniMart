-- Student numbers: required to post Products, Services, Rentals, or open a shop.
-- Gigs stay open. Column is nullable so existing accounts and gig-only posters are unaffected.

alter table public.profiles
  add column if not exists student_number text;

comment on column public.profiles.student_number is
  'University student number. Unique. Required to post Products, Services, Rentals, or open a shop.';

create unique index if not exists profiles_student_number_unique
  on public.profiles (lower(btrim(student_number)))
  where student_number is not null and btrim(student_number) <> '';

create or replace function public.require_student_number_for_listing()
returns trigger
language plpgsql
as $$
declare
  number text;
begin
  if new.category not in ('Products', 'Services', 'Rentals') then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.category is not distinct from new.category then
    return new;
  end if;

  select student_number into number
  from public.profiles
  where id = new.owner_id;

  if number is null or btrim(number) = '' then
    raise exception 'A student number is required to post products, services, or rentals.';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_require_student_number on public.listings;
create trigger listings_require_student_number
  before insert or update of category on public.listings
  for each row execute procedure public.require_student_number_for_listing();

create or replace function public.require_student_number_for_shop()
returns trigger
language plpgsql
as $$
declare
  number text;
begin
  select student_number into number
  from public.profiles
  where id = new.owner_id;

  if number is null or btrim(number) = '' then
    raise exception 'A student number is required to open a shop.';
  end if;
  return new;
end;
$$;

drop trigger if exists shops_require_student_number on public.shops;
create trigger shops_require_student_number
  before insert on public.shops
  for each row execute procedure public.require_student_number_for_shop();
