-- Posters can mark a listing unavailable to withdraw it from public view
-- without archiving or marking it sold. Public SELECT still requires status = 'active'.

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid
    where con.conrelid = 'public.listings'::regclass
      and con.contype = 'c'
      and att.attname = 'status'
      and att.attnum = any (con.conkey)
  loop
    execute format('alter table public.listings drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table public.listings
  add constraint listings_status_check
  check (status in ('draft', 'pending', 'active', 'unavailable', 'sold', 'archived', 'removed'));
