import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import daytimeVideo from '../assets/wallpapers/daytimescreensaver.mp4'
import nighttimeVideo from '../assets/wallpapers/nighttimescreensaver.mp4'

function isDaytime() {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18
}

export function Screensaver({ onDismiss }) {
  const videoRef = useRef(null)
  const video = isDaytime() ? daytimeVideo : nighttimeVideo

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
      <video
        ref={videoRef}
        src={video}
        autoPlay
        loop
        muted
        playsInline
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
