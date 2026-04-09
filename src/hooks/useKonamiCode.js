import { useState, useEffect, useRef } from 'react'

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

export function useKonamiCode() {
  const [triggered, setTriggered] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === KONAMI[indexRef.current]) {
        indexRef.current++
        if (indexRef.current === KONAMI.length) {
          setTriggered(true)
          indexRef.current = 0
          setTimeout(() => setTriggered(false), 3000)
        }
      } else {
        indexRef.current = 0
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return triggered
}
