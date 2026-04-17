import { useEffect, useRef, useState, useCallback } from 'react'

const PADDLE_H = 60
const PADDLE_W = 10
const BALL_SIZE = 8
const PADDLE_SPEED = 5
const BALL_SPEED_INIT = 3
const WINNING_SCORE = 7
const AI_SPEED = 3.2

export default function Pong() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const keysRef = useRef({})
  const [scores, setScores] = useState({ player: 0, ai: 0 })
  const [paused, setPaused] = useState(true)
  const [winner, setWinner] = useState(null)

  const resetBall = useCallback((state) => {
    const { w, h } = state
    state.ball = {
      x: w / 2,
      y: h / 2,
      vx: (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED_INIT,
      vy: (Math.random() - 0.5) * 4,
    }
  }, [])

  const initState = useCallback((canvas) => {
    const w = canvas.width
    const h = canvas.height
    const state = {
      w, h,
      player: { y: h / 2 - PADDLE_H / 2 },
      ai: { y: h / 2 - PADDLE_H / 2 },
      ball: null,
      playerScore: 0,
      aiScore: 0,
    }
    resetBall(state)
    return state
  }, [resetBall])

  const startGame = useCallback(() => {
    setWinner(null)
    setScores({ player: 0, ai: 0 })
    setPaused(false)
    if (stateRef.current) {
      stateRef.current.playerScore = 0
      stateRef.current.aiScore = 0
      stateRef.current.player.y = stateRef.current.h / 2 - PADDLE_H / 2
      stateRef.current.ai.y = stateRef.current.h / 2 - PADDLE_H / 2
      resetBall(stateRef.current)
    }
  }, [resetBall])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const parent = canvas.parentElement
    canvas.width = parent.clientWidth
    canvas.height = parent.clientHeight

    stateRef.current = initState(canvas)
    let raf

    const update = () => {
      const s = stateRef.current
      if (!s) return
      const { w, h, ball, player, ai } = s

      // Player movement (arrow keys or W/S)
      if (keysRef.current['ArrowUp'] || keysRef.current['w']) {
        player.y = Math.max(0, player.y - PADDLE_SPEED)
      }
      if (keysRef.current['ArrowDown'] || keysRef.current['s']) {
        player.y = Math.min(h - PADDLE_H, player.y + PADDLE_SPEED)
      }

      // AI movement — follows ball with slight delay
      const aiCenter = ai.y + PADDLE_H / 2
      if (ball.vx > 0) {
        // Ball coming toward AI
        if (aiCenter < ball.y - 10) ai.y += AI_SPEED
        else if (aiCenter > ball.y + 10) ai.y -= AI_SPEED
      } else {
        // Ball going away — drift toward center
        if (aiCenter < h / 2 - 20) ai.y += AI_SPEED * 0.5
        else if (aiCenter > h / 2 + 20) ai.y -= AI_SPEED * 0.5
      }
      ai.y = Math.max(0, Math.min(h - PADDLE_H, ai.y))

      // Ball movement
      ball.x += ball.vx
      ball.y += ball.vy

      // Top/bottom bounce
      if (ball.y <= 0 || ball.y >= h - BALL_SIZE) {
        ball.vy *= -1
        ball.y = ball.y <= 0 ? 0 : h - BALL_SIZE
      }

      // Player paddle collision (left side)
      if (
        ball.x <= PADDLE_W + 12 &&
        ball.x >= 12 &&
        ball.y + BALL_SIZE >= player.y &&
        ball.y <= player.y + PADDLE_H &&
        ball.vx < 0
      ) {
        ball.vx = Math.abs(ball.vx) * 1.05
        ball.vy += ((ball.y - (player.y + PADDLE_H / 2)) / PADDLE_H) * 3
        ball.x = PADDLE_W + 13
      }

      // AI paddle collision (right side)
      if (
        ball.x + BALL_SIZE >= w - PADDLE_W - 12 &&
        ball.x + BALL_SIZE <= w - 12 &&
        ball.y + BALL_SIZE >= ai.y &&
        ball.y <= ai.y + PADDLE_H &&
        ball.vx > 0
      ) {
        ball.vx = -Math.abs(ball.vx) * 1.05
        ball.vy += ((ball.y - (ai.y + PADDLE_H / 2)) / PADDLE_H) * 3
        ball.x = w - PADDLE_W - 12 - BALL_SIZE - 1
      }

      // Scoring
      if (ball.x < 0) {
        s.aiScore++
        setScores({ player: s.playerScore, ai: s.aiScore })
        if (s.aiScore >= WINNING_SCORE) {
          setWinner('CPU')
          setPaused(true)
        } else {
          resetBall(s)
        }
      }
      if (ball.x > w) {
        s.playerScore++
        setScores({ player: s.playerScore, ai: s.aiScore })
        if (s.playerScore >= WINNING_SCORE) {
          setWinner('You')
          setPaused(true)
        } else {
          resetBall(s)
        }
      }

      // Cap ball speed
      const speed = Math.sqrt(ball.vx ** 2 + ball.vy ** 2)
      if (speed > 10) {
        ball.vx = (ball.vx / speed) * 10
        ball.vy = (ball.vy / speed) * 10
      }
    }

    const draw = () => {
      const s = stateRef.current
      if (!s) return
      const { w, h, ball, player, ai } = s

      // Background
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, w, h)

      // Center dashed line
      ctx.setLineDash([6, 6])
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(w / 2, 0)
      ctx.lineTo(w / 2, h)
      ctx.stroke()
      ctx.setLineDash([])

      // Scores
      ctx.fillStyle = '#444'
      ctx.font = 'bold 40px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(s.playerScore, w / 2 - 40, 50)
      ctx.fillText(s.aiScore, w / 2 + 40, 50)

      // Paddles
      ctx.fillStyle = '#F0EBE1'
      ctx.fillRect(12, player.y, PADDLE_W, PADDLE_H)
      ctx.fillRect(w - PADDLE_W - 12, ai.y, PADDLE_W, PADDLE_H)

      // Ball
      ctx.fillStyle = '#FF6B35'
      ctx.shadowColor = '#FF6B35'
      ctx.shadowBlur = 10
      ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE)
      ctx.shadowBlur = 0
    }

    const loop = () => {
      if (!stateRef.current) return
      if (!paused && !winner) update()
      draw()
      raf = requestAnimationFrame(loop)
    }

    const onKey = (e) => {
      if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) {
        e.preventDefault()
      }
      keysRef.current[e.key] = e.type === 'keydown'
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  }, [initState, resetBall, paused, winner])

  return (
    <div className="flex flex-col h-full" style={{ background: '#000' }}>
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Overlay states */}
        {(paused || winner) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2 }}>
            <div className="text-center" style={{ fontFamily: 'monospace' }}>
              {winner ? (
                <>
                  <div className="text-2xl font-bold mb-2" style={{ color: '#FF6B35' }}>
                    {winner} Win{winner === 'You' ? '' : 's'}!
                  </div>
                  <div className="text-sm mb-4" style={{ color: '#666' }}>
                    {scores.player} – {scores.ai}
                  </div>
                </>
              ) : (
                <div className="text-lg mb-2" style={{ color: '#F0EBE1' }}>
                  PONG
                </div>
              )}
              <button
                onClick={startGame}
                className="px-4 py-1.5 text-sm font-bold cursor-pointer border-none"
                style={{
                  background: '#FF6B35',
                  color: '#000',
                  fontFamily: 'monospace',
                }}
              >
                {winner ? 'Play Again' : 'Start'}
              </button>
              <div className="mt-3 text-xs" style={{ color: '#555' }}>
                ↑↓ or W/S to move
              </div>
              <div className="text-xs" style={{ color: '#555' }}>
                First to {WINNING_SCORE} wins
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
