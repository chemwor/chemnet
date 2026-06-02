# Claude Code Prompt — Onboarding wizard (Windows setup on desktop, iPhone setup on mobile)

> Paste everything below the line into Claude Code. **Prerequisite:** Phase 1 (`provision_user`
> Edge Function, auth + handle claim, Customize, `members.desktop_config`). This is the **UI layer** on
> top of provisioning — a guided first-run setup, plus making the **About** app per-person.

---

You are working in the **ChemNet** repo. Read `CLAUDE.md` and `SOCIAL_PLATFORM_BUILD_SPEC.md` first.
Goal: a guided **setup wizard** new members go through after sign-in, that feels like a **Windows setup
wizard on desktop** and a **new-iPhone setup on mobile** — same steps, two skins. Plus: make **About**
a per-person profile (auto monogram from initials), not Eric's bespoke one.

## Core principles
- **Only the handle is required.** Every other step has a smart default and a **Skip** — the node goes
  live the moment the handle is claimed; the rest is polish, editable forever in Customize/About.
- **One source of truth.** The wizard writes the same `platform.profiles` + `members.desktop_config`
  that Customize/About edit later. No separate onboarding store.
- **Same steps, two shells.** A shared step-flow component renders Win95-wizard chrome in
  `DesktopShell`, iOS-setup chrome in `MobileShell` (mirrors the app's existing two-view pattern).

## HARD GUARDRAILS
1. **Never touch `public.*`.** Member data only (`platform.*`, `members.*`).
2. Provisioning still goes through the **`provision_user` Edge Function** (don't have the client insert
   profiles directly). The wizard collects values, then calls it / updates the member rows via the repo.
3. **Apps receive NO props** — context only. **No media uploads** this phase (avatar = generated
   monogram; wallpaper/theme = curated presets). Storage upload is Phase 3.
4. Use theme tokens; the wizard's retro chrome may use deliberate hardcoded palette tones.
5. No test suite — verify with `npm run dev`; `npm run build` and `npm run lint` must pass.

## Deliverables

### A. The shared setup flow
A `Setup` flow (component + small state machine) with these steps, **only step 2 required**:

1. **Welcome / sign in** — magic link or Google (reuse existing auth).
2. **Claim handle** *(required)* — live-validate `^[a-z0-9_]{3,20}$` + uniqueness against
   `platform.profiles`; this is `/u/:handle`.
3. **Identity** — display name + **initials monogram** preview (auto-derived; see C). Skippable →
   monogram from handle.
4. **Make it yours** — pick a **theme color** (curated palette set) + a **wallpaper** (curated set).
   Writes `members.desktop_config.theme` / `wallpaper`. Skippable → Warm Slate + default wallpaper.
5. **About starter** *(optional)* — 2–3 one-line prompts (bio, location, "what's this node about").
   Skippable; blank fields just hide on the profile.
6. **Finish** — call `provision_user` (if not already) / persist, then route to `/u/:handle?edit=1`
   with a brief welcome.

Progress indicator: "Step N of 5" on desktop, page dots on mobile. Back/Next on desktop; Continue/Skip
on mobile.

### B. Two skins
- **Desktop (`DesktopShell`): Windows-95 setup wizard** — gray dialog, navy title bar ("ChemNet
  Setup"), a teal vertical side banner, stepped pages, `Back` / `Next >` buttons (default button
  emphasized), `Cancel`. On-brand with the OS metaphor.
- **Mobile (`MobileShell`): new-iPhone setup** — full-screen steps, big iOS large-titles, muted
  subtitles, page dots, a blue **Continue** button pinned low, **Skip** as a secondary text button.
- Both render from the **same step definitions** — only chrome differs.

### C. Per-person About
- **Auto monogram:** generate initials from display name (fallback handle) and color the tile from the
  user's `theme` accent. Use this anywhere an avatar shows (About header, feed, directory) until real
  avatar upload exists (Phase 3).
- **About becomes a flexible profile** for member nodes: standard optional fields (name, location,
  about-me, links) rendered as the iOS-Settings list on desktop and the Apple-ID-style header + sections
  on mobile. Empty fields hide. Owner can edit in place (Phase 1 owner-edit) and/or via Customize.
- **Eric's flagship About stays bespoke** — do not genericize `public` About. Only the member-node
  About uses the flexible template (resolved via the repo/`node`).

### D. Curated presets
- A small set of **theme palettes** (named, e.g. Warm Slate, Vapor, Forest, Grape, Crimson) → CSS-var
  sets written to `desktop_config.theme`.
- A small set of **wallpapers** (keys/urls) → `desktop_config.wallpaper`. Presets only (no upload).

## Acceptance criteria
- A new user signs in → claims a handle → optionally sets name/monogram, theme, wallpaper, a couple of
  About lines → lands on `/u/:handle?edit=1` with those applied. Skipping everything but the handle
  still produces a working node with sensible defaults.
- The wizard renders as a Win95 setup wizard on desktop and an iPhone setup on mobile, from one step
  definition.
- About on a member node shows the auto-initials monogram + the flexible profile; empty fields hide;
  the owner can edit. Eric's flagship About is unchanged.
- Wizard writes `platform.profiles` + `members.desktop_config` (via `provision_user` / repo); **no
  `public.*` change**, no uploads. `npm run build` and `npm run lint` pass.

## Suggested order
1. Shared step-flow + state (A) → 2. handle-claim + finish wired to `provision_user` → 3. Win95 desktop
chrome + iOS mobile chrome (B) → 4. monogram util + per-person About template (C) → 5. theme/wallpaper
preset pickers (D).

When done, summarize: files added, the preset palettes/wallpapers chosen, how initials are derived, and
which steps are required vs skippable.
