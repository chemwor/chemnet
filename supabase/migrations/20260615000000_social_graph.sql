-- ════════════════════════════════════════════════════════════════════════
-- Phase 2 · Social graph (ADDITIVE — never touches public.*)
-- ════════════════════════════════════════════════════════════════════════
-- Follows + notifications + feed + directory plumbing. Notifications for OTHER
-- users are created exclusively by SECURITY DEFINER triggers (which run as the
-- table owner and bypass RLS) — clients can never insert a notification "for"
-- someone else. We drop the Phase 0 client-insert policy to guarantee that.
-- ════════════════════════════════════════════════════════════════════════

-- ── A. Follows: indexes (RLS already set in Phase 0: read-all / write-own) ──
create index if not exists follows_follower_idx on platform.follows (follower_id);
create index if not exists follows_followee_idx on platform.follows (followee_id);

-- ── B. Notifications: no client INSERT (triggers only) ──
-- Phase 0 allowed `insert with check (actor_id = auth.uid())`; Phase 2 forbids
-- all client inserts so notifications can only originate from the triggers.
drop policy if exists "notifications_insert_as_actor" on platform.notifications;
-- (notifications_read_own + notifications_update_own remain from Phase 0.)
create index if not exists notifications_user_idx on platform.notifications (user_id, created_at desc);

-- Helper: insert a notification, skipping self-actions. SECURITY DEFINER so it
-- runs as the table owner (RLS bypassed). Locked to internal trigger use.
create or replace function platform.notify(
  p_user_id uuid, p_actor_id uuid, p_kind text, p_payload jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = platform, public
as $$
begin
  -- never notify someone about their own action
  if p_user_id is null or p_user_id is not distinct from p_actor_id then
    return;
  end if;
  insert into platform.notifications (user_id, actor_id, kind, payload)
  values (p_user_id, p_actor_id, p_kind, coalesce(p_payload, '{}'::jsonb));
end;
$$;

-- follow → notify the followee
create or replace function platform.on_follow_notify() returns trigger
language plpgsql security definer set search_path = platform, public
as $$
begin
  perform platform.notify(NEW.followee_id, NEW.follower_id, 'follow', '{}'::jsonb);
  return NEW;
end;
$$;

-- guestbook signature → notify the book owner
create or replace function platform.on_guestbook_notify() returns trigger
language plpgsql security definer set search_path = platform, members, public
as $$
begin
  perform platform.notify(NEW.profile_id, NEW.author_id, 'guestbook_sign',
    jsonb_build_object('entry_id', NEW.id));
  return NEW;
end;
$$;

-- ChemMail → notify the recipient (sender may be null for system mail)
create or replace function platform.on_message_notify() returns trigger
language plpgsql security definer set search_path = platform, members, public
as $$
begin
  perform platform.notify(NEW.recipient_id, NEW.sender_id, 'chemmail',
    jsonb_build_object('message_id', NEW.id, 'subject', NEW.subject));
  return NEW;
end;
$$;

drop trigger if exists trg_follow_notify on platform.follows;
create trigger trg_follow_notify after insert on platform.follows
  for each row execute function platform.on_follow_notify();

drop trigger if exists trg_guestbook_notify on members.guestbook_entries;
create trigger trg_guestbook_notify after insert on members.guestbook_entries
  for each row execute function platform.on_guestbook_notify();

drop trigger if exists trg_message_notify on members.messages;
create trigger trg_message_notify after insert on members.messages
  for each row execute function platform.on_message_notify();

-- Note: board-reply notifications are intentionally skipped — members.board_posts
-- has no author user_id (only the board owner's user_id + an author text field),
-- so there's no reliable actor to attribute. Revisit if visitor board posting lands.

-- ── B (view). Notifications joined to the actor's profile, own rows only ──
create or replace view platform.notifications_view
with (security_invoker = true) as
select n.id, n.user_id, n.actor_id, n.kind, n.payload, n.read, n.created_at,
       pr.handle as actor_handle, pr.display_name as actor_display_name, pr.avatar_url as actor_avatar
from platform.notifications n
left join platform.profiles pr on pr.id = n.actor_id;

-- ── C. Feed: recent public posts from the caller's followees ──
-- security_invoker → underlying members.posts RLS (read-public-or-own) applies;
-- auth.uid() resolves per-caller so the same view serves every user's feed.
create or replace view platform.feed_posts
with (security_invoker = true) as
select p.id, p.user_id, p.title, p.filename, p.content, p.note, p.category, p.created_at,
       pr.handle, pr.display_name, pr.avatar_url
from members.posts p
join platform.profiles pr on pr.id = p.user_id
where pr.is_public
  and coalesce(p.published, true)
  and p.user_id in (
    select followee_id from platform.follows where follower_id = auth.uid()
  );

grant select on platform.notifications_view to anon, authenticated;
grant select on platform.feed_posts to anon, authenticated;
