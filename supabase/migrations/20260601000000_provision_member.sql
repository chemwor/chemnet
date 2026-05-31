-- ════════════════════════════════════════════════════════════════════════
-- Phase 1 · Transactional member provisioning (ADDITIVE — never touches public.*)
-- ════════════════════════════════════════════════════════════════════════
-- The provision_user Edge Function verifies the caller's JWT, then calls this
-- SECURITY DEFINER function. A plpgsql function body runs in a single implicit
-- transaction, so provisioning is atomic; the early-return on an existing
-- profile makes it idempotent.
--
-- It seeds members.* + platform.profiles ONLY. SECURITY DEFINER runs as the
-- function owner (table owner) so it can seed past RLS — never touching public.
--
-- Locked down: execute is granted to service_role only (the Edge Function),
-- never to anon/authenticated, so callers can't provision arbitrary users.
-- ════════════════════════════════════════════════════════════════════════

create or replace function platform.provision_member(p_user_id uuid, p_handle text)
returns text
language plpgsql
security definer
set search_path = platform, members, public
as $$
declare
  existing_handle text;
begin
  -- Idempotent: if this account already has a profile, no-op and return it.
  select handle into existing_handle from platform.profiles where id = p_user_id;
  if existing_handle is not null then
    return existing_handle;
  end if;

  -- Validate handle (mirrors the platform.profiles CHECK + client regex).
  if p_handle is null or p_handle !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'invalid_handle';
  end if;
  if exists (select 1 from platform.profiles where handle = p_handle) then
    raise exception 'handle_taken';
  end if;

  -- 1) Profile
  insert into platform.profiles (id, handle, display_name, is_public)
  values (p_user_id, p_handle, p_handle, true);

  -- 2) Desktop config — default "Warm Slate" theme + starter app set
  insert into members.desktop_config (user_id, theme, wallpaper, enabled_apps, app_order)
  values (
    p_user_id,
    '{}'::jsonb,                              -- empty = inherit Warm Slate defaults
    'warm-slate',
    array[
      'about','aboutme','blog','pictures','guestbook','music','reviews',
      'restaurants','wishlist','trips','digest','email','messageboard','terminal'
    ],
    array[
      'about','aboutme','blog','pictures','guestbook','music','reviews',
      'restaurants','wishlist','trips','digest','email','messageboard','terminal'
    ]
  );

  -- 3) Seed a welcome post
  insert into members.posts (user_id, title, filename, content, note, published, category)
  values (
    p_user_id,
    'Welcome to my corner of ChemNet',
    'welcome.doc',
    E'This is your desktop. Open the Customize app to change the theme, wallpaper, and which apps show up.\n\nEvery app you see is yours to fill — write posts, add photos, list the places you want to eat, the trips you want to take. Visitors can sign your guestbook and send you ChemMail.\n\nDelete this post whenever you''re ready to make the place your own.',
    'Auto-generated when your node was created.',
    true,
    'general'
  );

  -- 4) Seed a system ChemMail from "SysOp" (sender_id null = system)
  insert into members.messages (sender_id, recipient_id, subject, body, read)
  values (
    null,
    p_user_id,
    'Welcome to ChemNet',
    E'Hey — welcome aboard.\n\nYour node is live. Tip: open Customize to theme your desktop, then start filling your apps with content. Anything you create here is yours and shows up only on your node.\n\n— SysOp',
    false
  );

  return p_handle;
end;
$$;

revoke all on function platform.provision_member(uuid, text) from public;
grant execute on function platform.provision_member(uuid, text) to service_role;
