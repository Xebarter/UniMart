-- Incremental: let admins promote users from the dashboard.
-- Safe to run after 001_schema.sql.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and current_setting('unimart.allow_role_change', true) is distinct from 'on' then
    raise exception 'Role can only be changed by an admin';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
before update on public.profiles
for each row execute procedure public.protect_profile_role();

create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
  updated public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_user_id is null then
    raise exception 'A user is required';
  end if;
  if p_role not in ('student', 'moderator', 'admin') then
    raise exception 'Invalid role';
  end if;

  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role is distinct from 'admin' then
    raise exception 'Only admins can change roles';
  end if;
  if p_user_id = auth.uid() and p_role is distinct from 'admin' then
    raise exception 'You cannot remove your own admin access';
  end if;

  perform set_config('unimart.allow_role_change', 'on', true);

  update public.profiles
  set role = p_role
  where id = p_user_id
  returning * into updated;

  if updated.id is null then
    raise exception 'User not found';
  end if;

  return updated;
end;
$$;

grant execute on function public.set_user_role(uuid, text) to authenticated;
