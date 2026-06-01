# Phase 5 — Claude Code Kickoff Prompt: ChemFeed v2 (activity feed + likes)

> Paste everything below the line into Claude Code. Scoped to **Phase 5 only**. **Prerequisite:
> Phases 0–2 are merged** (follows, notifications, the v1 ChemFeed, repo layer, `/u/:handle` routing);
> Phase 3 (`platform.blocks`) and Phase 4 (icon visibility) should be in too. Update
> `SOCIAL_PLATFORM_BUILD_SPEC.md` to document the activity model when done.

---

You are working in the **ChemNet** repo. Read `CLAUDE.md` and `SOCIAL_PLATFORM_BUILD_SPEC.md` first.
Phase 5 turns **ChemFeed** into a real **friends activity feed**: a chronological stream of what the
people you follow have recently done (posted a photo, wrote a blog, rated a movie, added a wishlist
item, etc.), where **clicking an item deep-links to that friend's node with the item opened**. Plus
**likes**. Think "Instagram feed, but only your friends, and every item lives on its owner's retro-OS
node."

**Comments are explicitly OUT of scope this phase** — we'll add them later once moderation is built
out. Build likes only.

## HARD GUARDRAILS

1. **Never touch `public.*` / Eric's tables.** The activity feed covers **member** nodes
   (`members.*`). Flagship activity is intentionally out of scope (see Limitations).
2. All client DB access goes through the **repo layer** (`useRepo()`); **apps receive NO props** —
   node/repo/isOwner/currentUser from context.
3. **Activity rows and like-notifications for other users are created server-side** (security-definer
   triggers), never by a client inserting a row "for" someone else. RLS must keep forbidding that.
4. **RLS is the privacy boundary.** Feed shows only public items from public profiles, and must
   respect `platform.blocks` (exclude in both directions).
5. No test suite — verify with `npm run dev`; `npm run build` and `npm run lint` must pass.

## Phase 5 deliverables

### A. Activity events table (one feed query, not N)

Additive migration:
```sql
create table platform.activity (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                 -- 'blog'|'photo'|'review'|'wishlist'|'travel'|'carmod'|'project'|'music'|'digest'
  app text not null,                  -- APP_REGISTRY id to open (e.g. 'blog','pictures','reviews')
  item_id text not null,              -- the row id in the member content table
  title text,                         -- display text ("Dune: Part Two", a photo caption…)
  preview text,                       -- thumbnail url or short snippet, nullable
  created_at timestamptz default now()
);
create index on platform.activity (actor_id, created_at desc);
```
- **RLS:** `select` allowed when the actor's profile `is_public` **and** there is no block between
  the actor and the viewer; **no client insert** (triggers only).
- **Triggers (security-definer):** on `INSERT` into each member content table
  (`members.posts`, `members.photos`, `members.reviews`, `members.food_items`, `members.travel_log`,
  `members.car_mods`, `members.projects`, `members.music_tracks`, `members.digest_entries`) write one
  `platform.activity` row mapping kind/app/item_id/title/preview. Only for items that are public
  (skip drafts/hidden if such a flag exists). Centralize the mapping so adding an app later = one trigger.
- Optional: a one-off backfill of existing member rows.

### B. Likes (`platform.reactions`)

```sql
create table platform.reactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,          -- 'activity' (and reusable for items later)
  target_id text not null,
  created_at timestamptz default now(),
  unique (user_id, target_type, target_id)
);
```
- **RLS:** insert/delete only own (`user_id = auth.uid()`); `select` open (for counts), still subject
  to block rules.
- **Trigger (security-definer):** on a new like, create a `platform.notifications` row for the liked
  item's owner (`kind='like'`), respecting blocks, never notifying the actor about their own item.
- Repo methods: `reactions.like(target)`, `reactions.unlike(target)`, counts + "did I like this."

### C. Deep-link: open an item on its owner's node

- Extend the member route to accept query params: `/u/:handle?app=<registryId>&item=<id>`.
- On member-node load, the shell reads those params and dispatches the existing **`ericOS:openApp`**
  event with an item payload (e.g. `{ detail: { app, itemId } }`); both shells already listen for
  `ericOS:openApp`.
- Each content app gains a small "open to this item" hook: if an `itemId` is provided, open that
  item's detail/scroll to it instead of the list. Standardize via context (`useInitialItem()` or
  similar) so it's one shared pattern, not per-app glue.
- Feed cards build this URL for their "open on node ↗" action.

### D. ChemFeed v2 UI

- Repo method `feed.list()` → `platform.activity where actor_id in (select followee_id from
  platform.follows where follower_id = auth.uid()) order by created_at desc`, joined to
  `platform.profiles` for handle/display name/avatar. (RLS already enforces public + not-blocked —
  rely on it.)
- **Card:** actor avatar + handle · action text by `kind` ("posted a photo", "rated *Dune* 9/10",
  "added to their wishlist") · preview thumb/snippet · relative timestamp · ♥ like button + count ·
  **"open on their node ↗"** (the deep link from C).
- **Grouping & filters:** Today / This week headers; filter by kind (Photos · Blogs · Reviews · …)
  and by friend.
- **New-since-last-visit:** mark items newer than the user's last view (store last-seen timestamp in
  `localStorage` or `desktop_config`); show a subtle "new ↑" pill.
- **Realtime:** subscribe to `platform.activity` for the followee set (or poll on open) so new items
  surface live — keep it lightweight.
- **Empty state:** "Follow some nodes to fill your feed →" linking to the Members directory.
- **Logged-out:** "Sign in to see your feed" state.
- **Styling:** lean into the retro-OS aesthetic — a Win95 "Recent Activity" Explorer window / AOL-MSN
  "what's new with your buddies" ticker. Use `var(--color-*)`, no hardcoded hex.

## Limitations to note (don't try to fix here)

- **Flagship (Eric) activity isn't in the feed** — his content is in `public.*`, which we don't touch.
  If you later want Eric's posts to appear, that's a separate, deliberate decision.
- **Comments are deferred** (need moderation/blocks/rate-limit maturity). Likes only this phase.

## Acceptance criteria

- Creating a member item (e.g. a photo) writes a `platform.activity` row via trigger; it appears in
  followers' ChemFeed, newest first, with avatar/handle/preview.
- Clicking a feed item navigates to `/u/<handle>?app=&item=` and the correct app opens focused on that
  item.
- A viewer can like/unlike a feed item; the count updates; the item's owner gets a `like` notification
  (never for their own like); blocked users don't see each other's activity or generate notifications.
- Empty/logged-out states work; only public items from public profiles show.
- **No `public.*` table modified.** `npm run build` and `npm run lint` pass.

## Suggested order

1. `platform.activity` + triggers + RLS (A) → 2. deep-link route + `ericOS:openApp` item payload +
per-app "open to item" hook (C) → 3. ChemFeed v2 query + UI (D) → 4. `platform.reactions` likes +
notification trigger + like button (B).

When done, summarize: migrations/triggers added, the activity `kind→app` mapping, the deep-link param
contract, and anything needing a human decision before comments are added.
