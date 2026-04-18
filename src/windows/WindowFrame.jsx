import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import Draggable from 'react-draggable'
import { AppIcon } from '../shell/AppIcon'

const EXPO_OUT = [0.16, 1, 0.3, 1]
const MIN_W = 200
const MIN_H = 120
const HANDLE = 6

export function WindowFrame({ windowState, app, onClose, onMinimize, onMaximize, onFocus, onOffscreen, children }) {
  const nodeRef = useRef(null)
  const [position, setPosition] = useState(app.defaultPosition ?? { x: 100, y: 100 })
  const [size, setSize] = useState({
    w: app.defaultSize?.width ?? 480,
    h: app.defaultSize?.height ?? 360,
  })
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(null) // null or { dir, startX, startY, startW, startH, startPosX, startPosY }
  const glowControls = useAnimationControls()
  const prevZRef = useRef(windowState.zIndex)

  const isMaximized = windowState.maximized
  const isMinimized = windowState.minimized

  // Focus glow
  useEffect(() => {
    if (windowState.zIndex > prevZRef.current && !isMinimized) {
      glowControls.start({
        boxShadow: [
          '0 0 0px 0px rgba(255, 107, 53, 0)',
          '0 0 12px 4px rgba(255, 107, 53, 0.4)',
          '0 0 0px 0px rgba(255, 107, 53, 0)',
        ],
        transition: { duration: 0.25, times: [0, 0.4, 1] },
      })
    }
    prevZRef.current = windowState.zIndex
  }, [windowState.zIndex, isMinimized, glowControls])

  // Resize handlers
  const handleResizeStart = useCallback((e, dir) => {
    e.preventDefault()
    e.stopPropagation()
    onFocus()
    setResizing({
      dir,
      startX: e.clientX,
      startY: e.clientY,
      startW: size.w,
      startH: size.h,
      startPosX: position.x,
      startPosY: position.y,
    })
  }, [size, position, onFocus])

  useEffect(() => {
    if (!resizing) return

    const handleMouseMove = (e) => {
      const dx = e.clientX - resizing.startX
      const dy = e.clientY - resizing.startY
      const { dir, startW, startH, startPosX, startPosY } = resizing

      let newW = startW
      let newH = startH
      let newX = startPosX
      let newY = startPosY

      if (dir.includes('e')) newW = Math.max(MIN_W, startW + dx)
      if (dir.includes('s')) newH = Math.max(MIN_H, startH + dy)
      if (dir.includes('w')) {
        const dw = Math.min(dx, startW - MIN_W)
        newW = startW - dw
        newX = startPosX + dw
      }
      if (dir.includes('n')) {
        const dh = Math.min(dy, startH - MIN_H)
        newH = startH - dh
        newY = startPosY + dh
      }

      setSize({ w: newW, h: newH })
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => setResizing(null)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizing])

  // Cursor for each resize direction
  const resizeCursors = {
    n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
    ne: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize', sw: 'nesw-resize',
  }

  const resizeHandles = !isMaximized && (
    <>
      {/* Edge handles */}
      <div onMouseDown={(e) => handleResizeStart(e, 'n')} style={{ position: 'absolute', top: -HANDLE/2, left: HANDLE, right: HANDLE, height: HANDLE, cursor: 'ns-resize', zIndex: 1 }} />
      <div onMouseDown={(e) => handleResizeStart(e, 's')} style={{ position: 'absolute', bottom: -HANDLE/2, left: HANDLE, right: HANDLE, height: HANDLE, cursor: 'ns-resize', zIndex: 1 }} />
      <div onMouseDown={(e) => handleResizeStart(e, 'w')} style={{ position: 'absolute', top: HANDLE, bottom: HANDLE, left: -HANDLE/2, width: HANDLE, cursor: 'ew-resize', zIndex: 1 }} />
      <div onMouseDown={(e) => handleResizeStart(e, 'e')} style={{ position: 'absolute', top: HANDLE, bottom: HANDLE, right: -HANDLE/2, width: HANDLE, cursor: 'ew-resize', zIndex: 1 }} />
      {/* Corner handles */}
      <div onMouseDown={(e) => handleResizeStart(e, 'nw')} style={{ position: 'absolute', top: -HANDLE/2, left: -HANDLE/2, width: HANDLE*2, height: HANDLE*2, cursor: 'nwse-resize', zIndex: 2 }} />
      <div onMouseDown={(e) => handleResizeStart(e, 'ne')} style={{ position: 'absolute', top: -HANDLE/2, right: -HANDLE/2, width: HANDLE*2, height: HANDLE*2, cursor: 'nesw-resize', zIndex: 2 }} />
      <div onMouseDown={(e) => handleResizeStart(e, 'sw')} style={{ position: 'absolute', bottom: -HANDLE/2, left: -HANDLE/2, width: HANDLE*2, height: HANDLE*2, cursor: 'nesw-resize', zIndex: 2 }} />
      <div onMouseDown={(e) => handleResizeStart(e, 'se')} style={{ position: 'absolute', bottom: -HANDLE/2, right: -HANDLE/2, width: HANDLE*2, height: HANDLE*2, cursor: 'nwse-resize', zIndex: 2 }} />
    </>
  )

  const innerContent = (
    <motion.div
      className="flex flex-col h-full"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={isMinimized
        ? { scale: 0.3, opacity: 0 }
        : { scale: 1, opacity: 1 }
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
            className="text-sm font-bold truncate flex items-center gap-1.5"
            style={{ color: 'var(--color-titlebar-text)' }}
          >
            <AppIcon icon={app.icon} size={14} /> {app.label}
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

  if (isMaximized) {
    return (
      <div
        style={{ position: 'absolute', inset: 0, zIndex: windowState.zIndex }}
        className="flex flex-col"
        onMouseDown={onFocus}
      >
        {innerContent}
      </div>
    )
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".titlebar"
      position={position}
      disabled={!!resizing}
      onStart={() => setDragging(true)}
      onStop={(_, data) => {
        setDragging(false)
        const vw = window.innerWidth
        const vh = window.innerHeight
        if (data.x + size.w < 20 || data.x > vw - 20 || data.y + size.h < 20 || data.y > vh - 60) {
          onOffscreen?.()
          setPosition(app.defaultPosition ?? { x: 100, y: 100 })
        } else {
          setPosition({ x: data.x, y: data.y })
        }
      }}
    >
      <div
        ref={nodeRef}
        style={{
          position: 'absolute',
          zIndex: windowState.zIndex,
          width: size.w,
          height: size.h,
        }}
        className="flex flex-col"
        onMouseDown={onFocus}
      >
        {resizeHandles}
        {innerContent}
      </div>
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
