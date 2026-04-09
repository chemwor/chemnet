# CLAUDE.md — EricOS Personal Site

## Project Overview

A personal site / walled garden styled as a custom Win95-inspired desktop OS.
Inspired by windows93.net — a world to explore, not a page to scroll.
Built with React + Vite + React95 + Tailwind. Deployed to Netlify. Auth via Supabase.

**Core concept:** Everything is an "app." Navigation = opening windows.
Desktop on large screens. Launcher/panel UI on mobile. Same app components power both.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend framework | React 19 + Vite |
| UI component base | react95 (Win95 components + ThemeProvider) |
| Styling | Tailwind CSS (utility) + react95 theme tokens |
| Window management | Custom hook (`useWindowManager`) |
| Drag/resize | `@dnd-kit` or `react-draggable` for desktop windows |
| Animation | Framer Motion |
| Auth | Supabase (magic link, allowlist-gated) |
| Database | Supabase (guestbook, now-status, private content) |
| Deploy | Netlify |
| Icons | Win95-era `.ico` style PNGs + custom SVGs |

---

## Color Theme — "Warm Slate"

Override react95's default teal with this palette. Apply via `ThemeProvider` and CSS variables.

```css
:root {
  /* Desktop */
  --color-desktop-bg: #1E1C28;        /* deep purple-grey wallpaper */

  /* Window chrome */
  --color-titlebar-active: #3D2B1F;   /* deep brown-orange */
  --color-titlebar-inactive: #2C2A35; /* muted purple-grey */
  --color-titlebar-text: #F0EBE1;     /* warm off-white */

  /* Win95 bevel system */
  --color-surface: #2C2A35;           /* window body / button face */
  --color-bevel-light: #4A4555;       /* top-left bevel highlight */
  --color-bevel-dark: #110F18;        /* bottom-right bevel shadow */
  --color-border: #1A1820;

  /* Accent */
  --color-accent: #FF6B35;            /* burnt orange — used sparingly */
  --color-accent-hover: #FF8C5A;

  /* Text */
  --color-text-primary: #F0EBE1;      /* warm off-white */
  --color-text-secondary: #A09AB0;    /* muted lavender-grey */
  --color-text-disabled: #5A5465;

  /* Selection / focus */
  --color-selection-bg: #FF6B35;
  --color-selection-text: #F0EBE1;

  /* Taskbar */
  --color-taskbar-bg: #221F2E;
  --color-taskbar-border: #4A4555;

  /* Start button */
  --color-start-bg: #2C2A35;
  --color-start-hover: #FF6B35;
}
```

**Font stack:**
- UI chrome (window titles, menus, buttons): `'W95FA'` or `'Px437 IBM VGA8'` (bitmap fonts)
- Content (inside app windows): `'Courier Prime'` or `'iA Writer Mono S'`
- Display / headings: `'Archivo Black'` or `'Space Mono'`

Load bitmap fonts from: https://int10h.org/oldschool-pc-fonts/fontlist/

---

## Project Structure

