-- Listings are marketplace-first. shop_id is set only when the owner adds the listing to their shop.

alter table public.listings
  add column if not exists shop_id uuid references public.shops (id) on delete set null;

create index if not exists listings_shop_id_idx on public.listings (shop_id);

create or replace function public.listings_shop_owner_match()
returns trigger
language plpgsql
as $$
begin
  if new.shop_id is null then
    return new;
  end if;
  if not exists (
    select 1 from public.shops
    where id = new.shop_id and owner_id = new.owner_id
  ) then
    raise exception 'A listing can only join a shop you own.';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_shop_owner_match on public.listings;
create trigger listings_shop_owner_match
  before insert or update of shop_id, owner_id on public.listings
  for each row execute procedure public.listings_shop_owner_match();
