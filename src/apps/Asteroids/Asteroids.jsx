import { useEffect, useRef, useState, useCallback } from 'react'

const SHIP_SIZE = 14
const TURN_SPEED = 0.07
const THRUST = 0.12
const FRICTION = 0.99
const BULLET_SPEED = 7
const BULLET_LIFE = 50
const MAX_BULLETS = 6
const ASTEROID_SPEED = 1.2
const ASTEROID_SIZES = { large: 30, medium: 16, small: 8 }
const ASTEROID_POINTS = { large: 20, medium: 50, small: 100 }
const INVULN_TIME = 120 // frames of invulnerability after respawn

function randomAsteroid(w, h, size, avoidX, avoidY) {
  let x, y
  do {
    x = Math.random() * w
    y = Math.random() * h
  } while (avoidX !== undefined && Math.hypot(x - avoidX, y - avoidY) < 120)

  const angle = Math.random() * Math.PI * 2
  const speed = (0.5 + Math.random()) * ASTEROID_SPEED
  const r = ASTEROID_SIZES[size]

  // Generate jagged polygon
  const verts = []
  const numVerts = 8 + Math.floor(Math.random() * 5)
  for (let i = 0; i < numVerts; i++) {
    const a = (i / numVerts) * Math.PI * 2
    const jag = r * (0.7 + Math.random() * 0.5)
    verts.push({ x: Math.cos(a) * jag, y: Math.sin(a) * jag })
  }

  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r, size, verts,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.03,
  }
}

function wrap(val, max) {
  if (val < -50) return max + 50
  if (val > max + 50) return -50
  return val
}

