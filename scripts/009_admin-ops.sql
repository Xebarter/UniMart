-- Admin operations: account sanctions, shop status, and audit logs.
-- Additive. Run after 008_listing-purchase.sql.

-- ---------------------------------------------------------------------------
-- Profile account status
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists account_status text not null default 'active';

alter table public.profiles
  drop constraint if exists profiles_account_status_check;

alter table public.profiles
  add constraint profiles_account_status_check
  check (account_status in ('active', 'suspended', 'banned'));

create index if not exists profiles_account_status_idx on public.profiles (account_status);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_created_idx on public.profiles (created_at desc);

create or replace function public.protect_account_status()
returns trigger
language plpgsql
as $$
begin
  if new.account_status is distinct from old.account_status
     and current_setting('unimart.allow_status_change', true) is distinct from 'on' then
    raise exception 'Account status can only be changed by an admin';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_account_status on public.profiles;
create trigger profiles_protect_account_status
before update on public.profiles
for each row execute procedure public.protect_account_status();

create or replace function public.set_account_status(p_user_id uuid, p_status text)
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
  if p_status not in ('active', 'suspended', 'banned') then
    raise exception 'Invalid account status';
  end if;

  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role is distinct from 'admin' then
    raise exception 'Only admins can change account status';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own account status';
  end if;

  perform set_config('unimart.allow_status_change', 'on', true);

  update public.profiles
  set account_status = p_status
  where id = p_user_id
  returning * into updated;

  if updated.id is null then
    raise exception 'User not found';
  end if;

  return updated;
end;
$$;

grant execute on function public.set_account_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Shop status
-- ---------------------------------------------------------------------------

alter table public.shops
  add column if not exists status text not null default 'active';

alter table public.shops
  drop constraint if exists shops_status_check;

alter table public.shops
  add constraint shops_status_check
  check (status in ('active', 'disabled'));

create index if not exists shops_status_idx on public.shops (status);

create or replace function public.protect_shop_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status and not public.is_admin() then
    raise exception 'Only admins can change shop status';
  end if;
  return new;
end;
$$;

drop trigger if exists shops_protect_status on public.shops;
create trigger shops_protect_status
before update on public.shops
for each row execute procedure public.protect_shop_status();

-- ---------------------------------------------------------------------------
-- Audit logs
-- ---------------------------------------------------------------------------

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select using (public.is_admin());

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs for insert with check (
  public.is_admin()
  and (actor_id = auth.uid() or actor_id is null)
);

grant select, insert on public.audit_logs to authenticated;
