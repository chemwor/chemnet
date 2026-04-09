import { motion } from 'framer-motion'

export function OffscreenToast({ onDismiss }) {
  return (
    <motion.div
      className="fixed bottom-14 left-1/2 px-4 py-2 text-sm font-mono"
      style={{
        zIndex: 10001,
        x: '-50%',
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        borderTop: '2px solid var(--color-bevel-light)',
        borderLeft: '2px solid var(--color-bevel-light)',
        borderBottom: '2px solid var(--color-bevel-dark)',
        borderRight: '2px solid var(--color-bevel-dark)',
        boxShadow: '2px 2px 0 var(--color-bevel-dark)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.12 }}
    >
      Hey! Where are you taking that? 🪟
      <button
        className="ml-3 border-none bg-transparent underline cursor-pointer"
        style={{ color: 'var(--color-accent)', cursor: 'var(--cursor-pointer)' }}
        onClick={onDismiss}
      >
        OK
      </button>
    </motion.div>
  )
}
