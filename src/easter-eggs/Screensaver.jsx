import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const SCREENSAVER_AUDIO = '/loose-cannon.m4a'

const STORAGE_BASE = 'https://cxbfuzqjlqipjyinhzqv.supabase.co/storage/v1/object/public/screensavers'

function getScreensaverUrl() {
  const hour = new Date().getHours()
  if (hour === 3) return `${STORAGE_BASE}/scaryscreensaver.gif`
  if (hour >= 6 && hour < 18) return `${STORAGE_BASE}/daytimescreensaver.gif`
  return `${STORAGE_BASE}/nighttimescreensaver.gif`
}

// Fallback: animated starfield if GIFs aren't available
function StarfieldFallback() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', overflow: 'hidden' }}>
      {Array.from({ length: 80 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 2,
            height: 2,
            background: '#fff',
            borderRadius: '50%',
            animation: `twinkle ${1 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
      <div style={{
        position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)',
        color: '#333', fontSize: 12, fontFamily: 'monospace', textAlign: 'center',
      }}>
        ChemNet Screensaver
      </div>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export function Screensaver({ onDismiss }) {
  const url = useMemo(getScreensaverUrl, [])
  const [loadFailed, setLoadFailed] = useState(false)
  const audioRef = useRef(null)

  // Play the screensaver theme while active; stop on dismiss/unmount.
  useEffect(() => {
    const audio = new Audio(SCREENSAVER_AUDIO)
    audio.loop = true
    audio.volume = 0.6
    audioRef.current = audio
    // Autoplay may be blocked if the tab never received a gesture; ignore.
    audio.play().catch(() => {})
    return () => {
      audio.pause()
      audio.currentTime = 0
      audioRef.current = null
    }
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
      {loadFailed ? (
        <StarfieldFallback />
      ) : (
        <img
          src={url}
          alt=""
          onError={() => setLoadFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
    </motion.div>
  )
}
