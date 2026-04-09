import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function Toaster({ delay }) {
  const [pos, setPos] = useState({
    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
    y: -80 - Math.random() * 400,
  })

  useEffect(() => {
    let raf
    let startTime = null
    const speed = 60 + Math.random() * 40

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = (timestamp - startTime) / 1000
      setPos(prev => ({
        x: prev.x - speed * 0.016,
        y: -80 - Math.random() * 400 + elapsed * speed,
      }))
      raf = requestAnimationFrame(animate)
    }

    const timeout = setTimeout(() => {
      raf = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(raf)
    }
  }, [delay])

  return (
    <div
      className="absolute text-4xl select-none"
      style={{
        left: pos.x,
        top: pos.y % ((typeof window !== 'undefined' ? window.innerHeight : 600) + 160) - 80,
        transform: 'rotate(-15deg)',
      }}
    >
      🍞🔥
    </div>
  )
}

export function Screensaver({ onDismiss }) {
  const toasters = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      delay: i * 300,
    }))
  ).current

  useEffect(() => {
    const handler = () => onDismiss()
    window.addEventListener('mousemove', handler, { once: true })
    window.addEventListener('keydown', handler, { once: true })
    window.addEventListener('click', handler, { once: true })
    return () => {
      window.removeEventListener('mousemove', handler)
      window.removeEventListener('keydown', handler)
      window.removeEventListener('click', handler)
    }
  }, [onDismiss])

  return (
    <motion.div
      className="fixed inset-0 overflow-hidden"
      style={{ zIndex: 99998, background: '#000000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {toasters.map(t => (
        <Toaster key={t.id} delay={t.delay} />
      ))}
      <div
        className="absolute bottom-4 left-0 right-0 text-center text-xs"
        style={{ color: '#333' }}
      >
        Move mouse to dismiss
      </div>
    </motion.div>
  )
}
