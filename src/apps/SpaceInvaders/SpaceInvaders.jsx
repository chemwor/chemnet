import { useEffect, useRef, useState, useCallback } from 'react'
import { submitScore, getGameScore } from '../../lib/highscores'

const PLAYER_W = 30
const PLAYER_H = 16
const PLAYER_SPEED = 4
const BULLET_SPEED = 6
const ENEMY_BULLET_SPEED = 3
const INVADER_ROWS = 5
const INVADER_COLS = 11
const INVADER_W = 24
const INVADER_H = 18
const INVADER_PAD_X = 12
const INVADER_PAD_Y = 10
const INVADER_DROP = 14
const SHIELD_COUNT = 4

const INVADER_TYPES = [
  { row: 0, points: 30, shape: 'squid' },
  { row: 1, points: 20, shape: 'crab' },
  { row: 2, points: 20, shape: 'crab' },
  { row: 3, points: 10, shape: 'octopus' },
  { row: 4, points: 10, shape: 'octopus' },
]

function drawInvader(ctx, x, y, type, frame) {
  ctx.save()
  ctx.translate(x, y)
  const f = frame % 2

  if (type === 'squid') {
    ctx.fillStyle = '#FF6B35'
    // Body
    ctx.fillRect(-6, -6, 12, 8)
    ctx.fillRect(-8, -2, 16, 4)
    // Eyes
    ctx.fillRect(-4, -4, 3, 3)
    ctx.fillRect(1, -4, 3, 3)
    // Legs
    if (f === 0) {
      ctx.fillRect(-8, 2, 3, 4)
      ctx.fillRect(5, 2, 3, 4)
      ctx.fillRect(-3, 2, 2, 6)
      ctx.fillRect(1, 2, 2, 6)
    } else {
      ctx.fillRect(-10, 0, 3, 4)
      ctx.fillRect(7, 0, 3, 4)
      ctx.fillRect(-4, 2, 2, 4)
      ctx.fillRect(2, 2, 2, 4)
    }
  } else if (type === 'crab') {
    ctx.fillStyle = '#F0EBE1'
    ctx.fillRect(-8, -4, 16, 8)
    ctx.fillRect(-10, -2, 20, 4)
    // Eyes
    ctx.fillStyle = '#000'
    ctx.fillRect(-5, -2, 3, 3)
    ctx.fillRect(2, -2, 3, 3)
    ctx.fillStyle = '#F0EBE1'
    // Arms
    if (f === 0) {
      ctx.fillRect(-12, -6, 3, 4)
      ctx.fillRect(9, -6, 3, 4)
    } else {
      ctx.fillRect(-12, 2, 3, 4)
      ctx.fillRect(9, 2, 3, 4)
    }
    // Legs
    ctx.fillRect(-6, 4, 2, 3)
    ctx.fillRect(4, 4, 2, 3)
  } else {
    // octopus
    ctx.fillStyle = '#A09AB0'
    ctx.fillRect(-6, -6, 12, 10)
    ctx.fillRect(-8, -4, 16, 6)
    // Eyes
    ctx.fillStyle = '#000'
    ctx.fillRect(-4, -3, 3, 3)
    ctx.fillRect(1, -3, 3, 3)
    ctx.fillStyle = '#A09AB0'
    // Tentacles
    if (f === 0) {
      ctx.fillRect(-8, 4, 2, 4)
      ctx.fillRect(-4, 4, 2, 3)
      ctx.fillRect(0, 4, 2, 4)
      ctx.fillRect(4, 4, 2, 3)
      ctx.fillRect(6, 4, 2, 4)
    } else {
      ctx.fillRect(-8, 4, 2, 3)
      ctx.fillRect(-4, 4, 2, 4)
      ctx.fillRect(0, 4, 2, 3)
      ctx.fillRect(4, 4, 2, 4)
      ctx.fillRect(6, 4, 2, 3)
    }
  }
  ctx.restore()
}

