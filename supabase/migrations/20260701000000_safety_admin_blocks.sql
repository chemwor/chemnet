-- ════════════════════════════════════════════════════════════════════════
-- Phase 3 · Safety: platform admin helper + blocks (ADDITIVE — never public.*)
-- ════════════════════════════════════════════════════════════════════════
-- Blocks are enforced SERVER-SIDE: in the insert policies for follows / mail /
-- guestbook, in the feed + directory views, and in the notification helper —
-- not just hidden in the UI.
-- ════════════════════════════════════════════════════════════════════════

-- Platform-admin check (reads public.admin_users — read only, never modified).
-- SECURITY DEFINER so it works inside RLS regardless of the caller's grants.
create or replace function platform.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.admin_users where email = auth.jwt()->>'email')
$$;
grant execute on function platform.is_admin() to anon, authenticated;

-- ── Blocks ──
create table if not exists platform.blocks (
  blocker_id uuid references auth.users(id) on delete cascade,
  blocked_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table platform.blocks enable row level security;
drop policy if exists "blocks_select_own" on platform.blocks;
create policy "blocks_select_own" on platform.blocks for select using (blocker_id = auth.uid());
drop policy if exists "blocks_insert_own" on platform.blocks;
create policy "blocks_insert_own" on platform.blocks for insert with check (blocker_id = auth.uid());
drop policy if exists "blocks_delete_own" on platform.blocks;
create policy "blocks_delete_own" on platform.blocks for delete using (blocker_id = auth.uid());
grant select, insert, delete on platform.blocks to authenticated;

-- True if a and b have blocked each other in EITHER direction. SECURITY DEFINER
-- so RLS policies / triggers can see blocks rows they otherwise couldn't.
create or replace function platform.is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = platform, public
as $$
  select exists (
    select 1 from platform.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  )
$$;
grant execute on function platform.is_blocked(uuid, uuid) to anon, authenticated;

-- ── Enforce blocks in cross-user write policies (recreate Phase 0/1 policies) ──
drop policy if exists "follows_insert_own" on platform.follows;
create policy "follows_insert_own" on platform.follows for insert
  with check (follower_id = auth.uid() and not platform.is_blocked(follower_id, followee_id));

drop policy if exists "send_mail" on members.messages;
create policy "send_mail" on members.messages for insert
  with check (sender_id = auth.uid() and not platform.is_blocked(sender_id, recipient_id));

drop policy if exists "sign_any_book" on members.guestbook_entries;
create policy "sign_any_book" on members.guestbook_entries for insert
  with check (author_id = auth.uid() and not platform.is_blocked(author_id, profile_id));

-- ── Don't notify across a block (belt-and-suspenders; the insert is blocked too) ──
create or replace function platform.notify(
  p_user_id uuid, p_actor_id uuid, p_kind text, p_payload jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = platform, public
as $$
begin
  if p_user_id is null or p_user_id is not distinct from p_actor_id then
    return;
  end if;
  if p_actor_id is not null and platform.is_blocked(p_user_id, p_actor_id) then
    return;
  end if;
  insert into platform.notifications (user_id, actor_id, kind, payload)
  values (p_user_id, p_actor_id, p_kind, coalesce(p_payload, '{}'::jsonb));
end;
$$;

-- ── Feed: exclude blocked users (recreate Phase 2 view + block filter) ──
create or replace view platform.feed_posts
with (security_invoker = true) as
select p.id, p.user_id, p.title, p.filename, p.content, p.note, p.category, p.created_at,
       pr.handle, pr.display_name, pr.avatar_url
from members.posts p
join platform.profiles pr on pr.id = p.user_id
where pr.is_public
  and coalesce(p.published, true)
  and not platform.is_blocked(auth.uid(), p.user_id)
  and p.user_id in (
    select followee_id from platform.follows where follower_id = auth.uid()
  );

-- ── Directory: public profiles, minus anyone in a block relationship with me ──
create or replace view platform.directory
with (security_invoker = true) as
select id, handle, display_name, avatar_url, bio, created_at
from platform.profiles
where is_public and not platform.is_blocked(auth.uid(), id);

grant select on platform.feed_posts to anon, authenticated;
grant select on platform.directory to anon, authenticated;
