# Claude Code Prompt — Fix member-node content leaks + per-user editing

> Paste below the line into Claude Code. **Bug-fix pass** on the deployed multi-tenant build. Live
> evidence: on `/u/divinedancestudio`, About shows Eric's bio, the videos app shows Eric's videos,
> Pictures' storage path is hardcoded to Eric, Terminal appears, and members can't add their own
> content. Root cause: several apps aren't scoped to the viewed node and/or have no owner-add path.

---

You are working in the **ChemNet** repo. Read `CLAUDE.md` and `SOCIAL_PLATFORM_BUILD_SPEC.md` first.
Member nodes (`/u/:handle`) are leaking the flagship (Eric's) content and lack per-user editing. Fix
every item below. The guiding rule: **on a member node, an app must show ONLY that member's data (or
empty) — never Eric's — and the node owner must be able to add their own.**

## HARD GUARDRAILS
1. **Never touch `public.*` / Eric's content.** These fixes are about *not surfacing* flagship data on
   member nodes, plus adding member-side tables/columns (additive).
2. All data access through the **repo layer** (`useRepo()` → `memberRepo(userId)` on member nodes);
   **apps receive NO props**. A flagship-only sample/fallback must be gated behind
   `node.kind === 'flagship'` — never rendered on a member node.
3. No test suite — verify with `npm run dev`; `npm run build` and `npm run lint` must pass.

## A. Critical content leaks (do first — these are privacy bugs)

1. **About → per-user.** Stop rendering Eric's hardcoded bio on member nodes. Member About reads the
   member's profile (`platform.profiles` + a member About store — add `members` fields if needed:
   e.g. `members.profile_about jsonb` or columns), shows their **initials monogram** (not "EC"), and
   only their fields (empty fields hide). **Eric's flagship About stays bespoke.** (See
   `ONBOARDING_WIZARD_CLAUDE_CODE_PROMPT.md` for the per-person About template.)
2. **Videos (ChemTube/"Recital Dances") → scope to the member.** There is **no members videos table**,
   so it falls back to Eric's videos. Add `members.videos` (id, user_id, title, youtube_url/url,
   sort_order, created_at), wire `memberRepo.videos`, and make the app read the member's rows only
   (empty if none). Flagship keeps `public` videos. Owner can add YouTube videos (see C/B).
3. **Pictures → per-user storage path.** Replace the hardcoded `eric/pictures` path with a per-node
   path (`{user_id}/...`) for both read and write, so a member's photos read/write to *their* space,
   not Eric's. (Full upload pipeline is Phase 3; at minimum the path must be variable now.)
4. **Wish List → no Eric fallback on member nodes.** It currently shows Eric's wishlist at the top.
   Gate the sample/fallback behind `node.kind === 'flagship'` (same pattern Reviews/Restaurants use);
   member nodes show only the member's `members.wishlist_items` (empty if none).

## B. Owner can add/edit their own content (member nodes)
For the node **owner** (`isOwner`), ensure a working **add/edit/delete** path writing to `members.*`,
for **all** of: Reviews, The Food List, Wish List, Travel Log, Daily Digest, Pictures, Videos. Some
have `OwnerManager` already; audit each and wire the missing ones so the owner can actually populate
their node. Visitors stay read-only (UI hidden + RLS enforced).

## C. Music — per-user streaming links
Let the owner add their own **Spotify**, **SoundCloud**, and **YouTube** links (this member is a dance
studio — they want their channels). Store per-node (`members.desktop_config` or a music settings
record); render in the Music app. Embeds preferred (see `PHASE_6_CLAUDE_CODE_PROMPT.md`); add **YouTube**
to that set. Owner sets them in Customize.

## D. App visibility
1. **Terminal must be flagship-only** — it appears on member nodes; set its registry `visibility` so it
   shows only on Eric's flagship hub (and reconsider README.sh similarly). (See Phase 4 visibility.)
