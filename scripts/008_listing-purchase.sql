-- Support buyer checkout: mark listings sold when purchase payment completes.

create or replace function public.fulfill_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pay public.payments%rowtype;
  listing_row public.listings%rowtype;
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
    return;
  end if;

  if pay.purpose = 'listing_purchase' and pay.listing_id is not null then
    select * into listing_row from public.listings where id = pay.listing_id;
    if not found or listing_row.status <> 'active' then
      return;
    end if;

    update public.listings
    set status = 'sold'
    where id = pay.listing_id and status = 'active';

    insert into public.notifications (user_id, type, title, body, listing_id)
    values (
      listing_row.owner_id,
      'sale',
      'Your listing was purchased',
      left(listing_row.title, 140),
      pay.listing_id
    );
  end if;
end;
$$;
