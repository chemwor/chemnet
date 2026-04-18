import { Suspense, lazy, useMemo, useEffect, useState, useCallback, useRef } from 'react'
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
import { useIdleTimer } from '../hooks/useIdleTimer'
import { useKonamiCode } from '../hooks/useKonamiCode'
import { useSecretCode } from '../hooks/useSecretCode'

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
  const bootedRef = useRef(false)

  // Open boot apps on first mount
  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    APP_REGISTRY.filter(a => a.openOnBoot).forEach(a => openApp(a.id))
  }, [openApp])

  // Easter egg hooks
  const { idle, resetIdle } = useIdleTimer(60000)
  const konamiActive = useKonamiCode()
  const { triggered: bsodActive, dismiss: dismissBsod } = useSecretCode('IDDQD')

  // Terminal open app command
  useEffect(() => {
    const handler = (e) => {
      const appId = e.detail
      if (APP_REGISTRY.find(a => a.id === appId)) openApp(appId)
    }
    window.addEventListener('ericOS:openApp', handler)
    return () => window.removeEventListener('ericOS:openApp', handler)
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
    <div className="flex flex-col w-full h-full">
      <div
        className="relative flex-1 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            document.activeElement?.blur()
          }
        }}
        onContextMenu={handleContextMenu}
      >
        {/* Layer 0 — Animated gradient mesh */}
        <Wallpaper />

        {/* Layer 1 — CRT scanlines + noise + vignette */}
        <CRTOverlay />

        {/* Layer 2 — Desktop icons with staggered fade-in, wrapping into columns */}
        <div
          className="absolute top-4 left-4 flex flex-col flex-wrap gap-2 content-start"
          style={{ zIndex: 2, maxHeight: 'calc(100% - 16px)' }}
        >
          {APP_REGISTRY.filter(a => !a.category).map((app, i) => (
            <DesktopIcon key={app.id} app={app} onOpen={openApp} index={i} />
          ))}
        </div>

        {/* Layer 10+ — Windows with AnimatePresence */}
        <AnimatePresence>
          {windowsWithMeta.map(w => {
            const AppComponent = lazy(w.app.component)

            return (
              <WindowFrame
                key={w.id}
                windowState={w}
                app={w.app}
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
          label: w.app?.label ?? w.id,
          minimized: w.minimized,
        }))}
        onFocusApp={focusApp}
        onOpenApp={openApp}
      />

      {/* Easter egg overlays */}
      <AnimatePresence>
        {bsodActive && <BSOD onDismiss={dismissBsod} />}
      </AnimatePresence>

      <AnimatePresence>
        {idle && <Screensaver onDismiss={resetIdle} />}
      </AnimatePresence>

      {konamiActive && <KonamiOverlay />}

      <AnimatePresence>
        {meltdownActive && <Meltdown onDone={() => setMeltdownActive(false)} />}
      </AnimatePresence>
    </div>
  )
}
