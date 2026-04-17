import { useEffect, useRef, useState, useCallback } from 'react'

const BALL_R = 6
const GRAVITY = 0.15
const FLIPPER_LEN = 40
const FLIPPER_W = 6
const FLIPPER_SPEED = 0.18
const BALL_LOSS_Y_OFFSET = 40
const BUMPER_R = 16
const BUMPER_BOUNCE = 6
const WALL_BOUNCE = 0.7
const FLIPPER_BOUNCE = 10
const PLUNGER_MAX = 100

export default function Pinball() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const keysRef = useRef({})
  const [hud, setHud] = useState({ score: 0, balls: 3 })
  const [screen, setScreen] = useState('start')

  const initState = useCallback((canvas) => {
    const w = canvas.width
    const h = canvas.height

    const bumpers = [
      { x: w * 0.35, y: h * 0.22, r: BUMPER_R, color: '#FF6B35', points: 100, flash: 0 },
      { x: w * 0.65, y: h * 0.22, r: BUMPER_R, color: '#FF6B35', points: 100, flash: 0 },
      { x: w * 0.5,  y: h * 0.15, r: BUMPER_R, color: '#FF8C5A', points: 150, flash: 0 },
      { x: w * 0.3,  y: h * 0.35, r: 12, color: '#A09AB0', points: 50, flash: 0 },
      { x: w * 0.7,  y: h * 0.35, r: 12, color: '#A09AB0', points: 50, flash: 0 },
      { x: w * 0.5,  y: h * 0.30, r: 10, color: '#F0EBE1', points: 75, flash: 0 },
    ]

    // Targets — small rectangles that disappear when hit
    const targets = [
      { x: w * 0.2, y: h * 0.45, hit: false, points: 200 },
      { x: w * 0.4, y: h * 0.45, hit: false, points: 200 },
      { x: w * 0.6, y: h * 0.45, hit: false, points: 200 },
      { x: w * 0.8, y: h * 0.45, hit: false, points: 200 },
    ]

    // Slingshots — angled walls that bounce the ball
    const slingshots = [
      { x1: w * 0.12, y1: h * 0.55, x2: w * 0.25, y2: h * 0.65, flash: 0 },
      { x1: w * 0.75, y1: h * 0.65, x2: w * 0.88, y2: h * 0.55, flash: 0 },
    ]

    return {
      w, h,
      ball: null,
      leftFlipper: { angle: 0.4, target: 0.4, x: w * 0.3, y: h - 60 },
      rightFlipper: { angle: Math.PI - 0.4, target: Math.PI - 0.4, x: w * 0.7, y: h - 60 },
      bumpers, targets, slingshots,
      score: 0,
      balls: 3,
      plunger: 0,
      plungerCharging: false,
      launched: false,
      particles: [],
    }
  }, [])

  const launchBall = useCallback((s) => {
    s.ball = {
      x: s.w - 18,
      y: s.h - BALL_LOSS_Y_OFFSET - 20,
      vx: 0,
      vy: 0,
    }
    s.launched = false
    s.plunger = 0
    // Reset targets
    for (const t of s.targets) t.hit = false
  }, [])

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight
    const s = initState(canvas)
    stateRef.current = s
    launchBall(s)
    setHud({ score: 0, balls: 3 })
    setScreen('playing')
  }, [initState, launchBall])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight

    let raf

    const addParticles = (x, y, color, count) => {
      const s = stateRef.current
      if (!s) return
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2
        const spd = 1 + Math.random() * 3
        s.particles.push({
          x, y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 15 + Math.random() * 10,
          color,
        })
      }
    }

    const update = () => {
      const s = stateRef.current
      if (!s || screen !== 'playing') return

      const { w, h, ball, leftFlipper: lf, rightFlipper: rf } = s

      // Flippers
      if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['z']) {
        lf.target = -0.5
      } else {
        lf.target = 0.4
      }
      if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['/']) {
        rf.target = Math.PI + 0.5
      } else {
        rf.target = Math.PI - 0.4
      }

      // Smooth flipper movement
      const flipperMove = (f, isLeft) => {
        const diff = f.target - f.angle
        if (Math.abs(diff) > 0.01) {
          f.angle += Math.sign(diff) * FLIPPER_SPEED
        } else {
          f.angle = f.target
        }
      }
      flipperMove(lf, true)
      flipperMove(rf, false)

      // Plunger
      if (keysRef.current[' '] || keysRef.current['ArrowDown'] || keysRef.current['s']) {
        if (!s.launched) {
          s.plungerCharging = true
          s.plunger = Math.min(PLUNGER_MAX, s.plunger + 2)
        }
      } else if (s.plungerCharging) {
        s.plungerCharging = false
        if (ball && !s.launched) {
          ball.vy = -(s.plunger / PLUNGER_MAX) * 18 - 4
          ball.vx = -0.5 + Math.random()
          s.launched = true
        }
        s.plunger = 0
      }

      if (!ball) return

      // Gravity
      ball.vy += GRAVITY
      ball.x += ball.vx
      ball.y += ball.vy

      // Wall collisions
      const wallLeft = 8
      const wallRight = w - 25
      if (ball.x - BALL_R < wallLeft) {
        ball.x = wallLeft + BALL_R
        ball.vx = Math.abs(ball.vx) * WALL_BOUNCE
      }
      if (ball.x + BALL_R > wallRight) {
        ball.x = wallRight - BALL_R
        ball.vx = -Math.abs(ball.vx) * WALL_BOUNCE
      }
      if (ball.y - BALL_R < 8) {
        ball.y = 8 + BALL_R
        ball.vy = Math.abs(ball.vy) * WALL_BOUNCE
      }

      // Bumper collisions
      for (const b of s.bumpers) {
        const dx = ball.x - b.x
        const dy = ball.y - b.y
        const dist = Math.hypot(dx, dy)
        if (dist < BALL_R + b.r) {
          const nx = dx / dist
          const ny = dy / dist
          ball.x = b.x + nx * (BALL_R + b.r + 1)
          ball.y = b.y + ny * (BALL_R + b.r + 1)
          ball.vx = nx * BUMPER_BOUNCE
          ball.vy = ny * BUMPER_BOUNCE
          s.score += b.points
          b.flash = 8
          addParticles(b.x, b.y, b.color, 5)
          setHud(prev => ({ ...prev, score: s.score }))
        }
        if (b.flash > 0) b.flash--
      }

      // Target collisions
      for (const t of s.targets) {
        if (t.hit) continue
        if (Math.abs(ball.x - t.x) < 10 && Math.abs(ball.y - t.y) < 8) {
          t.hit = true
          s.score += t.points
          ball.vy *= -0.8
          addParticles(t.x, t.y, '#FFD700', 6)
          setHud(prev => ({ ...prev, score: s.score }))
          // Bonus if all targets hit
          if (s.targets.every(tt => tt.hit)) {
            s.score += 1000
            addParticles(w / 2, t.y, '#FF6B35', 15)
            setHud(prev => ({ ...prev, score: s.score }))
          }
        }
      }

      // Slingshot collisions
      for (const sl of s.slingshots) {
        const sx = sl.x2 - sl.x1
        const sy = sl.y2 - sl.y1
        const len = Math.hypot(sx, sy)
        const nx = -sy / len
        const ny = sx / len

        const dx = ball.x - sl.x1
        const dy = ball.y - sl.y1
        const proj = (dx * sx + dy * sy) / (len * len)
        const dist = dx * nx + dy * ny

        if (proj >= 0 && proj <= 1 && Math.abs(dist) < BALL_R + 4) {
          ball.vx += nx * 5
          ball.vy += ny * 5
          s.score += 10
          sl.flash = 6
          setHud(prev => ({ ...prev, score: s.score }))
        }
        if (sl.flash > 0) sl.flash--
      }

      // Flipper collision
      const checkFlipper = (f, isLeft) => {
        const endX = f.x + Math.cos(f.angle) * FLIPPER_LEN * (isLeft ? 1 : -1)
        const endY = f.y + Math.sin(f.angle) * FLIPPER_LEN

        const fx = endX - f.x
        const fy = endY - f.y
        const fLen = Math.hypot(fx, fy)
        const fnx = -fy / fLen
        const fny = fx / fLen

        const dx = ball.x - f.x
        const dy = ball.y - f.y
        const proj = (dx * fx + dy * fy) / (fLen * fLen)
        const dist = dx * fnx + dy * fny

        if (proj >= -0.1 && proj <= 1.1 && Math.abs(dist) < BALL_R + FLIPPER_W / 2) {
          const isFlipping = isLeft ? (f.angle < f.target - 0.05) : (f.angle > f.target + 0.05)
          const isActive = isLeft
            ? (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['z'])
            : (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['/'])

          const bounce = isActive ? FLIPPER_BOUNCE : 3
          ball.vx += fnx * bounce * 0.5
          ball.vy = -Math.abs(bounce) - 2
          ball.x += fnx * 2
          ball.y += -2
        }
      }
      checkFlipper(lf, true)
      checkFlipper(rf, false)

      // Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life--
        if (p.life <= 0) s.particles.splice(i, 1)
      }

      // Ball lost
      if (ball.y > h - BALL_LOSS_Y_OFFSET + 30) {
        s.balls--
        setHud(prev => ({ ...prev, balls: s.balls }))
        if (s.balls <= 0) {
          setScreen('gameover')
          s.ball = null
          return
        }
        launchBall(s)
      }

      // Speed cap
      const speed = Math.hypot(ball.vx, ball.vy)
      if (speed > 16) {
        ball.vx = (ball.vx / speed) * 16
        ball.vy = (ball.vy / speed) * 16
      }
    }

    const draw = () => {
      const s = stateRef.current
      const cw = canvas.width
      const ch = canvas.height

      // Background
      ctx.fillStyle = '#0a0a1a'
      ctx.fillRect(0, 0, cw, ch)

      if (!s) return

      // Playfield border
      ctx.strokeStyle = '#4A4555'
      ctx.lineWidth = 3
      ctx.strokeRect(6, 6, cw - 30, ch - BALL_LOSS_Y_OFFSET - 6)

      // Plunger lane
      ctx.fillStyle = '#111'
      ctx.fillRect(cw - 24, 6, 18, ch - BALL_LOSS_Y_OFFSET - 6)
      ctx.strokeStyle = '#4A4555'
      ctx.strokeRect(cw - 24, 6, 18, ch - BALL_LOSS_Y_OFFSET - 6)

      // Plunger
      if (!s.launched && s.ball) {
        const plY = ch - BALL_LOSS_Y_OFFSET - 10
        ctx.fillStyle = '#888'
        ctx.fillRect(cw - 21, plY + s.plunger * 0.3, 12, 20)
        ctx.fillStyle = '#aaa'
        ctx.fillRect(cw - 19, plY + s.plunger * 0.3, 8, 4)
        // Power bar
        if (s.plunger > 0) {
          const barH = (s.plunger / PLUNGER_MAX) * 60
          ctx.fillStyle = `hsl(${30 - (s.plunger / PLUNGER_MAX) * 30}, 100%, 50%)`
          ctx.fillRect(cw - 8, plY - barH, 4, barH)
        }
      }

      // Slingshots
      for (const sl of s.slingshots) {
        ctx.strokeStyle = sl.flash > 0 ? '#FF6B35' : '#4A4555'
        ctx.lineWidth = sl.flash > 0 ? 3 : 2
        ctx.beginPath()
        ctx.moveTo(sl.x1, sl.y1)
        ctx.lineTo(sl.x2, sl.y2)
        ctx.stroke()
      }

      // Bumpers
      for (const b of s.bumpers) {
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = b.flash > 0 ? '#fff' : b.color
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Inner ring
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r * 0.5, 0, Math.PI * 2)
        ctx.strokeStyle = b.flash > 0 ? b.color : 'rgba(255,255,255,0.3)'
        ctx.stroke()
      }

      // Targets
      for (const t of s.targets) {
        if (t.hit) continue
        ctx.fillStyle = '#FFD700'
        ctx.fillRect(t.x - 6, t.y - 4, 12, 8)
        ctx.strokeStyle = '#FFA500'
        ctx.lineWidth = 1
        ctx.strokeRect(t.x - 6, t.y - 4, 12, 8)
      }

      // Flippers
      const drawFlipper = (f, isLeft) => {
        const dir = isLeft ? 1 : -1
        const endX = f.x + Math.cos(f.angle) * FLIPPER_LEN * dir
        const endY = f.y + Math.sin(f.angle) * FLIPPER_LEN

        ctx.save()
        ctx.strokeStyle = '#F0EBE1'
        ctx.lineWidth = FLIPPER_W
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(f.x, f.y)
        ctx.lineTo(endX, endY)
        ctx.stroke()

        // Pivot point
        ctx.fillStyle = '#888'
        ctx.beginPath()
        ctx.arc(f.x, f.y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      drawFlipper(s.leftFlipper, true)
      drawFlipper(s.rightFlipper, false)

      // Drain gap indicators
      ctx.fillStyle = '#FF6B3540'
      ctx.fillRect(s.leftFlipper.x - 50, ch - BALL_LOSS_Y_OFFSET + 2, 20, 3)
      ctx.fillRect(s.rightFlipper.x + 30, ch - BALL_LOSS_Y_OFFSET + 2, 20, 3)

      // Particles
      for (const p of s.particles) {
        const alpha = p.life / 25
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // Ball
      if (s.ball) {
        ctx.fillStyle = '#ccc'
        ctx.shadowColor = '#fff'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Ball highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.beginPath()
        ctx.arc(s.ball.x - 2, s.ball.y - 2, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // HUD
      ctx.fillStyle = '#F0EBE1'
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'left'
      ctx.fillText('SCORE', 12, ch - 20)
      ctx.fillStyle = '#FF6B35'
      ctx.font = 'bold 16px monospace'
      ctx.fillText(`${s.score}`, 12, ch - 4)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#F0EBE1'
      ctx.font = 'bold 14px monospace'
      ctx.fillText('BALL', cw - 30, ch - 20)
      // Ball indicators
      for (let i = 0; i < s.balls; i++) {
        ctx.fillStyle = '#ccc'
        ctx.beginPath()
        ctx.arc(cw - 36 - i * 16, ch - 7, 5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const loop = () => {
      update()
      draw()
      raf = requestAnimationFrame(loop)
    }

    const onKey = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'z', '/'].includes(e.key)) {
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
  }, [screen, initState, launchBall])

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a1a' }}>
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {(screen === 'start' || screen === 'gameover') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2, background: 'rgba(0,0,0,0.8)' }}>
            <div className="text-center" style={{ fontFamily: 'monospace' }}>
              {screen === 'gameover' ? (
                <>
                  <div className="text-xl font-bold mb-1" style={{ color: '#FF6B35' }}>
                    GAME OVER
                  </div>
                  <div className="text-sm mb-4" style={{ color: '#A09AB0' }}>
                    Score: {hud.score}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold mb-1" style={{ color: '#FF6B35' }}>
                    PINBALL
                  </div>
                  <div className="text-xs mb-1" style={{ color: '#A09AB0' }}>
                    ← → or A/D flip &middot; SPACE plunger
                  </div>
                  <div className="text-xs mb-4" style={{ color: '#5A5465' }}>
                    Hold SPACE to charge, release to launch
                  </div>
                </>
              )}
              <button
                onClick={startGame}
                className="px-4 py-1.5 text-sm font-bold cursor-pointer border-none"
                style={{ background: '#FF6B35', color: '#000', fontFamily: 'monospace' }}
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