export default function Asteroids() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const keysRef = useRef({})
  const [hud, setHud] = useState({ score: 0, lives: 3 })
  const [screen, setScreen] = useState('start') // start | playing | gameover

  const initState = useCallback((canvas, keepScore) => {
    const w = canvas.width
    const h = canvas.height
    const asteroids = []
    for (let i = 0; i < 5; i++) {
      asteroids.push(randomAsteroid(w, h, 'large', w / 2, h / 2))
    }
    return {
      w, h,
      ship: { x: w / 2, y: h / 2, angle: -Math.PI / 2, vx: 0, vy: 0, invuln: INVULN_TIME },
      bullets: [],
      asteroids,
      particles: [],
      score: keepScore ? stateRef.current?.score ?? 0 : 0,
      lives: keepScore ? stateRef.current?.lives ?? 3 : 3,
      level: keepScore ? (stateRef.current?.level ?? 1) + 1 : 1,
    }
  }, [])

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight
    stateRef.current = initState(canvas, false)
    setScreen('playing')
    setHud({ score: 0, lives: 3 })
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
      const { w, h, ship, bullets, asteroids, particles } = s

      // Ship rotation
      if (keysRef.current['ArrowLeft'] || keysRef.current['a']) ship.angle -= TURN_SPEED
      if (keysRef.current['ArrowRight'] || keysRef.current['d']) ship.angle += TURN_SPEED

      // Thrust
      if (keysRef.current['ArrowUp'] || keysRef.current['w']) {
        ship.vx += Math.cos(ship.angle) * THRUST
        ship.vy += Math.sin(ship.angle) * THRUST
        // Thrust particles
        if (Math.random() > 0.3) {
          const spread = (Math.random() - 0.5) * 0.5
          particles.push({
            x: ship.x - Math.cos(ship.angle) * SHIP_SIZE,
            y: ship.y - Math.sin(ship.angle) * SHIP_SIZE,
            vx: -Math.cos(ship.angle + spread) * (1 + Math.random() * 2),
            vy: -Math.sin(ship.angle + spread) * (1 + Math.random() * 2),
            life: 15 + Math.random() * 10,
            maxLife: 25,
          })
        }
      }

      // Friction
      ship.vx *= FRICTION
      ship.vy *= FRICTION
      ship.x = wrap(ship.x + ship.vx, w)
      ship.y = wrap(ship.y + ship.vy, h)
      if (ship.invuln > 0) ship.invuln--

      // Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]
        b.x = wrap(b.x + b.vx, w)
        b.y = wrap(b.y + b.vy, h)
        b.life--
        if (b.life <= 0) bullets.splice(i, 1)
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life--
        if (p.life <= 0) particles.splice(i, 1)
      }

      // Asteroid rotation & movement
      for (const a of asteroids) {
        a.x = wrap(a.x + a.vx, w)
        a.y = wrap(a.y + a.vy, h)
        a.rot += a.rotSpeed
      }

      // Bullet–asteroid collision
      for (let bi = bullets.length - 1; bi >= 0; bi--) {
        const b = bullets[bi]
        for (let ai = asteroids.length - 1; ai >= 0; ai--) {
          const a = asteroids[ai]
          if (Math.hypot(b.x - a.x, b.y - a.y) < a.r) {
            bullets.splice(bi, 1)
            asteroids.splice(ai, 1)
            s.score += ASTEROID_POINTS[a.size]

            // Explosion particles
            for (let p = 0; p < 8; p++) {
              const ang = Math.random() * Math.PI * 2
              const spd = 1 + Math.random() * 2
              particles.push({
                x: a.x, y: a.y,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 20 + Math.random() * 15, maxLife: 35,
              })
            }

            // Split asteroid
            if (a.size === 'large') {
              asteroids.push(randomAsteroid(w, h, 'medium'))
              asteroids.push(randomAsteroid(w, h, 'medium'))
              asteroids[asteroids.length - 1].x = a.x + 10
              asteroids[asteroids.length - 1].y = a.y
              asteroids[asteroids.length - 2].x = a.x - 10
              asteroids[asteroids.length - 2].y = a.y
            } else if (a.size === 'medium') {
              asteroids.push(randomAsteroid(w, h, 'small'))
              asteroids.push(randomAsteroid(w, h, 'small'))
              asteroids[asteroids.length - 1].x = a.x + 5
              asteroids[asteroids.length - 1].y = a.y
              asteroids[asteroids.length - 2].x = a.x - 5
              asteroids[asteroids.length - 2].y = a.y
            }

            setHud({ score: s.score, lives: s.lives })
            break
          }
        }
      }

      // Ship–asteroid collision
      if (ship.invuln <= 0) {
        for (const a of asteroids) {
          if (Math.hypot(ship.x - a.x, ship.y - a.y) < a.r + SHIP_SIZE * 0.6) {
            s.lives--
            setHud({ score: s.score, lives: s.lives })

            // Death explosion
            for (let p = 0; p < 15; p++) {
              const ang = Math.random() * Math.PI * 2
              const spd = 1 + Math.random() * 3
              particles.push({
                x: ship.x, y: ship.y,
                vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
                life: 30 + Math.random() * 20, maxLife: 50,
              })
            }

            if (s.lives <= 0) {
              setScreen('gameover')
              return
            }

            // Respawn
            ship.x = w / 2
            ship.y = h / 2
            ship.vx = 0
            ship.vy = 0
            ship.invuln = INVULN_TIME
            break
          }
        }
      }

      // Next level
      if (asteroids.length === 0) {
        const count = 4 + s.level
        for (let i = 0; i < count; i++) {
          asteroids.push(randomAsteroid(w, h, 'large', ship.x, ship.y))
        }
        s.level++
      }
    }

    const drawShip = (ctx, ship) => {
      if (ship.invuln > 0 && Math.floor(ship.invuln / 4) % 2 === 0) return

      ctx.save()
      ctx.translate(ship.x, ship.y)
      ctx.rotate(ship.angle)

      ctx.strokeStyle = '#F0EBE1'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(SHIP_SIZE, 0)
      ctx.lineTo(-SHIP_SIZE * 0.7, -SHIP_SIZE * 0.6)
      ctx.lineTo(-SHIP_SIZE * 0.4, 0)
      ctx.lineTo(-SHIP_SIZE * 0.7, SHIP_SIZE * 0.6)
      ctx.closePath()
      ctx.stroke()

      ctx.restore()
    }

    const draw = () => {
      const s = stateRef.current
      const cw = canvas.width
      const ch = canvas.height

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, cw, ch)

      if (!s) return

      // Particles
      for (const p of s.particles) {
        const alpha = p.life / (p.maxLife || 25)
        ctx.fillStyle = `rgba(255, 107, 53, ${alpha})`
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2)
      }

      // Asteroids
      ctx.strokeStyle = '#F0EBE1'
      ctx.lineWidth = 1.2
      for (const a of s.asteroids) {
        ctx.save()
        ctx.translate(a.x, a.y)
        ctx.rotate(a.rot)
        ctx.beginPath()
        ctx.moveTo(a.verts[0].x, a.verts[0].y)
        for (let i = 1; i < a.verts.length; i++) {
          ctx.lineTo(a.verts[i].x, a.verts[i].y)
        }
        ctx.closePath()
        ctx.stroke()
        ctx.restore()
      }

      // Bullets
      ctx.fillStyle = '#FF6B35'
      ctx.shadowColor = '#FF6B35'
      ctx.shadowBlur = 6
      for (const b of s.bullets) {
        ctx.fillRect(b.x - 1.5, b.y - 1.5, 3, 3)
      }
      ctx.shadowBlur = 0

      // Ship
      if (screen === 'playing') {
        drawShip(ctx, s.ship)
      }

      // HUD — drawn on canvas so it never gets clipped
      if (screen === 'playing') {
        // Score — top left
        ctx.fillStyle = '#F0EBE1'
        ctx.font = 'bold 20px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(s.score, 14, 28)

        // Level indicator
        ctx.font = '12px monospace'
        ctx.fillStyle = '#666'
        ctx.fillText(`LEVEL ${s.level}`, 14, 44)

        // Lives — small ship icons top right
        ctx.strokeStyle = '#F0EBE1'
        ctx.lineWidth = 1.2
        for (let i = 0; i < s.lives; i++) {
          const lx = cw - 24 - i * 22
          const ly = 22
          ctx.save()
          ctx.translate(lx, ly)
          ctx.rotate(-Math.PI / 2) // point up
          ctx.beginPath()
          ctx.moveTo(10, 0)
          ctx.lineTo(-7, -5)
          ctx.lineTo(-4, 0)
          ctx.lineTo(-7, 5)
          ctx.closePath()
          ctx.stroke()
          ctx.restore()
        }
      }
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

      // Shoot on space keydown
      if (e.type === 'keydown' && e.key === ' ' && stateRef.current && screen === 'playing') {
        const s = stateRef.current
        if (s.bullets.length < MAX_BULLETS) {
          s.bullets.push({
            x: s.ship.x + Math.cos(s.ship.angle) * SHIP_SIZE,
            y: s.ship.y + Math.sin(s.ship.angle) * SHIP_SIZE,
            vx: Math.cos(s.ship.angle) * BULLET_SPEED + s.ship.vx * 0.5,
            vy: Math.sin(s.ship.angle) * BULLET_SPEED + s.ship.vy * 0.5,
            life: BULLET_LIFE,
          })
        }
      }
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
                  <div className="text-xl font-bold mb-1" style={{ color: '#FF6B35' }}>
                    GAME OVER
                  </div>
                  <div className="text-sm mb-4" style={{ color: '#666' }}>
                    Score: {hud.score}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold mb-1" style={{ color: '#F0EBE1' }}>
                    ASTEROIDS
                  </div>
                  <div className="text-xs mb-4" style={{ color: '#666' }}>
                    ← → rotate &middot; ↑ thrust &middot; SPACE shoot
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
