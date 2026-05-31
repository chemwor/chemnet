# Phase 0 — Claude Code Kickoff Prompt

> Paste everything below the line into Claude Code. It is scoped to **Phase 0 only** of
> `SOCIAL_PLATFORM_BUILD_SPEC.md`. Do not let it drift into later phases.

---

You are working in the **ChemNet** repo (see `CLAUDE.md`). We are converting ChemNet into a
multi-tenant social platform. Read `SOCIAL_PLATFORM_BUILD_SPEC.md` first — it is the design source
of truth. This task is **Phase 0 only**.

## Architecture recap (must hold)

- **Eric's site = the flagship hub node.** It lives in the existing `public` schema tables and must
  keep working **exactly as it does today**. Do not migrate, rename, or change those tables.
- **Members = a new `members` schema**, shared multi-tenant tables, one row per user (`user_id`).
- **Network = a new `platform` schema** (profiles, follows, notifications, reports).
- React apps never query a table directly. They go through a **repository** resolved by which node
  is being viewed: `flagshipRepo` (Eric's tables) on `/`, `memberRepo(userId)` on `/u/:handle`.

## HARD GUARDRAILS (do not violate)

1. **Never touch `public.*` / Eric's existing tables.** No `ALTER`, no `DROP`, no rename. Phase 0 is
   purely additive.
2. **Do not edit existing migrations.** Add new timestamped files in `supabase/migrations/` per the
   repo convention.
3. All client DB access stays through the existing `supabase` singleton (`src/lib/supabase.js`) —
   never `createClient` inline.
4. **Apps receive NO props** (repo convention). Provide the node + repo via React context, not props.
5. Keep the existing lazy-loading + registry patterns in the shells intact.
6. Do **not** build signup, the provisioning Edge Function, the customization editor, or the social
   graph — those are Phases 1–2. If you find yourself writing them, stop.
7. There is no test suite. Verify with `npm run dev` and by exercising the app. Don't add a test
   framework.

## Phase 0 deliverables

### A. Database migrations (new files only)

Create timestamped migrations in `supabase/migrations/` that:

1. `create schema platform; create schema members;`
2. **platform tables:** `platform.profiles`, `platform.follows`, `platform.notifications`,
   `platform.reports` — exact shapes per spec §3a.
3. **members content tables** mirroring the column shapes of the corresponding `public` tables:
   `members.posts` (← `public.blog_posts`), `members.photos`, `members.reviews`,
   `members.guestbook_entries`, `members.messages`, `members.board_threads`, `members.board_posts`,
   `members.food_items`, `members.travel_log`, `members.wishlist_items`, `members.car_mods`,
   `members.projects`, `members.digest_entries`, `members.music_tracks`, `members.desktop_config` —
   shapes per spec §3b. Every content row has
   `user_id uuid not null references auth.users(id) default auth.uid()`.
4. **RLS** on every `members.*` and `platform.*` table using the patterns in spec §4
   (read-public-or-own / write-own; guestbook and messages have their special policies). Enable RLS
   and add explicit policies — default-deny otherwise.

> I (the human) will apply these migrations to Supabase. Output them as files; do not attempt to run
> them against the live database.

### B. Repository layer (`src/lib/repo/`)

1. `types.ts` — a `Repo` TypeScript interface covering every app's data needs
   (`posts`, `photos`, `guestbook`, `messages`, `reviews`, `foodItems`, `travelLog`, `wishlist`,
   `carMods`, `projects`, `digest`, `music`, `board`, `desktopConfig`), each with the methods the
   current apps use (`list`, `get`, `create`, `update`, `remove` as needed).
2. `flagshipRepo.ts` — implements `Repo` against Eric's `public` tables (and current local data files
   where an app still reads from a file). This must reproduce today's behavior exactly.
3. `memberRepo.ts` — `memberRepo(userId)` implements `Repo` against `members.*`, filtering reads by
   `user_id = userId` and stamping writes with `auth.uid()`.
4. `useRepo.ts` — hook returning the correct repo from `ProfileContext`.

### C. Node context + routing

1. `ProfileContext` providing `{ node, isOwner }` where
   `node = { kind: 'flagship' } | { kind: 'member', userId, handle }`.
2. Add `react-router-dom`. Routes:
   - `/` → `node = { kind:'flagship' }`, renders the current site **unchanged**.
   - `/u/:handle` → resolve `platform.profiles` by handle → `node = { kind:'member', userId, handle }`;
     404 (friendly desktop-style "node not found") if missing or private and viewer isn't the owner.
   - `/me` → redirect to the signed-in user's `/u/:handle` if a profile exists, else `/`.
3. `App.jsx`: wrap shells in `ProfileContext`. The shells (`DesktopShell`/`MobileShell`) stay
   structurally the same; they now read `node`/repo from context.
4. Refactor each existing app to read via `useRepo()` instead of importing `supabase`/local data
   directly. On `/` behavior must be identical to before.

## Acceptance criteria

- `npm run dev` runs clean; `npm run build` and `npm run lint` pass.
- `/` renders Eric's site **identical to current `main`** (flagship via `flagshipRepo`).
- With one manually-seeded `platform.profiles` row + a few `members.*` rows for that user, visiting
  `/u/<that-handle>` renders a desktop showing **that user's** content (via `memberRepo`), and an
  unknown handle shows the friendly 404.
- No `public.*` table was altered; only new migration files were added.
- All apps go through `useRepo()`; no app imports `supabase` or local data files directly anymore
  (except inside `flagshipRepo`).

## Suggested order

1. Migrations (A) → 2. `Repo` interface + `flagshipRepo` and refactor apps to `useRepo()` on `/`
(prove no behavior change) → 3. `ProfileContext` + routing → 4. `memberRepo` + `/u/:handle`.

When done, summarize: files added/changed, any column-shape mismatches you had to resolve between
`public.*` and `members.*` (these feed the schema-parity ritual), and anything that needs a human
decision before Phase 1.
