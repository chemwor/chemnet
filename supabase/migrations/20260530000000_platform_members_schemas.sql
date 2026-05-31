-- ════════════════════════════════════════════════════════════════════════
-- ChemNet → Social Platform · Phase 0 · Schemas + tables (ADDITIVE ONLY)
-- ════════════════════════════════════════════════════════════════════════
-- This migration is purely additive. It NEVER touches `public.*` (Eric's
-- flagship hub node keeps working exactly as today). It creates two new
-- schemas:
--   platform — the global social graph (profiles, follows, notifications…)
--   members  — shared multi-tenant content, one row per user (user_id)
--
-- RLS lives in the companion migration (…_platform_members_rls.sql).
--
-- ⚠️ HUMAN STEP AFTER APPLYING: add `platform` and `members` to the
--    PostgREST exposed schemas (Supabase Dashboard → Settings → API →
--    "Exposed schemas"), otherwise supabase.schema('members') / ('platform')
--    calls from the client return a schema-not-found error.
-- ════════════════════════════════════════════════════════════════════════

create schema if not exists platform;
create schema if not exists members;

-- ── PostgREST / client roles can reach the schemas (RLS still governs rows) ──
grant usage on schema platform to anon, authenticated;
grant usage on schema members  to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- PLATFORM — global social graph
-- ════════════════════════════════════════════════════════════════════════

-- PROFILES: one per account, drives /u/:handle
create table if not exists platform.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  avatar_url text,
  bio text,
  is_public boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists platform.follows (
  follower_id uuid references auth.users(id) on delete cascade,
  followee_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table if not exists platform.notifications (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,   -- recipient
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null,
  payload jsonb default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists platform.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text not null,
  target_id text not null,
  reason text,
  status text not null default 'open',
  created_at timestamptz default now()
);

-- ════════════════════════════════════════════════════════════════════════
-- MEMBERS — shared multi-tenant content (one row per user, keyed by user_id)
-- ════════════════════════════════════════════════════════════════════════
-- Member tables are the CANONICAL shape; Eric's public.* tables are a
-- superset. When a field is added to an app, add it here first, then mirror
-- into the public.* table only if Eric's node needs it (schema-parity ritual).

-- posts ← public.blog_posts
create table if not exists members.posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  filename text not null default 'untitled.doc',
  content text not null default '',
  raw text,
  note text,
  layer integer default 1,
  size text default '0 KB',
  published boolean default true,
  views integer default 0,
  category text default 'general',
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- photos ← public.photos
create table if not exists members.photos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  caption text,
  url text not null,
  slides text[] default '{}',
  locked_video_url text,
  unlock_code text,
  unlock_hint text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- reviews ← public.reviews
create table if not exists members.reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  category text not null default 'movies',
  title text not null,
  year integer,
  rating integer default 0,
  status text default 'watched',
  poster text,
  review text,
  analysis text,
  tags text[] default '{}',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- food_items ← public.restaurants (The Food List)
create table if not exists members.food_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  location text,
  cuisine text,
  status text default 'been',
  rating integer default 0,
  icon text,
  review text,
  favorite text,
  vibe text,
  why text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- digest_entries ← public.digest_entries
create table if not exists members.digest_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null,
  url text,
  video_url text,
  note text,
  source text,
  published_date date default current_date,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- board_threads ← public.message_threads
create table if not exists members.board_threads (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),  -- whose board
  subject text not null,
  author text not null,
  pinned boolean default false,
  created_at timestamptz default now()
);

-- board_posts ← public.message_posts
create table if not exists members.board_posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),  -- whose board
  thread_id bigint references members.board_threads(id) on delete cascade,
  author text not null,
  email text,
  body text not null,
  is_sysop boolean default false,
  created_at timestamptz default now()
);

-- wishlist_items ← WishList/wishlist-data.js (file-backed on flagship)
create table if not exists members.wishlist_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  category text default 'other',
  price numeric,
  priority text default 'medium',
  link text,
  image text,
  notes text,
  acquired boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- car_mods ← CarMods PHASES (file-backed on flagship)
create table if not exists members.car_mods (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  phase text default 'phase1',          -- groups mods (repairs/phase1/interior…)
  name text not null,
  status text default 'planned',
  cost text,
  priority text,
  notes text,
  link text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- travel_log ← Trips (file-backed on flagship)
-- `data` jsonb holds the structured bits (highlights[], photos[]) that don't
-- yet have a settled columnar shape — finalize in Phase 1 (schema parity).
create table if not exists members.travel_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  destination text not null,
  status text default 'planned',
  dates text,
  icon text,
  summary text,
  notes text,
  data jsonb default '{}'::jsonb,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- projects ← Projects (file-backed on flagship)
-- `data` jsonb holds the rich nested shape (stack[], learnings[], roadmap[]…)
-- pending Phase-1 schema-parity finalization.
create table if not exists members.projects (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  icon text,
  status text default 'active',
  type text,
  tagline text,
  description text,
  notes text,
  data jsonb default '{}'::jsonb,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- music_tracks ← Music (file-backed on flagship)
create table if not exists members.music_tracks (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  kind text default 'audio',           -- audio | album | header | spacer
  folder text default 'my-music',      -- my-music | listening
  artist text,
  album text,
  size text,
  url text,
  date text,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- desktop_config: L2 customization (theme, wallpaper, apps, layout)
create table if not exists members.desktop_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme jsonb not null default '{}'::jsonb,        -- CSS var overrides
  wallpaper text,
  enabled_apps text[] not null default '{}',
  app_order text[] not null default '{}',
  app_labels jsonb not null default '{}'::jsonb,
  icon_positions jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- guestbook_entries: sign someone else's book
create table if not exists members.guestbook_entries (
  id bigint generated always as identity primary key,
  profile_id uuid not null references auth.users(id) on delete cascade,   -- whose book
  author_id  uuid references auth.users(id) on delete set null,           -- who signed
  body text not null,
  created_at timestamptz default now()
);

-- messages: user-to-user ChemMail
create table if not exists members.messages (
  id bigint generated always as identity primary key,
  sender_id uuid references auth.users(id) on delete set null,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  subject text,
  body text,
  read boolean not null default false,
  created_at timestamptz default now()
);

-- ── Table-level privileges (row visibility still enforced by RLS) ──
grant select, insert, update, delete on all tables in schema platform to anon, authenticated;
grant select, insert, update, delete on all tables in schema members  to anon, authenticated;
