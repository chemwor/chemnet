# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**ChemNet** — Eric's personal site, built as a fake Win95-inspired desktop OS (inspired by windows93.net). It's a "world to explore," not a page to scroll. Everything is an **app**; navigation means opening windows. Desktop on large screens, a phone-OS launcher on mobile — the *same* app components power both shells.

> Note: the product was originally specced as "EricOS" and some internals still use that name (e.g. the `ericOS:openApp` DOM event). The user-facing brand is **ChemNet** (page title, localStorage keys `chemnet_*`, seed scripts).

## Social platform conversion (in progress)

This repo is being converted into a multi-tenant social platform — "everyone gets their own ChemNet node." **Design source of truth: `SOCIAL_PLATFORM_BUILD_SPEC.md`. Per-phase build instructions: `PHASE_0_CLAUDE_CODE_PROMPT.md` … `PHASE_3_CLAUDE_CODE_PROMPT.md`.**

Non-negotiable rules for all platform work:

- **Never alter `public.*` / Eric's existing tables or content.** They are the flagship hub node (single-tenant). Everything is additive in two new schemas: `members` (multi-tenant, one row per `user_id`) and `platform` (`profiles`, `follows`, `notifications`, `reports`, `blocks`).
- All app data access goes through the **repo layer** (`src/lib/repo`, `useRepo()`) resolved by `ProfileContext`: `flagshipRepo` on `/`, `memberRepo(userId)` on `/u/:handle`. Apps still receive **no props**.
- Cross-user writes RLS forbids (notifications, etc.) are done via security-definer triggers / Edge Functions — never a client inserting a row "for" another user.
- After applying `members`/`platform` migrations, **expose both schemas** in Supabase → Settings → API → "Exposed schemas" or every `supabase.schema(...)` call fails.

## Commands

```bash
npm run dev       # Vite dev server (HMR)
npm run build     # production build → dist/
npm run preview   # serve the production build locally
npm run lint      # ESLint (flat config, eslint.config.js)

node scripts/seed.mjs              # seed Supabase from local data (uses inlined service_role key)
node scripts/add-art-of-losing.mjs # one-off content-insert script — pattern for adding a single row
```

There is **no test suite**. Verify changes by running `npm run dev` and exercising the app.

Deploy is Netlify (`netlify.toml`): `npm run build`, publish `dist/`, SPA redirect to `index.html`, Node 20.

## Architecture

### Shells and the registry are the whole framework

- `src/App.jsx` is tiny: `useMediaQuery('(max-width: 768px)')` picks `DesktopShell` vs `MobileShell`, both handed one shared `useWindowManager()` instance. There is **no boot screen / auth gate at the root** — the spec's `BootScreen`/`useBootSequence`/`AuthGate` were never built.
- `src/apps/registry.js` (`APP_REGISTRY`) is the single source of truth. Both shells render purely from it — nothing about apps is hardcoded in the shells. To add an app you add a registry entry and a folder; nothing else.
- **Apps receive NO props.** Shells render `<AppComponent />` with an empty prop list. An app that needs windowing, auth, or to open another app does it via hooks/DOM events, never props. Window chrome (titlebar, drag, resize, maximize) is entirely the shell's job — apps just render content.

### Registry entry shape (real, differs from older docs)

```js
{
  id: 'videos',
  label: 'ChemTube',
  icon: 'videos',                         // KEY into ICONS (src/shell/icons.js), NOT a file path
  component: () => import('./Videos/Videos.jsx'),  // lazy import
  defaultSize: { width, height },
  defaultPosition: { x, y },
  openOnBoot: false,                       // 'about' is the only true → opens on load
  pinned: true|false,                      // taskbar/dock
  auth: true|false,                        // true only for 'admin'
  category: null | 'games' | 'hidden',     // 'hidden' = admin, never shown in menus
  mobile: true|false,                      // (games) whether it appears on mobile
  hideFromDesktop: true,                   // optional — opens on boot, no desktop icon
}
```

`MENU_CATEGORIES` (bottom of the file) drives Start Menu submenus — currently just `games`.

### Icons are inline SVG, not image files

`src/shell/icons.js` exports `ICONS`, a map of `iconKey → inline SVG string` (16×16, Win95 palette). The registry's `icon` field is one of these keys. Adding an app icon = add an `ICONS` entry, not a PNG. (`public/icons.svg`, `public/projects/**` are content assets, separate from app icons.)

