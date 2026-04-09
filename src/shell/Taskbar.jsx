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
        position: 'relative',
        zIndex: 100,
        background: 'var(--color-taskbar-bg)',
        borderTop: '1px solid var(--color-taskbar-border)',
      }}
    >
      {/* Start button */}
      <button
        className="bevel-button flex items-center gap-1 px-3 py-1 mr-2 text-sm font-bold cursor-pointer"
        style={{
          background: 'var(--color-start-bg)',
          color: 'var(--color-text-primary)',
          cursor: 'var(--cursor-pointer)',
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
            className="bevel-button px-3 py-1 text-xs truncate max-w-[140px] cursor-pointer"
            style={{
              background: w.minimized ? 'var(--color-surface)' : 'var(--color-bevel-light)',
              color: 'var(--color-text-primary)',
              cursor: 'var(--cursor-pointer)',
              borderBottom: !w.minimized
                ? '2px solid var(--color-accent)'
                : '1px solid var(--color-bevel-dark)',
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
