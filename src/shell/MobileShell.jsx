import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { APP_REGISTRY, MENU_CATEGORIES } from '../apps/registry'
import { MobilePanel } from '../windows/MobilePanel'
import { AppIcon } from './AppIcon'
import daytime from '../assets/wallpapers/daytime.jpg'
import nighttime from '../assets/wallpapers/nighttime.jpg'

function isDaytime() {
  const h = new Date().getHours()
  return h >= 6 && h < 18
}

// ── Status Bar (iOS 1 style) ──
function StatusBar() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="flex items-center justify-between px-3 shrink-0"
      style={{
        height: 20,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.3))',
        color: '#fff',
        fontSize: 11,
        fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
        fontWeight: 600,
        letterSpacing: 0.3,
      }}
    >
      <div className="flex items-center gap-1">
        <span style={{ fontSize: 9, letterSpacing: 1 }}>▂▄▆█</span>
        <span>ChemNet</span>
      </div>
      <span>{time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
      <div className="flex items-center gap-1">
        <span style={{ fontSize: 9 }}>100%</span>
        <span style={{ fontSize: 10 }}>🔋</span>
      </div>
    </div>
  )
}

// ── App Icon (iOS 1 glossy rounded square) ──
function MobileAppIcon({ app, onTap }) {
  return (
    <button
      className="flex flex-col items-center gap-1 border-none bg-transparent cursor-pointer"
      style={{ width: 72 }}
      onClick={() => onTap(app.id)}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 54,
          height: 54,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.1) 100%)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Colored background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: getIconBg(app.id),
          borderRadius: 12,
        }} />
        {/* Gloss overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.05))',
          borderRadius: '12px 12px 0 0',
        }} />
        {/* Icon */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AppIcon icon={app.icon} size={28} />
        </div>
      </div>
      <span
        className="text-center leading-tight"
        style={{
          color: '#fff',
          fontSize: 10,
          fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
          fontWeight: 500,
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          maxWidth: 72,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {app.label}
      </span>
    </button>
  )
}

function getIconBg(id) {
  const colors = {
    about: 'linear-gradient(135deg, #1a1a1a, #333)',
    projects: 'linear-gradient(135deg, #c99a2e, #a07818)',
    blog: 'linear-gradient(135deg, #3366cc, #2244aa)',
    pictures: 'linear-gradient(135deg, #e06030, #c04020)',
    videos: 'linear-gradient(135deg, #cc2222, #aa1111)',
    messageboard: 'linear-gradient(135deg, #2266cc, #1144aa)',
    guestbook: 'linear-gradient(135deg, #8B4513, #5a2d0c)',
    music: 'linear-gradient(135deg, #e04090, #c02070)',
    reviews: 'linear-gradient(135deg, #333, #111)',
    restaurants: 'linear-gradient(135deg, #e08020, #c06010)',
    email: 'linear-gradient(135deg, #4488ff, #2266dd)',
    terminal: 'linear-gradient(135deg, #1a1a1a, #000)',
    stats: 'linear-gradient(135deg, #ddaa00, #bb8800)',
    solitaire: 'linear-gradient(135deg, #1a5a1a, #0a3a0a)',
    minesweeper: 'linear-gradient(135deg, #888, #555)',
    chess: 'linear-gradient(135deg, #006600, #004400)',
    pong: 'linear-gradient(135deg, #1B5E20, #0a3a0a)',
    asteroids: 'linear-gradient(135deg, #111, #000)',
    pacman: 'linear-gradient(135deg, #1a1a1a, #000)',
    spaceinvaders: 'linear-gradient(135deg, #111, #000)',
    arkanoid: 'linear-gradient(135deg, #2222aa, #111166)',
    fighter: 'linear-gradient(135deg, #cc2222, #881111)',
  }
  return colors[id] || 'linear-gradient(135deg, #444, #222)'
}

// ── Games folder icon ──
function GamesFolderIcon({ onTap }) {
  return (
    <button
      className="flex flex-col items-center gap-1 border-none bg-transparent cursor-pointer"
      style={{ width: 72 }}
      onClick={onTap}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 54,
          height: 54,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(80,80,80,0.6), rgba(40,40,40,0.8))',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Mini icon grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, padding: 6, position: 'relative', zIndex: 1 }}>
          <AppIcon icon="cards" size={16} />
          <AppIcon icon="ghost" size={16} />
          <AppIcon icon="rocket" size={16} />
          <AppIcon icon="chess" size={16} />
        </div>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0))',
          borderRadius: '12px 12px 0 0',
        }} />
      </div>
      <span style={{
        color: '#fff', fontSize: 10,
        fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
        fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.8)',
      }}>
        Games
      </span>
    </button>
  )
}

