import { useEffect, useRef, useState, useCallback } from 'react'
import { submitScore, getGameScore } from '../../lib/highscores'

const COLS = 10
const ROWS = 20
const CELL = 24
const TICK_INIT = 500
const TICK_MIN = 80

const PIECES = [
  { shape: [[1,1,1,1]], color: '#00F0F0' },           // I
  { shape: [[1,1],[1,1]], color: '#F0F000' },           // O
  { shape: [[0,1,0],[1,1,1]], color: '#A000F0' },       // T
  { shape: [[1,0,0],[1,1,1]], color: '#0000F0' },       // J
  { shape: [[0,0,1],[1,1,1]], color: '#F0A000' },       // L
  { shape: [[0,1,1],[1,1,0]], color: '#00F000' },       // S
  { shape: [[1,1,0],[0,1,1]], color: '#F00000' },       // Z
]

function rotate(shape) {
  const rows = shape.length, cols = shape[0].length
  return Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r) => shape[rows - 1 - r][c])
  )
}

function createBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)) }

function randomPiece() {
  const p = PIECES[Math.floor(Math.random() * PIECES.length)]
  return { shape: p.shape.map(r => [...r]), color: p.color, x: Math.floor((COLS - p.shape[0].length) / 2), y: 0 }
}

function collides(board, piece, dx, dy) {
  for (let r = 0; r < piece.shape.length; r++)
    for (let c = 0; c < piece.shape[r].length; c++)
      if (piece.shape[r][c]) {
        const nx = piece.x + c + dx, ny = piece.y + r + dy
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true
        if (ny >= 0 && board[ny][nx]) return true
      }
  return false
}

function place(board, piece) {
  const nb = board.map(r => [...r])
  for (let r = 0; r < piece.shape.length; r++)
    for (let c = 0; c < piece.shape[r].length; c++)
      if (piece.shape[r][c]) {
        const ny = piece.y + r
        if (ny >= 0) nb[ny][piece.x + c] = piece.color
      }
  return nb
}

function clearLines(board) {
  const kept = board.filter(row => row.some(c => c === null))
  const cleared = ROWS - kept.length
  const empty = Array.from({ length: cleared }, () => Array(COLS).fill(null))
  return { board: [...empty, ...kept], lines: cleared }
}

const LINE_POINTS = [0, 100, 300, 500, 800]