```
src/
├── main.jsx
├── App.jsx                    # Root — detects mobile/desktop, renders shell
│
├── shell/
│   ├── DesktopShell.jsx       # Wallpaper, icon grid, taskbar, window layer
│   ├── MobileShell.jsx        # Launcher grid, status bar, panel navigation
│   ├── Taskbar.jsx            # Start button, open app buttons, clock
│   ├── StartMenu.jsx          # Popup app list
│   ├── DesktopIcon.jsx        # Clickable icon on the wallpaper
│   ├── Wallpaper.jsx          # Background — static or generative
│   └── BootScreen.jsx         # Fake POST/login on first visit
│
├── windows/
│   ├── WindowFrame.jsx        # Desktop: draggable/resizable chrome
│   ├── MobilePanel.jsx        # Mobile: fullscreen panel with back button
│   └── useWindowManager.js    # State: open[], minimized[], zOrder[], focused
│
├── apps/
│   ├── registry.js            # Single source of truth — all app definitions
│   ├── About/                 # README.md — who Eric is
│   ├── Projects/              # DMHOA, MGN, BlitzSquares
│   ├── Now/                   # What Eric is working on right now
│   ├── Writing/               # Blog posts / notes
│   ├── Terminal/              # Fake terminal with real commands
│   ├── Music/                 # Guitar, gear, recordings
│   ├── BJJ/                   # Training log
│   ├── Kili/                  # Kilimanjaro tracker
│   ├── Contact/               # Email, socials
│   ├── Guestbook/             # Supabase-backed public guestbook
│   ├── Minesweeper/           # Playable game
│   ├── Solitaire/             # Playable game
│   ├── Trash/                 # Dead projects graveyard
│   └── Settings/              # Control panel — uses.tech style
│
├── easter-eggs/
│   ├── BSOD.jsx               # Fake blue screen of death
│   ├── Screensaver.jsx        # Triggers after 60s idle
│   └── SecretFolder/          # Hidden content — unlocked by finding it
│
├── auth/
│   ├── useAuth.js             # Supabase auth hook
│   └── AuthGate.jsx           # Wrapper — some apps require login
│
├── hooks/
│   ├── useWindowManager.js
│   ├── useMediaQuery.js       # Detects mobile vs desktop
│   ├── useIdleTimer.js        # Screensaver trigger
│   └── useBootSequence.js     # First-visit boot flow
│
├── lib/
│   ├── supabase.js
│   └── appRegistry.js         # (same as apps/registry.js — re-exported)
│
└── assets/
    ├── icons/                 # Win95-style PNG icons per app
    ├── fonts/                 # Bitmap fonts
    ├── sounds/                # startup.mp3, error.mp3, click.mp3
    └── wallpapers/            # Desktop background options
```

---

## App Registry — `src/apps/registry.js`

Every app is defined here. The shells read this file — nothing is hardcoded.

```js
// src/apps/registry.js
export const APP_REGISTRY = [
  {
    id: 'about',
    label: 'README.txt',
    icon: '/icons/notepad.png',
    component: () => import('./About/About.jsx'),
    defaultSize: { width: 480, height: 360 },
    defaultPosition: { x: 80, y: 60 },
    openOnBoot: true,          // opens automatically on first visit
    pinned: true,              // shown in dock/taskbar always
    auth: false,               // public
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: '/icons/folder.png',
    component: () => import('./Projects/Projects.jsx'),
    defaultSize: { width: 560, height: 420 },
    defaultPosition: { x: 120, y: 80 },
    openOnBoot: false,
    pinned: true,
    auth: false,
  },
  {
    id: 'terminal',
    label: 'Terminal',
    icon: '/icons/terminal.png',
    component: () => import('./Terminal/Terminal.jsx'),
    defaultSize: { width: 500, height: 340 },
    defaultPosition: { x: 200, y: 140 },
    openOnBoot: false,
    pinned: true,
    auth: false,
  },
  {
    id: 'now',
    label: 'Now',
    icon: '/icons/sticky.png',
    component: () => import('./Now/Now.jsx'),
    defaultSize: { width: 300, height: 260 },
    defaultPosition: { x: 600, y: 60 },
    openOnBoot: false,
    pinned: false,
    auth: false,
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: '/icons/docs.png',
    component: () => import('./Writing/Writing.jsx'),
    defaultSize: { width: 520, height: 440 },
    defaultPosition: { x: 160, y: 100 },
    openOnBoot: false,
    pinned: false,
    auth: false,
  },
  {
    id: 'music',
    label: 'Guitar.app',
    icon: '/icons/music.png',
    component: () => import('./Music/Music.jsx'),
    defaultSize: { width: 440, height: 380 },
    defaultPosition: { x: 180, y: 120 },
    openOnBoot: false,
    pinned: false,
    auth: false,
  },
  {
    id: 'bjj',
    label: 'Dojo.exe',
    icon: '/icons/bjj.png',
    component: () => import('./BJJ/BJJ.jsx'),
    defaultSize: { width: 420, height: 360 },
    defaultPosition: { x: 160, y: 110 },
    openOnBoot: false,
    pinned: false,
    auth: false,
  },
  {
    id: 'kili',
    label: 'Kili.exe',
    icon: '/icons/mountain.png',
    component: () => import('./Kili/Kili.jsx'),
    defaultSize: { width: 460, height: 380 },
    defaultPosition: { x: 140, y: 90 },
    openOnBoot: false,
    pinned: false,
    auth: false,
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: '/icons/mail.png',
    component: () => import('./Contact/Contact.jsx'),
    defaultSize: { width: 360, height: 280 },
    defaultPosition: { x: 220, y: 160 },
    openOnBoot: false,
    pinned: true,
    auth: false,
  },
  {
    id: 'guestbook',
    label: 'Guestbook',
    icon: '/icons/guestbook.png',
    component: () => import('./Guestbook/Guestbook.jsx'),
    defaultSize: { width: 440, height: 400 },
    defaultPosition: { x: 200, y: 130 },
    openOnBoot: false,
    pinned: false,
    auth: false,    // read public, write requires magic link
  },
  {
    id: 'minesweeper',
    label: 'Minesweeper',
    icon: '/icons/mine.png',
    component: () => import('./Minesweeper/Minesweeper.jsx'),
    defaultSize: { width: 320, height: 360 },
    defaultPosition: { x: 240, y: 150 },
    openOnBoot: false,
    pinned: false,
    auth: false,
  },
  {
    id: 'solitaire',
    label: 'Solitaire',
    icon: '/icons/cards.png',
    component: () => import('./Solitaire/Solitaire.jsx'),
    defaultSize: { width: 580, height: 420 },
    defaultPosition: { x: 100, y: 80 },
    openOnBoot: false,
    pinned: false,
    auth: false,
  },
  {
    id: 'trash',
    label: 'Recycle Bin',
    icon: '/icons/trash.png',
    component: () => import('./Trash/Trash.jsx'),
    defaultSize: { width: 440, height: 340 },
    defaultPosition: { x: 180, y: 120 },
    openOnBoot: false,
    pinned: false,
    auth: false,
    desktopOnly: true,         // shown on desktop, not in launcher
  },
  {
    id: 'settings',
    label: 'Control Panel',
    icon: '/icons/settings.png',
    component: () => import('./Settings/Settings.jsx'),
    defaultSize: { width: 480, height: 380 },
    defaultPosition: { x: 160, y: 100 },
    openOnBoot: false,
    pinned: false,
    auth: false,
  },
]
```

