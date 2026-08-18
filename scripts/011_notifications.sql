-- Expand notifications for app-wide inboxes and push-ready preferences.

alter table public.notifications
  add column if not exists actor_id uuid references public.profiles (id) on delete set null,
  add column if not exists path text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notifications_type_check'
      and conrelid = 'public.notifications'::regclass
  ) then
    execute $sql$
      alter table public.notifications
      add constraint notifications_type_check
      check (type in ('message', 'sale', 'favorite', 'follow', 'report_update', 'account_notice'))
      not valid
    $sql$;
  end if;
end $$;

alter table public.notifications validate constraint notifications_type_check;

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  push_enabled boolean not null default false,
  push_messages boolean not null default true,
  push_sales boolean not null default true,
  push_favorites boolean not null default true,
  push_follows boolean not null default true,
  push_report_updates boolean not null default true,
  push_account_notices boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notifications_user_read_created_idx
  on public.notifications (user_id, read_at, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notification_preferences_updated_at on public.notification_preferences;
create trigger notification_preferences_updated_at
before update on public.notification_preferences
for each row execute procedure public.set_updated_at();

alter table public.notification_preferences enable row level security;

drop policy if exists notification_preferences_all on public.notification_preferences;
create policy notification_preferences_all on public.notification_preferences
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
  sender_name text;
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;

  select display_name into sender_name from public.profiles where id = new.sender_id;

  for recipient in
    select user_id from public.conversation_members
    where conversation_id = new.conversation_id and user_id <> new.sender_id
  loop
    insert into public.notifications (user_id, type, title, body, conversation_id, actor_id, path)
    values (
      recipient,
      'message',
      coalesce(sender_name, 'New message'),
      left(new.body, 140),
      new.conversation_id,
      new.sender_id,
      '/messages/' || new.conversation_id::text
    );
  end loop;

  return new;
end;
$$;

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

    insert into public.notifications (user_id, type, title, body, listing_id, actor_id, path, metadata)
    values (
      listing_row.owner_id,
      'sale',
      'Your listing was purchased',
      left(listing_row.title, 140),
      pay.listing_id,
      pay.user_id,
      '/listings/' || pay.listing_id::text,
      jsonb_build_object('payment_id', pay.id, 'purpose', pay.purpose)
    );
  end if;
end;
$$;

update public.notifications
set actor_id = coalesce(actor_id, nullif(metadata ->> 'actor_id', '')::uuid),
    path = coalesce(
      path,
      case
        when conversation_id is not null then '/messages/' || conversation_id::text
        when listing_id is not null then '/listings/' || listing_id::text
        else '/messages?tab=alerts'
      end
    ),
    metadata = coalesce(metadata, '{}'::jsonb)
where actor_id is null or path is null or metadata is null;
