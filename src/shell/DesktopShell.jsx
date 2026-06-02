import { Suspense, lazy, useMemo, useEffect, useState, useCallback, useRef, memo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { APP_REGISTRY } from '../apps/registry'
import { DesktopIcon } from './DesktopIcon'
import { Taskbar } from './Taskbar'
import { Wallpaper } from './Wallpaper'
import { CRTOverlay } from './CRTOverlay'
import { ContextMenu } from './ContextMenu'
import { OffscreenToast } from './OffscreenToast'
import { WindowFrame } from '../windows/WindowFrame'
import { BSOD } from '../easter-eggs/BSOD'
import { Screensaver } from '../easter-eggs/Screensaver'
import { KonamiOverlay } from '../easter-eggs/KonamiOverlay'
import { Meltdown } from '../easter-eggs/Meltdown'
import { LayerNotification } from './LayerNotification'
import { recordDiscovery } from '../lib/layers'
import { useIdleTimer } from '../hooks/useIdleTimer'
import { useKonamiCode } from '../hooks/useKonamiCode'
import { useSecretCode } from '../hooks/useSecretCode'
import { useNodeView } from './useNodeView'
import { usePresence } from '../hooks/usePresence'
import { setInitialItem } from '../hooks/useInitialItem'

// Cache lazy components so they don't remount on every render
const lazyCache = new Map()
function getLazyComponent(app) {
  if (!lazyCache.has(app.id)) {
    lazyCache.set(app.id, lazy(app.component))
  }
  return lazyCache.get(app.id)
}

function BusyCursorCleanup({ children }) {
  useEffect(() => {
    document.body.classList.add('cursor-busy')
    return () => document.body.classList.remove('cursor-busy')
  }, [])
  return children
}

function BusyCursor() {
  return (
    <BusyCursorCleanup>
      <div style={{ padding: 16, color: 'var(--color-text-secondary)' }}>
        Loading...
      </div>
    </BusyCursorCleanup>
  )
}

export function DesktopShell({ windowManager }) {
  const { windows, openApp, closeApp, minimizeApp, maximizeApp, focusApp } = windowManager
  const { node, isOwner, currentUser, apps, labelFor, themeVars, wallpaper } = useNodeView()
  usePresence({ track: currentUser?.id })
  const bootedRef = useRef(false)

  // Open boot apps on first mount, but only on the user's first ever visit
  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    const hasVisited = (() => { try { return localStorage.getItem('ericOS_visited') === '1' } catch { return false } })()
    if (!hasVisited) {
      // Boot only the node-scoped apps (useNodeView already drops flagship-only
      // apps like README.sh on member nodes — so Eric's boot greeting never
      // auto-opens on /u/:handle).
      apps.filter(a => a.openOnBoot).forEach(a => openApp(a.id))
      try { localStorage.setItem('ericOS_visited', '1') } catch {}
    }
  }, [openApp, apps])

  // Land in edit mode: /u/:handle?edit=1 auto-opens Customize for the owner.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('edit') === '1' && node.kind === 'member' && isOwner) openApp('customize')
  }, [node, isOwner, openApp])

  // Easter egg hooks
  const { idle, resetIdle } = useIdleTimer(60000)
  const konamiActive = useKonamiCode()
  const { triggered: bsodActive, dismiss: dismissBsod } = useSecretCode('IDDQD')

  // Open-app channel. detail is either an app id string, or { app, itemId }
  // to deep-link into a specific item (ChemFeed "open on node").
  useEffect(() => {
    const handler = (e) => {
      const d = e.detail
      const appId = typeof d === 'string' ? d : d?.app
      if (d && typeof d === 'object' && d.itemId) setInitialItem(d.app, d.itemId)
      const app = APP_REGISTRY.find(a => a.id === appId)
      // Never honor a request to open a flagship-only app on a member node
      // (or a member-only app on the flagship) — that would surface Eric's
      // bespoke apps (README.sh, Terminal…) on /u/:handle.
      if (!app) return
      if (app.flagshipOnly && node.kind !== 'flagship') return
      if (app.memberOnly && node.kind !== 'member') return
      openApp(appId)
    }
    window.addEventListener('ericOS:openApp', handler)
    return () => window.removeEventListener('ericOS:openApp', handler)
  }, [openApp, node])

  // Deep-link on load: /u/:handle?app=<id>&item=<id> opens that app on the item.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const app = p.get('app'), item = p.get('item')
    if (app && APP_REGISTRY.find(a => a.id === app)) {
      if (item) setInitialItem(app, item)
      openApp(app)
    }
  }, [openApp])

  // Meltdown state
  const [meltdownActive, setMeltdownActive] = useState(false)

  useEffect(() => {
    const handler = () => setMeltdownActive(true)
    window.addEventListener('ericOS:meltdown', handler)
    return () => window.removeEventListener('ericOS:meltdown', handler)
  }, [])

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null)

  // Offscreen toast state
  const [showOffscreenToast, setShowOffscreenToast] = useState(false)

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
    recordDiscovery('right-click-desktop')
  }, [])

  const handleOffscreen = useCallback(() => {
    setShowOffscreenToast(true)
    setTimeout(() => setShowOffscreenToast(false), 3000)
  }, [])

  const windowsWithMeta = useMemo(() =>
    windows.map(w => {
      const app = APP_REGISTRY.find(a => a.id === w.id)
      return { ...w, app }
    }).filter(w => w.app),
    [windows]
  )

  return (
    <div className="flex flex-col w-full h-full" style={themeVars}>
      <div
        className="relative flex-1 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            document.activeElement?.blur()
          }
        }}
        onContextMenu={handleContextMenu}
      >
        {/* Layer 0 — Wallpaper (member nodes use their chosen preset) */}
        {node.kind === 'member'
          ? <div className="absolute inset-0" style={{ zIndex: 0, background: wallpaper }} />
          : <Wallpaper />}

        {/* Layer 1 — CRT scanlines + noise + vignette */}
        <CRTOverlay />

        {/* Layer 2 — Desktop icons with staggered fade-in, wrapping into columns */}
        <div
          className="absolute top-4 left-4 flex flex-col flex-wrap gap-2 content-start"
          style={{ zIndex: 2, maxHeight: 'calc(100% - 16px)' }}
        >
          {apps.filter(a => !a.category && !a.hideFromDesktop).map((app, i) => (
            <DesktopIcon key={app.id} app={{ ...app, label: labelFor(app) }} onOpen={openApp} index={i} />
          ))}
        </div>

        {/* Layer 10+ — Windows with AnimatePresence */}
        <AnimatePresence>
          {windowsWithMeta.map(w => {
            const AppComponent = getLazyComponent(w.app)

            return (
              <WindowFrame
                key={w.id}
                windowState={w}
                app={{ ...w.app, label: labelFor(w.app) }}
                onClose={() => closeApp(w.id)}
                onMinimize={() => minimizeApp(w.id)}
                onMaximize={() => maximizeApp(w.id)}
                onFocus={() => focusApp(w.id)}
                onOffscreen={handleOffscreen}
              >
                <Suspense fallback={<BusyCursor />}>
                  <AppComponent />
                </Suspense>
              </WindowFrame>
            )
          })}
        </AnimatePresence>

        {/* Context menu */}
        <AnimatePresence>
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={() => setContextMenu(null)}
            />
          )}
        </AnimatePresence>

        {/* Offscreen toast */}
        <AnimatePresence>
          {showOffscreenToast && (
            <OffscreenToast onDismiss={() => setShowOffscreenToast(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Layer 100 — Taskbar */}
      <Taskbar
        windows={windowsWithMeta.map(w => ({
          id: w.id,
          label: w.app ? labelFor(w.app) : w.id,
          minimized: w.minimized,
        }))}
        onFocusApp={focusApp}
        onOpenApp={openApp}
        apps={apps}
        labelFor={labelFor}
      />

      {/* Easter egg overlays */}
      <AnimatePresence>
        {bsodActive && <BSOD onDismiss={dismissBsod} />}
      </AnimatePresence>

      <AnimatePresence>
        {idle && node.kind === 'flagship' && <Screensaver onDismiss={resetIdle} />}
      </AnimatePresence>

      {konamiActive && <KonamiOverlay />}

      <AnimatePresence>
        {meltdownActive && <Meltdown onDone={() => setMeltdownActive(false)} />}
      </AnimatePresence>

      {/* Layer unlock notifications */}
      <LayerNotification />
    </div>
  )
}
