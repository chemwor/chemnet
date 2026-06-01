# Claude Code Prompt — Notifications as a pager (icon + UI)

> Paste everything below the line into Claude Code. Self-contained UI/restyle of the existing
> Notifications app. **Prerequisite:** the Notifications app from Phase 2 exists (reads
> `platform.notifications`). Deep-link-on-tap is best with Phase 5's `/u/:handle?app=&item=` contract;
> if that's not in yet, fall back to opening the actor's node.

---

You are working in the **ChemNet** repo. Read `CLAUDE.md` first. Goal: turn the **Notifications** app
into a **2000s pager / beeper** — both the desktop icon and the app UI. Lean fully into the metaphor:
the window *is* a handheld pager you read "pages" off of. No data-model changes — this is icon + UI +
behavior on top of the existing `platform.notifications` data.

## HARD GUARDRAILS

1. **No schema changes. Don't touch `public.*`.** Read notifications through the existing repo/data
   path; don't add tables or columns.
2. **Apps receive NO props** — node/repo/currentUser/isOwner from context. Notifications is an
   owner-only app (only the signed-in owner sees their own pages).
3. Sound may play **only after a user gesture** (browser autoplay rules); ship it **muted by default**
   with a toggle.
4. Respect `prefers-reduced-motion` — no buzz/shake/blink when the user opts out.
5. Use theme tokens (`var(--color-*)`); the LCD accent should derive from `--color-accent` (amber).
   No hardcoded hex except inside the self-contained pager "device" art.
6. No test suite — verify with `npm run dev`; `npm run build` and `npm run lint` must pass.

## Deliverables

### A. Pager icon
Add a **16×16 inline SVG** pager/beeper to `src/shell/icons.js` (`ICONS` map, Win95 palette — dark
plastic body, small light LCD strip, a couple of button dots) under a new key like `pager`, and point
the **Notifications** entry in `src/apps/registry.js` `icon` field at it. (Keep the icon legible at
16px — blocky, high-contrast.)

### B. Pager-device UI
Restyle the Notifications app as a handheld pager:
- **Device shell:** a beveled plastic body — translucent late-90s plastic (clear teal/grape) **or**
  Win95 gray; pick one and commit. A faux antenna + a tiny non-functional "battery" indicator as set
  dressing.
- **LCD screen:** monochrome **amber** readout (derive from `--color-accent`), monospace, faint
  scanline texture, subtle inset border so it reads as a screen.
- **Pages (notifications):** each on one LCD line in pager shorthand, lowercase + abbreviated, with a
  relative time. Map by `kind`:
  - like → `★ {handle} liked yr {thing}`
  - follow → `+ {handle} followed u`
  - guestbook_sign → `✎ {handle} signed yr book`
  - chemmail/mail → `✉ msg from {handle}`
  - board_reply → `↩ {handle} replied`
- **Unread:** bold row + blinking cursor/LED; show a count on the device (`3 NEW PAGES`).
- **Controls (physical buttons):** ▲▼ to move the selection, a **READ** button to mark the selected
  page read, and a **CLEAR ALL** button to mark all read (writes `read=true` via the existing path).
- **Grouping:** LCD dividers `NEW` then `EARLIER` (or by day).
- **Empty state:** LCD shows `-- NO NEW PAGES --`.

### C. Behaviors
- **Buzz on new:** when a new notification arrives, the device does a short shake + LED flash. Use a
  Supabase **Realtime** subscription on the current user's `platform.notifications` (or poll on open if
  Realtime isn't wired). Gate motion behind `prefers-reduced-motion`.
- **Sound:** optional short pager *beep* on new — **muted by default**, with a speaker toggle on the
  device; only initialize audio after a user gesture.
- **Tap a page → go to the source:** use the notification `payload` to deep-link. With Phase 5's
  contract, navigate to `/u/{actor_handle}?app={app}&item={item_id}`; without it, open the actor's
  node (`/u/{actor_handle}`) or the relevant app. Mark that page read on open.

### D. Flavor (optional but encouraged)
- **Numeric-code easter egg:** show a faux pager code next to playful events (e.g. `143` for a like,
  `911` when there are many unread). Pure cosmetic.
- Keep copy lowercase/abbreviated everywhere for the beeper voice.

## Accessibility
- The LCD shorthand is decorative; provide a full, plain-language label per notification for screen
  readers (e.g. `aria-label="Maya liked your photo, 10:42 PM"`).
- Use an `aria-live="polite"` region so new pages are announced.
- All buttons are real `<button>`s with `aria-label`s; the app is keyboard-navigable (▲▼/Enter).

## Acceptance criteria
- The Notifications desktop icon is a pager; the app renders as a pager device with an amber LCD list
  of real notifications from `platform.notifications`.
- New notifications buzz + (if unmuted) beep; motion/sound respect reduced-motion and autoplay rules.
- READ marks one page read, CLEAR ALL marks all read, and these persist.
- Tapping a page navigates to the right place (deep-link when available) and marks it read.
- Works in both `DesktopShell` and `MobileShell`. **No schema/`public.*` changes.**
  `npm run build` and `npm run lint` pass.

When done, summarize: the icon key added, files changed, whether Realtime or polling was used, and the
`kind → pager-shorthand` mapping so it's easy to extend.
