-- Singleton press page content, managed from the admin dashboard.

create table if not exists public.press_pages (
  id int primary key default 1 check (id = 1),
  eyebrow text not null default 'Press & Media',
  hero_title text not null default 'Stories from the marketplace nearby.',
  hero_subtitle text not null default 'For journalists, partners, and anyone covering campus commerce, community, and the people building UniMart.',
  contact_email text not null default 'press@unimart.app',
  contact_copy text not null default 'For press inquiries, interviews, partnerships, or brand questions, contact our communications team.',
  contact_sla text not null default 'We aim to respond to press requests within 48 hours.',
  boilerplate_title text not null default 'About UniMart',
  boilerplate text not null default 'UniMart is a campus marketplace for students and communities nearby. People buy, sell, offer services, rent items, post gigs, and discover shops in one organized place.',
  highlights jsonb not null default '[]'::jsonb,
  quote_text text not null default 'Universities are full of skills, businesses, and opportunities that often go undiscovered. UniMart brings these together.',
  quote_attribution text not null default 'UniMart',
  quote_role text not null default 'Communications',
  faqs jsonb not null default '[]'::jsonb,
  media_notes text not null default 'Please include your outlet, deadline, and the angle you are covering. We can arrange interviews, written comments, and background on campus marketplace stories.',
  updated_at timestamptz not null default now()
);

insert into public.press_pages (
  id,
  eyebrow,
  hero_title,
  hero_subtitle,
  contact_email,
  contact_copy,
  contact_sla,
  boilerplate_title,
  boilerplate,
  highlights,
  quote_text,
  quote_attribution,
  quote_role,
  faqs,
  media_notes
)
values (
  1,
  'Press & Media',
  'Stories from the marketplace nearby.',
  'For journalists, partners, and anyone covering campus commerce, community, and the people building UniMart.',
  'press@unimart.app',
  'For press inquiries, interviews, partnerships, or brand questions, contact our communications team.',
  'We aim to respond to press requests within 48 hours.',
  'About UniMart',
  'UniMart is a campus marketplace for students and communities nearby. People buy, sell, offer services, rent items, post gigs, and discover shops in one organized place. Founded in Kampala, Uganda, UniMart is built to make campus commerce simpler, safer, and easier to find.',
  '[
    {"title": "Founded", "body": "Kampala, Uganda"},
    {"title": "Focus", "body": "Campus communities"},
    {"title": "Marketplace", "body": "Products, services, rentals, gigs"},
    {"title": "Audience", "body": "Students, creators, shops"}
  ]'::jsonb,
  'Universities are full of skills, businesses, and opportunities that often go undiscovered. UniMart brings these together.',
  'UniMart',
  'Communications',
  '[
    {"question": "How fast do you reply to media requests?", "answer": "We aim to respond within 48 hours on weekdays."},
    {"question": "Can we interview the team?", "answer": "Yes. Share your outlet, deadline, and topic so we can arrange a call or written comments."},
    {"question": "What is UniMart in one line?", "answer": "A campus marketplace where students and nearby communities buy, sell, hire, rent, and connect."}
  ]'::jsonb,
  'Please include your outlet, deadline, and the angle you are covering. We can arrange interviews, written comments, and background on campus marketplace stories.'
)
on conflict (id) do nothing;

drop trigger if exists press_pages_updated_at on public.press_pages;
create trigger press_pages_updated_at before update on public.press_pages
for each row execute procedure public.set_updated_at();

alter table public.press_pages enable row level security;

drop policy if exists press_pages_select on public.press_pages;
create policy press_pages_select on public.press_pages
  for select using (true);

drop policy if exists press_pages_update on public.press_pages;
create policy press_pages_update on public.press_pages
  for update using (public.is_admin());

drop policy if exists press_pages_insert on public.press_pages;
create policy press_pages_insert on public.press_pages
  for insert with check (public.is_admin());

grant select on public.press_pages to anon, authenticated;
grant insert, update on public.press_pages to authenticated;
