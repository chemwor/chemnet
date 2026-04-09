import { useState, useEffect, useCallback, useRef } from 'react'

export function useIdleTimer(timeoutMs = 60000) {
  const [idle, setIdle] = useState(false)
  const timerRef = useRef(null)

  const reset = useCallback(() => {
    setIdle(false)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setIdle(true), timeoutMs)
  }, [timeoutMs])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    timerRef.current = setTimeout(() => setIdle(true), timeoutMs)

    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      clearTimeout(timerRef.current)
    }
  }, [reset, timeoutMs])

  return { idle, resetIdle: reset }
}
