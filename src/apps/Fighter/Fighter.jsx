import { useEffect, useRef, useState, useCallback } from 'react'

// ── Constants ──
const GROUND_Y = 310
const MOVE_SPEED = 2.5
const HEALTH_MAX = 100
const ROUND_TIME = 45
const ROUNDS_TO_WIN = 3
const HIT_STUN = 14
const BLOCK_STUN = 8
const KNOCKBACK = 4
const RING_LEFT = 40
const RING_RIGHT_PAD = 40

const ROBOTS = {
  red: {
    name: 'RED ROCKER',
    body: '#CC2222',
    bodyLight: '#EE4444',
    bodyDark: '#881111',
    eyes: '#FFDD00',
    accent: '#FF6B35',
    moves: {
      jab:   { damage: 6,  range: 48, startup: 2, active: 3, recovery: 6, hitstun: 10 },
      hook:  { damage: 10, range: 52, startup: 4, active: 4, recovery: 10, hitstun: 14 },
      uppercut: { damage: 16, range: 44, startup: 6, active: 5, recovery: 14, hitstun: 20, headshot: true },
      body:  { damage: 8,  range: 46, startup: 3, active: 3, recovery: 8, hitstun: 12, type: 'low' },
    },
  },
  blue: {
    name: 'BLUE BOMBER',
    body: '#2244CC',
    bodyLight: '#4466EE',
    bodyDark: '#112288',
    eyes: '#FFDD00',
    accent: '#00CCFF',
    moves: {
      jab:   { damage: 7,  range: 46, startup: 2, active: 3, recovery: 5, hitstun: 10 },
      hook:  { damage: 11, range: 50, startup: 4, active: 4, recovery: 9, hitstun: 14 },
      uppercut: { damage: 18, range: 42, startup: 7, active: 5, recovery: 16, hitstun: 22, headshot: true },
      body:  { damage: 9,  range: 44, startup: 3, active: 3, recovery: 7, hitstun: 12, type: 'low' },
    },
  },
}

function createRobot(type, x, facing) {
  return {
    type, x, y: GROUND_Y, facing,
    vx: 0,
    health: HEALTH_MAX,
    state: 'idle', // idle, walk, attack, hitstun, blockstun, ko
    stateTimer: 0,
    currentMove: null,
    blocking: false,
    headPopY: 0, // 0 = normal, >0 = head popping up on KO
    headBob: 0,
    roundsWon: 0,
    comboCount: 0,
  }
}

