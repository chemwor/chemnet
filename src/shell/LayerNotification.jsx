import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function LayerNotification() {
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      const { layer } = e.detail
      const messages = {
        2: { title: 'Layer 2 Unlocked', subtitle: 'Curious.', desc: 'You\'re starting to look deeper. New content has appeared in the Terminal filesystem.' },
        3: { title: 'Layer 3 Unlocked', subtitle: 'Explorer.', desc: 'You solved it. There\'s more hidden content waiting for you.' },
        4: { title: 'Layer 4 Unlocked', subtitle: 'Insider.', desc: 'All keys found. You\'ve earned access to the inner circle.' },
        5: { title: 'Layer 5 Unlocked', subtitle: 'The Vault.', desc: 'You found it. Almost nobody does.' },
      }
      setNotification(messages[layer] || null)
      setTimeout(() => setNotification(null), 6000)
    }

    window.addEventListener('chemnet:layer-unlocked', handler)
    return () => window.removeEventListener('chemnet:layer-unlocked', handler)
  }, [])

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          className="fixed left-1/2 flex flex-col items-center"
          style={{
            top: 60,
            zIndex: 99990,
            x: '-50%',
          }}
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="px-6 py-4 text-center"
            style={{
              background: '#0a0a0a',
              border: '2px solid var(--color-accent)',
              boxShadow: '0 0 20px rgba(255, 107, 53, 0.3), 0 4px 20px rgba(0,0,0,0.5)',
              fontFamily: '"Courier New", monospace',
              maxWidth: 340,
            }}
          >
            <div className="text-xs mb-1" style={{ color: 'var(--color-accent)' }}>
              ▲ ACCESS GRANTED ▲
            </div>
            <div className="font-bold text-sm mb-1" style={{ color: '#F0EBE1' }}>
              {notification.title}
            </div>
            <div className="text-xs mb-2" style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>
              {notification.subtitle}
            </div>
            <div className="text-xs" style={{ color: '#888', lineHeight: 1.5 }}>
              {notification.desc}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
