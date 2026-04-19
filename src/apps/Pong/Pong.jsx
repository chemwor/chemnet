import { useEffect, useRef, useState, useCallback } from 'react'
import { submitWin, submitLoss, getGameScore } from '../../lib/highscores'

const PADDLE_H = 70
const PADDLE_W = 12
const PADDLE_MARGIN = 20
const BALL_R = 7
const PADDLE_SPEED = 4.5
const BALL_SPEED_INIT = 3.5
const BALL_SPEED_MAX = 8
const WINNING_SCORE = 11
const AI_SPEED = 3.0
const AI_REACTION_ZONE = 15

export default function Pong() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const keysRef = useRef({})
  const [screen, setScreen] = useState('start') // start | playing | paused | gameover

  const resetBall = useCallback((state, serveDir) => {
    const { w, h } = state
    const dir = serveDir || (Math.random() > 0.5 ? 1 : -1)
    const angle = (Math.random() - 0.5) * 0.8 // narrow serve angle
    state.ball = {
      x: w / 2,
      y: h / 2,
      vx: dir * BALL_SPEED_INIT,
      vy: Math.sin(angle) * 2,
      speed: BALL_SPEED_INIT,
    }
    state.serveDelay = 40 // brief pause before ball moves
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
      serveDelay: 0,
      rallies: 0,
      lastHit: null, // 'player' or 'ai'
    }
    resetBall(state, 1)
    return state
  }, [resetBall])

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight
    stateRef.current = initState(canvas)
    setScreen('playing')
  }, [initState])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight

    if (!stateRef.current) {
      stateRef.current = initState(canvas)
    }

    let raf

    const update = () => {
      const s = stateRef.current
      if (!s || screen !== 'playing') return
      const { w, h, ball, player, ai } = s

      // Serve delay
      if (s.serveDelay > 0) {
        s.serveDelay--
        return
      }

      // Player movement
      if (keysRef.current['ArrowUp'] || keysRef.current['w']) {
        player.y = Math.max(0, player.y - PADDLE_SPEED)
      }
      if (keysRef.current['ArrowDown'] || keysRef.current['s']) {
        player.y = Math.min(h - PADDLE_H, player.y + PADDLE_SPEED)
      }

      // AI — tracks ball when coming toward it, slight imperfection
      const aiCenter = ai.y + PADDLE_H / 2
      const aiTarget = ball.y
      if (ball.vx > 0) {
        // Ball coming toward AI — track it
        if (aiCenter < aiTarget - AI_REACTION_ZONE) {
          ai.y += Math.min(AI_SPEED, aiTarget - aiCenter)
        } else if (aiCenter > aiTarget + AI_REACTION_ZONE) {
          ai.y -= Math.min(AI_SPEED, aiCenter - aiTarget)
        }
      } else {
        // Ball going away — slowly return to center
        const center = h / 2
        if (aiCenter < center - 30) ai.y += AI_SPEED * 0.4
        else if (aiCenter > center + 30) ai.y -= AI_SPEED * 0.4
      }
      ai.y = Math.max(0, Math.min(h - PADDLE_H, ai.y))

      // Ball movement
      ball.x += ball.vx
      ball.y += ball.vy

      // Top/bottom bounce
      if (ball.y - BALL_R <= 0) {
        ball.y = BALL_R
        ball.vy = Math.abs(ball.vy)
      }
      if (ball.y + BALL_R >= h) {
        ball.y = h - BALL_R
        ball.vy = -Math.abs(ball.vy)
      }

      // Player paddle collision
      const pLeft = PADDLE_MARGIN
      const pRight = PADDLE_MARGIN + PADDLE_W
      if (
        ball.vx < 0 &&
        ball.x - BALL_R <= pRight &&
        ball.x + BALL_R >= pLeft &&
        ball.y >= player.y - BALL_R &&
        ball.y <= player.y + PADDLE_H + BALL_R
      ) {
        // Where on paddle did it hit? -1 to 1
        const hitPos = (ball.y - (player.y + PADDLE_H / 2)) / (PADDLE_H / 2)
        const newAngle = hitPos * (Math.PI / 3) // max 60 degree deflection
        ball.speed = Math.min(BALL_SPEED_MAX, ball.speed + 0.15)
        ball.vx = Math.cos(newAngle) * ball.speed
        ball.vy = Math.sin(newAngle) * ball.speed
        ball.x = pRight + BALL_R
        s.rallies++
        s.lastHit = 'player'
      }

      // AI paddle collision
      const aiLeft = w - PADDLE_MARGIN - PADDLE_W
      const aiRight = w - PADDLE_MARGIN
      if (
        ball.vx > 0 &&
        ball.x + BALL_R >= aiLeft &&
        ball.x - BALL_R <= aiRight &&
        ball.y >= ai.y - BALL_R &&
        ball.y <= ai.y + PADDLE_H + BALL_R
      ) {
        const hitPos = (ball.y - (ai.y + PADDLE_H / 2)) / (PADDLE_H / 2)
        const newAngle = Math.PI - hitPos * (Math.PI / 3)
        ball.speed = Math.min(BALL_SPEED_MAX, ball.speed + 0.15)
        ball.vx = Math.cos(newAngle) * ball.speed
        ball.vy = Math.sin(newAngle) * ball.speed
        ball.x = aiLeft - BALL_R
        s.rallies++
        s.lastHit = 'ai'
      }

      // Scoring
      if (ball.x + BALL_R < 0) {
        s.aiScore++
        if (s.aiScore >= WINNING_SCORE && s.aiScore - s.playerScore >= 2) {
          submitLoss('tabletennis')
          setScreen('gameover')
        } else {
          resetBall(s, 1) // serve toward player
        }
        s.rallies = 0
      }
      if (ball.x - BALL_R > w) {
        s.playerScore++
        if (s.playerScore >= WINNING_SCORE && s.playerScore - s.aiScore >= 2) {
          submitWin('tabletennis')
          setScreen('gameover')
        } else {
          resetBall(s, -1) // serve toward AI
        }
        s.rallies = 0
      }
    }

    const draw = () => {
      const s = stateRef.current
      if (!s) return
      const { w, h, ball, player, ai } = s

      // Table background — dark green
      ctx.fillStyle = '#1B5E20'
      ctx.fillRect(0, 0, w, h)

      // Table border
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.strokeRect(2, 2, w - 4, h - 4)

      // Center line (net)
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 2
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(w / 2, 0)
      ctx.lineTo(w / 2, h)
      ctx.stroke()

      // Net posts
      ctx.fillStyle = '#888'
      ctx.fillRect(w / 2 - 2, 0, 4, 6)
      ctx.fillRect(w / 2 - 2, h - 6, 4, 6)

      // Center circle
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, 40, 0, Math.PI * 2)
      ctx.stroke()

      // Score display — top center
      ctx.font = 'bold 32px "Courier New", monospace'
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillText(`${s.playerScore}`, w / 2 - 36, 36)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.fillText(':', w / 2, 36)
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillText(`${s.aiScore}`, w / 2 + 36, 36)

      // Player/CPU labels
      ctx.font = '10px monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.textAlign = 'left'
      ctx.fillText('YOU', 10, h - 8)
      ctx.textAlign = 'right'
      ctx.fillText('CPU', w - 10, h - 8)

      // Paddles — white with rounded ends
      ctx.fillStyle = '#fff'
      // Player paddle
      const pr = PADDLE_W / 2
      ctx.beginPath()
      ctx.arc(PADDLE_MARGIN + pr, player.y + pr, pr, Math.PI, 0)
      ctx.arc(PADDLE_MARGIN + pr, player.y + PADDLE_H - pr, pr, 0, Math.PI)
      ctx.closePath()
      ctx.fill()

      // AI paddle
      ctx.beginPath()
      ctx.arc(w - PADDLE_MARGIN - pr, ai.y + pr, pr, Math.PI, 0)
      ctx.arc(w - PADDLE_MARGIN - pr, ai.y + PADDLE_H - pr, pr, 0, Math.PI)
      ctx.closePath()
      ctx.fill()

      // Ball — white with shadow
      ctx.fillStyle = '#fff'
      ctx.shadowColor = 'rgba(0,0,0,0.4)'
      ctx.shadowBlur = 6
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // Ball highlight
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.beginPath()
      ctx.arc(ball.x - 2, ball.y - 2, 2.5, 0, Math.PI * 2)
      ctx.fill()

      // Serve indicator
      if (s.serveDelay > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.font = '12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('SERVE', w / 2, h / 2 + 30)
      }

      // Rally counter
      if (s.rallies > 2) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)'
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`Rally: ${s.rallies}`, w / 2, h - 8)
      }
    }

    const loop = () => {
      if (!stateRef.current) return
      update()
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
  }, [initState, resetBall, screen])

  const s = stateRef.current

  return (
    <div className="flex flex-col h-full" style={{ background: '#1B5E20' }}>
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {(screen === 'start' || screen === 'gameover') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2, background: 'rgba(0,0,0,0.7)' }}>
            <div className="text-center" style={{ fontFamily: 'monospace' }}>
              {screen === 'gameover' ? (
                <>
                  <div className="text-xl font-bold mb-1" style={{ color: '#fff' }}>
                    {s && s.playerScore > s.aiScore ? 'You Win!' : 'CPU Wins'}
                  </div>
                  <div className="text-lg mb-1" style={{ color: '#8BC34A' }}>
                    {s ? `${s.playerScore} – ${s.aiScore}` : ''}
                  </div>
                  <div className="text-xs mb-1" style={{ color: '#666' }}>
                    First to {WINNING_SCORE}, win by 2
                  </div>
                  <div className="text-xs mb-4" style={{ color: '#555' }}>
                    Record: {getGameScore('tabletennis').wins || 0}W - {getGameScore('tabletennis').losses || 0}L
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold mb-1" style={{ color: '#fff' }}>
                    TABLE TENNIS
                  </div>
                  <div className="text-xs mb-1" style={{ color: '#8BC34A' }}>
                    First to {WINNING_SCORE}, win by 2
                  </div>
                  <div className="text-xs mb-1" style={{ color: '#666' }}>
                    ↑ ↓ or W/S to move paddle
                  </div>
                  <div className="text-xs mb-4" style={{ color: '#555' }}>
                    Record: {getGameScore('tabletennis').wins || 0}W - {getGameScore('tabletennis').losses || 0}L
                  </div>
                </>
              )}
              <button
                onClick={startGame}
                className="px-5 py-2 text-sm font-bold cursor-pointer border-none rounded"
                style={{ background: '#8BC34A', color: '#1B5E20', fontFamily: 'monospace' }}
              >
                {screen === 'gameover' ? 'Play Again' : 'Start Game'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
