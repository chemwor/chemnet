import { motion } from 'framer-motion'

export function KonamiOverlay({ onDone }) {
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 99997, filter: 'invert(1) hue-rotate(180deg)', mixBlendMode: 'difference' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    />
  )
}
