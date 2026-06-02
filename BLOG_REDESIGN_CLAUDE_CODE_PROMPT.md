# Claude Code Prompt — Blog redesign (desktop two-column "old blog")

> Paste everything below the line into Claude Code. UI redesign of the existing Blog app. Desktop-first:
> a two-column article + sidebar layout; mobile collapses to one column. No data model required to
> ship the core — optional fields are additive and member-side.

---

You are working in the **ChemNet** repo. Read `CLAUDE.md` first. Goal: make the **Blog** app look like a
characterful early-2000s personal blog (LiveJournal/Xanga energy) **on desktop**, while keeping
long-form text fully readable. Today it's a plain Apple-Notes list + a Polished/Raw reader. Keep the
Polished/Raw toggle; restyle everything around it.

## HARD GUARDRAILS

1. **Don't break flagship reading or touch `public.*` schema in a breaking way.** The Blog reads
   through the repo layer (`useRepo()` → `posts`); flagship = `public.blog_posts`, member =
   `members.posts`. Keep both working.
2. **Apps receive NO props** — node/repo/isOwner/currentUser from context.
3. **Readability first.** The article column stays high-contrast and comfortable; the retro touches are
   framing, not noise. Don't sacrifice legibility for gimmicks.
4. **Render defensively.** Any new/optional field (mood, now-playing, tags, likes) must gracefully
   omit when absent — the redesign must look right even before those exist.
5. Use theme tokens (`var(--color-*)`, the cream notepad surface, `Courier Prime` content font); no
   hardcoded hex except deliberate paper/accent tones.
6. No test suite — verify with `npm run dev`; `npm run build` and `npm run lint` must pass.

## Deliverables

### A. Desktop post view — two columns
On desktop (`DesktopShell`), the open-post view becomes **article (left, ~70%) + sidebar (right, ~30%)**:

**Article column**
- **Title** in a display face; below it a **meta header** (LiveJournal style): `date · mood: … · now
  playing: … · N reads`. Each segment renders only if present (date + reads always; mood/now-playing
  optional).
- **Drop cap** auto-applied to the first letter of the first paragraph (no authoring needed).
- Render the body as **markdown**: style `>` blockquotes as **pull quotes** (large, accent left-rule),
  `---` as an **ornamental divider** (`✦ ─────`), and normal paragraphs as comfortable body text.
- Keep the **Polished / Raw** toggle in the title bar (Raw = unedited/typewriter feel, Polished =
  clean read).
- Footer: **tags** as chips + a **♥ like** control with count.

**Sidebar**
- **Archive** — posts grouped by month (`may 2026 (3)`), clickable to filter the list.
- **Tag cloud** — weighted by frequency (bigger = more posts), clickable to filter.
- **Now playing** — a small strip (from the owner's Spotify integration if present, else a per-post
  `now_playing` text, else hidden).
- **Hit counter** — an amber LCD-style "visitors" readout driven by the existing blog views data.
- **RSS** button (orange) — link to a feed (or stub the link if no feed endpoint yet).

### B. List view (secondary — optional but encouraged)
Replace the plain Notes rows with something with texture: **index cards** or **floppy-disk labels**
(each post = a labeled floppy with date + title + read count). Keep search. If time-boxed, leaving the
current list is acceptable — the post view is the priority.

### C. Mobile
On `MobileShell`, collapse to a single column: article first, then the sidebar blocks (archive, tag
cloud, now-playing, hit counter) stacked underneath. Drop cap + pull quotes still apply.

### D. Optional data (additive, member-side; flagship flagged)
To power mood/now-playing/tags if not already present, add nullable columns **to `members.posts`**
(`mood text`, `now_playing text`, `tags text[]`). Mirroring these onto `public.blog_posts` is an
owner-approved, additive change Eric can opt into later — **do not** make it a breaking change, and
don't alter existing flagship columns. Hit counter uses existing blog-views data; tag cloud + archive
derive from `tags` + `created_at` (no new tables).

## Dependencies (graceful — build without them)
- **♥ likes** → the Phase 5 `platform.reactions` table. If absent, render the heart as display-only
  (or hide it). Don't block on it.
- **Now playing (Spotify)** → Phase 6. If absent, fall back to the per-post `now_playing` text, else
  hide the line.

## Acceptance criteria
- Desktop open-post view shows the two-column layout: article with mood/now-playing header (when
  present), auto drop cap, markdown pull quotes + dividers, Polished/Raw toggle, tags + like; sidebar
  with archive, tag cloud, now-playing, hit counter, RSS.
- Optional fields/dependencies absent → the view still looks correct (segments omit cleanly).
- Mobile collapses to one column with the sidebar blocks below the article.
- Flagship (`/`) and member nodes both render via the repo; **no breaking `public.*` change**.
- Long-form posts remain comfortably readable. `npm run build` and `npm run lint` pass.

## Suggested order
1. Two-column desktop post layout + meta header + drop cap/markdown pull quotes (A) → 2. sidebar
(archive + tag cloud + hit counter + RSS; now-playing/likes behind graceful checks) → 3. mobile
collapse (C) → 4. optional `members.posts` columns (D) → 5. floppy/index-card list view (B) if time.

When done, summarize: files changed, any columns added to `members.posts`, how drop cap / pull quotes
are derived from content, and which dependencies (likes, now-playing) are stubbed vs live.
