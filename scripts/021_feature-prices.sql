-- Per-category featured listing prices, editable from /admin/payments.
-- Checkout charges this UGX amount via Paytota (mobile money) or DPO (card).

create table if not exists public.feature_prices (
  category text primary key check (category in ('Products', 'Services', 'Rentals', 'Gigs')),
  amount_ugx int not null check (amount_ugx > 0),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.feature_prices (category, amount_ugx)
values
  ('Products', 15000),
  ('Services', 15000),
  ('Rentals', 15000),
  ('Gigs', 15000)
on conflict (category) do nothing;

drop trigger if exists feature_prices_updated_at on public.feature_prices;
create trigger feature_prices_updated_at before update on public.feature_prices
for each row execute procedure public.set_updated_at();

alter table public.feature_prices enable row level security;

drop policy if exists feature_prices_select on public.feature_prices;
create policy feature_prices_select on public.feature_prices
  for select using (true);

drop policy if exists feature_prices_insert on public.feature_prices;
create policy feature_prices_insert on public.feature_prices
  for insert with check (public.is_admin());

drop policy if exists feature_prices_update on public.feature_prices;
create policy feature_prices_update on public.feature_prices
  for update using (public.is_admin());

grant select on public.feature_prices to anon, authenticated;
grant insert, update on public.feature_prices to authenticated;
