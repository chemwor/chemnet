import { useEffect, useRef, useState, useCallback } from 'react'
import { submitScore, getGameScore } from '../../lib/highscores'

const PADDLE_W = 64
const PADDLE_H = 10
const PADDLE_SPEED = 6
const BALL_R = 5
const BALL_SPEED_INIT = 2.5
const BALL_SPEED_MAX = 5
const BRICK_ROWS = 8
const BRICK_COLS = 11
const BRICK_W = 32
const BRICK_H = 14
const BRICK_PAD = 2
const BRICK_TOP = 50

const ROW_COLORS = [
  '#FF0000', '#FF0000',  // red — 7 pts
  '#FF8800', '#FF8800',  // orange — 5 pts
  '#FFDD00', '#FFDD00',  // yellow — 3 pts
  '#00CC44', '#00CC44',  // green — 1 pt
]
const ROW_POINTS = [7, 7, 5, 5, 3, 3, 1, 1]

// Power-up types
const POWERUPS = ['wide', 'multi', 'slow', 'life']
const POWERUP_COLORS = { wide: '#00CCFF', multi: '#FF00FF', slow: '#00FF88', life: '#FF4444' }
const POWERUP_LABELS = { wide: 'W', multi: 'M', slow: 'S', life: '♥' }
const POWERUP_CHANCE = 0.12
const POWERUP_SPEED = 2
const POWERUP_R = 8

function createBricks(canvasW, level) {
  const bricks = []
  const totalW = BRICK_COLS * (BRICK_W + BRICK_PAD)
  const offsetX = (canvasW - totalW) / 2 + BRICK_PAD / 2

  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      // Higher levels add harder bricks (multi-hit)
      const hits = (r < 2 && level >= 3) ? 2 : 1
      bricks.push({
        x: offsetX + c * (BRICK_W + BRICK_PAD),
        y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
        w: BRICK_W, h: BRICK_H,
        color: ROW_COLORS[r],
        points: ROW_POINTS[r],
        hits,
        maxHits: hits,
        alive: true,
      })
    }
  }
  return bricks
}

