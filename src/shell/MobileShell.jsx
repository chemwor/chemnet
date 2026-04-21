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

// ── iOS icon glyph map — clean white symbols like original iPhone ──
const IOS_GLYPHS = {
  about: '📋', terminal: '>_', projects: '📂', blog: '✏️',
  pictures: '🌅', videos: '▶', messageboard: '💬', guestbook: '📖',
  music: '♫', reviews: '📺', restaurants: '🍴', email: '✉️',
  carmods: '🏎️', wishlist: '🛒', trips: '✈️',
  stats: '🏆', solitaire: '♠', minesweeper: '💣', chess: '♟',
  pong: '🏓', asteroids: '☄️', pacman: '👾', spaceinvaders: '👽',
  arkanoid: '🧱', fighter: '🤖', snake: '🐍', '2048': '🔢',
  flappybird: '🐤', tetris: '▦', sudoku: '9', doodlejump: '↑',
  fruitninja: '🔪', admin: '⚙️',
}

// ── App Icon (iOS 1 glossy rounded square) ──
function MobileAppIcon({ app, onTap }) {
  const glyph = IOS_GLYPHS[app.id] || '•'

  return (
    <button
      className="flex flex-col items-center gap-1 border-none bg-transparent cursor-pointer"
      style={{ width: 72 }}
      onClick={() => onTap(app.id)}
    >
      <div
        style={{
          width: 57,
          height: 57,
          borderRadius: 13,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
        }}
      >
        {/* Colored gradient background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: getIconBg(app.id),
        }} />
        {/* Gloss — top half shine (classic iOS 1 look) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '48%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 100%)',
          borderRadius: '13px 13px 0 0',
        }} />
        {/* Glyph — white centered symbol */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: glyph.length <= 2 ? 26 : 20,
          color: '#fff',
          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
          fontFamily: '-apple-system, "Helvetica Neue", sans-serif',
          fontWeight: 300,
        }}>
          {glyph}
        </div>
      </div>
      <span
        className="text-center leading-tight"
        style={{
          color: '#fff',
          fontSize: 10,
          fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
          fontWeight: 500,
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
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
  // Bold, saturated gradients like original iPhone icons
  const colors = {
    about: 'linear-gradient(180deg, #4a4a4a, #1a1a1a)',
    projects: 'linear-gradient(180deg, #FFD60A, #C8A200)',
    blog: 'linear-gradient(180deg, #FFCC00, #FF9500)',
    pictures: 'linear-gradient(180deg, #FF6B35, #D44500)',
    videos: 'linear-gradient(180deg, #5856D6, #3634A3)',
    messageboard: 'linear-gradient(180deg, #34C759, #248A3D)',
    guestbook: 'linear-gradient(180deg, #A2845E, #7A5C3E)',
    music: 'linear-gradient(180deg, #FC3D55, #D42040)',
    reviews: 'linear-gradient(180deg, #2C2C2E, #1C1C1E)',
    restaurants: 'linear-gradient(180deg, #FF9500, #CC7700)',
    email: 'linear-gradient(180deg, #5AC8FA, #007AFF)',
    terminal: 'linear-gradient(180deg, #2C2C2E, #000000)',
    stats: 'linear-gradient(180deg, #FFD700, #CC9900)',
    solitaire: 'linear-gradient(180deg, #34C759, #1B8C3A)',
    minesweeper: 'linear-gradient(180deg, #8E8E93, #636366)',
    chess: 'linear-gradient(180deg, #30D158, #1B8C3A)',
    pong: 'linear-gradient(180deg, #30D158, #1B6C2A)',
    asteroids: 'linear-gradient(180deg, #2C2C2E, #000000)',
    pacman: 'linear-gradient(180deg, #FFD60A, #CC9900)',
    spaceinvaders: 'linear-gradient(180deg, #30D158, #1B6C2A)',
    arkanoid: 'linear-gradient(180deg, #5856D6, #3634A3)',
    fighter: 'linear-gradient(180deg, #FF3B30, #CC2D26)',
    snake: 'linear-gradient(180deg, #30D158, #1B6C2A)',
    '2048': 'linear-gradient(180deg, #FF9500, #CC7700)',
    flappybird: 'linear-gradient(180deg, #5AC8FA, #34AADC)',
    tetris: 'linear-gradient(180deg, #5856D6, #3634A3)',
    sudoku: 'linear-gradient(180deg, #FFFFFF, #E5E5EA)',
    doodlejump: 'linear-gradient(180deg, #A2845E, #7A5C3E)',
    fruitninja: 'linear-gradient(180deg, #FF3B30, #8B1A10)',
    carmods: 'linear-gradient(180deg, #FF3B30, #CC2222)',
    wishlist: 'linear-gradient(180deg, #FFD60A, #CC9900)',
    trips: 'linear-gradient(180deg, #5AC8FA, #007AFF)',
    admin: 'linear-gradient(180deg, #8E8E93, #4A4A4E)',
  }
  return colors[id] || 'linear-gradient(180deg, #636366, #3A3A3C)'
}

// ── Games folder icon — iOS folder style ──
function GamesFolderIcon({ onTap }) {
  return (
    <button
      className="flex flex-col items-center gap-1 border-none bg-transparent cursor-pointer"
      style={{ width: 72 }}
      onClick={onTap}
    >
      <div
        style={{
          width: 57,
          height: 57,
          borderRadius: 13,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
          background: 'linear-gradient(180deg, #636366, #3A3A3C)',
        }}
      >
        {/* Gloss */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '48%',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.45), rgba(255,255,255,0.1))',
          borderRadius: '13px 13px 0 0',
        }} />
        {/* Mini icons grid */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', height: '100%',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          alignItems: 'center', justifyItems: 'center',
          padding: 10, gap: 2,
          fontSize: 14,
        }}>
          <span>♠</span>
          <span>👾</span>
          <span>☄️</span>
          <span>🐍</span>
        </div>
      </div>
      <span style={{
        color: '#fff', fontSize: 10,
        fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
        fontWeight: 500, textShadow: '0 1px 3px rgba(0,0,0,0.9)',
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

// ── Notification Banner (iOS style) — replaces README.sh on mobile ──
function NotificationBanner({ onTap }) {
  return (
    <motion.div
      className="absolute left-3 right-3"
      style={{
        top: 24,
        zIndex: 200,
        background: 'rgba(30,28,40,0.92)',
        backdropFilter: 'blur(20px)',
        borderRadius: 14,
        padding: '12px 14px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onClick={onTap}
    >
      <div className="flex items-start gap-2.5">
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid #333',
          shrink: 0,
        }}>
          <AppIcon icon="terminal" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span style={{ fontSize: 12, fontWeight: 600, color: '#F0EBE1', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>README.sh</span>
            <span style={{ fontSize: 9, color: '#888', fontFamily: '-apple-system, sans-serif' }}>now</span>
          </div>
          <div style={{ fontSize: 11, color: '#ccc', fontFamily: '-apple-system, "Helvetica Neue", sans-serif', lineHeight: 1.4 }}>
            Hey. Karibu. I'm Eric. Come in.
          </div>
          <div style={{ fontSize: 10, color: '#888', fontFamily: '-apple-system, sans-serif', marginTop: 3 }}>
            Tap to read more
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Shell ──
export function MobileShell({ windowManager }) {
  const { openApp, closeApp } = windowManager
  const [activeAppId, setActiveAppId] = useState(null)
  const [page, setPage] = useState(0)
  const [gamesOpen, setGamesOpen] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const touchStart = useRef(null)

  // Show terminal notification after 5 seconds (once per session)
  useEffect(() => {
    const shown = sessionStorage.getItem('chemnet_notif_shown')
    if (shown) return
    const timer = setTimeout(() => {
      setShowNotification(true)
      sessionStorage.setItem('chemnet_notif_shown', '1')
      // Auto-dismiss after 6 seconds
      setTimeout(() => setShowNotification(false), 6000)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

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

        {/* iOS-style notification */}
        <AnimatePresence>
          {showNotification && !activeApp && (
            <NotificationBanner
              onTap={() => { setShowNotification(false); handleOpen('about') }}
            />
          )}
        </AnimatePresence>

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
