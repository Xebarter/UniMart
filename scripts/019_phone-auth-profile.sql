-- Copy the phone used at sign-in onto profiles.phone_primary so it shows on
-- /profile, listings, shops, and settings. Existing empty profiles are backfilled.

alter table public.profiles
  add column if not exists phone_primary text;

alter table public.profiles
  add column if not exists phone_secondary text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, phone_primary)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, 'student'), '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    nullif(btrim(coalesce(new.phone, new.raw_user_meta_data ->> 'phone', '')), '')
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url = case
          when public.profiles.avatar_url like '%/storage/v1/object/public/avatars/%'
            then public.profiles.avatar_url
          else coalesce(excluded.avatar_url, public.profiles.avatar_url)
        end,
        phone_primary = coalesce(
          nullif(btrim(coalesce(public.profiles.phone_primary, '')), ''),
          excluded.phone_primary
        );
  return new;
end;
$$;

update public.profiles as p
set phone_primary = u.phone,
    updated_at = timezone('utc', now())
from auth.users as u
where u.id = p.id
  and (p.phone_primary is null or btrim(p.phone_primary) = '')
  and u.phone is not null
  and btrim(u.phone) <> '';

update public.profiles as p
set phone_primary = u.raw_user_meta_data ->> 'phone',
    updated_at = timezone('utc', now())
from auth.users as u
where u.id = p.id
  and (p.phone_primary is null or btrim(p.phone_primary) = '')
  and coalesce(u.raw_user_meta_data ->> 'phone', '') ~ '^\+[1-9][0-9]{7,14}$';