// ── Draw Robot ──
function drawRobot(ctx, r, tick, ringRight) {
  const data = ROBOTS[r.type]
  const isHurt = r.state === 'hitstun'
  const isKO = r.state === 'ko'
  const isAttacking = r.state === 'attack'
  const bob = r.state === 'idle' ? Math.sin(tick * 0.06) * 1.5 : 0
  const shakX = isHurt ? (Math.random() - 0.5) * 4 : 0
  const shakY = isHurt ? (Math.random() - 0.5) * 2 : 0

  ctx.save()
  ctx.translate(r.x + shakX, r.y + shakY)
  ctx.scale(r.facing, 1)

  const yOff = -70 + bob

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.ellipse(0, 2, 22, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  // ── Legs — pistons ──
  ctx.fillStyle = '#666'
  ctx.fillRect(-12, yOff + 52, 6, 20)
  ctx.fillRect(6, yOff + 52, 6, 20)
  // Feet
  ctx.fillStyle = '#555'
  ctx.fillRect(-15, yOff + 68, 12, 5)
  ctx.fillRect(3, yOff + 68, 12, 5)
  // Piston detail
  ctx.fillStyle = '#888'
  ctx.fillRect(-11, yOff + 56, 4, 3)
  ctx.fillRect(7, yOff + 56, 4, 3)

  // ── Body — boxy torso ──
  const bodyGrd = ctx.createLinearGradient(-18, yOff + 18, 18, yOff + 18)
  bodyGrd.addColorStop(0, data.bodyDark)
  bodyGrd.addColorStop(0.3, data.body)
  bodyGrd.addColorStop(0.7, data.bodyLight)
  bodyGrd.addColorStop(1, data.body)
  ctx.fillStyle = bodyGrd
  ctx.fillRect(-18, yOff + 18, 36, 36)

  // Body panel lines
  ctx.strokeStyle = data.bodyDark
  ctx.lineWidth = 1
  ctx.strokeRect(-16, yOff + 20, 32, 32)
  // Chest plate
  ctx.fillStyle = data.bodyDark
  ctx.fillRect(-10, yOff + 24, 20, 4)
  ctx.fillRect(-10, yOff + 32, 20, 4)
  // Power indicator
  ctx.fillStyle = r.health > 30 ? '#00FF44' : '#FF2200'
  ctx.fillRect(-4, yOff + 40, 8, 6)
  ctx.strokeStyle = '#333'
  ctx.strokeRect(-4, yOff + 40, 8, 6)

  // ── Arms ──
  ctx.fillStyle = '#888'
  // Shoulder joints
  ctx.beginPath()
  ctx.arc(-20, yOff + 22, 5, 0, Math.PI * 2)
  ctx.arc(20, yOff + 22, 5, 0, Math.PI * 2)
  ctx.fill()

  if (isAttacking && r.currentMove) {
    // Punching arm — extended
    const punchExt = r.stateTimer > 6 ? 30 : 20
    ctx.fillStyle = data.body
    ctx.fillRect(16, yOff + 18, punchExt, 8)
    // Fist
    ctx.fillStyle = data.bodyLight
    ctx.fillRect(16 + punchExt - 4, yOff + 15, 14, 14)
    ctx.strokeStyle = data.bodyDark
    ctx.lineWidth = 1.5
    ctx.strokeRect(16 + punchExt - 4, yOff + 15, 14, 14)
    // Knuckle lines
    ctx.fillStyle = data.bodyDark
    ctx.fillRect(16 + punchExt + 6, yOff + 17, 2, 10)

    // Other arm — guard
    ctx.fillStyle = data.body
    ctx.fillRect(-30, yOff + 20, 12, 7)
    ctx.fillStyle = data.bodyLight
    ctx.fillRect(-34, yOff + 17, 10, 12)
  } else if (r.blocking) {
    // Both arms up guarding
    ctx.fillStyle = data.body
    ctx.fillRect(-32, yOff + 12, 14, 8)
    ctx.fillRect(18, yOff + 12, 14, 8)
    ctx.fillStyle = data.bodyLight
    ctx.fillRect(-36, yOff + 8, 12, 14)
    ctx.fillRect(24, yOff + 8, 12, 14)
  } else {
    // Idle arms — guard position
    ctx.fillStyle = data.body
    ctx.fillRect(-30, yOff + 20, 12, 7)
    ctx.fillRect(18, yOff + 20, 12, 7)
    ctx.fillStyle = data.bodyLight
    ctx.fillRect(-34, yOff + 17, 10, 12)
    ctx.fillRect(26, yOff + 17, 10, 12)
  }

  // ── Head ──
  const headY = yOff + 2 - r.headPopY
  // Neck / spring (visible when head pops)
  if (r.headPopY > 0) {
    ctx.strokeStyle = '#888'
    ctx.lineWidth = 2
    const segments = 6
    for (let i = 0; i < segments; i++) {
      const sy = yOff + 16 - (r.headPopY / segments) * i
      const sx = Math.sin(i * 1.2) * 3
      ctx.beginPath()
      ctx.moveTo(sx - 3, sy)
      ctx.lineTo(sx + 3, sy - r.headPopY / segments)
      ctx.stroke()
    }
  }

  // Head block
  const headGrd = ctx.createLinearGradient(-14, headY - 14, 14, headY - 14)
  headGrd.addColorStop(0, data.bodyDark)
  headGrd.addColorStop(0.4, data.bodyLight)
  headGrd.addColorStop(1, data.body)
  ctx.fillStyle = headGrd
  ctx.fillRect(-14, headY - 14, 28, 22)
  ctx.strokeStyle = data.bodyDark
  ctx.lineWidth = 1.5
  ctx.strokeRect(-14, headY - 14, 28, 22)

  // Jaw
  ctx.fillStyle = data.body
  ctx.fillRect(-10, headY + 4, 20, 8)

  // Eyes
  if (isKO) {
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(-8, headY - 8, 6, 4)
    ctx.fillRect(2, headY - 8, 6, 4)
  } else {
    ctx.fillStyle = data.eyes
    ctx.shadowColor = data.eyes
    ctx.shadowBlur = 4
    ctx.fillRect(-8, headY - 8, 6, 5)
    ctx.fillRect(2, headY - 8, 6, 5)
    ctx.shadowBlur = 0
    // Pupils
    ctx.fillStyle = '#000'
    ctx.fillRect(-6, headY - 6, 2, 3)
    ctx.fillRect(4, headY - 6, 2, 3)
  }

  // Mouth grill
  ctx.fillStyle = '#333'
  ctx.fillRect(-6, headY + 1, 12, 6)
  ctx.fillStyle = data.bodyDark
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(-5 + i * 3, headY + 1, 1, 6)
  }

  // Antenna
  ctx.fillStyle = '#888'
  ctx.fillRect(-1, headY - 18, 2, 6)
  ctx.fillStyle = r.health > 50 ? data.accent : '#FF0000'
  ctx.beginPath()
  ctx.arc(0, headY - 19, 3, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

// ── AI ──
function aiUpdate(ai, player, tick) {
  const dist = Math.abs(ai.x - player.x)
  const input = { left: false, right: false, punch: false, hook: false, uppercut: false, body: false, block: false }

  if (ai.state !== 'idle' && ai.state !== 'walk') return input

  const shouldGoRight = player.x > ai.x

  // Incoming attack — try to block
  if (player.state === 'attack' && dist < 60) {
    if (Math.random() < 0.5) { input.block = true; return input }
  }

  if (dist > 100) {
    if (shouldGoRight) input.right = true; else input.left = true
  } else if (dist > 55) {
    if (shouldGoRight) input.right = true; else input.left = true
    if (Math.random() < 0.02) input.hook = true
  } else {
    // In range — fight
    const r = Math.random()
    if (r < 0.05) input.punch = true
    else if (r < 0.08) input.hook = true
    else if (r < 0.10) input.uppercut = true
    else if (r < 0.13) input.body = true
    else if (r < 0.18) input.block = true
    else if (r < 0.22) { if (shouldGoRight) input.left = true; else input.right = true } // dodge back
  }

  return input
}

export default function Fighter() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const keysRef = useRef({})
  const [screen, setScreen] = useState('start')

  const initRound = useCallback((canvas, keepRounds) => {
    const w = canvas.width, h = canvas.height
    const prev = stateRef.current
    const ringRight = w - RING_RIGHT_PAD
    const p1 = createRobot('red', w * 0.35, 1)
    const p2 = createRobot('blue', w * 0.65, -1)
    if (keepRounds && prev) {
      p1.roundsWon = prev.p1.roundsWon
      p2.roundsWon = prev.p2.roundsWon
    }
    return { w, h, ringRight, p1, p2, particles: [], tick: 0, roundTimer: ROUND_TIME * 60, roundOver: false, roundEndTimer: 0, message: 'ROUND ' + ((keepRounds && prev ? Math.max(prev.p1.roundsWon, prev.p2.roundsWon) : 0) + 1), messageTimer: 50 }
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

    const processInput = (robot, input, opponent, s) => {
      const data = ROBOTS[robot.type]
      if (robot.state === 'ko') return
      if (robot.state === 'hitstun' || robot.state === 'blockstun') {
        robot.stateTimer--
        if (robot.stateTimer <= 0) { robot.state = 'idle'; robot.comboCount = 0 }
        return
      }

      robot.facing = opponent.x > robot.x ? 1 : -1
      robot.blocking = input.block

      if (robot.state === 'attack') {
        robot.stateTimer--
        const move = data.moves[robot.currentMove]
        const elapsed = (move.startup + move.active + move.recovery) - robot.stateTimer

        if (elapsed >= move.startup && elapsed < move.startup + move.active) {
          const hitX = robot.x + robot.facing * move.range
          if (Math.abs(hitX - opponent.x) < 30 && !opponent._hitThisMove) {
            opponent._hitThisMove = true
            const blocked = opponent.blocking && move.type !== 'low'
            if (blocked) {
              opponent.state = 'blockstun'
              opponent.stateTimer = BLOCK_STUN
              opponent.vx = robot.facing * 2
              opponent.health -= 1
              s.particles.push({ x: opponent.x, y: opponent.y - 40, vx: 0, vy: -1, life: 20, text: 'BLOCK', color: '#888' })
            } else {
              opponent.health -= move.damage
              opponent.state = 'hitstun'
              opponent.stateTimer = move.hitstun
              opponent.vx = robot.facing * KNOCKBACK
              opponent.headBob = 6
              opponent.comboCount++

              // Hit sparks
              const sparkColor = data.accent
              for (let i = 0; i < 8; i++) {
                const ang = Math.random() * Math.PI * 2
                const spd = 2 + Math.random() * 4
                s.particles.push({ x: opponent.x - robot.facing * 10, y: opponent.y - 35, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 8 + Math.random() * 6, color: sparkColor })
              }

              // Damage text
              s.particles.push({ x: opponent.x, y: opponent.y - 70, vx: 0, vy: -1.5, life: 30, text: `-${move.damage}`, color: '#FF4444' })

              if (opponent.comboCount > 1) {
                s.particles.push({ x: (robot.x + opponent.x) / 2, y: opponent.y - 85, vx: 0, vy: -1, life: 35, text: `${opponent.comboCount} HIT!`, color: '#FFD700' })
              }

              if (opponent.health <= 0) {
                opponent.health = 0
                opponent.state = 'ko'
                opponent.stateTimer = 120
              }
            }
          }
        }

        if (robot.stateTimer <= 0) {
          robot.state = 'idle'
          robot.currentMove = null
        }
        return
      }

      // Movement
      if (input.left) { robot.vx = -MOVE_SPEED; robot.state = 'walk' }
      else if (input.right) { robot.vx = MOVE_SPEED; robot.state = 'walk' }
      else { robot.vx = 0; if (robot.state === 'walk') robot.state = 'idle' }

      // Attacks
      let moveName = null
      if (input.uppercut) moveName = 'uppercut'
      else if (input.hook) moveName = 'hook'
      else if (input.body) moveName = 'body'
      else if (input.punch) moveName = 'jab'

      if (moveName) {
        robot.state = 'attack'
        robot.currentMove = moveName
        const m = data.moves[moveName]
        robot.stateTimer = m.startup + m.active + m.recovery
        robot.vx = 0
        if (robot === s.p1) s.p2._hitThisMove = false
        else s.p1._hitThisMove = false
      }
    }

    const update = () => {
      const s = stateRef.current
      if (!s || screen !== 'playing') return
      s.tick++

      if (s.messageTimer > 0) { s.messageTimer--; return }

      if (s.roundOver) {
        // KO head pop animation
        const loser = s.p1.state === 'ko' ? s.p1 : s.p2.state === 'ko' ? s.p2 : null
        if (loser && loser.headPopY < 40) {
          loser.headPopY += 2
        }

        s.roundEndTimer--
        if (s.roundEndTimer <= 0) {
          if (s.p1.roundsWon >= ROUNDS_TO_WIN || s.p2.roundsWon >= ROUNDS_TO_WIN) {
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

      s.roundTimer--

      // Player input
      const p1Input = {
        left: keysRef.current['a'], right: keysRef.current['d'],
        punch: keysRef.current['f'], hook: keysRef.current['g'],
        uppercut: keysRef.current['h'], body: keysRef.current['r'],
        block: keysRef.current['s'],
      }
      const p2Input = aiUpdate(s.p2, s.p1, s.tick)

      processInput(s.p1, p1Input, s.p2, s)
      processInput(s.p2, p2Input, s.p1, s)

      // Physics
      for (const r of [s.p1, s.p2]) {
        r.x += r.vx
        r.vx *= 0.8
        r.x = Math.max(RING_LEFT, Math.min(s.ringRight, r.x))
        if (r.headBob > 0) r.headBob -= 0.5
      }

      // Push apart
      const dist = Math.abs(s.p1.x - s.p2.x)
      if (dist < 40) {
        const push = (40 - dist) / 2
        s.p1.x -= Math.sign(s.p1.x - s.p2.x) * push || push
        s.p2.x -= Math.sign(s.p2.x - s.p1.x) * push || -push
      }

      // Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i]
        p.x += p.vx || 0; p.y += p.vy || 0
        p.life--
        if (p.life <= 0) s.particles.splice(i, 1)
      }

      // Round end
      if (s.p1.health <= 0 || s.p2.health <= 0 || s.roundTimer <= 0) {
        s.roundOver = true
        s.roundEndTimer = 100

        if (s.p1.health <= 0) {
          s.p2.roundsWon++
          s.message = 'KNOCKOUT!'
        } else if (s.p2.health <= 0) {
          s.p1.roundsWon++
          s.message = 'KNOCKOUT!'
        } else {
          if (s.p1.health > s.p2.health) s.p1.roundsWon++
          else if (s.p2.health > s.p1.health) s.p2.roundsWon++
          s.message = 'TIME!'
        }
        s.messageTimer = 50
      }
    }

    const draw = () => {
      const s = stateRef.current
      const cw = canvas.width, ch = canvas.height
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, cw, ch)
      if (!s) return

      // Background — arena
      const bgGrd = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
      bgGrd.addColorStop(0, '#1a1a2e')
      bgGrd.addColorStop(1, '#16213e')
      ctx.fillStyle = bgGrd
      ctx.fillRect(0, 0, cw, GROUND_Y)

      // Crowd (dots)
      ctx.fillStyle = '#222'
      for (let i = 0; i < 60; i++) {
        const cx2 = (i * 53 + 17) % cw
        const cy = 30 + (i * 37) % 60
        ctx.fillRect(cx2, cy, 4, 6)
      }

      // Ring floor
      ctx.fillStyle = '#2a3a5a'
      ctx.fillRect(RING_LEFT - 20, GROUND_Y, cw - RING_LEFT - RING_RIGHT_PAD + 40, ch - GROUND_Y)
      // Ring mat
      ctx.fillStyle = '#354a70'
      ctx.fillRect(RING_LEFT - 10, GROUND_Y, cw - RING_LEFT - RING_RIGHT_PAD + 20, 4)

      // Ring ropes
      ctx.strokeStyle = '#FF4444'
      ctx.lineWidth = 2.5
      for (let i = 0; i < 3; i++) {
        const ropeY = GROUND_Y - 20 - i * 30
        ctx.beginPath()
        ctx.moveTo(RING_LEFT - 15, ropeY)
        ctx.lineTo(s.ringRight + 15, ropeY)
        ctx.stroke()
      }

      // Ring posts
      ctx.fillStyle = '#888'
      ctx.fillRect(RING_LEFT - 18, GROUND_Y - 90, 6, 94)
      ctx.fillRect(s.ringRight + 12, GROUND_Y - 90, 6, 94)
      // Post tops
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(RING_LEFT - 15, GROUND_Y - 92, 6, 0, Math.PI * 2)
      ctx.arc(s.ringRight + 15, GROUND_Y - 92, 6, 0, Math.PI * 2)
      ctx.fill()

      // Particles
      for (const p of s.particles) {
        if (p.text) {
          ctx.globalAlpha = p.life / 30
          ctx.fillStyle = p.color
          ctx.font = p.text.includes('HIT') ? 'bold 14px monospace' : 'bold 11px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(p.text, p.x, p.y)
        } else {
          ctx.globalAlpha = p.life / 14
          ctx.fillStyle = p.color
          ctx.fillRect(p.x - 2, p.y - 2, 4, 4)
        }
      }
      ctx.globalAlpha = 1

      // Robots
      drawRobot(ctx, s.p1, s.tick, s.ringRight)
      drawRobot(ctx, s.p2, s.tick, s.ringRight)

      // ── HUD ──
      const hbW = 140, hbH = 16, hbY = 10

      // P1 health
      ctx.fillStyle = '#333'
      ctx.fillRect(12, hbY, hbW, hbH)
      const p1Pct = s.p1.health / HEALTH_MAX
      const p1Grd = ctx.createLinearGradient(12, 0, 12 + hbW, 0)
      p1Grd.addColorStop(0, '#FF2222')
      p1Grd.addColorStop(1, '#FF6644')
      ctx.fillStyle = p1Grd
      ctx.fillRect(12, hbY, hbW * p1Pct, hbH)
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 1.5
      ctx.strokeRect(12, hbY, hbW, hbH)

      // P2 health
      ctx.fillStyle = '#333'
      ctx.fillRect(cw - 12 - hbW, hbY, hbW, hbH)
      const p2Pct = s.p2.health / HEALTH_MAX
      const p2Grd = ctx.createLinearGradient(cw - 12 - hbW, 0, cw - 12, 0)
      p2Grd.addColorStop(0, '#4466FF')
      p2Grd.addColorStop(1, '#2244CC')
      ctx.fillStyle = p2Grd
      ctx.fillRect(cw - 12 - hbW * p2Pct, hbY, hbW * p2Pct, hbH)
      ctx.strokeStyle = '#666'
      ctx.strokeRect(cw - 12 - hbW, hbY, hbW, hbH)

      // Names
      ctx.font = 'bold 10px monospace'
      ctx.fillStyle = '#FF4444'
      ctx.textAlign = 'left'
      ctx.fillText('RED ROCKER', 12, hbY + hbH + 12)
      ctx.fillStyle = '#4488FF'
      ctx.textAlign = 'right'
      ctx.fillText('BLUE BOMBER', cw - 12, hbY + hbH + 12)

      // Round dots
      for (let i = 0; i < ROUNDS_TO_WIN; i++) {
        ctx.fillStyle = i < s.p1.roundsWon ? '#FFD700' : '#333'
        ctx.beginPath()
        ctx.arc(14 + i * 14, hbY + hbH + 22, 4, 0, Math.PI * 2)
        ctx.fill()
      }
      for (let i = 0; i < ROUNDS_TO_WIN; i++) {
        ctx.fillStyle = i < s.p2.roundsWon ? '#FFD700' : '#333'
        ctx.beginPath()
        ctx.arc(cw - 14 - i * 14, hbY + hbH + 22, 4, 0, Math.PI * 2)
        ctx.fill()
      }

      // Timer
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 26px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(Math.max(0, Math.ceil(s.roundTimer / 60)), cw / 2, hbY + 22)

      // VS
      ctx.fillStyle = '#555'
      ctx.font = 'bold 10px monospace'
      ctx.fillText('VS', cw / 2, hbY + 34)

      // Message
      if (s.messageTimer > 0 || (s.message && s.roundOver)) {
        ctx.fillStyle = s.message === 'KNOCKOUT!' ? '#FF0000' : '#FFD700'
        ctx.font = 'bold 32px monospace'
        ctx.textAlign = 'center'
        ctx.shadowColor = s.message === 'KNOCKOUT!' ? '#FF000088' : '#FFD70088'
        ctx.shadowBlur = 16
        ctx.fillText(s.message, cw / 2, ch / 2 - 40)
        ctx.shadowBlur = 0
      }

      // Controls
      ctx.fillStyle = '#333'
      ctx.font = '8px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('A/D move · S block · F jab · G hook · H uppercut · R body', cw / 2, ch - 4)
    }

    const loop = () => { update(); draw(); raf = requestAnimationFrame(loop) }

    const onKey = (e) => {
      if (['w', 'a', 's', 'd', 'f', 'g', 'h', 'r'].includes(e.key)) e.preventDefault()
      keysRef.current[e.key] = e.type === 'keydown'
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
  }, [screen, initRound])

  const s = stateRef.current

  return (
    <div className="flex flex-col h-full" style={{ background: '#111' }}>
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {(screen === 'start' || screen === 'gameover') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2, background: 'rgba(0,0,0,0.85)' }}>
            <div className="text-center" style={{ fontFamily: 'monospace' }}>
              {screen === 'gameover' ? (
                <>
                  <div className="text-xl font-bold mb-1" style={{ color: '#FFD700' }}>
                    {s && s.p1.roundsWon >= ROUNDS_TO_WIN ? 'RED WINS!' : 'BLUE WINS!'}
                  </div>
                  <div className="text-sm mb-4" style={{ color: '#888' }}>
                    {s ? `${s.p1.roundsWon} - ${s.p2.roundsWon}` : ''}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs mb-1" style={{ color: '#FF444488' }}>★ ★ ★</div>
                  <div className="text-xl font-bold mb-0" style={{ color: '#FF4444' }}>ROCK'EM</div>
                  <div className="text-xl font-bold mb-1" style={{ color: '#4488FF' }}>SOCK'EM</div>
                  <div className="text-lg font-bold mb-3" style={{ color: '#FFD700' }}>ROBOTS</div>
                  <div className="text-xs mb-1" style={{ color: '#FF4444' }}>RED ROCKER <span style={{ color: '#666' }}>vs</span> <span style={{ color: '#4488FF' }}>BLUE BOMBER</span></div>
                  <div className="text-xs mb-1 mt-2" style={{ color: '#666' }}>A/D — move &middot; S — block</div>
                  <div className="text-xs mb-1" style={{ color: '#666' }}>F — jab &middot; G — hook</div>
                  <div className="text-xs mb-3" style={{ color: '#666' }}>H — uppercut &middot; R — body shot</div>
                  <div className="text-xs mb-3" style={{ color: '#555' }}>Best of {ROUNDS_TO_WIN * 2 - 1} &middot; Land an uppercut to pop their head!</div>
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