export default function Tetris() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const [screen, setScreen] = useState('start')
  const [hud, setHud] = useState({ score: 0, level: 1, lines: 0 })
  const touchStart = useRef(null)
  const lastTap = useRef(0)

  const startGame = useCallback(() => {
    stateRef.current = {
      board: createBoard(), current: randomPiece(), next: randomPiece(),
      score: 0, lines: 0, level: 1, tick: TICK_INIT, elapsed: 0, lastTime: 0,
    }
    setHud({ score: 0, level: 1, lines: 0 })
    setScreen('playing')
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const boardW = COLS * CELL
    const boardH = ROWS * CELL
    canvas.width = boardW + 100
    canvas.height = boardH

    let raf

    const drop = () => {
      const s = stateRef.current
      if (!s) return
      if (!collides(s.board, s.current, 0, 1)) {
        s.current.y++
      } else {
        s.board = place(s.board, s.current)
        const { board, lines } = clearLines(s.board)
        s.board = board
        s.lines += lines
        s.score += LINE_POINTS[lines] * s.level
        s.level = Math.floor(s.lines / 10) + 1
        s.tick = Math.max(TICK_MIN, TICK_INIT - (s.level - 1) * 40)
        setHud({ score: s.score, level: s.level, lines: s.lines })
        s.current = s.next
        s.next = randomPiece()
        if (collides(s.board, s.current, 0, 0)) {
          submitScore('tetris', s.score)
          setScreen('gameover')
        }
      }
    }

    const moveLeft = () => { const s = stateRef.current; if (s && !collides(s.board, s.current, -1, 0)) s.current.x-- }
    const moveRight = () => { const s = stateRef.current; if (s && !collides(s.board, s.current, 1, 0)) s.current.x++ }
    const rotatePiece = () => {
      const s = stateRef.current; if (!s) return
      const rotated = { ...s.current, shape: rotate(s.current.shape) }
      if (!collides(s.board, rotated, 0, 0)) s.current.shape = rotated.shape
      else if (!collides(s.board, rotated, -1, 0)) { s.current.shape = rotated.shape; s.current.x-- }
      else if (!collides(s.board, rotated, 1, 0)) { s.current.shape = rotated.shape; s.current.x++ }
    }
    const hardDrop = () => {
      const s = stateRef.current; if (!s) return
      while (!collides(s.board, s.current, 0, 1)) s.current.y++
      drop()
    }

    const update = (timestamp) => {
      const s = stateRef.current
      if (s && screen === 'playing') {
        if (!s.lastTime) s.lastTime = timestamp
        s.elapsed += timestamp - s.lastTime
        s.lastTime = timestamp
        if (s.elapsed >= s.tick) { s.elapsed = 0; drop() }
      }
      draw()
      raf = requestAnimationFrame(update)
    }

    const draw = () => {
      const s = stateRef.current
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // Board border
      ctx.strokeStyle = '#444'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, boardW, boardH)

      if (!s) return

      // Board
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          if (s.board[r][c]) {
            ctx.fillStyle = s.board[r][c]
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2)
          } else {
            ctx.fillStyle = '#1a1a1a'
            ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2)
          }
        }

      // Ghost piece
      if (screen === 'playing') {
        let ghostY = s.current.y
        while (!collides(s.board, { ...s.current, y: ghostY }, 0, 1)) ghostY++
        for (let r = 0; r < s.current.shape.length; r++)
          for (let c = 0; c < s.current.shape[r].length; c++)
            if (s.current.shape[r][c]) {
              ctx.fillStyle = 'rgba(255,255,255,0.1)'
              ctx.fillRect((s.current.x + c) * CELL + 1, (ghostY + r) * CELL + 1, CELL - 2, CELL - 2)
            }

        // Current piece
        for (let r = 0; r < s.current.shape.length; r++)
          for (let c = 0; c < s.current.shape[r].length; c++)
            if (s.current.shape[r][c]) {
              ctx.fillStyle = s.current.color
              ctx.fillRect((s.current.x + c) * CELL + 1, (s.current.y + r) * CELL + 1, CELL - 2, CELL - 2)
              ctx.fillStyle = 'rgba(255,255,255,0.15)'
              ctx.fillRect((s.current.x + c) * CELL + 1, (s.current.y + r) * CELL + 1, CELL - 2, (CELL - 2) / 2)
            }
      }

      // Side panel
      const px = boardW + 8
      ctx.fillStyle = '#888'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'left'
      ctx.fillText('NEXT', px, 14)
      // Next piece preview
      if (s.next) {
        for (let r = 0; r < s.next.shape.length; r++)
          for (let c = 0; c < s.next.shape[r].length; c++)
            if (s.next.shape[r][c]) {
              ctx.fillStyle = s.next.color
              ctx.fillRect(px + c * 16, 20 + r * 16, 14, 14)
            }
      }

      ctx.fillStyle = '#888'
      ctx.fillText('SCORE', px, 100)
      ctx.fillStyle = '#fff'
      ctx.fillText(s.score, px, 114)
      ctx.fillStyle = '#888'
      ctx.fillText('LEVEL', px, 140)
      ctx.fillStyle = '#fff'
      ctx.fillText(s.level, px, 154)
      ctx.fillStyle = '#888'
      ctx.fillText('LINES', px, 180)
      ctx.fillStyle = '#fff'
      ctx.fillText(s.lines, px, 194)
      ctx.fillStyle = '#555'
      ctx.fillText('HI', px, 220)
      ctx.fillText(getGameScore('tetris').highScore || 0, px, 234)
    }

    const onKey = (e) => {
      if (screen !== 'playing') return
      if (e.key === 'ArrowLeft' || e.key === 'a') { moveLeft(); e.preventDefault() }
      if (e.key === 'ArrowRight' || e.key === 'd') { moveRight(); e.preventDefault() }
      if (e.key === 'ArrowDown' || e.key === 's') { drop(); e.preventDefault() }
      if (e.key === 'ArrowUp' || e.key === 'w') { rotatePiece(); e.preventDefault() }
      if (e.key === ' ') { hardDrop(); e.preventDefault() }
    }

    // Store move functions for touch
    canvas._controls = { moveLeft, moveRight, drop, rotatePiece, hardDrop }

    window.addEventListener('keydown', onKey)
    raf = requestAnimationFrame(update)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey) }
  }, [screen, startGame])

  // Touch: swipe left/right/down, tap to rotate, double-tap to hard drop
  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() }
  }
  const handleTouchEnd = (e) => {
    if (!touchStart.current || screen !== 'playing') return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    const dt = Date.now() - touchStart.current.time
    const controls = canvasRef.current?._controls
    if (!controls) return

    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 300) {
      // Tap — check for double tap
      const now = Date.now()
      if (now - lastTap.current < 300) { controls.hardDrop(); lastTap.current = 0 }
      else { controls.rotatePiece(); lastTap.current = now }
    } else if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 25) controls.moveRight()
      else if (dx < -25) controls.moveLeft()
    } else if (dy > 25) {
      controls.drop()
    }
    touchStart.current = null
  }

  return (
    <div
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {(screen === 'start' || screen === 'gameover') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="text-center" style={{ fontFamily: 'monospace' }}>
            {screen === 'gameover' ? (
              <>
                <div className="text-xl font-bold mb-1" style={{ color: '#FF4444' }}>GAME OVER</div>
                <div className="text-sm mb-1" style={{ color: '#ccc' }}>Score: {hud.score} · Level {hud.level}</div>
                <div className="text-xs mb-3" style={{ color: '#666' }}>Hi-Score: {getGameScore('tetris').highScore || 0}</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold mb-2" style={{ color: '#00F0F0' }}>TETRIS</div>
                <div className="text-xs mb-1" style={{ color: '#888' }}>Swipe ← → to move · Tap to rotate</div>
                <div className="text-xs mb-1" style={{ color: '#888' }}>Swipe ↓ soft drop · Double-tap hard drop</div>
                <div className="text-xs mb-3" style={{ color: '#555' }}>Hi-Score: {getGameScore('tetris').highScore || 0}</div>
              </>
            )}
            <button
              onClick={startGame}
              className="px-4 py-1.5 text-sm font-bold cursor-pointer border-none"
              style={{ background: '#00F0F0', color: '#000', fontFamily: 'monospace' }}
            >
              {screen === 'gameover' ? 'Play Again' : 'Start'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
