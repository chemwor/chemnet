import { useState, useRef, useEffect } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import Draggable from 'react-draggable'

const EXPO_OUT = [0.16, 1, 0.3, 1]

export function WindowFrame({ windowState, app, onClose, onMinimize, onMaximize, onFocus, onOffscreen, children }) {
  const nodeRef = useRef(null)
  const [position, setPosition] = useState(app.defaultPosition ?? { x: 100, y: 100 })
  const [dragging, setDragging] = useState(false)
  const glowControls = useAnimationControls()
  const prevZRef = useRef(windowState.zIndex)

  const isMaximized = windowState.maximized
  const isMinimized = windowState.minimized

  // Focus glow: detect zIndex increase (brought to front)
  useEffect(() => {
    if (windowState.zIndex > prevZRef.current && !isMinimized) {
      glowControls.start({
        boxShadow: [
          '0 0 0px 0px rgba(192, 57, 43, 0)',
          '0 0 12px 4px rgba(192, 57, 43, 0.4)',
          '0 0 0px 0px rgba(192, 57, 43, 0)',
        ],
        transition: { duration: 0.25, times: [0, 0.4, 1] },
      })
    }
    prevZRef.current = windowState.zIndex
  }, [windowState.zIndex, isMinimized, glowControls])

  const positionStyle = isMaximized
    ? { position: 'absolute', inset: 0, zIndex: windowState.zIndex }
    : {
        position: 'absolute',
        width: app.defaultSize?.width ?? 480,
        height: app.defaultSize?.height ?? 360,
        zIndex: windowState.zIndex,
      }

  // Minimize: shrink toward taskbar (bottom center of screen)
  const minimizeTarget = {
    scale: 0.3,
    y: typeof window !== 'undefined' ? window.innerHeight - 40 : 700,
    opacity: 0,
  }

  const frame = (
    <motion.div
      ref={nodeRef}
      style={positionStyle}
      className="flex flex-col"
      onMouseDown={onFocus}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={isMinimized
        ? minimizeTarget
        : { scale: 1, opacity: 1, y: 0 }
      }
      exit={{ scale: 0.88, opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
      transition={{ duration: 0.18, ease: EXPO_OUT }}
    >
      <motion.div
        className="flex flex-col h-full"
        animate={glowControls}
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
          className="titlebar flex items-center justify-between px-2 py-1 select-none shrink-0"
          style={{
            background: 'linear-gradient(90deg, var(--color-titlebar-active), #1E1C28)',
            cursor: dragging ? 'var(--cursor-grab)' : 'var(--cursor-grab)',
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
      </motion.div>
    </motion.div>
  )

  if (isMaximized) return frame

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".titlebar"
      position={position}
      onStart={() => setDragging(true)}
      onStop={(_, data) => {
        setDragging(false)
        const w = app.defaultSize?.width ?? 480
        const h = app.defaultSize?.height ?? 360
        const vw = window.innerWidth
        const vh = window.innerHeight
        if (data.x + w < 20 || data.x > vw - 20 || data.y + h < 20 || data.y > vh - 60) {
          onOffscreen?.()
          setPosition(app.defaultPosition ?? { x: 100, y: 100 })
        } else {
          setPosition({ x: data.x, y: data.y })
        }
      }}
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
      className="title-btn bevel-button w-5 h-5 flex items-center justify-center text-xs leading-none cursor-pointer"
      style={{
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        cursor: 'var(--cursor-pointer)',
        transition: 'transform 80ms ease-out',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
    >
      {children}
    </button>
  )
}