export default function Arkanoid() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const keysRef = useRef({})
  const [screen, setScreen] = useState('start')
  const hudRef = useRef({ score: 0, lives: 3, level: 1 })

  const initState = useCallback((canvas, keepScore) => {
    const w = canvas.width
    const h = canvas.height
    const prev = stateRef.current
    const level = keepScore && prev ? prev.level + 1 : 1
    const score = keepScore && prev ? prev.score : 0
    const lives = keepScore && prev ? prev.lives : 3

    return {
      w, h,
      paddle: { x: w / 2, y: h - 30, w: PADDLE_W },
      balls: [{ x: w / 2, y: h - 45, vx: 0, vy: 0, stuck: true }],
      bricks: createBricks(w, level),
      powerups: [],
      particles: [],
      score, lives, level,
      wideTimer: 0,
    }
  }, [])

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight
    stateRef.current = initState(canvas, false)
    hudRef.current = { score: 0, lives: 3, level: 1 }
    setScreen('playing')
  }, [initState])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight

    let raf

    const addParticles = (x, y, color, count) => {
      const s = stateRef.current
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2
        const spd = 0.5 + Math.random() * 2.5
        s.particles.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 12 + Math.random() * 10, color })
      }
    }

    const launchBall = (ball) => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6
      ball.vx = Math.cos(angle) * BALL_SPEED_INIT
      ball.vy = Math.sin(angle) * BALL_SPEED_INIT
      ball.stuck = false
    }

    const update = () => {
      const s = stateRef.current
      if (!s || screen !== 'playing') return
      const { w, h, paddle, balls } = s

      // Paddle movement
      if (keysRef.current['ArrowLeft'] || keysRef.current['a']) {
        paddle.x = Math.max(paddle.w / 2, paddle.x - PADDLE_SPEED)
      }
      if (keysRef.current['ArrowRight'] || keysRef.current['d']) {
        paddle.x = Math.min(w - paddle.w / 2, paddle.x + PADDLE_SPEED)
      }

      // Launch ball
      if (keysRef.current[' '] && balls.length > 0 && balls[0].stuck) {
        launchBall(balls[0])
      }

      // Wide paddle timer
      if (s.wideTimer > 0) {
        s.wideTimer--
        paddle.w = PADDLE_W * 1.5
        if (s.wideTimer === 0) paddle.w = PADDLE_W
      }

      // Balls
      for (let bi = balls.length - 1; bi >= 0; bi--) {
        const ball = balls[bi]

        if (ball.stuck) {
          ball.x = paddle.x
          ball.y = paddle.y - PADDLE_H / 2 - BALL_R - 1
          continue
        }

        ball.x += ball.vx
        ball.y += ball.vy

        // Wall bounces
        if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx) }
        if (ball.x + BALL_R > w) { ball.x = w - BALL_R; ball.vx = -Math.abs(ball.vx) }
        if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy) }

        // Paddle collision
        if (
          ball.vy > 0 &&
          ball.y + BALL_R >= paddle.y - PADDLE_H / 2 &&
          ball.y - BALL_R <= paddle.y + PADDLE_H / 2 &&
          ball.x >= paddle.x - paddle.w / 2 &&
          ball.x <= paddle.x + paddle.w / 2
        ) {
          const hitPos = (ball.x - paddle.x) / (paddle.w / 2) // -1 to 1
          const angle = hitPos * (Math.PI / 3) - Math.PI / 2 // -150° to -30°
          const speed = Math.min(BALL_SPEED_MAX, Math.hypot(ball.vx, ball.vy) + 0.05)
          ball.vx = Math.cos(angle) * speed
          ball.vy = Math.sin(angle) * speed
          ball.y = paddle.y - PADDLE_H / 2 - BALL_R - 1
        }

        // Brick collision
        for (const brick of s.bricks) {
          if (!brick.alive) continue

          const bx = brick.x, by = brick.y, bw = brick.w, bh = brick.h
          if (ball.x + BALL_R > bx && ball.x - BALL_R < bx + bw && ball.y + BALL_R > by && ball.y - BALL_R < by + bh) {
            // Determine collision side
            const overlapLeft = ball.x + BALL_R - bx
            const overlapRight = bx + bw - (ball.x - BALL_R)
            const overlapTop = ball.y + BALL_R - by
            const overlapBottom = by + bh - (ball.y - BALL_R)
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)

            if (minOverlap === overlapTop || minOverlap === overlapBottom) {
              ball.vy *= -1
            } else {
              ball.vx *= -1
            }

            brick.hits--
            if (brick.hits <= 0) {
              brick.alive = false
              s.score += brick.points
              addParticles(bx + bw / 2, by + bh / 2, brick.color, 6)

              // Maybe spawn power-up
              if (Math.random() < POWERUP_CHANCE) {
                const type = POWERUPS[Math.floor(Math.random() * POWERUPS.length)]
                s.powerups.push({ x: bx + bw / 2, y: by + bh / 2, type })
              }
            } else {
              // Dim the brick
              addParticles(bx + bw / 2, by + bh / 2, '#fff', 3)
            }

            hudRef.current.score = s.score
            break // one brick per frame per ball
          }
        }

        // Ball lost
        if (ball.y - BALL_R > h) {
          balls.splice(bi, 1)
        }
      }

      // If no balls left
      if (balls.length === 0) {
        s.lives--
        hudRef.current.lives = s.lives
        if (s.lives <= 0) {
          submitScore('arkanoid', hudRef.current.score)
          setScreen('gameover')
          return
        }
        s.balls = [{ x: paddle.x, y: paddle.y - PADDLE_H / 2 - BALL_R - 1, vx: 0, vy: 0, stuck: true }]
        paddle.w = PADDLE_W
        s.wideTimer = 0
      }

      // Power-ups falling
      for (let i = s.powerups.length - 1; i >= 0; i--) {
        const pu = s.powerups[i]
        pu.y += POWERUP_SPEED

        // Catch with paddle
        if (
          pu.y + POWERUP_R >= paddle.y - PADDLE_H / 2 &&
          pu.y - POWERUP_R <= paddle.y + PADDLE_H / 2 &&
          pu.x >= paddle.x - paddle.w / 2 &&
          pu.x <= paddle.x + paddle.w / 2
        ) {
          s.powerups.splice(i, 1)
          if (pu.type === 'wide') {
            s.wideTimer = 600 // 10 seconds
          } else if (pu.type === 'multi') {
            // Split each ball into 3
            const newBalls = []
            for (const ball of s.balls) {
              if (ball.stuck) continue
              const speed = Math.hypot(ball.vx, ball.vy)
              for (let a = -1; a <= 1; a++) {
                const ang = Math.atan2(ball.vy, ball.vx) + a * 0.4
                newBalls.push({ x: ball.x, y: ball.y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, stuck: false })
              }
            }
            if (newBalls.length > 0) s.balls = newBalls
          } else if (pu.type === 'slow') {
            for (const ball of s.balls) {
              const speed = Math.hypot(ball.vx, ball.vy)
              if (speed > BALL_SPEED_INIT) {
                const ratio = BALL_SPEED_INIT / speed
                ball.vx *= ratio
                ball.vy *= ratio
              }
            }
          } else if (pu.type === 'life') {
            s.lives = Math.min(5, s.lives + 1)
            hudRef.current.lives = s.lives
          }
          addParticles(pu.x, pu.y, POWERUP_COLORS[pu.type], 8)
          continue
        }

        // Missed
        if (pu.y > h + 10) s.powerups.splice(i, 1)
      }

      // Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i]
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--
        if (p.life <= 0) s.particles.splice(i, 1)
      }

      // Level clear
      if (s.bricks.every(b => !b.alive)) {
        s.level++
        hudRef.current.level = s.level
        s.bricks = createBricks(w, s.level)
        s.balls = [{ x: paddle.x, y: paddle.y - PADDLE_H / 2 - BALL_R - 1, vx: 0, vy: 0, stuck: true }]
        s.powerups = []
        paddle.w = PADDLE_W
        s.wideTimer = 0
      }
    }

    const draw = () => {
      const s = stateRef.current
      const cw = canvas.width, ch = canvas.height

      // Background — dark gradient
      const grd = ctx.createLinearGradient(0, 0, 0, ch)
      grd.addColorStop(0, '#0a0a20')
      grd.addColorStop(1, '#000')
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, cw, ch)

      if (!s) return

      // Side borders
      ctx.fillStyle = '#222'
      ctx.fillRect(0, 0, 3, ch)
      ctx.fillRect(cw - 3, 0, 3, ch)
      ctx.fillStyle = '#444'
      ctx.fillRect(0, 0, cw, 3)

      // Bricks
      for (const b of s.bricks) {
        if (!b.alive) continue
        const alpha = b.hits < b.maxHits ? 0.5 : 1
        ctx.globalAlpha = alpha

        // Brick body with gradient
        const bgrd = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h)
        bgrd.addColorStop(0, b.color)
        bgrd.addColorStop(1, '#000')
        ctx.fillStyle = bgrd
        ctx.fillRect(b.x, b.y, b.w, b.h)

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.fillRect(b.x, b.y, b.w, 2)
        ctx.fillRect(b.x, b.y, 2, b.h)

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)'
        ctx.fillRect(b.x, b.y + b.h - 2, b.w, 2)
        ctx.fillRect(b.x + b.w - 2, b.y, 2, b.h)

        ctx.globalAlpha = 1
      }

      // Power-ups
      for (const pu of s.powerups) {
        ctx.fillStyle = POWERUP_COLORS[pu.type]
        ctx.shadowColor = POWERUP_COLORS[pu.type]
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(pu.x, pu.y, POWERUP_R, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        // Label
        ctx.fillStyle = '#000'
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(POWERUP_LABELS[pu.type], pu.x, pu.y + 4)
      }

      // Particles
      for (const p of s.particles) {
        ctx.globalAlpha = p.life / 22
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3)
      }
      ctx.globalAlpha = 1

      // Paddle
      const px = s.paddle.x - s.paddle.w / 2
      const py = s.paddle.y - PADDLE_H / 2
      const pgrd = ctx.createLinearGradient(px, py, px, py + PADDLE_H)
      pgrd.addColorStop(0, '#8888FF')
      pgrd.addColorStop(0.5, '#4444CC')
      pgrd.addColorStop(1, '#2222AA')
      ctx.fillStyle = pgrd
      ctx.beginPath()
      ctx.roundRect(px, py, s.paddle.w, PADDLE_H, 3)
      ctx.fill()
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.fillRect(px + 2, py + 1, s.paddle.w - 4, 2)

      // Balls
      for (const ball of s.balls) {
        ctx.fillStyle = '#fff'
        ctx.shadowColor = '#fff'
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.beginPath()
        ctx.arc(ball.x - 1.5, ball.y - 1.5, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // HUD
      ctx.fillStyle = '#888'
      ctx.font = 'bold 12px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`SCORE: ${s.score}`, 8, ch - 6)
      ctx.textAlign = 'center'
      ctx.fillText(`LEVEL ${s.level}`, cw / 2, ch - 6)
      ctx.textAlign = 'right'
      // Lives as balls
      for (let i = 0; i < s.lives; i++) {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(cw - 12 - i * 14, ch - 10, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // Stuck ball hint
      if (s.balls.length > 0 && s.balls[0].stuck) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.font = '11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('SPACE to launch', cw / 2, ch / 2)
      }

      // Wide paddle timer indicator
      if (s.wideTimer > 0) {
        ctx.fillStyle = '#00CCFF'
        const barW = (s.wideTimer / 600) * 60
        ctx.fillRect(cw / 2 - 30, ch - 3, barW, 2)
      }
    }

    const loop = () => { update(); draw(); raf = requestAnimationFrame(loop) }

    const onKey = (e) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'a', 'd'].includes(e.key)) e.preventDefault()
      keysRef.current[e.key] = e.type === 'keydown'
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
  }, [screen, initState])

  return (
    <div className="flex flex-col h-full" style={{ background: '#000' }}>
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {(screen === 'start' || screen === 'gameover') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2, background: 'rgba(0,0,0,0.85)' }}>
            <div className="text-center" style={{ fontFamily: 'monospace' }}>
              {screen === 'gameover' ? (
                <>
                  <div className="text-xl font-bold mb-1" style={{ color: '#FF4444' }}>GAME OVER</div>
                  <div className="text-sm mb-1" style={{ color: '#888' }}>Score: {hudRef.current.score}</div>
                  <div className="text-xs mb-1" style={{ color: '#555' }}>Level {hudRef.current.level}</div>
                  <div className="text-xs mb-4" style={{ color: '#555' }}>Hi-Score: {getGameScore('arkanoid').highScore || 0}</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold mb-2" style={{ color: '#fff' }}>ARKANOID</div>
                  <div className="text-xs mb-1" style={{ color: '#888' }}>← → or A/D to move</div>
                  <div className="text-xs mb-1" style={{ color: '#888' }}>SPACE to launch ball</div>
                  <div className="text-xs mb-3" style={{ color: '#555' }}>Hi-Score: {getGameScore('arkanoid').highScore || 0}</div>
                  <div className="flex gap-3 justify-center mb-4 text-xs" style={{ color: '#666' }}>
                    <span><span style={{ color: '#00CCFF' }}>W</span>ide</span>
                    <span><span style={{ color: '#FF00FF' }}>M</span>ulti</span>
                    <span><span style={{ color: '#00FF88' }}>S</span>low</span>
                    <span><span style={{ color: '#FF4444' }}>♥</span> Life</span>
                  </div>
                </>
              )}
              <button
                onClick={startGame}
                className="px-5 py-2 text-sm font-bold cursor-pointer border-none rounded"
                style={{ background: '#4444CC', color: '#fff', fontFamily: 'monospace' }}
              >
                {screen === 'gameover' ? 'Play Again' : 'Start'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