function drawUFO(ctx, x, y) {
  ctx.fillStyle = '#FF0000'
  ctx.beginPath()
  ctx.ellipse(x, y, 14, 6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FF4444'
  ctx.beginPath()
  ctx.ellipse(x, y - 4, 8, 4, 0, Math.PI, 0)
  ctx.fill()
  // Lights
  ctx.fillStyle = '#FFD700'
  ctx.fillRect(x - 8, y - 1, 2, 2)
  ctx.fillRect(x - 2, y - 1, 2, 2)
  ctx.fillRect(x + 4, y - 1, 2, 2)
}

function createShields(canvasW, canvasH) {
  const shields = []
  const shieldW = 36
  const shieldH = 24
  const y = canvasH - 80
  const totalW = SHIELD_COUNT * shieldW + (SHIELD_COUNT - 1) * 40
  const startX = (canvasW - totalW) / 2

  for (let i = 0; i < SHIELD_COUNT; i++) {
    const x = startX + i * (shieldW + 40)
    // Each shield is a grid of small blocks
    const blocks = []
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 12; c++) {
        // Cut out the arch at the bottom center
        if (r >= 5 && c >= 4 && c <= 7) continue
        blocks.push({ x: x + c * 3, y: y + r * 3, alive: true })
      }
    }
    shields.push(blocks)
  }
  return shields
}

function createInvaders(canvasW) {
  const invaders = []
  const gridW = INVADER_COLS * (INVADER_W + INVADER_PAD_X)
  const startX = (canvasW - gridW) / 2 + INVADER_W / 2
  const startY = 60

  for (let r = 0; r < INVADER_ROWS; r++) {
    for (let c = 0; c < INVADER_COLS; c++) {
      invaders.push({
        x: startX + c * (INVADER_W + INVADER_PAD_X),
        y: startY + r * (INVADER_H + INVADER_PAD_Y),
        alive: true,
        type: INVADER_TYPES[r].shape,
        points: INVADER_TYPES[r].points,
      })
    }
  }
  return invaders
}

