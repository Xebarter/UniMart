-- Copy Google / auth photos onto profiles that still have no avatar.
-- Uploaded avatars in the avatars bucket are left alone.

update public.profiles as p
set avatar_url = coalesce(
  nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
  nullif(u.raw_user_meta_data ->> 'picture', '')
)
from auth.users as u
where u.id = p.id
  and (p.avatar_url is null or btrim(p.avatar_url) = '')
  and coalesce(
    nullif(u.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(u.raw_user_meta_data ->> 'picture', '')
  ) is not null;

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
        avatar_url = case
          when public.profiles.avatar_url like '%/storage/v1/object/public/avatars/%'
            then public.profiles.avatar_url
          else coalesce(excluded.avatar_url, public.profiles.avatar_url)
        end;
  return new;
end;
$$;
