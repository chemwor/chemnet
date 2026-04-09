import { useState, useCallback } from 'react'

export function useWindowManager() {
  const [windows, setWindows] = useState([])
  const [nextZ, setNextZ] = useState(10)

  const openApp = useCallback((appId) => {
    setWindows(prev => {
      const existing = prev.find(w => w.id === appId)
      if (existing) {
        return prev.map(w => w.id === appId
          ? { ...w, minimized: false, zIndex: nextZ }
          : w
        )
      }
      return [...prev, { id: appId, zIndex: nextZ, minimized: false, maximized: false }]
    })
    setNextZ(z => z + 1)
  }, [nextZ])

  const closeApp = useCallback((id) => {
    setWindows(prev => prev.filter(w => w.id !== id))
  }, [])

  const minimizeApp = useCallback((id) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, minimized: true } : w
    ))
  }, [])

  const maximizeApp = useCallback((id) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, maximized: !w.maximized } : w
    ))
  }, [])

  const focusApp = useCallback((id) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, zIndex: nextZ, minimized: false } : w
    ))
    setNextZ(z => z + 1)
  }, [nextZ])

  return { windows, openApp, closeApp, minimizeApp, maximizeApp, focusApp }
}