---

## Window Manager — `useWindowManager.js`

```js
// src/hooks/useWindowManager.js
import { useState, useCallback } from 'react'

export function useWindowManager() {
  const [windows, setWindows] = useState([])   // { id, zIndex, minimized, position, size }
  const [nextZ, setNextZ] = useState(10)

  const openApp = useCallback((appId) => {
    setWindows(prev => {
      const existing = prev.find(w => w.id === appId)
      if (existing) {
        // bring to front, un-minimize
        return prev.map(w => w.id === appId
          ? { ...w, minimized: false, zIndex: nextZ }
          : w
        )
      }
      return [...prev, { id: appId, zIndex: nextZ, minimized: false }]
    })
    setNextZ(z => z + 1)
  }, [nextZ])

  const closeApp   = useCallback((id) => setWindows(p => p.filter(w => w.id !== id)), [])
  const minimizeApp = useCallback((id) => setWindows(p => p.map(w => w.id === id ? { ...w, minimized: true } : w)), [])
  const focusApp   = useCallback((id) => {
    setNextZ(z => z + 1)
    setWindows(p => p.map(w => w.id === id ? { ...w, zIndex: nextZ } : w))
  }, [nextZ])

  return { windows, openApp, closeApp, minimizeApp, focusApp }
}
```

---

## Shell Routing — `App.jsx`

```jsx
// src/App.jsx
import { useMediaQuery } from './hooks/useMediaQuery'
import { useWindowManager } from './hooks/useWindowManager'
import { DesktopShell } from './shell/DesktopShell'
import { MobileShell } from './shell/MobileShell'
import { BootScreen } from './shell/BootScreen'
import { useBootSequence } from './hooks/useBootSequence'

export default function App() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { booted } = useBootSequence()
  const windowManager = useWindowManager()

  if (!booted) return <BootScreen />

  return isMobile
    ? <MobileShell windowManager={windowManager} />
    : <DesktopShell windowManager={windowManager} />
}
```

---

## Mobile Shell Design

