import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LINES = [
  'rm: removing /usr/bin...',
  'rm: removing /etc/passwd...',
  'rm: removing /home/eric/projects...',
  'rm: removing /var/lib/everything...',
  'rm: removing /boot/vmlinuz...',
  'KERNEL PANIC: no init found',
  '',
  'Just kidding. Everything is fine.',
  'Nice try though.',
]

export function Meltdown({ onDone }) {
  const [visibleLines, setVisibleLines] = useState(0)
  const [phase, setPhase] = useState('deleting') // deleting | glitch | recovery

  useEffect(() => {
    if (phase === 'deleting' && visibleLines < LINES.length) {
      const delay = visibleLines >= LINES.length - 2 ? 800 : 120 + Math.random() * 200
      const timer = setTimeout(() => setVisibleLines(v => v + 1), delay)
      return () => clearTimeout(timer)
    }
    if (phase === 'deleting' && visibleLines >= LINES.length) {
      const timer = setTimeout(() => setPhase('glitch'), 400)
      return () => clearTimeout(timer)
    }
    if (phase === 'glitch') {
      const timer = setTimeout(() => setPhase('recovery'), 1500)
      return () => clearTimeout(timer)
    }
    if (phase === 'recovery') {
      const timer = setTimeout(onDone, 2000)
      return () => clearTimeout(timer)
    }
  }, [visibleLines, phase, onDone])

  return (
    <motion.div
      className="absolute inset-0 flex flex-col p-4 font-mono text-sm overflow-hidden"
      style={{
        zIndex: 50000,
        background: '#000',
        color: '#FF6B35',
      }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        filter: phase === 'glitch'
          ? ['none', 'blur(2px) brightness(2)', 'none', 'blur(4px)', 'none']
          : 'none',
      }}
      exit={{ opacity: 0 }}
      transition={phase === 'glitch' ? { duration: 1.5, times: [0, 0.2, 0.4, 0.7, 1] } : { duration: 0.15 }}
    >
      {LINES.slice(0, visibleLines).map((line, i) => (
        <div key={i} style={{ color: i >= LINES.length - 2 ? '#4ADE80' : '#FF6B35' }}>
          {line}
        </div>
      ))}
      {phase !== 'recovery' && (
        <span className="inline-block" style={{ animation: 'blink 0.6s step-end infinite' }}>█</span>
      )}
      {phase === 'recovery' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4"
          style={{ color: '#F0EBE1' }}
        >
          System restored. Have a nice day.
        </motion.div>
      )}
      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </motion.div>
  )
}
