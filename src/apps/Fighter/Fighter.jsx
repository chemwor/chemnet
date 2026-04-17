import { useEffect, useRef, useState, useCallback } from 'react'

// ── Constants ──
const GROUND_Y = 320
const GRAVITY = 0.6
const MOVE_SPEED = 3.5
const JUMP_FORCE = -12
const HEALTH_MAX = 100
const ROUND_TIME = 60
const ROUNDS_TO_WIN = 2
const HIT_STUN = 18
const BLOCK_STUN = 10
const KNOCKBACK = 5
const BLOCK_KNOCKBACK = 2
const PROJECTILE_SPEED = 5

// ── Fighters ──
const FIGHTERS = {
  ryu: {
    name: 'Ryu',
    color: '#4488FF',
    altColor: '#2244AA',
    beltColor: '#FF4444',
    headband: '#FF4444',
    moves: {
      punch:   { damage: 8,  range: 45, startup: 3, active: 4, recovery: 8, hitstun: 14, type: 'mid' },
      kick:    { damage: 10, range: 50, startup: 5, active: 4, recovery: 10, hitstun: 16, type: 'mid' },
      crouch_punch: { damage: 6, range: 40, startup: 2, active: 3, recovery: 6, hitstun: 10, type: 'low' },
      crouch_kick:  { damage: 12, range: 55, startup: 6, active: 5, recovery: 14, hitstun: 18, type: 'low', knockdown: true },
      special: { damage: 15, range: 0, startup: 12, active: 0, recovery: 20, hitstun: 20, type: 'projectile' },
      uppercut: { damage: 14, range: 40, startup: 4, active: 5, recovery: 16, hitstun: 22, type: 'mid', launcher: true },
    },
  },
  akuma: {
    name: 'Akuma',
    color: '#333',
    altColor: '#1a1a1a',
    beltColor: '#880000',
    headband: '#000',
    moves: {
      punch:   { damage: 9,  range: 42, startup: 2, active: 4, recovery: 7, hitstun: 14, type: 'mid' },
      kick:    { damage: 11, range: 48, startup: 4, active: 5, recovery: 9, hitstun: 16, type: 'mid' },
      crouch_punch: { damage: 7, range: 38, startup: 2, active: 3, recovery: 6, hitstun: 10, type: 'low' },
      crouch_kick:  { damage: 13, range: 52, startup: 5, active: 5, recovery: 13, hitstun: 18, type: 'low', knockdown: true },
      special: { damage: 18, range: 0, startup: 10, active: 0, recovery: 18, hitstun: 22, type: 'projectile' },
      uppercut: { damage: 16, range: 38, startup: 3, active: 5, recovery: 14, hitstun: 24, type: 'mid', launcher: true },
    },
  },
}

function createFighter(type, x, facing) {
  return {
    type,
    x, y: GROUND_Y,
    vx: 0, vy: 0,
    facing, // 1 = right, -1 = left
    health: HEALTH_MAX,
    state: 'idle', // idle, walk, jump, crouch, attack, hitstun, blockstun, knockdown, victory
    frame: 0,
    stateTimer: 0,
    currentMove: null,
    blocking: false,
    crouching: false,
    airborne: false,
    roundsWon: 0,
  }
}

function createProjectile(owner, x, y, facing, damage) {
  return { owner, x, y, vx: facing * PROJECTILE_SPEED, damage, life: 80, w: 20, h: 14 }
}

