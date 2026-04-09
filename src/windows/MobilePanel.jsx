import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'

export function MobilePanel({ app, onClose }) {
  const AppComponent = lazy(app.component)

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{
          background: 'var(--color-titlebar-active)',
          borderBottom: '1px solid var(--color-bevel-dark)',
        }}
      >
        <button
          onClick={onClose}
          className="text-sm border-none bg-transparent cursor-pointer"
          style={{ color: 'var(--color-titlebar-text)' }}
        >
          ← Back
        </button>
        <span
          className="text-sm font-bold truncate mx-2"
          style={{ color: 'var(--color-titlebar-text)' }}
        >
          {app.icon} {app.label}
        </span>
        <button
          onClick={onClose}
          className="text-sm border-none bg-transparent cursor-pointer"
          style={{ color: 'var(--color-titlebar-text)' }}
        >
          ✕
        </button>
      </div>

      {/* App content */}
      <div className="flex-1 overflow-auto p-4">
        <Suspense fallback={
          <div style={{ padding: 16, color: 'var(--color-text-secondary)' }}>
            Loading...
          </div>
        }>
          <AppComponent />
        </Suspense>
      </div>
    </motion.div>
  )
}
