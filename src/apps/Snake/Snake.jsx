import { useEffect, useRef, useState, useCallback } from 'react'
import { submitScore, getGameScore } from '../../lib/highscores'
import GameOver from '../../lib/GameOver'

const CELL = 16
const COLS = 20
const ROWS = 20
const TICK_INIT = 120
const TICK_MIN = 60

export default function Snake() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const [screen, setScreen] = useState('start')
  const [score, setScore] = useState(0)
  const touchStart = useRef(null)

  const initGame = useCallback(() => {
    const mid = Math.floor(ROWS / 2)
    return {
      snake: [{ x: 5, y: mid }, { x: 4, y: mid }, { x: 3, y: mid }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: spawnFood([{ x: 5, y: mid }, { x: 4, y: mid }, { x: 3, y: mid }]),
      score: 0,
      tick: TICK_INIT,
      lastTime: 0,
      elapsed: 0,
    }
  }, [])

  const startGame = useCallback(() => {
    stateRef.current = initGame()
    setScore(0)
    setScreen('playing')
  }, [initGame])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = COLS * CELL
    canvas.height = ROWS * CELL

    let raf

    const update = (timestamp) => {
      const s = stateRef.current
      if (!s || screen !== 'playing') { draw(); raf = requestAnimationFrame(update); return }

      if (!s.lastTime) s.lastTime = timestamp
      s.elapsed += timestamp - s.lastTime
      s.lastTime = timestamp

      if (s.elapsed < s.tick) { draw(); raf = requestAnimationFrame(update); return }
      s.elapsed = 0

      // Apply buffered direction
      s.dir = s.nextDir

      // Move head
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y }

      // Wall collision
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        submitScore('snake', s.score)
        setScreen('gameover')
        draw()
        raf = requestAnimationFrame(update)
        return
      }

      // Self collision
      if (s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        submitScore('snake', s.score)
        setScreen('gameover')
        draw()
        raf = requestAnimationFrame(update)
        return
      }

      s.snake.unshift(head)

      // Eat food
      if (head.x === s.food.x && head.y === s.food.y) {
        s.score += 10
        setScore(s.score)
        s.food = spawnFood(s.snake)
        s.tick = Math.max(TICK_MIN, s.tick - 2) // speed up
      } else {
        s.snake.pop()
      }

      draw()
      raf = requestAnimationFrame(update)
    }

    const draw = () => {
      const s = stateRef.current
      const w = canvas.width, h = canvas.height

      // Background
      ctx.fillStyle = '#0a2a0a'
      ctx.fillRect(0, 0, w, h)

      // Grid lines (subtle)
      ctx.strokeStyle = '#0f3f0f'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, h); ctx.stroke()
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(w, y * CELL); ctx.stroke()
      }

      if (!s) return

      // Food
      ctx.fillStyle = '#FF6B35'
      ctx.shadowColor = '#FF6B35'
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Snake
      s.snake.forEach((seg, i) => {
        const isHead = i === 0
        ctx.fillStyle = isHead ? '#44FF44' : '#22CC22'
        ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2)
        if (isHead) {
          ctx.fillStyle = '#0a2a0a'
          // Eyes based on direction
          const ex = s.dir.x * 3, ey = s.dir.y * 3
          ctx.fillRect(seg.x * CELL + 4 + ex, seg.y * CELL + 4 + ey, 2, 2)
          ctx.fillRect(seg.x * CELL + CELL - 6 + ex, seg.y * CELL + 4 + ey, 2, 2)
        }
      })

      // Score on canvas
      ctx.fillStyle = '#44FF44'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`Score: ${s.score}`, 4, 12)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#1a5a1a'
      ctx.fillText(`Hi: ${getGameScore('snake').highScore || 0}`, w - 4, 12)
    }

    const onKey = (e) => {
      if (!stateRef.current || screen !== 'playing') return
      const s = stateRef.current
      if (e.key === 'ArrowUp' || e.key === 'w') { if (s.dir.y !== 1) s.nextDir = { x: 0, y: -1 } }
      if (e.key === 'ArrowDown' || e.key === 's') { if (s.dir.y !== -1) s.nextDir = { x: 0, y: 1 } }
      if (e.key === 'ArrowLeft' || e.key === 'a') { if (s.dir.x !== 1) s.nextDir = { x: -1, y: 0 } }
      if (e.key === 'ArrowRight' || e.key === 'd') { if (s.dir.x !== -1) s.nextDir = { x: 1, y: 0 } }
      e.preventDefault()
    }

    window.addEventListener('keydown', onKey)
    raf = requestAnimationFrame(update)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey) }
  }, [screen, initGame])

  // Touch controls — swipe
  const handleTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const handleTouchEnd = (e) => {
    if (!touchStart.current || !stateRef.current || screen !== 'playing') return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    const s = stateRef.current
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 20 && s.dir.x !== -1) s.nextDir = { x: 1, y: 0 }
      if (dx < -20 && s.dir.x !== 1) s.nextDir = { x: -1, y: 0 }
    } else {
      if (dy > 20 && s.dir.y !== -1) s.nextDir = { x: 0, y: 1 }
      if (dy < -20 && s.dir.y !== 1) s.nextDir = { x: 0, y: -1 }
    }
    touchStart.current = null
  }

  return (
    <div
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0a2a0a', alignItems: 'center', justifyContent: 'center' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative">
        <canvas ref={canvasRef} style={{ display: 'block' }} />

        {screen === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <div className="text-center" style={{ fontFamily: 'monospace' }}>
              <div className="text-xl font-bold mb-1" style={{ color: '#44FF44' }}>SNAKE</div>
              <div className="text-xs mb-1" style={{ color: '#22aa22' }}>Swipe or arrow keys to move</div>
              <div className="text-xs mb-3" style={{ color: '#1a5a1a' }}>Hi-Score: {getGameScore('snake').highScore || 0}</div>
              <button
                onClick={startGame}
                className="px-4 py-1.5 text-sm font-bold cursor-pointer border-none"
                style={{ background: '#44FF44', color: '#0a2a0a', fontFamily: 'monospace' }}
              >
                Start
              </button>
            </div>
          </div>
        )}

        {screen === 'gameover' && (
          <GameOver gameId="snake" score={score} onRestart={startGame} />
        )}
      </div>
    </div>
  )
}

function spawnFood(snake) {
  let pos
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
  } while (snake.some(s => s.x === pos.x && s.y === pos.y))
  return pos
}
