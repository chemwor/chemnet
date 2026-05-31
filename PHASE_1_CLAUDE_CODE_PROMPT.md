# Phase 1 — Claude Code Kickoff Prompt

> Paste everything below the line into Claude Code. Scoped to **Phase 1 only** of
> `SOCIAL_PLATFORM_BUILD_SPEC.md`. **Prerequisite: Phase 0 is merged** (schemas `platform`/`members`,
> RLS, `flagshipRepo`/`memberRepo`/`useRepo`, `ProfileContext`, `/` and `/u/:handle` routing).

---

You are working in the **ChemNet** repo. Read `CLAUDE.md` and `SOCIAL_PLATFORM_BUILD_SPEC.md` first.
Phase 0 is already done. This task is **Phase 1 only: signup + self-authoring + L2 customization.**

Goal of Phase 1: a stranger can hit **"Make your own,"** sign in, claim a handle, get their own
provisioned node at `/u/:handle`, **edit all their own content in place**, and **customize the look
and layout** of their desktop. No social graph yet.

## HARD GUARDRAILS (do not violate)

1. **Never touch `public.*` / Eric's tables or content.** Everything new is additive and member-side.
2. Provisioning and all writes target `members.*` / `platform.*` only.
3. All client DB access goes through the `supabase` singleton and the Phase 0 **repository layer**
   (`useRepo()`), never inline `createClient`, never a table directly from a component.
4. **Apps receive NO props** — node/repo/isOwner come from context.
5. Customization ceiling is **L2 (content + look/layout)**. Do **not** build arbitrary custom
   apps/code (L3), the social graph/feed/notifications (Phase 2), or moderation/rate-limit/Storage
   upload pipelines (Phase 3). If you start writing those, stop.
6. **Media uploads are out of scope.** Use **preset wallpapers and preset/initials avatars** only.
   (Supabase Storage upload is Phase 3.)
7. No test suite — verify with `npm run dev`; `npm run build` and `npm run lint` must pass.

## Phase 1 deliverables

### A. Auth: signup + handle claim

Extend `src/hooks/useAuth.js` (keep magic-link OTP; keep `admin_users`/`isAdmin` for the flagship
node + platform admin):

- After login, look up `platform.profiles` for `auth.uid()`.
- If **no profile** exists → route to a **handle-claim screen** (desktop-styled): validate handle
  against `^[a-z0-9_]{3,20}$` + uniqueness, then call the `provision_user` Edge Function (B).
- If a profile exists → continue; `/me` resolves to their `/u/:handle`.
- Expose `isOwner(node)` for edit gating (member-node owner, or Eric on flagship).

### B. Provisioning Edge Function

Create `supabase/functions/provision_user/index.ts` (runs with service role / security-definer so it
can seed past RLS — **member tables only, never `public`**):

```
POST /provision_user { handle }
  - require authenticated caller (verify JWT → auth.uid())
  - re-validate handle (regex + uniqueness)
  - INSERT platform.profiles (id = auth.uid(), handle, display_name, is_public = true)
  - INSERT members.desktop_config (default theme = current "Warm Slate" CSS vars,
      default enabled_apps = sensible starter set, default app_order)
  - SEED: one welcome members.posts row, one system members.messages row (from "SysOp")
  - return { handle }
```

Must be **idempotent** (no-op if a profile already exists) and **transactional**. Do not run it
against the live DB — output the function; the human deploys it.

### C. "Make your own" entry point

- Add a prominent **"Make your own"** CTA on the flagship hub (`/`) — a desktop-native affordance
  (e.g., a dock/desktop icon or a banner app) that starts the auth → handle-claim → provision flow,
  then routes the new user to `/u/:handle?edit=1`.

### D. Owner-scoped in-place editing (member nodes)

For every member content app (Blog, Pictures, Guestbook view, Reviews, Food List, Travel Log,
Wish List, Car Mods, Projects, Music, Daily Digest, ChemMail):

- When `isOwner` is true, expose **create / edit / delete** affordances inside the app, writing via
  `useRepo()` → `memberRepo` (RLS enforces own-rows). Reuse the existing Admin app's editor patterns
  where helpful, but scoped to `auth.uid()` and surfaced **in place** on the node.
- When `isOwner` is false, the app is read-only (no edit UI). RLS must also block writes server-side.
- Confirm guestbook signing and ChemMail send work as a **visitor on someone else's node** (insert
  allowed by Phase 0 policies); these are the two cross-user writes.

### E. Move member content off local JS files → `members.*`

Apps that read static co-located data today (`WishList/wishlist-data.js`, Music, Food List, Travel
Log, Car Mods, Projects, Blog content) must, **for member nodes**, read/write `members.*` via
`memberRepo`. Flagship (`/`) may keep reading its files via `flagshipRepo` — do not change flagship
behavior. Net effect: `memberRepo` is fully table-backed; `flagshipRepo` is unchanged.

### F. "Customize" app — L2 customization (owner-only)

Add a `Customize` app to `APP_REGISTRY` (owner-only on member nodes) that writes
`members.desktop_config` and is reflected live:

- **Theme:** edit CSS-variable overrides (`--color-accent`, `--color-surface`, etc.); apply by
  injecting them as inline styles on the desktop root. (Your `index.css` is already 100% CSS vars.)
- **Wallpaper:** choose from preset keys.
- **Apps:** toggle `enabled_apps`, reorder (`app_order`), rename (`app_labels`) — registry stays the
  master list; the shells filter/reorder/relabel per `desktop_config`.
- **Icon layout:** persist `icon_positions` if the shell supports drag.
- Both shells must honor `desktop_config` for the viewed node (so visitors see the owner's setup).

## Acceptance criteria

- A new account can: sign in → claim handle → get provisioned → land on `/u/:handle` in edit mode,
  with a welcome post and a system ChemMail present.
- Owner can create/edit/delete their content across apps; it persists in `members.*` and appears
  **only** on their node. A second account cannot edit the first's node (UI hidden **and** RLS blocks).
- Owner can change theme, wallpaper, enabled/ordered/renamed apps in `Customize`; changes persist and
  are visible to other visitors of that node.
- A visitor can sign another user's guestbook and send them ChemMail; cannot edit anything else.
- `/` (flagship) is unchanged; **no `public.*` table or content was modified.**
- `npm run build` and `npm run lint` pass.

## Suggested order

1. Auth handle-claim + `provision_user` (B, A) → 2. "Make your own" CTA (C) → 3. `memberRepo`
table-backed writes + owner edit affordances (E, D) → 4. `Customize` app + shell honoring
`desktop_config` (F).

When done, summarize: files added/changed, the default `enabled_apps` starter set you chose, any
content-shape gaps you hit moving apps to `members.*`, and anything needing a human decision before
Phase 2 (social graph).
