import { Suspense, lazy, useMemo } from 'react'
import { APP_REGISTRY } from '../apps/registry'
import { DesktopIcon } from './DesktopIcon'
import { Taskbar } from './Taskbar'
import { Wallpaper } from './Wallpaper'
import { CRTOverlay } from './CRTOverlay'
import { WindowFrame } from '../windows/WindowFrame'

export function DesktopShell({ windowManager }) {
  const { windows, openApp, closeApp, minimizeApp, maximizeApp, focusApp } = windowManager

  const windowsWithMeta = useMemo(() =>
    windows.map(w => {
      const app = APP_REGISTRY.find(a => a.id === w.id)
      return { ...w, app }
    }).filter(w => w.app),
    [windows]
  )

  return (
    <div className="flex flex-col w-full h-full">
      <div className="relative flex-1 overflow-hidden">
        {/* Layer 0 — Animated gradient mesh */}
        <Wallpaper />

        {/* Layer 1 — CRT scanlines + noise + vignette */}
        <CRTOverlay />

        {/* Layer 2 — Desktop icons */}
        <div className="absolute top-4 left-4 flex flex-col gap-2" style={{ zIndex: 2 }}>
          {APP_REGISTRY.map(app => (
            <DesktopIcon key={app.id} app={app} onOpen={openApp} />
          ))}
        </div>

        {/* Layer 10+ — Windows */}
        {windowsWithMeta.map(w => {
          if (w.minimized) return null

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
            >
              <Suspense fallback={
                <div style={{ padding: 16, color: 'var(--color-text-secondary)' }}>
                  Loading...
                </div>
              }>
                <AppComponent />
              </Suspense>
            </WindowFrame>
          )
        })}
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
    </div>
  )
}
