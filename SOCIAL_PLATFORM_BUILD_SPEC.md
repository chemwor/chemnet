# ChemNet → Social Platform: Build Spec

**Goal:** Turn ChemNet into a multi-tenant platform where anyone can hit "Make your own," get
their own editable retro-OS desktop at `/u/:handle`, and visit/interact with other people's
desktops — while **Eric's site stays a separate, dedicated hub node** with its own tables.

**Concept:** MySpace × windows93 — a social network where every user gets their own fake OS world,
orbiting a flagship hub node.

---

## 0. Decisions

| Decision | Choice | Why |
|---|---|---|
| **Eric's site** | **Its own dedicated single-tenant tables (current ones, untouched)** | It's the hub/node — separate lifecycle, hand-curated, never co-mingled with user data, zero migration risk |
| **All other users** | **Shared multi-tenant tables, one row per user per item, keyed by `user_id`** | Provisioning = INSERT rows, never `CREATE TABLE` per user |
| **The network** | **Global platform tables** (profiles, follows, notifications) | The graph connecting all nodes |
| Keep components DRY across two backends | **Repository/adapter layer** | One set of React apps, two data sources behind one interface |
| Customization ceiling (v1) | **L2: content + look/layout** | Cheap given CSS-variable theme + registry; architect for L3 later |
| Auth | Supabase magic-link (extend existing `useAuth`) | Already built; add signup + handle claim |

---

## 1. Core principle — two data sources, one UI