// ── Page dots indicator ──
function PageDots({ total, current }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: i === current ? '#fff' : 'rgba(255,255,255,0.3)',
            transition: 'background 0.2s',
          }}
        />
      ))}
    </div>
  )
}

// ── Dock ──
function Dock({ onTap }) {
  const dockApps = APP_REGISTRY.filter(a => a.pinned)
  return (
    <div
      className="flex items-center justify-center gap-4 px-3 py-2 shrink-0"
      style={{
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
        borderTop: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {dockApps.map(app => (
        <MobileAppIcon key={app.id} app={app} onTap={onTap} />
      ))}
    </div>
  )
}

// ── Main Shell ──
export function MobileShell({ windowManager }) {
  const { openApp, closeApp } = windowManager
  const [activeAppId, setActiveAppId] = useState(null)
  const [page, setPage] = useState(0)
  const [gamesOpen, setGamesOpen] = useState(false)
  const touchStart = useRef(null)

  const activeApp = activeAppId ? APP_REGISTRY.find(a => a.id === activeAppId) : null

  const topLevelApps = APP_REGISTRY.filter(a => !a.category && !a.pinned)
  const gameApps = APP_REGISTRY.filter(a => a.category === 'games' && a.mobile !== false)

  // Split into pages of 16 (4x4 grid) — include games folder on first page
  const pageSize = 16
  const allHomeItems = [...topLevelApps]
  const totalPages = Math.max(1, Math.ceil((allHomeItems.length + 1) / pageSize)) // +1 for games folder

  const handleOpen = (appId) => {
    openApp(appId)
    setActiveAppId(appId)
    setGamesOpen(false)
  }

  const handleClose = () => {
    if (activeAppId) {
      closeApp(activeAppId)
      setActiveAppId(null)
    }
  }

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return
    const diff = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && page < totalPages - 1) setPage(p => p + 1)
      if (diff < 0 && page > 0) setPage(p => p - 1)
    }
    touchStart.current = null
  }

  const bg = isDaytime() ? daytime : nighttime

  return (
    <div className="flex flex-col w-full h-full" style={{ background: '#000' }}>
      {/* Wallpaper */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.6)',
      }} />

      {/* Content layer */}
      <div className="flex flex-col w-full h-full relative" style={{ zIndex: 1 }}>
        <StatusBar />

        {/* App grid area */}
        <div
          className="flex-1 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {!gamesOpen ? (
            <motion.div
              key={`page-${page}`}
              className="h-full px-4 pt-4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-4 gap-y-5 gap-x-2 justify-items-center">
                {allHomeItems.slice(page * pageSize, (page + 1) * pageSize).map(app => (
                  <MobileAppIcon key={app.id} app={app} onTap={handleOpen} />
                ))}
                {/* Games folder on first page */}
                {page === 0 && <GamesFolderIcon onTap={() => setGamesOpen(true)} />}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="h-full px-4 pt-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              {/* Games folder expanded */}
              <div className="mb-3 flex items-center justify-between">
                <span style={{
                  color: '#fff', fontSize: 16, fontWeight: 600,
                  fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
                  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                }}>
                  Games
                </span>
                <button
                  onClick={() => setGamesOpen(false)}
                  className="border-none bg-transparent cursor-pointer text-xs"
                  style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit' }}
                >
                  Done
                </button>
              </div>
              <div
                className="p-3 rounded-2xl"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="grid grid-cols-4 gap-y-4 gap-x-2 justify-items-center">
                  {gameApps.map(app => (
                    <MobileAppIcon key={app.id} app={app} onTap={handleOpen} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Page dots */}
        {!gamesOpen && <PageDots total={totalPages} current={page} />}

        {/* Dock */}
        <Dock onTap={handleOpen} />
      </div>

      {/* App panel */}
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
