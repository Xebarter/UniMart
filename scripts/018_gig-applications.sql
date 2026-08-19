-- Gig applications: student-only apply flow, private resumes, and inbox cards.

alter table public.messages
  add column if not exists kind text not null default 'text';

alter table public.messages
  add column if not exists application_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_kind_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_kind_check
      check (kind in ('text', 'gig_application'));
  end if;
end $$;

create table if not exists public.gig_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  cover_letter text not null default '',
  resume_path text not null,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  student_number text not null default '',
  university text not null default '',
  campus text not null default '',
  status text not null default 'submitted'
    check (status in ('submitted', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, applicant_id)
);

create index if not exists gig_applications_listing_idx
  on public.gig_applications (listing_id, created_at desc);

create index if not exists gig_applications_applicant_idx
  on public.gig_applications (applicant_id, created_at desc);

create index if not exists gig_applications_conversation_idx
  on public.gig_applications (conversation_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_application_id_fkey'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_application_id_fkey
      foreign key (application_id) references public.gig_applications (id) on delete set null;
  end if;
end $$;

drop trigger if exists gig_applications_updated_at on public.gig_applications;
create trigger gig_applications_updated_at before update on public.gig_applications
for each row execute procedure public.set_updated_at();

alter table public.gig_applications enable row level security;

drop policy if exists gig_applications_select on public.gig_applications;
create policy gig_applications_select on public.gig_applications
for select using (
  applicant_id = auth.uid()
  or exists (
    select 1 from public.listings l
    where l.id = listing_id and l.owner_id = auth.uid()
  )
  or public.is_admin()
);

drop policy if exists gig_applications_insert on public.gig_applications;
create policy gig_applications_insert on public.gig_applications
for insert with check (applicant_id = auth.uid());

drop policy if exists gig_applications_update on public.gig_applications;
create policy gig_applications_update on public.gig_applications
for update using (applicant_id = auth.uid() or public.is_admin())
with check (applicant_id = auth.uid() or public.is_admin());

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('message', 'sale', 'favorite', 'follow', 'report_update', 'account_notice', 'gig_application'));

create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
  sender_name text;
  listing_title text;
  listing_uuid uuid;
  notice_type text := 'message';
  notice_title text;
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;

  select display_name into sender_name from public.profiles where id = new.sender_id;

  select c.listing_id, l.title
    into listing_uuid, listing_title
  from public.conversations c
  left join public.listings l on l.id = c.listing_id
  where c.id = new.conversation_id;

  if coalesce(new.kind, 'text') = 'gig_application' then
    notice_type := 'gig_application';
    notice_title := 'New application for ' || coalesce(listing_title, 'your gig');
  else
    notice_title := coalesce(sender_name, 'New message');
  end if;

  for recipient in
    select user_id from public.conversation_members
    where conversation_id = new.conversation_id and user_id <> new.sender_id
  loop
    insert into public.notifications (user_id, type, title, body, conversation_id, listing_id, actor_id, path)
    values (
      recipient,
      notice_type,
      notice_title,
      left(new.body, 140),
      new.conversation_id,
      listing_uuid,
      new.sender_id,
      '/messages/' || new.conversation_id::text
    );
  end loop;

  return new;
end;
$$;

insert into storage.buckets (id, name, public)
values ('gig-resumes', 'gig-resumes', false)
on conflict (id) do update set public = false;

drop policy if exists gig_resumes_select on storage.objects;
create policy gig_resumes_select on storage.objects
for select using (
  bucket_id = 'gig-resumes'
  and auth.uid() is not null
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(name))[2]
        and l.owner_id = auth.uid()
    )
    or public.is_admin()
  )
);

drop policy if exists gig_resumes_insert on storage.objects;
create policy gig_resumes_insert on storage.objects
for insert with check (
  bucket_id = 'gig-resumes'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists gig_resumes_delete on storage.objects;
create policy gig_resumes_delete on storage.objects
for delete using (
  bucket_id = 'gig-resumes'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);