Mobile gets its own UX — not a broken desktop, but a "phone OS" skin.

```
Layout:
  - Fake status bar (time, battery icon, signal)
  - App icon grid (3 columns, scrollable if many apps)
  - Fake home bar at bottom
  - Tap icon → fullscreen MobilePanel slides up (Framer Motion)
  - MobilePanel has: back arrow, app title, close X
  - Swipe down to dismiss panel
  - Active app shown in bottom nav area

No dragging. No resizing. No z-stacking.
Each app is fullscreen when open.
```

```jsx
// MobilePanel.jsx — wraps any app for mobile
<motion.div
  initial={{ y: '100%' }}
  animate={{ y: 0 }}
  exit={{ y: '100%' }}
  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
  className="fixed inset-0 z-50 flex flex-col"
  style={{ background: 'var(--color-surface)' }}
>
  <div className="mobile-titlebar">
    <button onClick={onClose}>← Back</button>
    <span>{app.label}</span>
    <button onClick={onClose}>✕</button>
  </div>
  <div className="flex-1 overflow-auto p-4">
    <AppComponent />
  </div>
</motion.div>
```

---

## Terminal App — Supported Commands

```
help           → list all commands
whois eric     → short bio paragraph
ls             → list all apps/sections
open <appid>   → open an app by id
cat about.txt  → print about text
cat beliefs.txt
cat setup.txt  → gear, stack, tools
git log        → fake commit history (easter egg)
sudo           → "nice try."
exit           → close terminal
clear          → clear output
```

---

## Boot Sequence

On first visit (localStorage flag not set):

1. Black screen → white text, monospace font
2. Fake POST: `EricOS v1.0 ... checking memory ... OK`
3. Progress bar fills
4. "Welcome, stranger." or login prompt
5. Desktop fades in
6. `README.txt` opens automatically

Skip boot on subsequent visits (check `localStorage.getItem('ericOS_booted')`).

---

## Auth / Walled Garden

- **Public:** All apps visible and openable without login
- **Auth-gated apps:** Private notes, full writing archive, invite-only sections
- **Supabase magic link** — user enters email → gets link → session stored
- **Allowlist table** in Supabase: `allowed_emails (email text, role text)`
- `AuthGate.jsx` wraps protected app content — shows "Access Denied" dialog (Win95 style) if not authed

---

## Easter Eggs

| Trigger | Effect |
|---|---|
| Type `IDDQD` anywhere | BSOD.jsx renders full screen |
| 60s idle | Screensaver activates (flying toasters or custom) |
| Right-click desktop | Context menu with fake options |
| Open Trash | Shows "dead projects" — Zombie Corp, etc. |
| Find hidden folder icon | Unlocks secret app/page |
| Konami code | Surprise (TBD) |
| `sudo rm -rf /` in terminal | Dramatic fake meltdown, then recovery |

---

## Conventions

- Every app is a self-contained folder: `src/apps/AppName/AppName.jsx`
- Apps receive no props about windowing — they just render content
- Window chrome (titlebar, resize, drag) is always the shell's responsibility
- Use `var(--color-*)` CSS variables everywhere — never hardcode hex in components
- Icons should be 32x32 or 48x48 PNG, Win95 palette style
- Sounds are optional but should respect `prefers-reduced-motion` and user settings
- All Supabase calls go through `src/lib/supabase.js` — never inline client creation

---

## Build Order

1. **Scaffold:** `npm create vite@latest . -- --template react`, install react95, tailwind, framer-motion
2. **Theme:** Set up ThemeProvider with Warm Slate palette
3. **Shell:** DesktopShell + Taskbar (static, no windows yet)
4. **Window Manager:** `useWindowManager` hook + `WindowFrame` component
5. **App Registry:** registry.js + lazy load pattern
6. **First Apps:** About, Projects, Terminal (enough to feel real)
7. **Mobile Shell:** MobileShell + MobilePanel
8. **Boot Screen:** BootSequence
9. **Games:** Minesweeper, Solitaire
10. **Auth:** Supabase setup + AuthGate
11. **Easter Eggs:** BSOD, screensaver, terminal tricks
12. **Polish:** Sounds, wallpaper options, icons, favicon
