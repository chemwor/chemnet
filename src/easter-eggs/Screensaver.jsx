import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import daytimeGif from '../assets/wallpapers/daytimescreensaver.gif'
import nighttimeGif from '../assets/wallpapers/nighttimescreensaver.gif'
import scaryGif from '../assets/wallpapers/scaryscreensaver.gif'

function isDaytime() {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18
}

export function Screensaver({ onDismiss }) {
  const gif = useMemo(() => {
    const hour = new Date().getHours()
    // 3am-4am: scary screensaver
    if (hour === 3) return scaryGif
    // 6am-6pm: daytime
    if (hour >= 6 && hour < 18) return daytimeGif
    // everything else: nighttime
    return nighttimeGif
  }, [])

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
      style={{ zIndex: 99998, background: '#000' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <img
        src={gif}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </motion.div>
  )
}
