import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { AppIcon } from '../shell/AppIcon'

// Cache lazy components for mobile too
const mobileLazyCache = new Map()
function getMobileLazy(app) {
  if (!mobileLazyCache.has(app.id)) {
    mobileLazyCache.set(app.id, lazy(app.component))
  }
  return mobileLazyCache.get(app.id)
}

export function MobilePanel({ app, onClose }) {
  const AppComponent = getMobileLazy(app)

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 350 }}
      className="fixed inset-0 flex flex-col"
      style={{ zIndex: 50, background: 'var(--color-surface)' }}
    >
      {/* iOS-style header bar */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{
          height: 44,
          background: 'rgba(30,28,40,0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-1 border-none bg-transparent cursor-pointer"
          style={{
            color: '#FF6B35',
            fontSize: 14,
            fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
            fontWeight: 400,
          }}
        >
          ‹ Back
        </button>
        <span
          className="font-bold truncate mx-3 flex items-center gap-1.5"
          style={{
            color: '#F0EBE1',
            fontSize: 14,
            fontFamily: '-apple-system, "Helvetica Neue", Arial, sans-serif',
            fontWeight: 600,
          }}
        >
          <AppIcon icon={app.icon} size={16} />
          {app.label}
        </span>
        <div style={{ width: 50 }} />
      </div>

      {/* App content */}
      <div className="flex-1" style={{ position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-text-secondary)' }}>
            Loading...
          </div>
        }>
          <AppComponent />
        </Suspense>
      </div>
    </motion.div>
  )
}