### Window manager

`src/hooks/useWindowManager.js` holds `windows: [{ id, zIndex, minimized, maximized }]` plus a monotonically increasing `nextZ` for focus ordering. Exposes `openApp / closeApp / minimizeApp / maximizeApp / focusApp`. `openApp` re-focuses & un-minimizes an already-open app instead of duplicating it. Position/size live in the registry defaults; `WindowFrame` owns live drag/resize state.

### Lazy loading

`DesktopShell` wraps each `app.component` import in `React.lazy` and **caches the result in a module-level `Map` (`lazyCache`)** so windows don't remount on every shell re-render. Keep this pattern if you touch shell rendering.

### Cross-component "open this app" channel

Anything (terminal commands, easter eggs, links inside apps) opens an app by dispatching a DOM event rather than threading callbacks:

```js
window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: 'admin' }))
```

Both shells listen for `ericOS:openApp`. There's also `ericOS:meltdown` (easter egg) and `chemnet:layer-unlocked` (see layers). Use these events for app-to-shell signalling.

## Data layers

Three distinct persistence layers — know which one a feature uses:

**1. Supabase (`src/lib/supabase.js`)** — the URL and **anon key are hardcoded in source** (public client; not env vars). All client DB access must go through this exported `supabase` singleton — never `createClient` inline in a component. Tables in use: `blog_posts`, `guestbook_entries`, `message_threads`, `message_posts`, `reviews`, `restaurants`, `photos`, `digest_entries`, `contact_messages`, `hidden_files`, `high_scores`, `admin_users`. Schema lives in `supabase/migrations/*.sql` (timestamped). RLS pattern: **public read, admin-only write**, where "admin" = an authenticated user whose email is in `admin_users` (`auth.jwt()->>'email'`). Add a migration when changing schema; don't edit existing ones.

**2. localStorage (game/easter-egg state, client-only)**
- `src/lib/highscores.js` — personal scores + a names leaderboard (`chemnet_highscores`, `chemnet_leaderboard`, `chemnet_player`). Games call `submitScore/submitWin/submitLoss/submitDraw/submitTime/submitSolitaire`; the Scoreboard app reads `getTopScores/getMostActive/getGameStats`. A game's id here must match its registry `id` (note `pong` vs the `tabletennis` key — check before adding).
- `src/lib/layers.js` — the 5-tier "depth" progression (`chemnet_layers`). `recordDiscovery(action)` logs exploration (`ls-a`, `found-hidden-dir`, `right-click-desktop`); reaching thresholds flips `unlockedLayers` and dispatches `chemnet:layer-unlocked`. Layers 3–5 are mostly stubbed.

**3. Seed/admin scripts (`scripts/*.mjs`)** — Node scripts that write to Supabase using the **inlined service_role key** to bypass RLS. Use these (or the in-app Admin panel) to load content, not the anon client.

### Auth & admin

`src/hooks/useAuth.js` (Supabase magic-link OTP, redirect to `window.location.origin`) exposes `{ user, isAdmin, loading, loginWithMagicLink, logout }`. `isAdmin` is set by checking the user's email against `admin_users`. Only `src/apps/Admin/Admin.jsx` consumes `useAuth` — it's the CMS for all Supabase-backed content and is hidden (`category: 'hidden'`, `auth: true`), opened via the terminal `admin` command / `ericOS:openApp`.

## Conventions

- One app = one self-contained folder `src/apps/Name/Name.jsx`. Co-locate static content data beside it (`Blog/ai-paper.js`, `WishList/wishlist-data.js`).
- **Theme "Warm Slate":** all colors are CSS variables defined in `src/index.css` (`--color-accent` burnt orange `#FF6B35`, `--color-surface`, `--color-titlebar-active`, etc.). Use `var(--color-*)` — never hardcode hex in components. UI uses `react95` components + a matching ThemeProvider; content font is `Courier Prime` mono.
- `category: 'hidden'` apps must stay out of all menus/desktop. Respect the `mobile` flag for games (canvas/keyboard-only games like `fighter` are `mobile: false`).
- When adding a Supabase-backed feature: migration for schema → RLS policies (public read / admin write) → read path via the `supabase` singleton → write path behind the Admin panel or a seed script.
