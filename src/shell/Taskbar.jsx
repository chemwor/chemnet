import { useState, useEffect } from 'react'

function Clock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="px-3 py-1 text-xs font-mono border-l"
      style={{
        color: 'var(--color-text-secondary)',
        borderColor: 'var(--color-taskbar-border)',
      }}
    >
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </div>
  )
}

export function Taskbar({ windows, onFocusApp, onOpenApp }) {
  return (
    <div
      className="flex items-center h-10 px-1 shrink-0"
      style={{
        background: 'var(--color-taskbar-bg)',
        borderTop: '1px solid var(--color-taskbar-border)',
      }}
    >
      {/* Start button */}
      <button
        className="flex items-center gap-1 px-3 py-1 mr-2 text-sm font-bold border-none cursor-pointer"
        style={{
          background: 'var(--color-start-bg)',
          color: 'var(--color-text-primary)',
          borderTop: '1px solid var(--color-bevel-light)',
          borderLeft: '1px solid var(--color-bevel-light)',
          borderBottom: '1px solid var(--color-bevel-dark)',
          borderRight: '1px solid var(--color-bevel-dark)',
        }}
      >
        <span>⊞</span> Start
      </button>

      {/* Open window buttons */}
      <div className="flex gap-1 flex-1 overflow-hidden">
        {windows.map(w => (
          <button
            key={w.id}
            onClick={() => onFocusApp(w.id)}
            className="px-3 py-1 text-xs truncate max-w-[140px] border-none cursor-pointer"
            style={{
              background: w.minimized ? 'var(--color-surface)' : 'var(--color-bevel-light)',
              color: 'var(--color-text-primary)',
              borderTop: '1px solid var(--color-bevel-light)',
              borderLeft: '1px solid var(--color-bevel-light)',
              borderBottom: '1px solid var(--color-bevel-dark)',
              borderRight: '1px solid var(--color-bevel-dark)',
            }}
          >
            {w.label}
          </button>
        ))}
      </div>

      <Clock />
    </div>
  )
}
