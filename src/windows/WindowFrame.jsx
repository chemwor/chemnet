import { useState, useRef } from 'react'
import Draggable from 'react-draggable'

export function WindowFrame({ windowState, app, onClose, onMinimize, onMaximize, onFocus, children }) {
  const nodeRef = useRef(null)
  const [position, setPosition] = useState(app.defaultPosition ?? { x: 100, y: 100 })

  const isMaximized = windowState.maximized

  const style = isMaximized
    ? { position: 'absolute', inset: 0, zIndex: windowState.zIndex }
    : {
        position: 'absolute',
        width: app.defaultSize?.width ?? 480,
        height: app.defaultSize?.height ?? 360,
        zIndex: windowState.zIndex,
      }

  const frame = (
    <div
      ref={nodeRef}
      style={style}
      className="flex flex-col"
      onMouseDown={onFocus}
    >
      {/* Outer bevel */}
      <div
        className="flex flex-col h-full"
        style={{
          background: 'var(--color-surface)',
          borderTop: '2px solid var(--color-bevel-light)',
          borderLeft: '2px solid var(--color-bevel-light)',
          borderBottom: '2px solid var(--color-bevel-dark)',
          borderRight: '2px solid var(--color-bevel-dark)',
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center justify-between px-2 py-1 select-none shrink-0 cursor-grab active:cursor-grabbing"
          style={{
            background: 'linear-gradient(90deg, var(--color-titlebar-active), #1E1C28)',
          }}
        >
          <span
            className="text-sm font-bold truncate"
            style={{ color: 'var(--color-titlebar-text)' }}
          >
            {app.icon} {app.label}
          </span>

          <div className="flex gap-0.5 ml-2 shrink-0">
            <TitleButton onClick={onMinimize}>_</TitleButton>
            <TitleButton onClick={onMaximize}>{isMaximized ? '❐' : '□'}</TitleButton>
            <TitleButton onClick={onClose}>✕</TitleButton>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-auto"
          style={{
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-bevel-dark)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )

  if (isMaximized) return frame

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".cursor-grab"
      position={position}
      onStop={(_, data) => setPosition({ x: data.x, y: data.y })}
    >
      {frame}
    </Draggable>
  )
}

function TitleButton({ onClick, children }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="w-5 h-5 flex items-center justify-center text-xs leading-none border-none cursor-pointer"
      style={{
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        borderTop: '1px solid var(--color-bevel-light)',
        borderLeft: '1px solid var(--color-bevel-light)',
        borderBottom: '1px solid var(--color-bevel-dark)',
        borderRight: '1px solid var(--color-bevel-dark)',
      }}
    >
      {children}
    </button>
  )
}
