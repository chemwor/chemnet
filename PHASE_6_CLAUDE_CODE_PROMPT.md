# Phase 6 — Claude Code Kickoff Prompt: Music integrations (SoundCloud + Spotify, embed-first)

> Paste everything below the line into Claude Code. Scoped to **Phase 6 only**. **Prerequisite:
> Phases 0–1 merged** (repo layer, `/u/:handle`, Customize + `desktop_config`). Update
> `SOCIAL_PLATFORM_BUILD_SPEC.md` when done.

---

You are working in the **ChemNet** repo. Read `CLAUDE.md` and `SOCIAL_PLATFORM_BUILD_SPEC.md` first.
Phase 6 turns the **Music** app into two integrated sections, **using official embeds only — no API
keys, no OAuth, no secrets**:

- **My Music → SoundCloud**, styled like **Napster** (early-2000s P2P client).
- **Current Rotation → Spotify**, styled like **iTunes** (classic track-list + now-playing bar).

Each section is driven by a **playlist URL the owner pastes** — so the content **auto-syncs**: when the
owner edits that playlist on SoundCloud/Spotify, the embed reflects it with no code change.

## HARD GUARDRAILS

1. **Embeds only this phase.** No Spotify/SoundCloud API keys, no OAuth, no tokens, no server calls.
   (Auto-pulling real listening history via the Spotify Web API is a **deferred** later phase.)
2. **Never touch `public.*`'s schema.** Member settings go in `members.desktop_config` (additive).
   For the flagship, read Eric's two URLs from a small config constant — do **not** add columns to
   `public.*`.
3. All data access via the **repo layer** (`useRepo()`); **apps receive NO props** — node/isOwner from
   context.
4. Sandboxed iframes with the correct `allow` attributes (autoplay/encrypted-media as the providers
   require); respect any CSP. Use `var(--color-*)` for chrome, no hardcoded hex.
5. No test suite — verify with `npm run dev`; `npm run build` and `npm run lint` must pass.

## Deliverables

### A. Per-node music links

- Additive migration: add `soundcloud_url text` and `spotify_url text` to `members.desktop_config`.
- Flagship: store Eric's two URLs in a small config (a constant in the Music app or a flagship
  settings object) — no `public.*` schema change.
- Repo: expose these via the existing config read path so the Music app gets the right URLs per node
  (`memberRepo` → that member's `desktop_config`; `flagshipRepo` → the flagship constant).

### B. Music app — three modes

Refactor `src/apps/Music/…` into tabs/segments:

1. **My Productions** (existing) — keep the current local/`members.music_tracks` list.
2. **My Music (SoundCloud)** — if `soundcloud_url` is set, render the **SoundCloud HTML5 widget**
   iframe for that **playlist** URL, wrapped in **Napster chrome** (gray/blue P2P-client list look,
   waveform vibe). Empty state if unset: owner sees "Add your SoundCloud playlist in Customize,"
   visitors see nothing/placeholder.
3. **Current Rotation (Spotify)** — if `spotify_url` is set, render the **Spotify embed** iframe for
   that **playlist** URL, wrapped in **iTunes chrome** (Name/Artist/Album/Time column header styling +
   a faux now-playing bar around the embed). Same empty-state behavior.

> Use **playlist** embeds (not single-track) so content auto-syncs. Note in code comments that there's
> no public embed for "recently played" — that's the deferred API upgrade.

### C. Customize — owner sets the URLs

- In the Customize app (owner-only), add two fields: **SoundCloud playlist URL** and **Spotify
  playlist URL**, saved to `members.desktop_config`.
- Validate they're real provider URLs (`soundcloud.com/...`, `open.spotify.com/playlist/...`); show a
  small inline preview/confirmation. Trim/normalize.

## Notes on behavior (document these)

- **Auto-sync:** because the embeds load live from the providers, editing the linked playlist updates
  the app automatically — no redeploy. Single-track embeds would be static, so always use playlists.
- **Playback limits (Spotify):** previews for everyone; full tracks only for viewers logged into
  Spotify Premium. This is expected — the iTunes UI is a styled shell around the official embed.
- **SoundCloud API** is intentionally unused (new keys are hard to obtain); the widget needs none.

## Acceptance criteria

- An owner pastes a SoundCloud playlist URL and a Spotify playlist URL in Customize; visitors to that
  node see the **Napster-styled SoundCloud player** and the **iTunes-styled Spotify player**, both
  playing.
- Editing the linked playlist on the provider updates what shows in the app with no code change.
- No API keys / tokens / secrets anywhere in the client or repo; nothing server-side added.
- Flagship Music works from Eric's configured URLs with **no `public.*` schema change**.
- Empty states are clean when a URL is unset. `npm run build` and `npm run lint` pass.

## Suggested order

1. Migration + config read (A) → 2. Customize URL fields (C) → 3. Music app three-mode refactor with
the two embeds + Napster/iTunes chrome (B).

When done, summarize: the migration, files changed, the exact embed URL formats expected, and a clear
description of the **deferred Spotify-OAuth "real current rotation"** upgrade (what it would add and
the server pieces it needs) so it's ready to scope later.
