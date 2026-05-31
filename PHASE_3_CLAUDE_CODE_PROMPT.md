# Phase 3 — Claude Code Kickoff Prompt

> Paste everything below the line into Claude Code. Scoped to **Phase 3 only** of
> `SOCIAL_PLATFORM_BUILD_SPEC.md`. **Prerequisite: Phases 0–2 are merged** (schemas/RLS/repo/routing,
> signup+provisioning+L2 editing, and the social graph: follows/notifications/feed/directory).

---

You are working in the **ChemNet** repo. Read `CLAUDE.md` and `SOCIAL_PLATFORM_BUILD_SPEC.md` first.
Phases 0–2 are done. This task is **Phase 3 only: safety + scale** — the things that become
mandatory the moment strangers can write and upload: blocks, rate limits, reporting + a moderation
queue, and a Supabase Storage upload pipeline with content scanning.

This phase is what makes the platform safe to open publicly. Treat the safety items as
non-negotiable, not nice-to-haves.

## HARD GUARDRAILS (do not violate)

1. **Never touch `public.*` / Eric's tables or content.** Additive, member/platform-side only.
2. All client DB access goes through the `supabase` singleton + **repository layer** (`useRepo()`).
   **Apps receive NO props** — node/repo/isOwner/currentUser/isAdmin from context.
3. **Moderation/admin powers are gated to platform admins** (`admin_users`), not member owners. Add a
   SQL helper `platform.is_admin()` (checks `auth.jwt()->>'email'` against `admin_users`) and use it
   in RLS, not ad-hoc client checks.
4. **Storage policies are a security boundary like RLS** — every bucket needs explicit policies;
   default-deny. Audit them.
5. **Image uploads must pass a moderation/safety check before becoming public** (see D). CSAM/NSFW
   scanning is mandatory for a public image host; if a vendor must be chosen, stub the integration
   behind one Edge Function and **fail closed** (content stays private until approved) — flag the
   vendor choice as a human decision. Never ship public uploads with no scanning path.
6. Stay in scope: no L3 custom apps/code; no new social features beyond enforcing safety on existing ones.
7. No test suite — verify with `npm run dev`; `npm run build` and `npm run lint` must pass.

## Phase 3 deliverables

### A. Blocks / mutes

- Migration (additive): `platform.blocks (blocker_id, blocked_id, created_at, primary key(...))`,
  RLS insert/delete where `blocker_id = auth.uid()`, select own.
- A SQL helper `platform.is_blocked(a uuid, b uuid)` (either direction).
- **Enforce blocks everywhere a cross-user interaction exists:** follows, ChemMail send, guestbook
  signing, feed inclusion, directory listing, and notification triggers (don't notify across a block).
  Enforce in RLS / trigger logic, not just the UI. Add Block/Unblock UI on a member node.

### B. Rate limits

- Trigger-based limits on member inserts: `members.posts`, `members.guestbook_entries`,
  `members.messages`, `platform.follows` (e.g. raise an exception if a user exceeds N inserts per
  rolling window per table). Centralize in one `platform.enforce_rate_limit(kind)` helper.
- Surface a clear, friendly error in the UI when a limit trips; normal usage must be unaffected. Make
  the thresholds easy to tune in one place.

### C. Reports + moderation queue (`platform.reports` exists from Phase 0)

- Migration (additive): RLS on `platform.reports` — any authed user can `insert` (`reporter_id =
  auth.uid()`); only `platform.is_admin()` can `select`/`update`.
- **Content hiding:** add `is_hidden boolean not null default false` (+ `hidden_reason text`) to each
  `members.*` content table. Update each table's read policy to exclude hidden rows for everyone
  **except the owner and admins** (`is_hidden = false or user_id = auth.uid() or platform.is_admin()`).
- **Report action** on content and profiles across apps → inserts a `platform.reports` row.
- **Moderation app** (admin-only, reuse the existing Admin app shell): review the report queue,
  resolve/dismiss, **hide content** (set `is_hidden`), and **suspend a profile** (e.g.
  `profiles.is_public = false` + a `suspended` flag) — all via security-definer functions so admins
  can act on rows they don't own.

### D. Supabase Storage upload pipeline

- Create buckets: `avatars`, `wallpapers`, `photos`, `music`. Path convention `{user_id}/...`.
- Storage RLS: public read; write/update/delete only where
  `auth.uid()::text = (storage.foldername(name))[1]` (users write only their own folder).
- Client upload with **type + size validation before upload**; on success store the public URL in the
  relevant `members.*` row (Pictures → `members.photos`, Music → `members.music_tracks`, avatar →
  `platform.profiles.avatar_url`, custom wallpaper → `members.desktop_config.wallpaper`).
- **Scanning gate:** uploads land **private/pending**; an Edge Function (`scan_upload`) runs the
  moderation check and only then flips the asset/row to public. Fail closed. This replaces the
  preset-only wallpaper/avatar limitation from Phase 1 (presets remain available too).
- Keep optional client-side image resize/compression minimal; note CDN/cost implications, don't
  over-build.

## Acceptance criteria

- A blocked user cannot follow, message, or sign the guestbook of the blocker, and the two don't
  appear in each other's feed/directory or generate notifications — enforced server-side (RLS/trigger),
  not just hidden in the UI.
- Exceeding an insert rate limit returns a clear error; ordinary use is unaffected; thresholds live in
  one tunable place.
- Any user can report content/a profile; an admin sees it in the moderation queue and can hide content
  (it disappears for the public via RLS but remains visible to its owner and admins) and suspend a user.
- A user can upload an avatar, a custom wallpaper, photos, and music within type/size limits; assets
  store under their own folder; others cannot write to that folder; public can read **only after the
  scan gate approves** (uploads fail closed if scanning is unavailable).
- Non-admins cannot read the report queue or call moderation functions.
- `/` (flagship) still works; **no `public.*` table or content was modified.** `npm run build` and
  `npm run lint` pass.

## Suggested order

1. `platform.is_admin()` + blocks (A) → 2. rate limits (B) → 3. reports RLS + `is_hidden` + moderation
app (C) → 4. Storage buckets + policies + client upload (D) → 5. `scan_upload` gate (fail closed).

When done, summarize: migrations/functions/buckets added, the rate-limit thresholds chosen, the
moderation actions implemented, and the **explicit human decisions still required** before public
launch (image-scanning vendor, storage/cost limits, terms-of-service / abuse-response policy).
