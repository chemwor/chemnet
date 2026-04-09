import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function Clock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="px-3 py-1 text-xs font-mono border-l"
      style={{
        color: 'var(--color-text-secondary)',
        borderColor: 'var(--color-taskbar-border)',
      }}
    >
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </div>
  )
}

export function Taskbar({ windows, onFocusApp, onOpenApp }) {
  return (
    <motion.div
      className="flex items-center h-10 px-1 shrink-0"
      initial={{ y: 40 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      style={{
        position: 'relative',
        zIndex: 100,
        background: 'var(--color-taskbar-bg)',
        borderTop: '1px solid var(--color-taskbar-border)',
      }}
    >
      {/* Start button */}
      <button
        className="bevel-button flex items-center gap-1 px-3 py-1 mr-2 text-sm font-bold cursor-pointer"
        style={{
          background: 'var(--color-start-bg)',
          color: 'var(--color-text-primary)',
          cursor: 'var(--cursor-pointer)',
        }}
      >
        <span>⊞</span> Start
      </button>

      {/* Open window buttons */}
      <div className="flex gap-1 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {windows.map(w => (
            <motion.button
              key={w.id}
              layout
              initial={{ opacity: 0, x: 30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onFocusApp(w.id)}
              className="bevel-button px-3 py-1 text-xs truncate max-w-[140px] cursor-pointer"
              style={{
                background: w.minimized ? 'var(--color-surface)' : 'var(--color-bevel-light)',
                color: 'var(--color-text-primary)',
                cursor: 'var(--cursor-pointer)',
                borderBottom: !w.minimized
                  ? '2px solid var(--color-accent)'
                  : '1px solid var(--color-bevel-dark)',
              }}
            >
              {w.label}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <Clock />
    </motion.div>
  )
}
