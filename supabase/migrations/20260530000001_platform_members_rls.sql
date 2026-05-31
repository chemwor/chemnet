-- ════════════════════════════════════════════════════════════════════════
-- ChemNet → Social Platform · Phase 0 · Row Level Security
-- ════════════════════════════════════════════════════════════════════════
-- Applies RLS to every members.* and platform.* table. Does NOT touch
-- public.* (Eric's flagship tables keep their existing policies).
--
-- ⚠️ The anon key ships in the client. For these tables RLS is the ONLY
--    security boundary — every table gets explicit policies; with RLS on and
--    no matching policy, access is denied by default.
--
-- Canonical content pattern (read-public-or-own / write-own):
--   select → row owner, OR the owner's profile is public
--   insert/update/delete → only the row owner (user_id = auth.uid())
-- Idempotent: policies are dropped-if-exists then recreated.
-- ════════════════════════════════════════════════════════════════════════

-- ── Standard content tables: read-public-or-own / write-own ──
do $$
declare
  t text;
  std_tables text[] := array[
    'posts','photos','reviews','food_items','digest_entries',
    'board_threads','board_posts','wishlist_items','car_mods',
    'travel_log','projects','music_tracks'
  ];
begin
  foreach t in array std_tables loop
    execute format('alter table members.%I enable row level security', t);

    execute format('drop policy if exists "read_public_or_own" on members.%I', t);
    execute format(
      $f$create policy "read_public_or_own" on members.%1$I for select using (
        user_id = auth.uid()
        or exists (select 1 from platform.profiles p where p.id = members.%1$I.user_id and p.is_public)
      )$f$, t);

    execute format('drop policy if exists "insert_own" on members.%I', t);
    execute format('create policy "insert_own" on members.%I for insert with check (user_id = auth.uid())', t);

    execute format('drop policy if exists "update_own" on members.%I', t);
    execute format('create policy "update_own" on members.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t);

    execute format('drop policy if exists "delete_own" on members.%I', t);
    execute format('create policy "delete_own" on members.%I for delete using (user_id = auth.uid())', t);
  end loop;
end$$;

-- ── members.desktop_config (keyed by user_id directly) ──
alter table members.desktop_config enable row level security;
drop policy if exists "config_read_public_or_own" on members.desktop_config;
create policy "config_read_public_or_own" on members.desktop_config for select using (
  user_id = auth.uid()
  or exists (select 1 from platform.profiles p where p.id = members.desktop_config.user_id and p.is_public)
);
drop policy if exists "config_insert_own" on members.desktop_config;
create policy "config_insert_own" on members.desktop_config for insert with check (user_id = auth.uid());
drop policy if exists "config_update_own" on members.desktop_config;
create policy "config_update_own" on members.desktop_config for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── members.guestbook_entries (sign someone else's book) ──
alter table members.guestbook_entries enable row level security;
drop policy if exists "read_book" on members.guestbook_entries;
create policy "read_book" on members.guestbook_entries for select using (
  exists (select 1 from platform.profiles p where p.id = profile_id and p.is_public)
  or profile_id = auth.uid()
);
drop policy if exists "sign_any_book" on members.guestbook_entries;
create policy "sign_any_book" on members.guestbook_entries for insert with check (author_id = auth.uid());
drop policy if exists "owner_or_signer_delete" on members.guestbook_entries;
create policy "owner_or_signer_delete" on members.guestbook_entries for delete using (
  profile_id = auth.uid() or author_id = auth.uid()
);

-- ── members.messages (user-to-user ChemMail) ──
alter table members.messages enable row level security;
drop policy if exists "send_mail" on members.messages;
create policy "send_mail" on members.messages for insert with check (sender_id = auth.uid());
drop policy if exists "read_my_mail" on members.messages;
create policy "read_my_mail" on members.messages for select using (
  recipient_id = auth.uid() or sender_id = auth.uid()
);
drop policy if exists "update_my_mail" on members.messages;
create policy "update_my_mail" on members.messages for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════
-- PLATFORM tables
-- ════════════════════════════════════════════════════════════════════════

-- profiles: public profiles readable by anyone; own row readable/writable by owner
alter table platform.profiles enable row level security;
drop policy if exists "profiles_read" on platform.profiles;
create policy "profiles_read" on platform.profiles for select using (is_public or id = auth.uid());
drop policy if exists "profiles_insert_own" on platform.profiles;
create policy "profiles_insert_own" on platform.profiles for insert with check (id = auth.uid());
drop policy if exists "profiles_update_own" on platform.profiles;
create policy "profiles_update_own" on platform.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- follows: graph is public; you may only create/remove your own follows
alter table platform.follows enable row level security;
drop policy if exists "follows_read" on platform.follows;
create policy "follows_read" on platform.follows for select using (true);
drop policy if exists "follows_insert_own" on platform.follows;
create policy "follows_insert_own" on platform.follows for insert with check (follower_id = auth.uid());
drop policy if exists "follows_delete_own" on platform.follows;
create policy "follows_delete_own" on platform.follows for delete using (follower_id = auth.uid());

-- notifications: you read/update your own; actors create notifications they author
alter table platform.notifications enable row level security;
drop policy if exists "notifications_read_own" on platform.notifications;
create policy "notifications_read_own" on platform.notifications for select using (user_id = auth.uid());
drop policy if exists "notifications_insert_as_actor" on platform.notifications;
create policy "notifications_insert_as_actor" on platform.notifications for insert with check (actor_id = auth.uid());
drop policy if exists "notifications_update_own" on platform.notifications;
create policy "notifications_update_own" on platform.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reports: authenticated users file reports as themselves; admins read them
alter table platform.reports enable row level security;
drop policy if exists "reports_insert_self" on platform.reports;
create policy "reports_insert_self" on platform.reports for insert with check (reporter_id = auth.uid());
drop policy if exists "reports_admin_read" on platform.reports;
create policy "reports_admin_read" on platform.reports for select using (
  exists (select 1 from public.admin_users where email = auth.jwt()->>'email')
);
drop policy if exists "reports_admin_update" on platform.reports;
create policy "reports_admin_update" on platform.reports for update using (
  exists (select 1 from public.admin_users where email = auth.jwt()->>'email')
);