> **Eric's tables are physically separate and stay as they are.** Member content lives in shared
> multi-tenant tables, one row per user. React apps never touch a table directly — they call a
> **repository** that resolves to the flagship source (Eric's tables) or the member source
> (shared tables filtered by `user_id`) based on which node is being viewed.

The shells (`DesktopShell` / `MobileShell`) and `APP_REGISTRY` do **not** change structurally.
They receive a `node` ({ kind: 'flagship' | 'member', userId }) via context; apps read through the repo.

### Physical split — Postgres schemas

| Schema | Contents | Tenancy | RLS |
|---|---|---|---|
| `public` (**flagship**) | Eric's existing tables: `blog_posts`, `photos`, `reviews`, `restaurants`, `guestbook_entries`, `message_threads`, `message_posts`, `digest_entries`, `hidden_files`, `high_scores` | single-tenant (Eric) | **unchanged** — public read / admin write |
| `members` | shared multi-tenant copies: `posts`, `photos`, `guestbook_entries`, `messages`, `board_threads`, `board_posts`, `reviews`, `food_items`, `travel_log`, `wishlist_items`, `car_mods`, `projects`, `digest_entries`, `music_tracks`, `desktop_config` | multi-tenant (`user_id` per row) | owner-writes-own / public-read |
| `platform` | `profiles`, `follows`, `notifications`, `reports`, `blocks`, `admin_users` | global | per-policy |

Eric's tables require **no migration** — they keep working exactly as today.

---

## 2. The repository layer (keeps it from rotting into two codebases)

Single interface, two implementations. Apps stay backend-agnostic.

```js
// ProfileContext provides `node`
const repo = node.kind === 'flagship'
  ? flagshipRepo                  // → public.blog_posts, public.photos, ...
  : memberRepo(node.userId);      // → members.posts WHERE user_id = node.userId, ...

repo.posts.list();                // <Blog/> doesn't know or care which schema
repo.guestbook.sign(entry);
```

- `flagshipRepo` maps method → Eric's table names (e.g. `posts` → `blog_posts`).
- `memberRepo(userId)` maps method → `members.*` and injects `user_id`.
- Both satisfy the same TS interface (`Repo`) so a missing method fails at compile time.
- Each app: `const repo = useRepo();` — no other change to existing components.

**Schema-parity ritual (the one real cost of separate tables):** treat `members.*` as the
**canonical shape**; Eric's tables are a superset. When a field is added to an app, add it to the
member table first, then mirror into Eric's table if his node needs it. Keep a single column-spec
file the migrations import so both sides can't silently drift.

---

## 3. Member-side data model (`members` schema)

### 3a. New platform tables

```sql
create schema if not exists platform;
create schema if not exists members;

-- PROFILES: one per account, drives /u/:handle
create table platform.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name text, avatar_url text, bio text,
  is_public boolean not null default true,
  created_at timestamptz default now()
);

create table platform.follows (
  follower_id uuid references auth.users(id) on delete cascade,
  followee_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table platform.notifications (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,  -- recipient
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null, payload jsonb default '{}'::jsonb,
  read boolean not null default false, created_at timestamptz default now()
);

create table platform.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text not null, target_id text not null,
  reason text, status text not null default 'open', created_at timestamptz default now()
);
```

### 3b. Member content tables (shared multi-tenant)

Every member content table follows the same shape:
```sql
create table members.posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  -- ...mirror the fields of public.blog_posts...
  sort_order int default 0,
  created_at timestamptz default now()
);
```
Repeat for: `members.photos`, `members.reviews`, `members.food_items`, `members.travel_log`,
`members.wishlist_items`, `members.car_mods`, `members.projects`, `members.digest_entries`,
`members.music_tracks`, `members.board_threads`, `members.board_posts`.

```sql
-- DESKTOP_CONFIG: L2 customization (theme, wallpaper, apps, layout)
create table members.desktop_config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme jsonb not null default '{}'::jsonb,        -- CSS var overrides
  wallpaper text,
  enabled_apps text[] not null default '{}',
  app_order text[] not null default '{}',
  app_labels jsonb not null default '{}'::jsonb,
  icon_positions jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- GUESTBOOK: sign someone else's book
create table members.guestbook_entries (
  id bigint generated always as identity primary key,
  profile_id uuid not null references auth.users(id) on delete cascade,  -- whose book
  author_id  uuid references auth.users(id) on delete set null,          -- who signed
  body text not null, created_at timestamptz default now()
);

-- CHEMMAIL: user-to-user
create table members.messages (
  id bigint generated always as identity primary key,
  sender_id uuid references auth.users(id) on delete set null,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  subject text, body text, read boolean not null default false,
  created_at timestamptz default now()
);
```

> Note: `wishlist_items`, `music_tracks`, `food_items`, `travel_log`, `car_mods`, `projects`,
> and Blog content live in **local JS files today** (`WishList/wishlist-data.js`, etc.). For Eric's
> node they can stay as files *or* move to his tables; for members they **must** be tables.

---

## 4. RLS — only the `members` + `platform` schemas

Eric's `public` tables keep their current policies (public read / admin write). New policies apply
to member tables only. Canonical pattern (example = `members.posts`):

```sql
alter table members.posts enable row level security;
create policy "read_public_or_own" on members.posts for select using (
  user_id = auth.uid()
  or exists (select 1 from platform.profiles p where p.id = members.posts.user_id and p.is_public)
);
create policy "insert_own" on members.posts for insert with check (user_id = auth.uid());
create policy "update_own" on members.posts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete_own" on members.posts for delete using (user_id = auth.uid());
```

Guestbook (write to others' books):
```sql
create policy "sign_any_book" on members.guestbook_entries for insert with check (author_id = auth.uid());
create policy "read_book" on members.guestbook_entries for select
  using (exists (select 1 from platform.profiles p where p.id = profile_id and p.is_public) or profile_id = auth.uid());
create policy "owner_or_signer_delete" on members.guestbook_entries for delete
  using (profile_id = auth.uid() or author_id = auth.uid());
```

ChemMail:
```sql
create policy "send_mail" on members.messages for insert with check (sender_id = auth.uid());
create policy "read_my_mail" on members.messages for select using (recipient_id = auth.uid() or sender_id = auth.uid());
```

> ⚠️ The anon key ships in the client. For member tables, **RLS is the only security boundary** —
> default-deny once RLS is on; every table needs explicit policies. Eric's tables are unaffected.

---

## 5. "Make your own" — provisioning Edge Function

`supabase/functions/provision_user/index.ts` (security-definer; seeds member tables only — never touches `public`).

```
POST /provision_user { handle }
  - require auth (auth.uid())
  - validate handle (regex, uniqueness on platform.profiles)
  - insert platform.profiles
  - insert members.desktop_config (default theme = Warm Slate vars, default enabled_apps)
  - seed: 1 welcome members.posts row, 1 system members.messages row
  - return { handle }
Client routes to /u/:handle?edit=1
```
Idempotent; wrap in a transaction.

---

## 6. Routing, shells, node resolution

- Routes: `/` (Eric's flagship hub node — current site + "Make your own"), `/u/:handle` (a member node), `/me`.
- `/` → `node = { kind:'flagship' }`. `/u/:handle` → resolve `platform.profiles` → `node = { kind:'member', userId }`.
- `App.jsx` provides `ProfileContext({ node, isOwner })`. Shells unchanged; apps call `useRepo()`.
- `isOwner` (member node owner, or Eric on flagship) gates edit affordances.
- Eric's hub is the graph root: it hosts the signup CTA and can surface a directory/feed of member nodes.

---

## 7. L2 customization (member nodes)

- **Theme:** load `members.desktop_config.theme` → set as inline CSS vars on the desktop root. Your `index.css` is already 100% `--color-*`, so it themes the whole OS for free.
- **Apps:** `APP_REGISTRY` stays the master list; `enabled_apps` / `app_order` / `app_labels` filter, reorder, rename per user.
- **Editor:** an owner-only "Customize" app writing `desktop_config`.
- Eric's node customization stays however it is today (or reuses the same editor against flagship config — optional).

---

## 8. Auth changes

- Extend `useAuth`: `signUp` (magic link) → first login with no `platform.profiles` row forces handle-claim → `provision_user`.
- Keep Eric's `admin_users` / `isAdmin` for the **flagship node + platform moderation**.
- Add `isOwner(node)` for member-node edit gating.

---

## 9. Safety baseline (once strangers can write members tables)

Rate limits on member inserts; `platform.reports` + moderation queue (reuse Admin app);
`platform.blocks` before opening DMs; image upload validation via Supabase Storage.

---

## 10. Phased task checklist (for Claude Code)

**Phase 0 — member backend + node routing (1–2 wk)**
- [ ] Create `platform` + `members` schemas; `platform.profiles`, `members.desktop_config`, member content tables (mirror Eric's column shapes).
- [ ] RLS on all `members.*` / `platform.*`. **Do not touch `public.*`.**
- [ ] `ProfileContext` + `useRepo()`; implement `flagshipRepo` (Eric's tables) and `memberRepo(userId)`.
- [ ] Routes `/` (flagship) and `/u/:handle` (member); shells consume `node`.

**Phase 1 — signup + self-authoring (2–3 wk)**
- [ ] `provision_user` Edge Function + handle-claim + "Make your own" button on Eric's hub.
- [ ] Owner-scoped in-place editing for member nodes; "Customize" app → `desktop_config`.
- [ ] Move member-side content apps off local JS files onto `members.*` tables.

**Phase 2 — social graph (2 wk)**
- [ ] `follows`, `notifications`; cross-node ChemMail; guestbook signing on others' nodes.
- [ ] Feed of recent public `members.posts` from followees; member directory on the hub.

**Phase 3 — safety + scale**
- [ ] `reports` + moderation queue, rate limits, `blocks`, Storage upload pipeline.

---

## 11. Open risks

1. **Schema parity** — member tables are canonical; mirror into Eric's only when his node needs it. Keep a shared column-spec to prevent silent drift.
2. **Moderation is the real cost, not code** — budget from Phase 1.
3. **Cold start** — a network with one populated node is a ghost town; have a distribution plan.
4. **RLS is the entire security model for members** — audit every policy; add tests asserting user A can't write user B's rows.
5. **Storage cost curve** — per-user media moves you off free Supabase; model break-even.
6. **L3 (custom code/apps)** — deferred; needs sandboxing + XSS controls.

---

## 12. Final communication model + icon visibility (Phase 4)

The three communication surfaces were finalized as follows. The **public Message
Board forum is retired** (folded into Messages) and **ChemMail is repurposed into
Mail** (the old in-app DM inbox moved to Messages).

| App | What it is | Account? | Owner sees | Visitor sees |
|---|---|---|---|---|
| **Guestbook** | Open public wall | No (anonymous OK on public nodes) | All signatures | Can sign; sees all |
| **Mail** | Contact form that **emails the owner's real address** (Resend, via `send_mail` Edge Function) | No (enters own email + message) | Reads it in their email — **no in-app inbox** | Send-only form |
| **Messages** | 1:1 **AOL-style** realtime chat over `members.messages` | **Yes — both logged in** | Buddy-list of **all** their conversations | **Only their own thread** with the owner (RLS-enforced) |

- **Mail** — the owner's email is resolved **server-side** in `send_mail` and never
  returned to the client. `profiles.mail_enabled=false` disables it. Anti-spam:
  per-IP (5/hr) + per-recipient (20/hr) limits, length caps, `members.mail_log`
  audit, optional hCaptcha hook. `reply_to` = the visitor's email.
- **Messages** — privacy comes from RLS (`select` where `auth.uid()` is sender or
  recipient), not client filtering. Realtime via the `supabase_realtime`
  publication on `members.messages`; the client ignores the event payload and
  refetches RLS-scoped.
- **Guestbook** — anonymous insert allowed when the target `profile_id` is public,
  with a body-length cap and a per-book rate limit (anon signs are keyed on
  `profile_id` since there's no signer id / request IP in-trigger).

### Owner-aware icon visibility

Each `APP_REGISTRY` entry carries a `visibility` (default `public`); both shells
filter icons using `{ node, isOwner, isAuthed, hasNode }` via `useNodeView`:

| `visibility` | Shows when | Apps |
|---|---|---|
| `public` | any visitor | About, Blog, Pictures, Music, Reviews, Food List, Car Mods, Wish List, Travel Log, Daily Digest, Projects, Manifestations, Games, README.sh, Terminal, Guestbook, Profile, Mail, Directory(+flagshipOnly) |
| `authed` | viewer logged in (RLS-scoped) | Messages |
| `owner` | `isOwner` (own node; Eric on flagship) | Notifications, ChemFeed, Customize |
| `guest` | logged out OR node-less; hidden on your own node | Make Your Own |
| `hidden` | never in menus | Admin |

A logged-in **visitor** on someone else's node never sees that owner's
`owner`-visibility apps — those belong on the visitor's own node (`isOwner`, not
merely "authed"). `flagshipOnly`/`memberOnly` remain as orthogonal node-kind
constraints (Directory = flagship; Profile/Customize = member).

---

## 13. Activity feed + likes (ChemFeed v2)

ChemFeed is a chronological stream of what the people you follow have done on
their member nodes, with likes and deep-links into the item on its owner's node.

### Activity model
- `platform.activity (id, actor_id, kind, app, item_id, title, preview, created_at)`.
  One row per member content item, written by a single SECURITY DEFINER trigger
  (`on_content_activity`) on INSERT into the member content tables. Clients never
  insert activity (no insert policy). RLS select = actor profile is_public AND no
  block between actor and viewer. The `activity_feed` view adds the followee
  filter + actor profile.
- `kind -> app -> source table` mapping (one trigger, easy to extend):

  | kind | app (APP_REGISTRY id) | source table | title / preview |
  |---|---|---|---|
  | blog | blog | members.posts | title / content snippet (published only) |
  | photo | pictures | members.photos | title / url |
  | review | reviews | members.reviews | title / poster |
  | food | restaurants | members.food_items | name / icon |
  | travel | trips | members.travel_log | destination / icon |
  | carmod | carmods | members.car_mods | name / - |
  | project | projects | members.projects | name / tagline |
  | music | music | members.music_tracks | name / artist |
  | digest | digest | members.digest_entries | title / note |
  | wishlist | wishlist | members.wishlist_items | name / image |

  Hidden rows (is_hidden) and unpublished posts are skipped.

### Deep-link contract
- URL: `/u/:handle?app=<APP_REGISTRY id>&item=<item_id>`.
- Both shells, on load (and via the `ericOS:openApp` event whose `detail` may be
  `{ app, itemId }`), stash the item with `setInitialItem(app, itemId)` then open
  the app. Apps read it once via `useInitialItem(appId)` and open that item.
  Wired for blog, pictures, reviews, restaurants, trips (others open to the app).

### Likes
- `platform.reactions (user_id, target_type, target_id, unique)`. RLS: own
  insert/delete, open select. A SECURITY DEFINER trigger notifies the liked
  activity's owner (`kind='like'`), respecting blocks and never self-notifying.

### Limitations (deliberate)
- Flagship (Eric, public.*) activity is not in the feed.
- Comments are deferred until moderation/rate-limit maturity. Likes only.

---

## 14. Music integrations (Phase 6, embed-first)

The Music app has three segments, driven by playlist URLs (embeds only, no API
keys / OAuth / secrets):

- **My Productions** — local list of Eric's own tracks (unchanged).
- **My Music** — SoundCloud HTML5 widget for the owner's playlist, wrapped in
  Napster (P2P client) chrome.
- **Current Rotation** — Spotify embed for the owner's playlist, wrapped in
  iTunes chrome (Name/Artist/Album/Time header + now-playing bar). Falls back to
  a curated album list when no Spotify URL is set.

### Per-node config
- Migration adds `soundcloud_url` and `spotify_url` to `members.desktop_config`
  (members set them in Customize → Music; validated for `soundcloud.com/` and
  `open.spotify.com/playlist/`). Flagship URLs live in the `FLAGSHIP_MUSIC`
  constant in the Music app (no public.* schema change). `memberRepo`/
  `useDesktopConfig` already select `*`, so the columns flow through.

### Expected embed URL formats
- SoundCloud: any `soundcloud.com/<user>/sets/<playlist>` URL. Rendered via
  `https://w.soundcloud.com/player/?url=<encoded>&visual=true`.
- Spotify: `https://open.spotify.com/playlist/<id>` → `https://open.spotify.com/embed/playlist/<id>`.
- Always use PLAYLIST links so the embed auto-syncs when the playlist is edited.
  Single-track links would be static.

### Behavior
- Auto-sync: embeds load live from the providers, so editing a linked playlist
  updates the app with no redeploy.
- Spotify playback: previews for everyone, full tracks only for viewers logged
  into Spotify Premium (expected; the iTunes UI is a styled shell).

### Deferred: real "Current Rotation" via Spotify OAuth
There is no public embed for "recently played." A true auto-pulled rotation
would need: a Spotify app (client id/secret), an OAuth authorization-code flow
so the owner links their Spotify account, secure server-side token storage +
refresh (an Edge Function + a `members.spotify_tokens` table, RLS owner-only),
and a server endpoint that calls the Spotify Web API (`/me/player/recently-played`
or top tracks) on a schedule or on load. That is a separate phase (keys, OAuth,
server pieces) deliberately out of scope here.
