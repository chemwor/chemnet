import { useEffect, useRef, useState, useCallback } from 'react'

const BALL_R = 5
const GRAVITY = 0.12
const FLIPPER_LEN = 44
const FLIPPER_W = 7
const FLIPPER_REST_DOWN = 0.5   // rest: tips angled down (V shape)
const FLIPPER_ACTIVE_UP = -0.5  // active: tips angled up
const FLIPPER_SPEED = 0.25
const WALL_BOUNCE = 0.55
const PLUNGER_MAX = 80

export default function Pinball() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const keysRef = useRef({})
  const [screen, setScreen] = useState('start')
  const hudRef = useRef({ score: 0, balls: 3, multiplier: 1 })

  const initState = useCallback((canvas) => {
    const w = canvas.width
    const h = canvas.height
    const pw = w - 26 // playfield width (minus plunger lane)
    const cx = pw / 2

    // Bumpers — triangle formation like Space Cadet
    const bumpers = [
      { x: cx,      y: h * 0.20, r: 18, points: 100, color: '#e03030', flash: 0, lit: false },
      { x: cx - 30, y: h * 0.27, r: 18, points: 100, color: '#3060e0', flash: 0, lit: false },
      { x: cx + 30, y: h * 0.27, r: 18, points: 100, color: '#e0a020', flash: 0, lit: false },
    ]

    // Top lanes — rollover lights
    const lanes = []
    for (let i = 0; i < 4; i++) {
      lanes.push({
        x: cx - 45 + i * 30,
        y: h * 0.08,
        w: 16, h: 30,
        lit: false, points: 500,
      })
    }

    // Drop targets — row of 5
    const dropTargets = []
    for (let i = 0; i < 5; i++) {
      dropTargets.push({
        x: cx - 48 + i * 24,
        y: h * 0.38,
        alive: true, points: 250,
      })
    }

    // Kickers (slingshots) — triangular bumpers above flippers
    const kickers = [
      { x1: 20,     y1: h * 0.62, x2: 50,     y2: h * 0.72, x3: 20,     y3: h * 0.72, flash: 0 },
      { x1: pw - 20, y1: h * 0.62, x2: pw - 50, y2: h * 0.72, x3: pw - 20, y3: h * 0.72, flash: 0 },
    ]

    // Outlane / inlane guides
    const guides = [
      // Left outer wall curve
      { x1: 8, y1: h * 0.08, x2: 8, y2: h * 0.75 },
      // Right outer wall curve
      { x1: pw - 8, y1: h * 0.08, x2: pw - 8, y2: h * 0.75 },
      // Left inlane
      { x1: 40, y1: h * 0.72, x2: 40, y2: h * 0.80 },
      // Right inlane
      { x1: pw - 40, y1: h * 0.72, x2: pw - 40, y2: h * 0.80 },
    ]

    const flipperY = h - 55
    return {
      w, h, pw, cx,
      ball: null,
      leftFlipper:  { angle: FLIPPER_REST_DOWN, target: FLIPPER_REST_DOWN, x: cx - 40, y: flipperY },
      rightFlipper: { angle: FLIPPER_REST_DOWN, target: FLIPPER_REST_DOWN, x: cx + 40, y: flipperY },
      bumpers, lanes, dropTargets, kickers, guides,
      score: 0, balls: 3, multiplier: 1,
      plunger: 0, plungerCharging: false, launched: false,
      particles: [],
      bonusText: null,
    }
  }, [])

  const launchBall = useCallback((s) => {
    s.ball = { x: s.pw + 5, y: s.h - 70, vx: 0, vy: 0 }
    s.launched = false
    s.plunger = 0
  }, [])

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight
    const s = initState(canvas)
    stateRef.current = s
    launchBall(s)
    hudRef.current = { score: 0, balls: 3, multiplier: 1 }
    setScreen('playing')
  }, [initState, launchBall])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight

    let raf

    const addScore = (pts) => {
      const s = stateRef.current
      s.score += pts * s.multiplier
      hudRef.current.score = s.score
    }

    const showBonus = (text, x, y) => {
      const s = stateRef.current
      s.bonusText = { text, x, y, life: 40 }
    }

    const addParticles = (x, y, color, count) => {
      const s = stateRef.current
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2
        const spd = 1 + Math.random() * 3
        s.particles.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 18 + Math.random() * 12, color })
      }
    }

    const update = () => {
      const s = stateRef.current
      if (!s || screen !== 'playing') return
      const { w, h, pw, ball, leftFlipper: lf, rightFlipper: rf } = s

      // Flippers
      const leftActive = keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['z']
      const rightActive = keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['/']
      lf.target = leftActive ? FLIPPER_ACTIVE_UP : FLIPPER_REST_DOWN
      rf.target = rightActive ? FLIPPER_ACTIVE_UP : FLIPPER_REST_DOWN

      for (const f of [lf, rf]) {
        const diff = f.target - f.angle
        if (Math.abs(diff) > 0.01) f.angle += Math.sign(diff) * FLIPPER_SPEED
        else f.angle = f.target
      }

      // Plunger
      if (keysRef.current[' '] || keysRef.current['ArrowDown']) {
        if (!s.launched) { s.plungerCharging = true; s.plunger = Math.min(PLUNGER_MAX, s.plunger + 1.5) }
      } else if (s.plungerCharging) {
        s.plungerCharging = false
        if (ball && !s.launched) {
          ball.vy = -(s.plunger / PLUNGER_MAX) * 16 - 5
          ball.vx = (Math.random() - 0.5) * 0.5
          s.launched = true
        }
        s.plunger = 0
      }

      if (!ball) return

      ball.vy += GRAVITY
      ball.x += ball.vx
      ball.y += ball.vy

      // Wall collisions — playfield bounds
      if (ball.x - BALL_R < 8) { ball.x = 8 + BALL_R; ball.vx = Math.abs(ball.vx) * WALL_BOUNCE }
      if (s.launched && ball.x + BALL_R > pw - 8) { ball.x = pw - 8 - BALL_R; ball.vx = -Math.abs(ball.vx) * WALL_BOUNCE }
      if (!s.launched && ball.x + BALL_R > w - 6) { ball.x = w - 6 - BALL_R; ball.vx = -Math.abs(ball.vx) * WALL_BOUNCE }
      if (ball.y - BALL_R < 6) { ball.y = 6 + BALL_R; ball.vy = Math.abs(ball.vy) * WALL_BOUNCE }

      // Plunger lane to playfield — ball curves left at top
      if (s.launched && ball.x > pw - 20 && ball.y < h * 0.12) {
        ball.vx -= 0.3
      }

      // Bumpers
      for (const b of s.bumpers) {
        const dx = ball.x - b.x, dy = ball.y - b.y
        const dist = Math.hypot(dx, dy)
        if (dist < BALL_R + b.r) {
          const nx = dx / dist, ny = dy / dist
          ball.x = b.x + nx * (BALL_R + b.r + 1)
          ball.y = b.y + ny * (BALL_R + b.r + 1)
          const bounce = 7
          ball.vx = nx * bounce
          ball.vy = ny * bounce
          b.lit = true
          b.flash = 10
          addScore(b.points)
          addParticles(b.x, b.y, b.color, 4)
          // All bumpers lit = multiplier up
          if (s.bumpers.every(bb => bb.lit)) {
            s.multiplier = Math.min(5, s.multiplier + 1)
            hudRef.current.multiplier = s.multiplier
            showBonus(`${s.multiplier}X MULTIPLIER`, s.cx, b.y + 30)
            for (const bb of s.bumpers) bb.lit = false
          }
        }
        if (b.flash > 0) b.flash--
      }

      // Lanes
      for (const l of s.lanes) {
        if (ball.x > l.x - l.w / 2 && ball.x < l.x + l.w / 2 && ball.y > l.y && ball.y < l.y + l.h && !l.lit) {
          l.lit = true
          addScore(l.points)
          addParticles(l.x, l.y + l.h / 2, '#00ff88', 3)
          if (s.lanes.every(ll => ll.lit)) {
            addScore(5000)
            showBonus('ALL LANES! +5000', s.cx, l.y + 50)
            for (const ll of s.lanes) ll.lit = false
          }
        }
      }

      // Drop targets
      for (const t of s.dropTargets) {
        if (!t.alive) continue
        if (Math.abs(ball.x - t.x) < 10 && Math.abs(ball.y - t.y) < 8) {
          t.alive = false
          ball.vy *= -0.6
          addScore(t.points)
          addParticles(t.x, t.y, '#ff0', 5)
          if (s.dropTargets.every(tt => !tt.alive)) {
            addScore(10000)
            showBonus('TARGETS CLEAR! +10000', s.cx, t.y + 20)
            // Reset after a delay
            setTimeout(() => { for (const tt of s.dropTargets) tt.alive = true }, 2000)
          }
        }
      }

      // Kickers (slingshot triangles)
      for (const k of s.kickers) {
        const kcx = (k.x1 + k.x2 + k.x3) / 3
        const kcy = (k.y1 + k.y2 + k.y3) / 3
        const dist = Math.hypot(ball.x - kcx, ball.y - kcy)
        if (dist < 25) {
          const nx = (ball.x - kcx) / dist
          const ny = (ball.y - kcy) / dist
          ball.vx += nx * 6
          ball.vy += ny * 6
          k.flash = 8
          addScore(25)
        }
        if (k.flash > 0) k.flash--
      }

      // Flipper collision
      const checkFlipper = (f, isLeft) => {
        const dir = isLeft ? 1 : -1
        const endX = f.x + Math.cos(f.angle) * FLIPPER_LEN * dir
        const endY = f.y + Math.sin(f.angle) * FLIPPER_LEN
        const fx = endX - f.x, fy = endY - f.y
        const fLen = Math.hypot(fx, fy)
        const fnx = -fy / fLen, fny = fx / fLen
        const dx = ball.x - f.x, dy = ball.y - f.y
        const proj = (dx * fx + dy * fy) / (fLen * fLen)
        const dist = dx * fnx + dy * fny

        if (proj >= -0.05 && proj <= 1.05 && Math.abs(dist) < BALL_R + FLIPPER_W) {
          const active = isLeft ? leftActive : rightActive
          const power = active ? 11 + proj * 4 : 2.5 // tip hits harder
          // Reflect based on flipper angle
          const reflAngle = f.angle + (isLeft ? -0.8 : 0.8)
          ball.vx = Math.cos(reflAngle) * power * (isLeft ? 1 : -1)
          ball.vy = -Math.abs(Math.sin(reflAngle) * power) - 2
          ball.x += fnx * (BALL_R + FLIPPER_W - Math.abs(dist) + 1) * Math.sign(dist)
          ball.y -= 2
        }
      }
      checkFlipper(lf, true)
      checkFlipper(rf, false)

      // Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i]
        p.x += p.vx; p.y += p.vy; p.life--
        if (p.life <= 0) s.particles.splice(i, 1)
      }

      // Bonus text
      if (s.bonusText) {
        s.bonusText.life--
        if (s.bonusText.life <= 0) s.bonusText = null
      }

      // Ball drain
      if (ball.y > h + 10) {
        s.balls--
        hudRef.current.balls = s.balls
        s.multiplier = 1
        hudRef.current.multiplier = 1
        for (const l of s.lanes) l.lit = false
        if (s.balls <= 0) { s.ball = null; setScreen('gameover'); return }
        launchBall(s)
      }

      // Speed cap
      const spd = Math.hypot(ball.vx, ball.vy)
      if (spd > 14) { ball.vx = (ball.vx / spd) * 14; ball.vy = (ball.vy / spd) * 14 }
    }

    const draw = () => {
      const s = stateRef.current
      const cw = canvas.width, ch = canvas.height
      if (!s) { ctx.fillStyle = '#0c0c2a'; ctx.fillRect(0, 0, cw, ch); return }
      const { pw, cx } = s

      // Background — deep blue like Space Cadet
      ctx.fillStyle = '#0c0c2a'
      ctx.fillRect(0, 0, cw, ch)

      // Playfield surface
      const grd = ctx.createLinearGradient(0, 0, 0, ch)
      grd.addColorStop(0, '#0a0a35')
      grd.addColorStop(0.5, '#0f0f40')
      grd.addColorStop(1, '#0a0a30')
      ctx.fillStyle = grd
      ctx.fillRect(6, 6, pw - 12, ch - 12)

      // Outer walls
      ctx.strokeStyle = '#4060c0'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(8, ch - 50)
      ctx.lineTo(8, 30)
      ctx.quadraticCurveTo(8, 8, 30, 8)
      ctx.lineTo(pw - 30, 8)
      ctx.quadraticCurveTo(pw - 8, 8, pw - 8, 30)
      ctx.lineTo(pw - 8, ch - 50)
      ctx.stroke()

      // Plunger lane
      ctx.fillStyle = '#080820'
      ctx.fillRect(pw - 2, 30, 24, ch - 80)
      ctx.strokeStyle = '#3050a0'
      ctx.lineWidth = 2
      ctx.strokeRect(pw - 2, 30, 24, ch - 80)

      // Plunger
      if (!s.launched && s.ball) {
        const plY = ch - 60
        ctx.fillStyle = '#6080c0'
        ctx.fillRect(pw + 3, plY + s.plunger * 0.4, 14, 22)
        ctx.fillStyle = '#80a0e0'
        ctx.fillRect(pw + 5, plY + s.plunger * 0.4, 10, 4)
        if (s.plunger > 0) {
          const pct = s.plunger / PLUNGER_MAX
          ctx.fillStyle = `hsl(${200 + pct * 40}, 80%, ${50 + pct * 20}%)`
          const barH = pct * 50
          ctx.fillRect(pw + 20, plY - barH, 3, barH)
        }
      }

      // Top lanes
      for (const l of s.lanes) {
        ctx.fillStyle = l.lit ? '#00ff88' : '#102040'
        ctx.fillRect(l.x - l.w / 2, l.y, l.w, l.h)
        ctx.strokeStyle = l.lit ? '#00ff88' : '#2040a0'
        ctx.lineWidth = 1
        ctx.strokeRect(l.x - l.w / 2, l.y, l.w, l.h)
        // Arrow
        ctx.fillStyle = l.lit ? '#00ff88' : '#304080'
        ctx.beginPath()
        ctx.moveTo(l.x, l.y + l.h + 2)
        ctx.lineTo(l.x - 5, l.y + l.h + 10)
        ctx.lineTo(l.x + 5, l.y + l.h + 10)
        ctx.closePath()
        ctx.fill()
      }

      // Drop targets
      for (const t of s.dropTargets) {
        if (!t.alive) continue
        ctx.fillStyle = '#ff3333'
        ctx.fillRect(t.x - 8, t.y - 4, 16, 8)
        ctx.fillStyle = '#ff6666'
        ctx.fillRect(t.x - 6, t.y - 2, 12, 4)
      }

      // Bumpers
      for (const b of s.bumpers) {
        // Outer glow
        if (b.flash > 0 || b.lit) {
          ctx.fillStyle = b.flash > 0 ? 'rgba(255,255,255,0.15)' : `${b.color}30`
          ctx.beginPath()
          ctx.arc(b.x, b.y, b.r + 6, 0, Math.PI * 2)
          ctx.fill()
        }
        // Body
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        const bgrd = ctx.createRadialGradient(b.x - 4, b.y - 4, 2, b.x, b.y, b.r)
        bgrd.addColorStop(0, b.flash > 0 ? '#fff' : b.color)
        bgrd.addColorStop(1, b.flash > 0 ? b.color : '#000')
        ctx.fillStyle = bgrd
        ctx.fill()
        ctx.strokeStyle = b.lit ? '#fff' : '#5070b0'
        ctx.lineWidth = 2
        ctx.stroke()
        // Points label
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 9px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(b.points, b.x, b.y + 3)
      }

      // Kickers
      for (const k of s.kickers) {
        ctx.fillStyle = k.flash > 0 ? '#ff6b3560' : '#1a1a5060'
        ctx.strokeStyle = k.flash > 0 ? '#ff6b35' : '#4060c0'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(k.x1, k.y1)
        ctx.lineTo(k.x2, k.y2)
        ctx.lineTo(k.x3, k.y3)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }

      // Guide rails
      ctx.strokeStyle = '#304080'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(40, s.h * 0.72)
      ctx.lineTo(s.leftFlipper.x - 5, s.leftFlipper.y + 8)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(pw - 40, s.h * 0.72)
      ctx.lineTo(s.rightFlipper.x + 5, s.rightFlipper.y + 8)
      ctx.stroke()

      // Flippers
      const drawFlipper = (f, isLeft) => {
        const dir = isLeft ? 1 : -1
        const endX = f.x + Math.cos(f.angle) * FLIPPER_LEN * dir
        const endY = f.y + Math.sin(f.angle) * FLIPPER_LEN

        // Flipper body — tapered
        ctx.save()
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#c0d0ff'
        ctx.lineWidth = FLIPPER_W
        ctx.beginPath()
        ctx.moveTo(f.x, f.y)
        ctx.lineTo(endX, endY)
        ctx.stroke()
        // Highlight
        ctx.strokeStyle = '#e0e8ff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(f.x, f.y - 1)
        ctx.lineTo(endX, endY - 1)
        ctx.stroke()
        // Pivot
        ctx.fillStyle = '#8090c0'
        ctx.beginPath()
        ctx.arc(f.x, f.y, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      drawFlipper(s.leftFlipper, true)
      drawFlipper(s.rightFlipper, false)

      // Drain opening
      ctx.strokeStyle = '#302050'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(s.leftFlipper.x - 35, ch - 40)
      ctx.lineTo(s.leftFlipper.x - 5, s.leftFlipper.y + 10)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(s.rightFlipper.x + 35, ch - 40)
      ctx.lineTo(s.rightFlipper.x + 5, s.rightFlipper.y + 10)
      ctx.stroke()

      // Particles
      for (const p of s.particles) {
        ctx.globalAlpha = p.life / 30
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // Ball
      if (s.ball) {
        ctx.shadowColor = '#8080ff'
        ctx.shadowBlur = 10
        const bGrd = ctx.createRadialGradient(s.ball.x - 2, s.ball.y - 2, 1, s.ball.x, s.ball.y, BALL_R)
        bGrd.addColorStop(0, '#fff')
        bGrd.addColorStop(0.6, '#ccd')
        bGrd.addColorStop(1, '#889')
        ctx.fillStyle = bGrd
        ctx.beginPath()
        ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Bonus text
      if (s.bonusText) {
        ctx.globalAlpha = s.bonusText.life / 40
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 13px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(s.bonusText.text, s.bonusText.x, s.bonusText.y - (40 - s.bonusText.life) * 0.5)
        ctx.globalAlpha = 1
      }

      // HUD — scoreboard panel at bottom
      ctx.fillStyle = '#080818'
      ctx.fillRect(0, ch - 32, cw, 32)
      ctx.strokeStyle = '#3050a0'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, ch - 32)
      ctx.lineTo(cw, ch - 32)
      ctx.stroke()

      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#6080c0'
      ctx.fillText('SCORE', 8, ch - 18)
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 16px monospace'
      ctx.fillText(`${s.score.toLocaleString()}`, 8, ch - 3)

      ctx.textAlign = 'center'
      ctx.fillStyle = s.multiplier > 1 ? '#ff6b35' : '#4060a0'
      ctx.font = 'bold 11px monospace'
      ctx.fillText(`${s.multiplier}X`, cw / 2, ch - 10)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#6080c0'
      ctx.font = 'bold 11px monospace'
      ctx.fillText('BALL', cw - 8, ch - 18)
      for (let i = 0; i < s.balls; i++) {
        ctx.fillStyle = '#ccd'
        ctx.beginPath()
        ctx.arc(cw - 14 - i * 14, ch - 7, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const loop = () => { update(); draw(); raf = requestAnimationFrame(loop) }

    const onKey = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'z', '/'].includes(e.key)) e.preventDefault()
      keysRef.current[e.key] = e.type === 'keydown'
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
  }, [screen, initState, launchBall])

  return (
    <div className="flex flex-col h-full" style={{ background: '#0c0c2a' }}>
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {(screen === 'start' || screen === 'gameover') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2, background: 'rgba(8,8,30,0.9)' }}>
            <div className="text-center" style={{ fontFamily: 'monospace' }}>
              {screen === 'gameover' ? (
                <>
                  <div className="text-xl font-bold mb-1" style={{ color: '#FFD700' }}>GAME OVER</div>
                  <div className="text-sm mb-4" style={{ color: '#6080c0' }}>
                    Score: {hudRef.current.score.toLocaleString()}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs mb-1" style={{ color: '#4060a0' }}>3D</div>
                  <div className="text-2xl font-bold mb-1" style={{ color: '#c0d0ff' }}>SPACE PINBALL</div>
                  <div className="text-xs mb-1" style={{ color: '#6080c0' }}>← Z left flipper &middot; → / right flipper</div>
                  <div className="text-xs mb-4" style={{ color: '#4060a0' }}>Hold SPACE to charge plunger</div>
                </>
              )}
              <button
                onClick={startGame}
                className="px-5 py-2 text-sm font-bold cursor-pointer border-none rounded"
                style={{ background: '#4060c0', color: '#fff', fontFamily: 'monospace' }}
              >
                {screen === 'gameover' ? 'Play Again' : 'Launch'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
