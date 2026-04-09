import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { APP_REGISTRY } from '../apps/registry'
import { MobilePanel } from '../windows/MobilePanel'

function StatusBar() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="flex items-center justify-between px-4 py-1 text-xs shrink-0"
      style={{
        background: 'var(--color-taskbar-bg)',
        color: 'var(--color-text-secondary)',
        borderBottom: '1px solid var(--color-taskbar-border)',
      }}
    >
      <span>EricOS</span>
      <div className="flex items-center gap-2">
        <span>▂▄▆█</span>
        <span>🔋</span>
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  )
}

function AppIcon({ app, onOpen }) {
  return (
    <button
      className="flex flex-col items-center gap-1 p-3 rounded-lg cursor-pointer
                 active:bg-black/5 transition-colors border-none bg-transparent"
      onClick={() => onOpen(app.id)}
    >
      <span className="text-4xl select-none">{app.icon}</span>
      <span
        className="text-xs text-center leading-tight"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {app.label}
      </span>
    </button>
  )
}

function HomeBar() {
  return (
    <div className="flex items-center justify-center py-2 shrink-0">
      <div
        className="w-32 h-1 rounded-full"
        style={{ background: 'var(--color-text-secondary)' }}
      />
    </div>
  )
}

export function MobileShell({ windowManager }) {
  const { openApp, closeApp } = windowManager
  const [activeAppId, setActiveAppId] = useState(null)

  const activeApp = activeAppId
    ? APP_REGISTRY.find(a => a.id === activeAppId)
    : null

  const handleOpen = (appId) => {
    openApp(appId)
    setActiveAppId(appId)
  }

  const handleClose = () => {
    if (activeAppId) {
      closeApp(activeAppId)
      setActiveAppId(null)
    }
  }

  return (
    <div
      className="flex flex-col w-full h-full"
      style={{ background: 'var(--color-desktop-bg)' }}
    >
      <StatusBar />

      {/* App icon grid */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 justify-items-center">
          {APP_REGISTRY.map(app => (
            <AppIcon key={app.id} app={app} onOpen={handleOpen} />
          ))}
        </div>
      </div>

      <HomeBar />

      {/* Fullscreen app panel */}
      <AnimatePresence>
        {activeApp && (
          <MobilePanel
            key={activeApp.id}
            app={activeApp}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
