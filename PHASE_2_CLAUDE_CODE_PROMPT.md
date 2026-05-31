# Phase 2 — Claude Code Kickoff Prompt

> Paste everything below the line into Claude Code. Scoped to **Phase 2 only** of
> `SOCIAL_PLATFORM_BUILD_SPEC.md`. **Prerequisite: Phases 0 and 1 are merged** (schemas + RLS +
> repo layer + routing from P0; signup/provisioning, owner editing, and L2 Customize from P1).

---

You are working in the **ChemNet** repo. Read `CLAUDE.md` and `SOCIAL_PLATFORM_BUILD_SPEC.md` first.
Phases 0–1 are done. This task is **Phase 2 only: the social graph that connects nodes** —
follows, notifications, a feed, cross-node ChemMail, and a member directory on the hub.

Goal of Phase 2: turn a set of isolated member nodes into a network — users can follow each other,
get notified about activity on their node, see a feed of who they follow, message anyone, and
discover other nodes from Eric's hub.

## HARD GUARDRAILS (do not violate)

1. **Never touch `public.*` / Eric's tables or content.** Everything is additive and member/platform-side.
2. All client DB access goes through the `supabase` singleton + the **repository layer** (`useRepo()`),
   never inline `createClient`, never a table directly from a component. Add social methods to the repo
   interface (follows/notifications/feed/directory) rather than bypassing it.
3. **Apps receive NO props** — node/repo/isOwner/currentUser come from context.
4. **Notifications for another user must be created server-side** (Postgres triggers running as table
   owner / security-definer), **never** by a client inserting a row "for" someone else — RLS forbids
   that and must keep forbidding it.
5. Out of scope (do **not** build): blocks/mutes, rate limiting, content moderation queue, and
   Supabase Storage uploads — those are **Phase 3**. Note any place where their absence is a known gap.
   No L3 custom apps/code.
6. No test suite — verify with `npm run dev`; `npm run build` and `npm run lint` must pass.

## Phase 2 deliverables

### A. Follows (`platform.follows` exists from Phase 0)

- Migration (additive): RLS on `platform.follows` — `insert`/`delete` only where
  `follower_id = auth.uid()`; `select` open (the graph is public). Indexes on `follower_id` and
  `followee_id`.
- Repo + UI: **Follow / Unfollow** button on a member node (hidden on your own node and when logged
  out → prompts auth). Follower / following **counts** and **lists** on the profile/About area.

### B. Notifications (`platform.notifications` exists from Phase 0)

- Migration (additive): RLS — recipient can `select` and `update` (mark read) **own** rows
  (`user_id = auth.uid()`); **no client insert**.
- **Trigger functions** (security-definer) that insert a notification on:
  - new `platform.follows` row → notify `followee_id` (`kind='follow'`)
  - new `members.guestbook_entries` row → notify `profile_id` (`kind='guestbook_sign'`)
  - new `members.messages` row → notify `recipient_id` (`kind='chemmail'`)
  - (optional) new `members.board_posts` reply → notify thread owner (`kind='board_reply'`)
  - Never notify the actor about their own action (`actor_id <> user_id`).
- UI: a notifications surface (a `Notifications` app and/or a taskbar/menubar unread badge) listing
  recent items, linking to the source, with mark-as-read. **Optional** live updates via Supabase
  Realtime subscription on `platform.notifications` for the current user — keep it lightweight; polling
  on open is acceptable for MVP.

### C. Feed — "what's new from people you follow"

- Repo method `feed.list()` returning recent **public** `members.posts` from followed users
  (`user_id in (select followee_id from platform.follows where follower_id = auth.uid())`), newest
  first, joined to `platform.profiles` for handle/display name/avatar. (A SQL view is fine; a
  materialized view is a later optimization — note it, don't build it.)
- A **`ChemFeed`** app (registry entry) showing the feed with a friendly empty state ("Follow some
  nodes to fill your feed"). RLS already restricts reads to public rows — rely on it; don't re-implement
  visibility in the client.

### D. Cross-node ChemMail wiring

- Phase 1 already allows sending to any user. Add a **compose-to-handle** path (resolve handle →
  `recipient_id` via `platform.profiles`) and ensure received mail shows in the recipient's inbox and
  fires the `chemmail` notification (via the B trigger). Thread/conversation view is optional.

### E. Member directory on the hub (`/`)

- A **`Directory`** app on the flagship hub listing **public** `platform.profiles` (recent or
  recently-active), with **search by handle/display name**, each linking to `/u/:handle`. Read-only;
  reads `platform.profiles where is_public`. This is how people discover nodes from your hub.

## Acceptance criteria

- User A can follow/unfollow User B from B's node; follower/following counts and lists update for both.
- A follow, a guestbook signature, and a received ChemMail each create a notification **for the
  recipient** (created by trigger, not the client), visible in their Notifications surface and
  markable as read. Actors never get notified about their own actions.
- `ChemFeed` shows recent public posts from followed users, newest first, with avatars/handles, and a
  correct empty state when following no one.
- A user can compose ChemMail by handle to anyone; it lands in their inbox.
- The hub `Directory` lists and searches public nodes and links correctly to `/u/:handle`.
- A logged-out visitor is prompted to auth when trying to follow / message; cannot perform those writes.
- `/` (flagship) still works; **no `public.*` table or content was modified.** `npm run build` and
  `npm run lint` pass.

## Suggested order

1. Follows RLS + Follow/Unfollow UI + counts (A) → 2. Notification triggers + Notifications surface
(B) → 3. Feed view + `ChemFeed` app (C) → 4. ChemMail compose-to-handle + notification wiring (D) →
5. Hub `Directory` (E).

When done, summarize: files/migrations added, the trigger functions written, where missing
blocks/rate-limits/moderation create a known abuse gap (feeds Phase 3 planning), and anything needing
a human decision before Phase 3.
