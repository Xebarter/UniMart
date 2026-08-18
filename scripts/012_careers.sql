-- Careers CMS: public page copy, job roles, and applications.

create table if not exists public.career_page_settings (
  id int primary key default 1 check (id = 1),
  headline text not null default 'Work on the marketplace nearby.',
  intro text not null default 'UniMart is a small team building a local marketplace. We hire people who care about buyers and sellers, ship with care, and think long-term.',
  apply_email text not null default 'careers@unimart.app',
  accept_general boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.career_page_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.job_roles (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles (id) on delete set null,
  title text not null,
  slug text not null unique,
  department text not null default 'General',
  location text not null default 'Kampala, Uganda',
  employment_type text not null default 'full_time'
    check (employment_type in ('full_time', 'part_time', 'contract', 'internship')),
  workplace text not null default 'hybrid'
    check (workplace in ('onsite', 'remote', 'hybrid')),
  excerpt text not null default '',
  description text not null default '',
  requirements text not null default '',
  benefits text not null default '',
  apply_email text,
  apply_url text,
  featured boolean not null default false,
  sort_order int not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'closed', 'archived')),
  published_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references public.job_roles (id) on delete set null,
  name text not null,
  email text not null,
  phone text not null default '',
  location text not null default '',
  portfolio_url text not null default '',
  linkedin_url text not null default '',
  resume_url text not null default '',
  cover_letter text not null default '',
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'shortlisted', 'rejected', 'hired')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_roles_status_sort_idx
  on public.job_roles (status, featured desc, sort_order, published_at desc);

create index if not exists job_roles_slug_idx
  on public.job_roles (slug);

create index if not exists job_applications_created_idx
  on public.job_applications (created_at desc);

create index if not exists job_applications_status_idx
  on public.job_applications (status, created_at desc);

create index if not exists job_applications_role_idx
  on public.job_applications (role_id, created_at desc);

drop trigger if exists career_page_settings_updated_at on public.career_page_settings;
create trigger career_page_settings_updated_at before update on public.career_page_settings
for each row execute procedure public.set_updated_at();

drop trigger if exists job_roles_updated_at on public.job_roles;
create trigger job_roles_updated_at before update on public.job_roles
for each row execute procedure public.set_updated_at();

drop trigger if exists job_applications_updated_at on public.job_applications;
create trigger job_applications_updated_at before update on public.job_applications
for each row execute procedure public.set_updated_at();

alter table public.career_page_settings enable row level security;
alter table public.job_roles enable row level security;
alter table public.job_applications enable row level security;

drop policy if exists career_page_settings_select on public.career_page_settings;
create policy career_page_settings_select on public.career_page_settings
  for select using (true);

drop policy if exists career_page_settings_update on public.career_page_settings;
create policy career_page_settings_update on public.career_page_settings
  for update using (public.is_admin());

drop policy if exists job_roles_select on public.job_roles;
create policy job_roles_select on public.job_roles
  for select using (status = 'published' or public.is_admin());

drop policy if exists job_roles_insert on public.job_roles;
create policy job_roles_insert on public.job_roles
  for insert with check (public.is_admin());

drop policy if exists job_roles_update on public.job_roles;
create policy job_roles_update on public.job_roles
  for update using (public.is_admin());

drop policy if exists job_roles_delete on public.job_roles;
create policy job_roles_delete on public.job_roles
  for delete using (public.is_admin());

drop policy if exists job_applications_select on public.job_applications;
create policy job_applications_select on public.job_applications
  for select using (public.is_admin());

drop policy if exists job_applications_insert on public.job_applications;
create policy job_applications_insert on public.job_applications
  for insert with check (true);

drop policy if exists job_applications_update on public.job_applications;
create policy job_applications_update on public.job_applications
  for update using (public.is_admin());

grant select on public.career_page_settings to anon, authenticated;
grant update on public.career_page_settings to authenticated;

grant select on public.job_roles to anon, authenticated;
grant insert, update, delete on public.job_roles to authenticated;

grant insert on public.job_applications to anon, authenticated;
grant select, update on public.job_applications to authenticated;
