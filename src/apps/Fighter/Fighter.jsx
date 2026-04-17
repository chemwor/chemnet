import { useEffect, useRef, useState, useCallback } from 'react'

const HEALTH_MAX = 50
const HIT_DAMAGE = 2
const HIT_STUN = 20
const PUNCH_COOLDOWN = 12
const AI_PUNCH_CHANCE = 0.035
const HEAD_POP_SPEED = 1.5
const HEAD_POP_MAX = 60

const ROBOTS = {
  red: {
    name: 'RED ROCKER',
    body: '#CC2222', bodyLight: '#EE4444', bodyDark: '#881111',
    eyes: '#FFDD00', accent: '#FF6B35', fist: '#DD3333',
  },
  blue: {
    name: 'BLUE BOMBER',
    body: '#2244CC', bodyLight: '#4466EE', bodyDark: '#112288',
    eyes: '#FFDD00', accent: '#00CCFF', fist: '#3355DD',
  },
}

function createRobot(type) {
  return {
    type,
    health: HEALTH_MAX,
    punchState: 'idle', // idle, punching, retracting
    punchTimer: 0,
    cooldown: 0,
    stunTimer: 0,
    headPopY: 0,
    ko: false,
    roundsWon: 0,
    punchCount: 0,
  }
}

function drawRobot(ctx, robot, x, y, facing, tick) {
  const data = ROBOTS[robot.type]
  const isStunned = robot.stunTimer > 0
  const shakeX = isStunned ? (Math.random() - 0.5) * 3 : 0
  const shakeY = isStunned ? (Math.random() - 0.5) * 2 : 0
  const bob = !isStunned && !robot.ko ? Math.sin(tick * 0.05) * 1 : 0

  ctx.save()
  ctx.translate(x + shakeX, y + shakeY + bob)
  ctx.scale(facing, 1)

  // ── Base / platform ──
  ctx.fillStyle = '#444'
  ctx.fillRect(-30, 70, 60, 8)
  ctx.fillStyle = '#555'
  ctx.fillRect(-28, 70, 56, 3)

  // ── Body column ──
  ctx.fillStyle = '#666'
  ctx.fillRect(-6, 40, 12, 32)
  // Body pistons
  ctx.fillStyle = '#777'
  ctx.fillRect(-10, 50, 4, 10)
  ctx.fillRect(6, 50, 4, 10)

  // ── Torso ──
  const bodyGrd = ctx.createLinearGradient(-24, 0, 24, 0)
  bodyGrd.addColorStop(0, data.bodyDark)
  bodyGrd.addColorStop(0.35, data.body)
  bodyGrd.addColorStop(0.65, data.bodyLight)
  bodyGrd.addColorStop(1, data.body)
  ctx.fillStyle = bodyGrd
  ctx.fillRect(-24, 4, 48, 40)
  ctx.strokeStyle = data.bodyDark
  ctx.lineWidth = 1.5
  ctx.strokeRect(-24, 4, 48, 40)

  // Chest panel
  ctx.fillStyle = data.bodyDark
  ctx.fillRect(-14, 10, 28, 3)
  ctx.fillRect(-14, 18, 28, 3)
  ctx.fillRect(-14, 26, 28, 3)

  // Power meter on chest
  const meterW = 20
  const meterH = 6
  ctx.fillStyle = '#222'
  ctx.fillRect(-meterW / 2, 32, meterW, meterH)
  const healthPct = robot.health / HEALTH_MAX
  ctx.fillStyle = healthPct > 0.3 ? '#00FF44' : '#FF2200'
  ctx.fillRect(-meterW / 2, 32, meterW * healthPct, meterH)
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 1
  ctx.strokeRect(-meterW / 2, 32, meterW, meterH)

  // ── Arms + Fists ──
  const punchExtend = robot.punchState === 'punching' ? 28 : robot.punchState === 'retracting' ? 14 : 0
  const guardBob = Math.sin(tick * 0.08) * 1

  // Punching arm (right side = forward)
  ctx.fillStyle = '#888'
  // Shoulder
  ctx.beginPath()
  ctx.arc(26, 12, 6, 0, Math.PI * 2)
  ctx.fill()
  // Arm
  ctx.fillStyle = data.body
  ctx.fillRect(24, 8, 12 + punchExtend, 9)
  // Fist
  ctx.fillStyle = data.fist
  const fistX = 34 + punchExtend
  ctx.fillRect(fistX, 4, 16, 16)
  ctx.strokeStyle = data.bodyDark
  ctx.lineWidth = 1.5
  ctx.strokeRect(fistX, 4, 16, 16)
  // Knuckle lines
  ctx.fillStyle = data.bodyDark
  ctx.fillRect(fistX + 12, 6, 2, 12)
  ctx.fillRect(fistX + 8, 6, 2, 12)

  // Guard arm (left side)
  ctx.fillStyle = '#888'
  ctx.beginPath()
  ctx.arc(-26, 12, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = data.body
  ctx.fillRect(-38, 8 + guardBob, 14, 9)
  ctx.fillStyle = data.fist
  ctx.fillRect(-44, 4 + guardBob, 14, 14)
  ctx.strokeStyle = data.bodyDark
  ctx.lineWidth = 1.5
  ctx.strokeRect(-44, 4 + guardBob, 14, 14)

  // ── Head ──
  const headY = -8 - robot.headPopY

  // Neck / spring when popping
  if (robot.headPopY > 2) {
    ctx.strokeStyle = '#999'
    ctx.lineWidth = 2
    const segs = 8
    const segH = robot.headPopY / segs
    ctx.beginPath()
    for (let i = 0; i <= segs; i++) {
      const sy = 2 - i * segH
      const sx = Math.sin(i * 1.8) * 4
      if (i === 0) ctx.moveTo(sx, sy)
      else ctx.lineTo(sx, sy)
    }
    ctx.stroke()
  }

  // Head box
  const headGrd = ctx.createLinearGradient(-16, headY - 18, 16, headY - 18)
  headGrd.addColorStop(0, data.bodyDark)
  headGrd.addColorStop(0.4, data.bodyLight)
  headGrd.addColorStop(1, data.body)
  ctx.fillStyle = headGrd
  ctx.fillRect(-16, headY - 18, 32, 24)
  ctx.strokeStyle = data.bodyDark
  ctx.lineWidth = 1.5
  ctx.strokeRect(-16, headY - 18, 32, 24)

  // Jaw
  ctx.fillStyle = data.body
  ctx.fillRect(-12, headY + 2, 24, 6)

  // Eyes
  if (robot.ko) {
    // X eyes
    ctx.strokeStyle = '#FF0000'
    ctx.lineWidth = 2
    for (const ex of [-7, 5]) {
      ctx.beginPath()
      ctx.moveTo(ex - 3, headY - 12)
      ctx.lineTo(ex + 3, headY - 6)
      ctx.moveTo(ex + 3, headY - 12)
      ctx.lineTo(ex - 3, headY - 6)
      ctx.stroke()
    }
  } else {
    ctx.fillStyle = data.eyes
    ctx.shadowColor = data.eyes
    ctx.shadowBlur = 5
    ctx.fillRect(-10, headY - 12, 7, 6)
    ctx.fillRect(3, headY - 12, 7, 6)
    ctx.shadowBlur = 0
    // Pupils
    ctx.fillStyle = '#000'
    ctx.fillRect(-7, headY - 10, 3, 4)
    ctx.fillRect(6, headY - 10, 3, 4)
  }

  // Mouth grill
  ctx.fillStyle = '#333'
  ctx.fillRect(-8, headY - 2, 16, 6)
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = data.bodyDark
    ctx.fillRect(-7 + i * 3.5, headY - 2, 1, 6)
  }

  // Antenna
  ctx.fillStyle = '#888'
  ctx.fillRect(-1, headY - 24, 2, 8)
  const antennaColor = robot.ko ? '#FF0000' : robot.health > 25 ? data.accent : '#FF4400'
  ctx.fillStyle = antennaColor
  ctx.shadowColor = antennaColor
  ctx.shadowBlur = robot.ko ? 0 : 6
  ctx.beginPath()
  ctx.arc(0, headY - 25, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.restore()
}

export default function Fighter() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const [screen, setScreen] = useState('start')

  const initRound = useCallback((canvas, keepRounds) => {
    const w = canvas.width, h = canvas.height
    const prev = stateRef.current
    const p1 = createRobot('red')
    const p2 = createRobot('blue')
    if (keepRounds && prev) {
      p1.roundsWon = prev.p1.roundsWon
      p2.roundsWon = prev.p2.roundsWon
    }
    const round = (keepRounds && prev ? Math.max(prev.p1.roundsWon, prev.p2.roundsWon) : 0) + 1
    return { w, h, p1, p2, particles: [], tick: 0, roundOver: false, roundEndTimer: 0, message: `ROUND ${round}`, messageTimer: 50 }
  }, [])

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight
    stateRef.current = initRound(canvas, false)
    setScreen('playing')
  }, [initRound])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight

    let raf
    let spacePressed = false

    const tryPunch = (robot) => {
      if (robot.cooldown > 0 || robot.stunTimer > 0 || robot.ko) return
      robot.punchState = 'punching'
      robot.punchTimer = 6
      robot.cooldown = PUNCH_COOLDOWN
      robot.punchCount++
    }

    const update = () => {
      const s = stateRef.current
      if (!s || screen !== 'playing') return
      s.tick++

      if (s.messageTimer > 0) { s.messageTimer--; return }
      if (s.roundOver) {
        // Animate head pop
        const loser = s.p1.ko ? s.p1 : s.p2.ko ? s.p2 : null
        if (loser && loser.headPopY < HEAD_POP_MAX) {
          loser.headPopY += HEAD_POP_SPEED
        }
        s.roundEndTimer--
        if (s.roundEndTimer <= 0) {
          if (s.p1.roundsWon >= 3 || s.p2.roundsWon >= 3) {
            setScreen('gameover')
            return
          }
          const newS = initRound(canvas, true)
          newS.p1.roundsWon = s.p1.roundsWon
          newS.p2.roundsWon = s.p2.roundsWon
          stateRef.current = newS
        }
        return
      }

      // Player punch — spacebar tap
      // (handled in keydown event below)

      // AI punching
      if (s.p2.cooldown <= 0 && s.p2.stunTimer <= 0 && !s.p2.ko) {
        if (Math.random() < AI_PUNCH_CHANCE) {
          tryPunch(s.p2)
        }
      }

      // Process both robots
      for (const r of [s.p1, s.p2]) {
        if (r.cooldown > 0) r.cooldown--
        if (r.stunTimer > 0) r.stunTimer--

        if (r.punchState === 'punching') {
          r.punchTimer--
          if (r.punchTimer <= 0) {
            r.punchState = 'retracting'
            r.punchTimer = 5
          }
        } else if (r.punchState === 'retracting') {
          r.punchTimer--
          if (r.punchTimer <= 0) r.punchState = 'idle'
        }
      }

      // Hit detection — punch connects at peak extension
      const checkHit = (attacker, defender, s) => {
        if (attacker.punchState !== 'punching' || attacker.punchTimer !== 3) return // only on frame 3
        if (defender.stunTimer > 0 || defender.ko) return

        // If defender is also punching at the same time — clash, both stun
        if (defender.punchState === 'punching') {
          attacker.stunTimer = 8
          defender.stunTimer = 8
          attacker.punchState = 'idle'
          defender.punchState = 'idle'
          // Clash sparks
          const mx = (s.w / 2)
          for (let i = 0; i < 10; i++) {
            const ang = Math.random() * Math.PI * 2
            const spd = 2 + Math.random() * 4
            s.particles.push({ x: mx, y: 190, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 10, color: '#FFD700' })
          }
          s.particles.push({ x: mx, y: 160, vx: 0, vy: -1, life: 25, text: 'CLASH!', color: '#FFD700' })
          return
        }

        // Hit connects
        defender.health -= HIT_DAMAGE
        defender.stunTimer = HIT_STUN
        defender.punchState = 'idle'

        // Sparks
        const hitX = s.w / 2 + (attacker === s.p1 ? 20 : -20)
        const sparkColor = ROBOTS[attacker.type].accent
        for (let i = 0; i < 6; i++) {
          const ang = Math.random() * Math.PI * 2
          const spd = 1 + Math.random() * 3
          s.particles.push({ x: hitX, y: 190, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 8, color: sparkColor })
        }
        s.particles.push({ x: hitX, y: 160, vx: 0, vy: -1.5, life: 25, text: 'HIT!', color: sparkColor })

        if (defender.health <= 0) {
          defender.health = 0
          defender.ko = true
          attacker.roundsWon++
          s.roundOver = true
          s.roundEndTimer = 140
          s.message = 'KNOCKOUT!'
          s.messageTimer = 40

          // Big explosion
          for (let i = 0; i < 20; i++) {
            const ang = Math.random() * Math.PI * 2
            const spd = 2 + Math.random() * 5
            s.particles.push({ x: hitX, y: 180, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 2, life: 20, color: sparkColor })
          }
        }
      }

      checkHit(s.p1, s.p2, s)
      checkHit(s.p2, s.p1, s)

      // Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i]
        p.x += p.vx || 0; p.y += p.vy || 0
        if (!p.text) p.vy += 0.1
        p.life--
        if (p.life <= 0) s.particles.splice(i, 1)
      }
    }

    const draw = () => {
      const s = stateRef.current
      const cw = canvas.width, ch = canvas.height
      ctx.fillStyle = '#0a0a14'
      ctx.fillRect(0, 0, cw, ch)
      if (!s) return

      // Background — arena lights
      const bgGrd = ctx.createRadialGradient(cw / 2, 60, 20, cw / 2, 200, 300)
      bgGrd.addColorStop(0, '#1a1a30')
      bgGrd.addColorStop(1, '#0a0a14')
      ctx.fillStyle = bgGrd
      ctx.fillRect(0, 0, cw, ch)

      // Crowd
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `hsl(${(i * 73) % 360}, 30%, 15%)`
        const cx2 = (i * 47 + 13) % cw
        const cy = 20 + (i * 31) % 50
        ctx.fillRect(cx2, cy, 5, 7)
      }

      // Ring platform
      ctx.fillStyle = '#2a2a3a'
      ctx.fillRect(20, 310, cw - 40, 60)
      ctx.fillStyle = '#3a3a4a'
      ctx.fillRect(20, 310, cw - 40, 4)
      // Ring mat
      ctx.fillStyle = '#333350'
      ctx.fillRect(30, 314, cw - 60, 50)

      // Ring ropes
      ctx.strokeStyle = '#FF4444'
      ctx.lineWidth = 3
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(15, 120 + i * 30)
        ctx.lineTo(cw - 15, 120 + i * 30)
        ctx.stroke()
      }
      // Posts
      ctx.fillStyle = '#777'
      ctx.fillRect(12, 100, 6, 218)
      ctx.fillRect(cw - 18, 100, 6, 218)
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(15, 98, 6, 0, Math.PI * 2)
      ctx.arc(cw - 15, 98, 6, 0, Math.PI * 2)
      ctx.fill()

      // Spotlight
      ctx.fillStyle = 'rgba(255,255,200,0.03)'
      ctx.beginPath()
      ctx.moveTo(cw / 2 - 10, 0)
      ctx.lineTo(cw / 2 - 80, 310)
      ctx.lineTo(cw / 2 + 80, 310)
      ctx.lineTo(cw / 2 + 10, 0)
      ctx.fill()

      // Particles (behind robots)
      for (const p of s.particles) {
        if (p.text) continue
        ctx.globalAlpha = p.life / 20
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4)
      }
      ctx.globalAlpha = 1

      // Robots — fixed positions, facing each other
      const p1X = cw / 2 - 60
      const p2X = cw / 2 + 60
      const robotY = 270

      drawRobot(ctx, s.p1, p1X, robotY, 1, s.tick)
      drawRobot(ctx, s.p2, p2X, robotY, -1, s.tick)

      // Text particles (in front)
      for (const p of s.particles) {
        if (!p.text) continue
        ctx.globalAlpha = p.life / 25
        ctx.fillStyle = p.color
        ctx.font = p.text === 'CLASH!' ? 'bold 16px monospace' : 'bold 12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(p.text, p.x, p.y)
      }
      ctx.globalAlpha = 1

      // ── HUD ──
      const hbW = 120, hbH = 14, hbY = 80

      // P1 health
      ctx.fillStyle = '#222'
      ctx.fillRect(20, hbY, hbW, hbH)
      ctx.fillStyle = '#CC2222'
      ctx.fillRect(20, hbY, hbW * (s.p1.health / HEALTH_MAX), hbH)
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 1
      ctx.strokeRect(20, hbY, hbW, hbH)

      // P2 health
      ctx.fillStyle = '#222'
      ctx.fillRect(cw - 20 - hbW, hbY, hbW, hbH)
      ctx.fillStyle = '#2244CC'
      ctx.fillRect(cw - 20 - hbW * (s.p2.health / HEALTH_MAX), hbY, hbW * (s.p2.health / HEALTH_MAX), hbH)
      ctx.strokeStyle = '#666'
      ctx.strokeRect(cw - 20 - hbW, hbY, hbW, hbH)

      // Names
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#FF4444'
      ctx.fillText('RED ROCKER', 20, hbY - 4)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#4488FF'
      ctx.fillText('BLUE BOMBER', cw - 20, hbY - 4)

      // Round dots
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < s.p1.roundsWon ? '#FFD700' : '#333'
        ctx.beginPath()
        ctx.arc(22 + i * 14, hbY + hbH + 10, 4, 0, Math.PI * 2)
        ctx.fill()
      }
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < s.p2.roundsWon ? '#FFD700' : '#333'
        ctx.beginPath()
        ctx.arc(cw - 22 - i * 14, hbY + hbH + 10, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // VS
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('VS', cw / 2, hbY + 12)

      // Message
      if (s.messageTimer > 0 || (s.roundOver && s.message)) {
        ctx.fillStyle = s.message === 'KNOCKOUT!' ? '#FF0000' : '#FFD700'
        ctx.font = 'bold 30px monospace'
        ctx.textAlign = 'center'
        ctx.shadowColor = s.message === 'KNOCKOUT!' ? '#FF000066' : '#FFD70066'
        ctx.shadowBlur = 20
        ctx.fillText(s.message, cw / 2, ch / 2 - 60)
        ctx.shadowBlur = 0
      }

      // Controls hint
      ctx.fillStyle = '#333'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('Tap SPACE to punch! Mash fast to win!', cw / 2, ch - 6)
    }

    const loop = () => { update(); draw(); raf = requestAnimationFrame(loop) }

    const onKey = (e) => {
      if (e.key === ' ') e.preventDefault()
      if (e.type === 'keydown' && e.key === ' ' && !spacePressed) {
        spacePressed = true
        const s = stateRef.current
        if (s && screen === 'playing' && !s.roundOver && s.messageTimer <= 0) {
          tryPunch(s.p1)
        }
      }
      if (e.type === 'keyup' && e.key === ' ') {
        spacePressed = false
      }
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
  }, [screen, initRound])

  const s = stateRef.current

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a14' }}>
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {(screen === 'start' || screen === 'gameover') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2, background: 'rgba(0,0,0,0.85)' }}>
            <div className="text-center" style={{ fontFamily: 'monospace' }}>
              {screen === 'gameover' ? (
                <>
                  <div className="text-xl font-bold mb-2" style={{ color: '#FFD700' }}>
                    {s && s.p1.roundsWon >= 3
                      ? 'RED ROCKER WINS!'
                      : 'BLUE BOMBER WINS!'}
                  </div>
                  <div className="text-sm mb-4" style={{ color: '#888' }}>
                    {s ? `${s.p1.roundsWon} - ${s.p2.roundsWon}` : ''}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs mb-1" style={{ color: '#FF444466' }}>★ ★ ★</div>
                  <div className="text-xl font-bold" style={{ color: '#FF4444' }}>ROCK'EM</div>
                  <div className="text-xl font-bold mb-1" style={{ color: '#4488FF' }}>SOCK'EM</div>
                  <div className="text-lg font-bold mb-3" style={{ color: '#FFD700' }}>ROBOTS</div>
                  <div className="text-xs mb-1" style={{ color: '#FF4444' }}>RED ROCKER <span style={{ color: '#666' }}>vs</span> <span style={{ color: '#4488FF' }}>BLUE BOMBER</span></div>
                  <div className="text-sm mt-3 mb-1" style={{ color: '#ccc' }}>Tap SPACEBAR to punch!</div>
                  <div className="text-xs mb-3" style={{ color: '#666' }}>Mash fast — knock their block off!</div>
                  <div className="text-xs mb-3" style={{ color: '#555' }}>Best of 5 rounds</div>
                </>
              )}
              <button
                onClick={startGame}
                className="px-5 py-2 text-sm font-bold cursor-pointer border-none rounded"
                style={{ background: '#FFD700', color: '#000', fontFamily: 'monospace' }}
              >
                {screen === 'gameover' ? 'Rematch' : 'FIGHT!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
