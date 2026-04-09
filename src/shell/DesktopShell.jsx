import { Suspense, lazy, useMemo } from 'react'
import { APP_REGISTRY } from '../apps/registry'
import { DesktopIcon } from './DesktopIcon'
import { Taskbar } from './Taskbar'
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
      {/* Wallpaper + icon grid + windows */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ background: 'var(--color-desktop-bg)' }}
      >
        {/* Desktop icon grid */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-0">
          {APP_REGISTRY.map(app => (
            <DesktopIcon key={app.id} app={app} onOpen={openApp} />
          ))}
        </div>

        {/* Window layer */}
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

      {/* Taskbar */}
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
