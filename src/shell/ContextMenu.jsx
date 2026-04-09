import { motion } from 'framer-motion'

export function ContextMenu({ x, y, onClose }) {
  const items = [
    { label: 'Refresh', action: () => window.location.reload() },
    { label: 'Properties', action: () => alert('EricOS v1.0\nMemory: 640K ought to be enough') },
    { type: 'separator' },
    { label: 'Why are you right-clicking?', action: onClose },
  ]

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: 9999 }} onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose() }} />
      <motion.div
        className="fixed"
        style={{
          zIndex: 10000,
          left: x,
          top: y,
          background: 'var(--color-surface)',
          borderTop: '2px solid var(--color-bevel-light)',
          borderLeft: '2px solid var(--color-bevel-light)',
          borderBottom: '2px solid var(--color-bevel-dark)',
          borderRight: '2px solid var(--color-bevel-dark)',
          minWidth: 180,
          padding: '2px',
          fontFamily: 'monospace',
          fontSize: 13,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.08 }}
      >
        {items.map((item, i) =>
          item.type === 'separator' ? (
            <div
              key={i}
              className="my-1"
              style={{
                height: 1,
                background: 'var(--color-bevel-dark)',
                borderBottom: '1px solid var(--color-bevel-light)',
              }}
            />
          ) : (
            <button
              key={i}
              className="block w-full text-left px-4 py-1 border-none bg-transparent cursor-pointer"
              style={{
                color: 'var(--color-text-primary)',
                cursor: 'var(--cursor-pointer)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-accent)'
                e.currentTarget.style.color = 'var(--color-titlebar-text)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }}
              onClick={() => { item.action(); onClose() }}
            >
              {item.label}
            </button>
          )
        )}
      </motion.div>
    </>
  )
}
