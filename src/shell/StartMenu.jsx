import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { APP_REGISTRY, MENU_CATEGORIES } from '../apps/registry'

function MenuItem({ icon, label, hasSubmenu, onClick, onMouseEnter }) {
  return (
    <button
      className="flex items-center gap-2 w-full px-3 py-1.5 text-left border-none bg-transparent cursor-pointer"
      style={{
        color: 'var(--color-text-primary)',
        fontFamily: 'monospace',
        fontSize: 12,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--color-accent)'
        e.currentTarget.style.color = '#fff'
        onMouseEnter?.()
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--color-text-primary)'
      }}
      onClick={onClick}
    >
      <span className="w-5 text-center text-sm">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {hasSubmenu && <span className="text-xs ml-1" style={{ opacity: 0.6 }}>▸</span>}
    </button>
  )
}

function Separator() {
  return (
    <div className="my-1 mx-2" style={{
      height: 1,
      borderTop: '1px solid var(--color-bevel-dark)',
      borderBottom: '1px solid var(--color-bevel-light)',
    }} />
  )
}

export function StartMenu({ onOpenApp, onClose }) {
  const [activeSubmenu, setActiveSubmenu] = useState(null)

  const topLevelApps = APP_REGISTRY.filter(a => !a.category)
  const gameApps = APP_REGISTRY.filter(a => a.category === 'games')

  const handleOpen = (appId) => {
    onOpenApp(appId)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 199 }}
        onClick={onClose}
      />

      {/* Menu */}
      <motion.div
        className="absolute left-1"
        style={{
          bottom: 42,
          zIndex: 200,
          background: 'var(--color-surface)',
          borderTop: '2px solid var(--color-bevel-light)',
          borderLeft: '2px solid var(--color-bevel-light)',
          borderBottom: '2px solid var(--color-bevel-dark)',
          borderRight: '2px solid var(--color-bevel-dark)',
          minWidth: 200,
          display: 'flex',
        }}
        initial={{ opacity: 0, y: 10, scaleY: 0.95 }}
        animate={{ opacity: 1, y: 0, scaleY: 1 }}
        exit={{ opacity: 0, y: 10, scaleY: 0.95 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Left sidebar — Win95 vertical banner */}
        <div
          className="flex items-end shrink-0"
          style={{
            width: 24,
            background: 'linear-gradient(to top, var(--color-accent), #3D2B1F)',
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            padding: '8px 2px',
          }}
        >
          <span style={{
            color: '#F0EBE1',
            fontSize: 14,
            fontWeight: 'bold',
            fontFamily: 'monospace',
            letterSpacing: 2,
          }}>
            ChemNet
          </span>
        </div>

        {/* Menu items */}
        <div className="flex-1 py-1" style={{ minWidth: 176 }}>
          {/* Top-level apps */}
          {topLevelApps.map(app => (
            <MenuItem
              key={app.id}
              icon={app.icon}
              label={app.label}
              onClick={() => handleOpen(app.id)}
              onMouseEnter={() => setActiveSubmenu(null)}
            />
          ))}

          <Separator />

          {/* Category submenus */}
          {MENU_CATEGORIES.map(cat => (
            <div key={cat.id} className="relative">
              <MenuItem
                icon={cat.icon}
                label={cat.label}
                hasSubmenu
                onMouseEnter={() => setActiveSubmenu(cat.id)}
                onClick={() => setActiveSubmenu(activeSubmenu === cat.id ? null : cat.id)}
              />

              {/* Submenu */}
              <AnimatePresence>
                {activeSubmenu === cat.id && (
                  <motion.div
                    className="absolute"
                    style={{
                      left: '100%',
                      top: -2,
                      background: 'var(--color-surface)',
                      borderTop: '2px solid var(--color-bevel-light)',
                      borderLeft: '2px solid var(--color-bevel-light)',
                      borderBottom: '2px solid var(--color-bevel-dark)',
                      borderRight: '2px solid var(--color-bevel-dark)',
                      minWidth: 170,
                      zIndex: 210,
                    }}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.1 }}
                  >
                    <div className="py-1">
                      {APP_REGISTRY.filter(a => a.category === cat.id).map(app => (
                        <MenuItem
                          key={app.id}
                          icon={app.icon}
                          label={app.label}
                          onClick={() => handleOpen(app.id)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          <Separator />

          {/* Bottom items */}
          <MenuItem
            icon="⚙️"
            label="Settings"
            onMouseEnter={() => setActiveSubmenu(null)}
            onClick={onClose}
          />
          <MenuItem
            icon="❓"
            label="About ChemNet"
            onMouseEnter={() => setActiveSubmenu(null)}
            onClick={() => handleOpen('about')}
          />
        </div>
      </motion.div>
    </>
  )
}
