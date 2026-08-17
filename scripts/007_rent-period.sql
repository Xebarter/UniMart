-- Rentals store how the price is billed: per day, week, or month.

alter table public.listings
  add column if not exists rent_period text;

alter table public.listings
  drop constraint if exists listings_rent_period_check;

alter table public.listings
  add constraint listings_rent_period_check
  check (rent_period is null or rent_period in ('day', 'week', 'month'));

update public.listings
set rent_period = 'month'
where category = 'Rentals' and rent_period is null;
