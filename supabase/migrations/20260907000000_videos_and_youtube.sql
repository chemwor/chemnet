-- ════════════════════════════════════════════════════════════════════════
-- Member videos + per-node YouTube link (ADDITIVE — never touches public.*)
-- ════════════════════════════════════════════════════════════════════════
-- The Videos app (ChemTube) had no members table, so member nodes fell back to
-- Eric's hardcoded videos. This adds members.videos (per-user, RLS-scoped) so a
-- member node shows ONLY that member's videos (empty if none). Eric's flagship
-- videos stay in a client constant (no public.* change).
--
-- Also adds desktop_config.youtube_url so the Music app can embed the owner's
-- YouTube channel/playlist alongside SoundCloud + Spotify.
-- ════════════════════════════════════════════════════════════════════════

create table if not exists members.videos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  url text not null,                      -- YouTube watch / youtu.be / shorts URL
  description text,
  folder text default 'my-videos',        -- my-videos | watching
  sort_order int default 0,
  created_at timestamptz default now()
);

-- RLS: same shape as every other members.* content table (public-or-own read,
-- own-only writes). Mirrors the loop in 20260530000001_platform_members_rls.sql.
alter table members.videos enable row level security;

drop policy if exists "read_public_or_own" on members.videos;
create policy "read_public_or_own" on members.videos for select using (
  user_id = auth.uid()
  or exists (select 1 from platform.profiles p where p.id = members.videos.user_id and p.is_public)
);
drop policy if exists "insert_own" on members.videos;
create policy "insert_own" on members.videos for insert with check (user_id = auth.uid());
drop policy if exists "update_own" on members.videos;
create policy "update_own" on members.videos for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "delete_own" on members.videos;
create policy "delete_own" on members.videos for delete using (user_id = auth.uid());

-- Per-node YouTube link for the Music app.
alter table members.desktop_config add column if not exists youtube_url text;
