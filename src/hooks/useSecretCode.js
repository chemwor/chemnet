import { useState, useEffect, useRef } from 'react'

export function useSecretCode(code = 'IDDQD') {
  const [triggered, setTriggered] = useState(false)
  const bufferRef = useRef('')

  useEffect(() => {
    const handler = (e) => {
      if (triggered) return
      bufferRef.current += e.key.toUpperCase()
      // Keep buffer trimmed to code length
      if (bufferRef.current.length > code.length) {
        bufferRef.current = bufferRef.current.slice(-code.length)
      }
      if (bufferRef.current === code.toUpperCase()) {
        setTriggered(true)
        bufferRef.current = ''
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [code, triggered])

  const dismiss = () => setTriggered(false)

  return { triggered, dismiss }
}
