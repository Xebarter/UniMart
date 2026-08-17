-- Fix infinite recursion in conversation RLS.
-- Run in the Supabase SQL editor after 001_schema.sql.

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members
    where conversation_id = p_conversation_id
      and user_id = auth.uid()
  );
$$;

grant execute on function public.is_conversation_member(uuid) to anon, authenticated;

drop policy if exists conversation_members_select on public.conversation_members;
create policy conversation_members_select on public.conversation_members for select using (
  user_id = auth.uid()
  or public.is_conversation_member(conversation_id)
  or public.is_admin()
);

drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations for select using (
  public.is_conversation_member(id)
  or public.is_admin()
);

drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations for update using (
  public.is_conversation_member(id)
);

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select using (
  public.is_conversation_member(conversation_id)
  or public.is_admin()
);

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert with check (
  sender_id = auth.uid()
  and public.is_conversation_member(conversation_id)
);