2. **Members can choose which apps show on their node.** Expose an app picker in **Customize** that
   writes `members.desktop_config.enabled_apps`; both shells already filter by it — make sure it's
   editable and respected. Default a sensible starter set for new nodes.

## E. Profile app — decide its purpose
The **Profile** app's role is unclear, especially for a visitor (it overlaps with About). Audit it and
pick one:
- **(Recommended)** Make Profile the **social card** only — avatar/handle, bio one-liner, follow button,
  follower/following counts/lists — and let **About** own the detailed bio. Clear division of labor.
- Or merge Profile into About and remove the separate Profile app.
Document the decision and make Profile coherent for a logged-out visitor.

## F. Screensaver + theme music → flagship-only (for now)
The idle **screensaver** and its **"Loose Cannon" theme audio** currently can run on member nodes.
Restrict both to **Eric's flagship node only** — gate on `node.kind === 'flagship'`. Member nodes get
no screensaver and no auto-playing audio for now (revisit later as an opt-in per-user feature).

## G. Custom wallpaper upload (owner)
Let the node **owner upload their own image** as the wallpaper, in addition to the presets. Use Supabase
Storage: a `wallpapers` bucket, **per-user folder** (`{user_id}/...`), public read, **owner-only write**
(path-based policy: `auth.uid()::text = (storage.foldername(name))[1]`). Validate **type (image) + size**
before upload; store the resulting URL in `members.desktop_config.wallpaper`. Owner sets it in Customize.
This is the first slice of the Phase 3 storage pipeline scoped to wallpaper — wallpapers are publicly
visible, so run them through the Phase 3 scan gate if present; otherwise enforce type/size validation at
minimum. (Avatar upload can follow the same pattern later.)

## H. "About ChemNet" explains the platform — never Eric
On a member node, About must **never** surface Eric's bio (covered in A1) — and its **default/empty
state** should be a generic **"About ChemNet"** explainer: what this site is ("a personal retro-OS node
on ChemNet — everyone gets their own at /u/their-handle"), not Eric's personal story. Provide one shared
"About ChemNet" blurb reused on every member node's empty About. **Eric's flagship About stays his
bespoke personal profile.**

## Acceptance criteria
- On any member node: About shows **that member** (initials monogram, their fields or empty) — **never
  Eric**; Videos shows the member's videos or empty — **never Eric's**; Wish List shows the member's
  items or empty (no Eric wishlist); Pictures read/write uses the member's own path.
- The node owner can add/edit/delete their own Reviews, Food, Wish List, Travel Log, Daily Digest,
  Pictures, and Videos; visitors are read-only.
- Owner can add Spotify/SoundCloud/YouTube links and they render in Music.
- Terminal does **not** appear on member nodes; members can pick which apps show via Customize.
- Profile has a clear, documented purpose distinct from About.
- The **screensaver + theme music run only on the flagship** — member nodes have neither.
- The owner can **upload a custom wallpaper image** (stored in their own folder); presets still work.
- A member node's About **never shows Eric's bio**; its empty/default state explains ChemNet.
- **No `public.*` change.** Eric's flagship node is unchanged. `npm run build` and `npm run lint` pass.

## Suggested order
1. Audit every content app for node scoping; gate all flagship samples behind `node.kind==='flagship'`
   (A4 + sweep). → 2. About per-user (A1). → 3. `members.videos` + scope + owner add (A2). → 4. Pictures
   per-user path (A3). → 5. owner add/edit sweep (B). → 6. Terminal visibility + Customize app picker
   (D). → 7. Music links (C). → 8. Profile decision (E). → 9. screensaver/music flagship-gate (F) +
   "About ChemNet" empty state (H). → 10. custom wallpaper upload (G).

When done, summarize: every app and whether its reads are now node-scoped, tables/columns added,
which apps gained owner-add, the Terminal/visibility change, and the Profile decision.