export default function SpaceInvaders() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const keysRef = useRef({})
  const [hud, setHud] = useState({ score: 0, lives: 3 })
  const [screen, setScreen] = useState('start')

  const initState = useCallback((canvas) => {
    const w = canvas.width
    const h = canvas.height
    return {
      w, h,
      player: { x: w / 2, y: h - 30 },
      bullets: [],
      enemyBullets: [],
      invaders: createInvaders(w),
      shields: createShields(w, h),
      invaderDir: 1,
      invaderSpeed: 1,
      moveTimer: 0,
      moveInterval: 45,
      animFrame: 0,
      score: 0,
      lives: 3,
      level: 1,
      shootCooldown: 0,
      enemyShootTimer: 0,
      particles: [],
      ufo: null,
      ufoTimer: 600 + Math.floor(Math.random() * 600),
    }
  }, [])

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight
    stateRef.current = initState(canvas)
    setHud({ score: 0, lives: 3 })
    setScreen('playing')
  }, [initState])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight

    let raf

    const update = () => {
      const s = stateRef.current
      if (!s || screen !== 'playing') return

      // Player movement
      if (keysRef.current['ArrowLeft'] || keysRef.current['a']) {
        s.player.x = Math.max(PLAYER_W / 2, s.player.x - PLAYER_SPEED)
      }
      if (keysRef.current['ArrowRight'] || keysRef.current['d']) {
        s.player.x = Math.min(s.w - PLAYER_W / 2, s.player.x + PLAYER_SPEED)
      }

      // Shoot
      if (s.shootCooldown > 0) s.shootCooldown--
      if ((keysRef.current[' '] || keysRef.current['ArrowUp'] || keysRef.current['w']) && s.shootCooldown === 0 && s.bullets.length < 2) {
        s.bullets.push({ x: s.player.x, y: s.player.y - PLAYER_H / 2 })
        s.shootCooldown = 20
      }

      // Player bullets
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        s.bullets[i].y -= BULLET_SPEED
        if (s.bullets[i].y < 0) s.bullets.splice(i, 1)
      }

      // Enemy bullets
      for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
        s.enemyBullets[i].y += ENEMY_BULLET_SPEED
        if (s.enemyBullets[i].y > s.h) s.enemyBullets.splice(i, 1)
      }

      // Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life--
        if (p.life <= 0) s.particles.splice(i, 1)
      }

      // Invader movement
      s.moveTimer++
      if (s.moveTimer >= s.moveInterval) {
        s.moveTimer = 0
        s.animFrame++

        // Find bounds of alive invaders
        let minX = s.w, maxX = 0
        for (const inv of s.invaders) {
          if (!inv.alive) continue
          minX = Math.min(minX, inv.x)
          maxX = Math.max(maxX, inv.x)
        }

        let drop = false
        if (s.invaderDir > 0 && maxX + INVADER_W / 2 + s.invaderSpeed >= s.w - 10) {
          drop = true
        } else if (s.invaderDir < 0 && minX - INVADER_W / 2 - s.invaderSpeed <= 10) {
          drop = true
        }

        if (drop) {
          s.invaderDir *= -1
          for (const inv of s.invaders) {
            if (inv.alive) inv.y += INVADER_DROP
          }
        } else {
          for (const inv of s.invaders) {
            if (inv.alive) inv.x += s.invaderDir * s.invaderSpeed * 6
          }
        }
      }

      // Enemy shooting
      s.enemyShootTimer++
      if (s.enemyShootTimer >= 60) {
        s.enemyShootTimer = 0
        // Find bottom-most invader in a random column
        const aliveCols = new Map()
        for (const inv of s.invaders) {
          if (!inv.alive) continue
          const col = Math.round(inv.x / (INVADER_W + INVADER_PAD_X))
          if (!aliveCols.has(col) || inv.y > aliveCols.get(col).y) {
            aliveCols.set(col, inv)
          }
        }
        const shooters = [...aliveCols.values()]
        if (shooters.length > 0) {
          const shooter = shooters[Math.floor(Math.random() * shooters.length)]
          s.enemyBullets.push({ x: shooter.x, y: shooter.y + INVADER_H / 2 })
        }
      }

      // UFO
      s.ufoTimer--
      if (s.ufoTimer <= 0 && !s.ufo) {
        s.ufo = { x: -20, y: 30, dir: 1 }
        s.ufoTimer = 800 + Math.floor(Math.random() * 800)
      }
      if (s.ufo) {
        s.ufo.x += s.ufo.dir * 2
        if (s.ufo.x > s.w + 20) s.ufo = null
      }

      // Bullet-invader collision
      for (let bi = s.bullets.length - 1; bi >= 0; bi--) {
        const b = s.bullets[bi]
        for (const inv of s.invaders) {
          if (!inv.alive) continue
          if (Math.abs(b.x - inv.x) < INVADER_W / 2 && Math.abs(b.y - inv.y) < INVADER_H / 2) {
            inv.alive = false
            s.bullets.splice(bi, 1)
            s.score += inv.points
            // Explosion particles
            for (let p = 0; p < 6; p++) {
              const ang = Math.random() * Math.PI * 2
              s.particles.push({
                x: inv.x, y: inv.y,
                vx: Math.cos(ang) * (1 + Math.random() * 2),
                vy: Math.sin(ang) * (1 + Math.random() * 2),
                life: 15 + Math.random() * 10,
                color: inv.type === 'squid' ? '#FF6B35' : inv.type === 'crab' ? '#F0EBE1' : '#A09AB0',
              })
            }
            // Speed up invaders
            const aliveCount = s.invaders.filter(i => i.alive).length
            s.moveInterval = Math.max(4, Math.floor(45 * (aliveCount / (INVADER_ROWS * INVADER_COLS))))
            setHud(prev => ({ ...prev, score: s.score }))
            break
          }
        }

        // Bullet-UFO collision
        if (b && s.ufo) {
          if (Math.abs(b.x - s.ufo.x) < 14 && Math.abs(b.y - s.ufo.y) < 8) {
            s.score += 100 + Math.floor(Math.random() * 200)
            for (let p = 0; p < 10; p++) {
              const ang = Math.random() * Math.PI * 2
              s.particles.push({
                x: s.ufo.x, y: s.ufo.y,
                vx: Math.cos(ang) * (1 + Math.random() * 3),
                vy: Math.sin(ang) * (1 + Math.random() * 3),
                life: 20 + Math.random() * 15, color: '#FF0000',
              })
            }
            s.ufo = null
            s.bullets.splice(bi, 1)
            setHud(prev => ({ ...prev, score: s.score }))
          }
        }
      }

      // Bullet-shield collision (player bullets)
      for (let bi = s.bullets.length - 1; bi >= 0; bi--) {
        const b = s.bullets[bi]
        let hit = false
        for (const shield of s.shields) {
          for (const block of shield) {
            if (!block.alive) continue
            if (Math.abs(b.x - block.x - 1.5) < 3 && Math.abs(b.y - block.y - 1.5) < 3) {
              block.alive = false
              s.bullets.splice(bi, 1)
              hit = true
              break
            }
          }
          if (hit) break
        }
      }

      // Enemy bullet-shield collision
      for (let bi = s.enemyBullets.length - 1; bi >= 0; bi--) {
        const b = s.enemyBullets[bi]
        let hit = false
        for (const shield of s.shields) {
          for (const block of shield) {
            if (!block.alive) continue
            if (Math.abs(b.x - block.x - 1.5) < 3 && Math.abs(b.y - block.y - 1.5) < 3) {
              block.alive = false
              s.enemyBullets.splice(bi, 1)
              hit = true
              break
            }
          }
          if (hit) break
        }
      }

      // Enemy bullet-player collision
      for (let bi = s.enemyBullets.length - 1; bi >= 0; bi--) {
        const b = s.enemyBullets[bi]
        if (Math.abs(b.x - s.player.x) < PLAYER_W / 2 && Math.abs(b.y - s.player.y) < PLAYER_H / 2) {
          s.enemyBullets.splice(bi, 1)
          s.lives--
          // Death particles
          for (let p = 0; p < 12; p++) {
            const ang = Math.random() * Math.PI * 2
            s.particles.push({
              x: s.player.x, y: s.player.y,
              vx: Math.cos(ang) * (1 + Math.random() * 3),
              vy: Math.sin(ang) * (1 + Math.random() * 3),
              life: 25 + Math.random() * 15, color: '#4ADE80',
            })
          }
          setHud(prev => ({ ...prev, lives: s.lives }))
          if (s.lives <= 0) {
            submitScore('spaceinvaders', s.score)
            setScreen('gameover')
            return
          }
          s.player.x = s.w / 2
        }
      }

      // Invaders reaching bottom
      for (const inv of s.invaders) {
        if (inv.alive && inv.y + INVADER_H / 2 >= s.player.y - PLAYER_H) {
          s.lives = 0
          submitScore('spaceinvaders', s.score)
          setHud(prev => ({ ...prev, lives: 0 }))
          setScreen('gameover')
          return
        }
      }

      // All invaders dead — next wave
      if (s.invaders.every(i => !i.alive)) {
        s.level++
        s.invaders = createInvaders(s.w)
        s.invaderDir = 1
        s.moveInterval = Math.max(10, 45 - s.level * 3)
        s.moveTimer = 0
        s.enemyBullets = []
        s.shields = createShields(s.w, s.h)
      }
    }

    const draw = () => {
      const s = stateRef.current
      const cw = canvas.width
      const ch = canvas.height

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, cw, ch)

      if (!s) return

      // Stars background
      ctx.fillStyle = '#222'
      for (let i = 0; i < 40; i++) {
        const sx = (i * 137 + 29) % cw
        const sy = (i * 97 + 13) % ch
        ctx.fillRect(sx, sy, 1, 1)
      }

      // Particles
      for (const p of s.particles) {
        const alpha = p.life / 30
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - 1, p.y - 1, 3, 3)
      }
      ctx.globalAlpha = 1

      // Shields
      ctx.fillStyle = '#4ADE80'
      for (const shield of s.shields) {
        for (const block of shield) {
          if (block.alive) {
            ctx.fillRect(block.x, block.y, 3, 3)
          }
        }
      }

      // Invaders
      for (const inv of s.invaders) {
        if (!inv.alive) continue
        drawInvader(ctx, inv.x, inv.y, inv.type, s.animFrame)
      }

      // UFO
      if (s.ufo) {
        drawUFO(ctx, s.ufo.x, s.ufo.y)
      }

      // Player
      ctx.fillStyle = '#4ADE80'
      // Ship body
      ctx.fillRect(s.player.x - PLAYER_W / 2, s.player.y - 4, PLAYER_W, 8)
      ctx.fillRect(s.player.x - PLAYER_W / 2 + 4, s.player.y - 8, PLAYER_W - 8, 4)
      ctx.fillRect(s.player.x - 2, s.player.y - PLAYER_H / 2, 4, 8)

      // Player bullets
      ctx.fillStyle = '#4ADE80'
      ctx.shadowColor = '#4ADE80'
      ctx.shadowBlur = 4
      for (const b of s.bullets) {
        ctx.fillRect(b.x - 1, b.y - 4, 2, 8)
      }
      ctx.shadowBlur = 0

      // Enemy bullets — zigzag style
      ctx.fillStyle = '#FF6B35'
      for (const b of s.enemyBullets) {
        ctx.fillRect(b.x - 1, b.y - 3, 2, 6)
        ctx.fillRect(b.x - 2, b.y - 1, 1, 2)
        ctx.fillRect(b.x + 1, b.y + 1, 1, 2)
      }

      // HUD
      ctx.fillStyle = '#F0EBE1'
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`SCORE`, 10, 16)
      ctx.fillStyle = '#4ADE80'
      ctx.fillText(`${s.score}`, 10, 32)

      ctx.fillStyle = '#F0EBE1'
      ctx.textAlign = 'center'
      ctx.fillText(`LEVEL ${s.level}`, cw / 2, 16)

      ctx.textAlign = 'right'
      ctx.fillText(`LIVES`, cw - 10, 16)

      // Lives as small player ships
      for (let i = 0; i < s.lives; i++) {
        const lx = cw - 16 - i * 22
        const ly = 30
        ctx.fillStyle = '#4ADE80'
        ctx.fillRect(lx - 8, ly - 2, 16, 4)
        ctx.fillRect(lx - 1, ly - 6, 2, 4)
      }

      // Ground line
      ctx.strokeStyle = '#4ADE80'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, ch - 10)
      ctx.lineTo(cw, ch - 10)
      ctx.stroke()
    }

    const loop = () => {
      update()
      draw()
      raf = requestAnimationFrame(loop)
    }

    const onKey = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
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
  }, [screen, initState])

  return (
    <div className="flex flex-col h-full" style={{ background: '#000' }}>
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {(screen === 'start' || screen === 'gameover') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2 }}>
            <div className="text-center" style={{ fontFamily: 'monospace' }}>
              {screen === 'gameover' ? (
                <>
                  <div className="text-xl font-bold mb-1" style={{ color: '#FF0000' }}>
                    GAME OVER
                  </div>
                  <div className="text-sm mb-1" style={{ color: '#4ADE80' }}>
                    Score: {hud.score}
                  </div>
                  <div className="text-xs mb-4" style={{ color: '#666' }}>
                    Hi-Score: {getGameScore('spaceinvaders').highScore || 0}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xl font-bold mb-1" style={{ color: '#F0EBE1' }}>
                    SPACE INVADERS
                  </div>
                  <div className="text-xs mb-1" style={{ color: '#FF6B35' }}>
                    ← → move &middot; SPACE shoot
                  </div>
                  <div className="text-xs mb-1" style={{ color: '#666' }}>
                    Hi-Score: {getGameScore('spaceinvaders').highScore || 0}
                  </div>
                  <div className="flex flex-col gap-1 items-center my-3 text-xs" style={{ color: '#888' }}>
                    <span><span style={{ color: '#FF6B35' }}>■</span> = 30 pts &nbsp; <span style={{ color: '#F0EBE1' }}>■</span> = 20 pts &nbsp; <span style={{ color: '#A09AB0' }}>■</span> = 10 pts</span>
                    <span><span style={{ color: '#FF0000' }}>●</span> = ??? pts</span>
                  </div>
                </>
              )}
              <button
                onClick={startGame}
                className="px-4 py-1.5 text-sm font-bold cursor-pointer border-none"
                style={{ background: '#4ADE80', color: '#000', fontFamily: 'monospace' }}
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
