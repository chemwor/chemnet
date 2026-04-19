import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AppIcon } from './AppIcon'

export function DesktopIcon({ app, onOpen, index = 0 }) {
  const [selected, setSelected] = useState(false)
  const [pressing, setPressing] = useState(false)
  const clickTimer = useRef(null)

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    setSelected(true)

    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      setPressing(true)
      setTimeout(() => {
        setPressing(false)
        onOpen(app.id)
      }, 120)
      return
    }

    clickTimer.current = setTimeout(() => {
      clickTimer.current = null
    }, 300)
  }, [app.id, onOpen])

  return (
    <motion.button
      className="desktop-icon flex flex-col items-center gap-1.5 p-2 rounded border-none bg-transparent"
      onClick={handleClick}
      onBlur={() => setSelected(false)}
      title={app.label}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      style={{
        cursor: 'var(--cursor-pointer)',
        transform: pressing ? 'scale(0.92)' : undefined,
      }}
    >
      <span
        className="select-none"
        style={{
          transition: 'transform 120ms ease-out, filter 120ms ease-out',
        }}
      >
        <AppIcon icon={app.icon} size={32} />
      </span>
      <span
        className="text-xs text-center leading-tight whitespace-nowrap px-1 rounded-sm"
        style={{
          color: 'var(--color-text-primary)',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          background: selected ? 'color-mix(in srgb, var(--color-accent) 30%, transparent)' : 'transparent',
          transition: 'background 80ms ease-out',
        }}
      >
        {app.label}
      </span>

      <style>{`
        .desktop-icon:hover span:first-child {
          transform: translateY(-3px);
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));
        }
      `}</style>
    </motion.button>
  )
}