// ── Draw fighter ──
function drawFighter(ctx, f, tick) {
  const data = FIGHTERS[f.type]
  ctx.save()
  ctx.translate(f.x, f.y)
  ctx.scale(f.facing, 1)

  const bob = f.state === 'idle' ? Math.sin(tick * 0.08) * 2 : 0
  const isHurt = f.state === 'hitstun' || f.state === 'knockdown'
  const isAttacking = f.state === 'attack'
  const isCrouching = f.crouching && f.state !== 'attack'
  const bodyH = isCrouching ? 35 : 50

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  const yOff = -bodyH + bob

  // Legs
  ctx.fillStyle = data.color
  if (isCrouching) {
    ctx.fillRect(-10, yOff + 25, 8, 10)
    ctx.fillRect(2, yOff + 25, 8, 10)
  } else if (f.state === 'walk') {
    const legAnim = Math.sin(tick * 0.15) * 6
    ctx.fillRect(-10 + legAnim, yOff + 32, 7, 18)
    ctx.fillRect(3 - legAnim, yOff + 32, 7, 18)
  } else if (f.state === 'jump') {
    ctx.fillRect(-10, yOff + 30, 7, 14)
    ctx.fillRect(3, yOff + 30, 7, 14)
  } else {
    ctx.fillRect(-10, yOff + 32, 7, 18)
    ctx.fillRect(3, yOff + 32, 7, 18)
  }

  // Feet
  ctx.fillStyle = '#222'
  if (!isCrouching) {
    ctx.fillRect(-12, yOff + 48, 10, 4)
    ctx.fillRect(2, yOff + 48, 10, 4)
  }

  // Body
  ctx.fillStyle = isHurt ? '#ff4444' : data.color
  ctx.fillRect(-12, yOff + 8, 24, 26)

  // Belt
  ctx.fillStyle = data.beltColor
  ctx.fillRect(-12, yOff + 28, 24, 4)

  // Arms
  ctx.fillStyle = isHurt ? '#ff6666' : '#ddb590'
  if (isAttacking && f.currentMove) {
    const move = data.moves[f.currentMove]
    if (f.currentMove === 'kick' || f.currentMove === 'crouch_kick') {
      // Kick — extended leg
      ctx.fillStyle = data.color
      ctx.fillRect(8, yOff + (isCrouching ? 22 : 28), 30, 7)
      ctx.fillStyle = '#222'
      ctx.fillRect(35, yOff + (isCrouching ? 22 : 28), 8, 7)
    } else if (f.currentMove === 'uppercut') {
      // Uppercut — arm reaching up
      ctx.fillRect(4, yOff - 5, 8, 20)
      ctx.fillRect(8, yOff - 10, 10, 10)
    } else if (f.currentMove === 'special') {
      // Hadouken pose — both arms forward
      ctx.fillRect(10, yOff + 14, 16, 8)
      ctx.fillRect(10, yOff + 10, 16, 8)
      // Energy charge
      if (f.stateTimer < 10) {
        ctx.fillStyle = f.type === 'akuma' ? '#8800FF' : '#44AAFF'
        ctx.shadowColor = f.type === 'akuma' ? '#8800FF' : '#44AAFF'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(24, yOff + 16, 6 + f.stateTimer * 0.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
    } else {
      // Punch — extended arm
      ctx.fillRect(8, yOff + 14, 28, 7)
      ctx.fillRect(32, yOff + 13, 8, 9)
    }
    // Other arm stays
    ctx.fillStyle = '#ddb590'
    ctx.fillRect(-16, yOff + 12, 6, 14)
  } else if (f.blocking) {
    // Block pose — arms crossed
    ctx.fillRect(-4, yOff + 8, 8, 16)
    ctx.fillRect(0, yOff + 8, 8, 16)
  } else {
    // Idle arms
    ctx.fillRect(-16, yOff + 12, 6, 14)
    ctx.fillRect(12, yOff + 12, 6, 14)
    // Fists
    ctx.fillRect(-17, yOff + 24, 8, 6)
    ctx.fillRect(11, yOff + 24, 8, 6)
  }

  // Head
  ctx.fillStyle = '#ddb590'
  ctx.beginPath()
  ctx.arc(0, yOff + 4, 10, 0, Math.PI * 2)
  ctx.fill()

  // Headband
  ctx.fillStyle = data.headband
  ctx.fillRect(-10, yOff - 3, 20, 4)
  // Headband tail
  ctx.fillRect(-14, yOff - 3, 6, 3)
  ctx.fillRect(-16, yOff - 1, 4, 3)

  // Eyes
  if (f.state === 'knockdown') {
    ctx.fillStyle = '#000'
    ctx.fillText('X', 3, yOff + 5)
    ctx.fillText('X', -6, yOff + 5)
  } else {
    ctx.fillStyle = '#fff'
    ctx.fillRect(2, yOff + 1, 5, 4)
    ctx.fillRect(-7, yOff + 1, 5, 4)
    ctx.fillStyle = '#000'
    ctx.fillRect(4, yOff + 2, 2, 3)
    ctx.fillRect(-5, yOff + 2, 2, 3)
  }

  // Mouth
  if (isHurt) {
    ctx.fillStyle = '#000'
    ctx.fillRect(-3, yOff + 8, 6, 3)
  }

  ctx.restore()
}

function drawProjectile(ctx, p, tick) {
  const glow = p.owner === 'akuma' ? '#8800FF' : '#44AAFF'
  ctx.fillStyle = glow
  ctx.shadowColor = glow
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.ellipse(p.x, p.y, 10 + Math.sin(tick * 0.3) * 2, 7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(p.x, p.y, 4, 3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
}

// ── AI ──
function aiUpdate(ai, player, projectiles, tick) {
  const dist = Math.abs(ai.x - player.x)
  const input = { left: false, right: false, up: false, down: false, punch: false, kick: false, special: false, block: false }

  if (ai.state === 'hitstun' || ai.state === 'blockstun' || ai.state === 'knockdown' || ai.state === 'attack') return input

  // Face player
  const shouldFaceRight = player.x > ai.x

  // Check incoming projectiles
  const incoming = projectiles.find(p => p.owner !== ai.type && Math.abs(p.y - ai.y) < 30 && Math.abs(p.x - ai.x) < 120 && Math.sign(p.vx) === (ai.x > p.x ? 1 : -1))

  if (incoming) {
    if (Math.random() < 0.6) {
      input.block = true
      input.down = false
    } else {
      input.up = true
    }
    return input
  }

  if (dist > 200) {
    // Far — approach or throw projectile
    if (Math.random() < 0.02 && tick % 60 < 5) {
      input.special = true
    } else {
      if (shouldFaceRight) input.right = true; else input.left = true
    }
  } else if (dist > 60) {
    // Mid range — approach and attack
    if (shouldFaceRight) input.right = true; else input.left = true
    if (Math.random() < 0.04) input.kick = true
  } else {
    // Close range — fight
    const r = Math.random()
    if (r < 0.06) input.punch = true
    else if (r < 0.10) input.kick = true
    else if (r < 0.12) input.special = true
    else if (r < 0.16) { input.down = true; input.kick = true }
    else if (r < 0.18) { input.down = true; input.punch = true }
    else if (r < 0.22) input.block = true
    else if (r < 0.24) input.up = true
    // Sometimes back off
    else if (r < 0.28) { if (shouldFaceRight) input.left = true; else input.right = true }
  }

  return input
}

export default function Fighter() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const keysRef = useRef({})
  const [screen, setScreen] = useState('start')
  const hudRef = useRef({ p1: HEALTH_MAX, p2: HEALTH_MAX, p1Rounds: 0, p2Rounds: 0, timer: ROUND_TIME })

  const initRound = useCallback((canvas, keepRounds) => {
    const w = canvas.width, h = canvas.height
    const prev = stateRef.current
    const p1 = createFighter('ryu', w * 0.3, 1)
    const p2 = createFighter('akuma', w * 0.7, -1)
    if (keepRounds && prev) {
      p1.roundsWon = prev.p1.roundsWon
      p2.roundsWon = prev.p2.roundsWon
    }
    return { w, h, p1, p2, projectiles: [], particles: [], tick: 0, roundTimer: ROUND_TIME * 60, roundOver: false, roundEndTimer: 0, ko: false, message: 'FIGHT!', messageTimer: 60 }
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

    const processInput = (fighter, input, opponent, s) => {
      const data = FIGHTERS[fighter.type]
      if (fighter.state === 'knockdown') {
        fighter.stateTimer--
        if (fighter.stateTimer <= 0) { fighter.state = 'idle'; fighter.y = GROUND_Y }
        return
      }
      if (fighter.state === 'hitstun' || fighter.state === 'blockstun') {
        fighter.stateTimer--
        if (fighter.stateTimer <= 0) fighter.state = 'idle'
        return
      }
      if (fighter.state === 'victory') return

      // Auto face opponent
      fighter.facing = opponent.x > fighter.x ? 1 : -1

      // Blocking
      const holdingBack = (fighter.facing === 1 && input.left) || (fighter.facing === -1 && input.right)
      fighter.blocking = holdingBack || input.block
      fighter.crouching = input.down

      if (fighter.state === 'attack') {
        fighter.stateTimer--
        const move = data.moves[fighter.currentMove]
        const elapsed = (move.startup + move.active + move.recovery) - fighter.stateTimer

        // Active frames — check hit
        if (elapsed >= move.startup && elapsed < move.startup + move.active) {
          if (move.type === 'projectile') {
            if (elapsed === move.startup) {
              s.projectiles.push(createProjectile(fighter.type, fighter.x + fighter.facing * 20, fighter.y - 30, fighter.facing, move.damage))
            }
          } else {
            const hitX = fighter.x + fighter.facing * move.range
            const dist = Math.abs(hitX - opponent.x)
            if (dist < 30 && Math.abs(fighter.y - opponent.y) < 40 && !opponent._hitThisMove) {
              opponent._hitThisMove = true
              const blocked = opponent.blocking && !opponent.crouching === (move.type === 'low')
              if (blocked) {
                opponent.state = 'blockstun'
                opponent.stateTimer = BLOCK_STUN
                opponent.vx = fighter.facing * BLOCK_KNOCKBACK
                opponent.health -= Math.floor(move.damage * 0.15)
              } else {
                opponent.health -= move.damage
                opponent.state = move.knockdown ? 'knockdown' : 'hitstun'
                opponent.stateTimer = move.knockdown ? 40 : move.hitstun
                opponent.vx = fighter.facing * KNOCKBACK
                if (move.launcher) { opponent.vy = -8; opponent.airborne = true }
                // Hit particles
                for (let i = 0; i < 6; i++) {
                  const ang = Math.random() * Math.PI * 2
                  s.particles.push({ x: opponent.x, y: opponent.y - 25, vx: Math.cos(ang) * 3, vy: Math.sin(ang) * 3, life: 10, color: '#FFD700' })
                }
              }
              if (opponent.health < 0) opponent.health = 0
            }
          }
        }

        if (fighter.stateTimer <= 0) {
          fighter.state = 'idle'
          fighter.currentMove = null
        }
        return
      }

      // Jump
      if (input.up && !fighter.airborne) {
        fighter.vy = JUMP_FORCE
        fighter.airborne = true
        fighter.state = 'jump'
      }

      // Movement
      if (!fighter.airborne) {
        if (input.left && !input.down) { fighter.vx = -MOVE_SPEED; fighter.state = 'walk' }
        else if (input.right && !input.down) { fighter.vx = MOVE_SPEED; fighter.state = 'walk' }
        else { fighter.vx = 0; fighter.state = input.down ? 'crouch' : 'idle' }
      }

      // Attacks
      if (input.special && fighter.state !== 'jump') {
        fighter.state = 'attack'
        fighter.currentMove = 'special'
        const m = data.moves.special
        fighter.stateTimer = m.startup + m.active + m.recovery
        fighter.vx = 0
        opponent._hitThisMove = false
      } else if (input.punch && input.up && !fighter.airborne) {
        fighter.state = 'attack'
        fighter.currentMove = 'uppercut'
        const m = data.moves.uppercut
        fighter.stateTimer = m.startup + m.active + m.recovery
        fighter.vy = JUMP_FORCE * 0.7
        fighter.airborne = true
        fighter.vx = fighter.facing * 2
        opponent._hitThisMove = false
      } else if (input.punch) {
        fighter.state = 'attack'
        fighter.currentMove = input.down ? 'crouch_punch' : 'punch'
        const m = data.moves[fighter.currentMove]
        fighter.stateTimer = m.startup + m.active + m.recovery
        fighter.vx = 0
        opponent._hitThisMove = false
      } else if (input.kick) {
        fighter.state = 'attack'
        fighter.currentMove = input.down ? 'crouch_kick' : 'kick'
        const m = data.moves[fighter.currentMove]
        fighter.stateTimer = m.startup + m.active + m.recovery
        fighter.vx = 0
        opponent._hitThisMove = false
      }
    }

    const update = () => {
      const s = stateRef.current
      if (!s || screen !== 'playing') return
      s.tick++

      if (s.messageTimer > 0) { s.messageTimer--; return }

      if (s.roundOver) {
        s.roundEndTimer--
        if (s.roundEndTimer <= 0) {
          // Check for game over
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

      // Timer
      s.roundTimer--
      const timerSec = Math.ceil(s.roundTimer / 60)

      // Player input
      const p1Input = {
        left: keysRef.current['a'], right: keysRef.current['d'],
        up: keysRef.current['w'], down: keysRef.current['s'],
        punch: keysRef.current['f'], kick: keysRef.current['g'],
        special: keysRef.current['h'], block: false,
      }

      const p2Input = aiUpdate(s.p2, s.p1, s.projectiles, s.tick)

      processInput(s.p1, p1Input, s.p2, s)
      processInput(s.p2, p2Input, s.p1, s)

      // Physics for both fighters
      for (const f of [s.p1, s.p2]) {
        f.x += f.vx
        f.y += f.vy
        f.vy += GRAVITY
        f.vx *= 0.85

        if (f.y >= GROUND_Y) { f.y = GROUND_Y; f.vy = 0; f.airborne = false }
        f.x = Math.max(20, Math.min(s.w - 20, f.x))
      }

      // Push apart if overlapping
      const dist = Math.abs(s.p1.x - s.p2.x)
      if (dist < 30) {
        const push = (30 - dist) / 2
        s.p1.x -= Math.sign(s.p1.x - s.p2.x) * push || push
        s.p2.x -= Math.sign(s.p2.x - s.p1.x) * push || -push
      }

      // Projectiles
      for (let i = s.projectiles.length - 1; i >= 0; i--) {
        const p = s.projectiles[i]
        p.x += p.vx
        p.life--
        if (p.life <= 0 || p.x < -20 || p.x > s.w + 20) { s.projectiles.splice(i, 1); continue }

        // Hit check
        const target = p.owner === s.p1.type ? s.p2 : s.p1
        if (Math.abs(p.x - target.x) < 25 && Math.abs(p.y - (target.y - 25)) < 25) {
          if (target.blocking) {
            target.state = 'blockstun'
            target.stateTimer = BLOCK_STUN
            target.health -= 2
          } else {
            target.health -= p.damage
            target.state = 'hitstun'
            target.stateTimer = HIT_STUN
            target.vx = Math.sign(p.vx) * KNOCKBACK
            for (let j = 0; j < 8; j++) {
              const ang = Math.random() * Math.PI * 2
              s.particles.push({ x: target.x, y: target.y - 25, vx: Math.cos(ang) * 4, vy: Math.sin(ang) * 4, life: 12, color: p.owner === 'akuma' ? '#8800FF' : '#44AAFF' })
            }
          }
          if (target.health < 0) target.health = 0
          s.projectiles.splice(i, 1)
        }
      }

      // Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i]
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--
        if (p.life <= 0) s.particles.splice(i, 1)
      }

      // Round end check
      if (s.p1.health <= 0 || s.p2.health <= 0 || s.roundTimer <= 0) {
        s.roundOver = true
        s.roundEndTimer = 120
        if (s.p1.health <= 0) {
          s.p2.roundsWon++
          s.p2.state = 'victory'
          s.message = 'K.O.!'
          s.ko = true
        } else if (s.p2.health <= 0) {
          s.p1.roundsWon++
          s.p1.state = 'victory'
          s.message = 'K.O.!'
          s.ko = true
        } else {
          // Time up — most health wins
          if (s.p1.health > s.p2.health) { s.p1.roundsWon++; s.p1.state = 'victory' }
          else if (s.p2.health > s.p1.health) { s.p2.roundsWon++; s.p2.state = 'victory' }
          s.message = 'TIME!'
        }
        s.messageTimer = 60
        hudRef.current = { p1: s.p1.health, p2: s.p2.health, p1Rounds: s.p1.roundsWon, p2Rounds: s.p2.roundsWon, timer: timerSec }
      }

      hudRef.current = { p1: s.p1.health, p2: s.p2.health, p1Rounds: s.p1.roundsWon, p2Rounds: s.p2.roundsWon, timer: timerSec }
    }

    const draw = () => {
      const s = stateRef.current
      const cw = canvas.width, ch = canvas.height
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, cw, ch)
      if (!s) return

      // Background — dojo
      const skyGrd = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
      skyGrd.addColorStop(0, '#1a0a2e')
      skyGrd.addColorStop(1, '#2d1b4e')
      ctx.fillStyle = skyGrd
      ctx.fillRect(0, 0, cw, GROUND_Y)

      // Mountains
      ctx.fillStyle = '#150a25'
      ctx.beginPath()
      ctx.moveTo(0, GROUND_Y)
      for (let x = 0; x <= cw; x += 40) {
        ctx.lineTo(x, GROUND_Y - 40 - Math.sin(x * 0.02) * 30 - Math.cos(x * 0.01) * 20)
      }
      ctx.lineTo(cw, GROUND_Y)
      ctx.fill()

      // Ground
      ctx.fillStyle = '#3d2b1f'
      ctx.fillRect(0, GROUND_Y, cw, ch - GROUND_Y)
      ctx.fillStyle = '#2a1d14'
      for (let x = 0; x < cw; x += 60) {
        ctx.fillRect(x, GROUND_Y, 1, ch - GROUND_Y)
      }
      ctx.fillStyle = '#4a3828'
      ctx.fillRect(0, GROUND_Y, cw, 3)

      // Particles
      for (const p of s.particles) {
        ctx.globalAlpha = p.life / 12
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4)
      }
      ctx.globalAlpha = 1

      // Projectiles
      for (const p of s.projectiles) drawProjectile(ctx, p, s.tick)

      // Fighters
      drawFighter(ctx, s.p1, s.tick)
      drawFighter(ctx, s.p2, s.tick)

      // ── HUD ──
      const hbW = 160, hbH = 14, hbY = 12
      // P1 health bar (left, fills right to left)
      ctx.fillStyle = '#222'
      ctx.fillRect(10, hbY, hbW, hbH)
      const p1W = (s.p1.health / HEALTH_MAX) * hbW
      const p1Grd = ctx.createLinearGradient(10, 0, 10 + hbW, 0)
      p1Grd.addColorStop(0, '#FFDD00')
      p1Grd.addColorStop(1, '#FF4400')
      ctx.fillStyle = p1Grd
      ctx.fillRect(10, hbY, p1W, hbH)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.strokeRect(10, hbY, hbW, hbH)

      // P2 health bar (right, fills left to right)
      ctx.fillStyle = '#222'
      ctx.fillRect(cw - 10 - hbW, hbY, hbW, hbH)
      const p2W = (s.p2.health / HEALTH_MAX) * hbW
      const p2Grd = ctx.createLinearGradient(cw - 10 - hbW, 0, cw - 10, 0)
      p2Grd.addColorStop(0, '#FF4400')
      p2Grd.addColorStop(1, '#FFDD00')
      ctx.fillStyle = p2Grd
      ctx.fillRect(cw - 10 - p2W, hbY, p2W, hbH)
      ctx.strokeStyle = '#fff'
      ctx.strokeRect(cw - 10 - hbW, hbY, hbW, hbH)

      // Names
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText('RYU', 12, hbY + hbH + 14)
      ctx.textAlign = 'right'
      ctx.fillText('AKUMA', cw - 12, hbY + hbH + 14)

      // Round indicators
      for (let i = 0; i < ROUNDS_TO_WIN; i++) {
        ctx.fillStyle = i < s.p1.roundsWon ? '#FFDD00' : '#333'
        ctx.beginPath()
        ctx.arc(14 + i * 16, hbY + hbH + 24, 5, 0, Math.PI * 2)
        ctx.fill()
      }
      for (let i = 0; i < ROUNDS_TO_WIN; i++) {
        ctx.fillStyle = i < s.p2.roundsWon ? '#FFDD00' : '#333'
        ctx.beginPath()
        ctx.arc(cw - 14 - i * 16, hbY + hbH + 24, 5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Timer
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 28px monospace'
      ctx.textAlign = 'center'
      const timerSec = Math.max(0, Math.ceil(s.roundTimer / 60))
      ctx.fillText(timerSec, cw / 2, hbY + 22)

      // Message
      if (s.messageTimer > 0 || (s.message && s.roundOver)) {
        ctx.fillStyle = s.ko ? '#FF0000' : '#FFD700'
        ctx.font = 'bold 36px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(s.message, cw / 2, ch / 2 - 30)
      }

      // Controls hint
      ctx.fillStyle = '#333'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('WASD move · F punch · G kick · H special · W+F uppercut', cw / 2, ch - 4)
    }

    const loop = () => { update(); draw(); raf = requestAnimationFrame(loop) }

    const onKey = (e) => {
      if (['w', 'a', 's', 'd', 'f', 'g', 'h'].includes(e.key)) e.preventDefault()
      keysRef.current[e.key] = e.type === 'keydown'
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
  }, [screen, initRound])

  const s = stateRef.current

  return (
    <div className="flex flex-col h-full" style={{ background: '#000' }}>
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {(screen === 'start' || screen === 'gameover') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2, background: 'rgba(0,0,0,0.85)' }}>
            <div className="text-center" style={{ fontFamily: 'monospace' }}>
              {screen === 'gameover' ? (
                <>
                  <div className="text-2xl font-bold mb-2" style={{ color: '#FFD700' }}>
                    {s && s.p1.roundsWon >= ROUNDS_TO_WIN ? 'YOU WIN!' : 'DEFEAT'}
                  </div>
                  <div className="text-sm mb-4" style={{ color: '#888' }}>
                    {s ? `${s.p1.roundsWon} - ${s.p2.roundsWon}` : ''}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold mb-1" style={{ color: '#FF4400' }}>STREET BRAWLER</div>
                  <div className="text-sm mb-2" style={{ color: '#FFD700' }}>RYU vs AKUMA</div>
                  <div className="text-xs mb-1" style={{ color: '#666' }}>WASD — move/jump/crouch</div>
                  <div className="text-xs mb-1" style={{ color: '#666' }}>F — punch &middot; G — kick &middot; H — energy blast</div>
                  <div className="text-xs mb-4" style={{ color: '#666' }}>W+F — uppercut &middot; Hold back — block</div>
                </>
              )}
              <button
                onClick={startGame}
                className="px-5 py-2 text-sm font-bold cursor-pointer border-none rounded"
                style={{ background: '#FF4400', color: '#fff', fontFamily: 'monospace' }}
              >
                {screen === 'gameover' ? 'Rematch' : 'FIGHT'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
