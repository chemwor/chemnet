import { useEffect, useRef, useState, useCallback } from 'react'

// ── Map: 0=empty, 1=wall, 2=dot, 3=power pellet, 4=ghost house ──
const MAP_TEMPLATE = [
  '1111111111111111111',
  '1222222212222222221',
  '1311112212211111321',
  '1222222222222222221',
  '1221111211112211221',
  '1222222222222222221',
  '1221122111122112211',
  '1222122000221222211',
  '0002100044400012000',
  '1222122000221222211',
  '1221122111122112211',
  '1222222222222222221',
  '1221111211112211221',
  '1222222222222222221',
  '1311112212211111321',
  '1222222222222222221',
  '1111111111111111111',
]

const CELL = 22
const COLS = MAP_TEMPLATE[0].length
const ROWS = MAP_TEMPLATE.length
const W = COLS * CELL
const H = ROWS * CELL

const DIRS = {
  up:    { x: 0, y: -1 },
  down:  { x: 0, y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const GHOST_COLORS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852']

function parseMap() {
  return MAP_TEMPLATE.map(row => row.split('').map(Number))
}

function countDots(map) {
  let n = 0
  for (const row of map) for (const c of row) if (c === 2 || c === 3) n++
  return n
}

function findStart(map, val) {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (map[r][c] === val) return { x: c, y: r }
  return null
}

function canMove(map, x, y) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true // tunnel
  return map[y][x] !== 1
}

function wrapPos(x, y) {
  return {
    x: ((x % COLS) + COLS) % COLS,
    y: ((y % ROWS) + ROWS) % ROWS,
  }
}

function ghostAI(ghost, pacman, map) {
  const possible = []
  for (const [name, d] of Object.entries(DIRS)) {
    // Ghosts can't reverse
    if (d.x === -ghost.dir.x && d.y === -ghost.dir.y) continue
    const nx = ghost.x + d.x
    const ny = ghost.y + d.y
    if (canMove(map, ((nx % COLS) + COLS) % COLS, ((ny % ROWS) + ROWS) % ROWS)) {
      possible.push({ name, d, dist: Math.hypot(pacman.x - nx, pacman.y - ny) })
    }
  }
  if (possible.length === 0) {
    // Allow reverse if stuck
    for (const [name, d] of Object.entries(DIRS)) {
      const nx = ghost.x + d.x
      const ny = ghost.y + d.y
      if (canMove(map, ((nx % COLS) + COLS) % COLS, ((ny % ROWS) + ROWS) % ROWS)) {
        possible.push({ name, d, dist: Math.hypot(pacman.x - nx, pacman.y - ny) })
      }
    }
  }
  if (possible.length === 0) return ghost.dir

  if (ghost.scared) {
    // Run away — pick farthest
    possible.sort((a, b) => b.dist - a.dist)
  } else {
    // Chase — pick closest, with some randomness
    possible.sort((a, b) => a.dist - b.dist)
    if (possible.length > 1 && Math.random() < 0.3) {
      return possible[1].d
    }
  }
  return possible[0].d
}

export default function Pacman() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const keysRef = useRef({})
  const [hud, setHud] = useState({ score: 0, lives: 3 })
  const [screen, setScreen] = useState('start')

  const initState = useCallback(() => {
    const map = parseMap()
    const totalDots = countDots(map)

    // Find a good start for pacman (center bottom area)
    const pacman = { x: 9, y: 13, dir: DIRS.left, nextDir: null, mouthAngle: 0, mouthDir: 1 }

    const ghosts = GHOST_COLORS.map((color, i) => ({
      x: 8 + i, y: 8, dir: DIRS.up, color, scared: false, scaredTimer: 0,
      released: i === 0, releaseTimer: i * 120,
    }))

    return { map, pacman, ghosts, score: 0, lives: 3, totalDots, dotsEaten: 0, powerTimer: 0, tick: 0, moveTimer: 0, ghostMoveTimer: 0 }
  }, [])

  const startGame = useCallback(() => {
    stateRef.current = initState()
    setHud({ score: 0, lives: 3 })
    setScreen('playing')
  }, [initState])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = W
    canvas.height = H

    let raf

    const update = () => {
      const s = stateRef.current
      if (!s || screen !== 'playing') return
      s.tick++

      // Release ghosts over time
      for (const g of s.ghosts) {
        if (!g.released) {
          g.releaseTimer--
          if (g.releaseTimer <= 0) g.released = true
        }
      }

      // Pacman movement — every 12 frames
      s.moveTimer++
      if (s.moveTimer >= 12) {
        s.moveTimer = 0
        const p = s.pacman

        // Try next direction first
        if (p.nextDir) {
          const nx = p.x + p.nextDir.x
          const ny = p.y + p.nextDir.y
          const w = wrapPos(nx, ny)
          if (canMove(s.map, w.x, w.y)) {
            p.dir = p.nextDir
            p.nextDir = null
          }
        }

        const nx = p.x + p.dir.x
        const ny = p.y + p.dir.y
        const w = wrapPos(nx, ny)
        if (canMove(s.map, w.x, w.y)) {
          p.x = w.x
          p.y = w.y
        }

        // Eat dots
        const cell = s.map[p.y]?.[p.x]
        if (cell === 2) {
          s.map[p.y][p.x] = 0
          s.score += 10
          s.dotsEaten++
        } else if (cell === 3) {
          s.map[p.y][p.x] = 0
          s.score += 50
          s.dotsEaten++
          s.powerTimer = 300
          for (const g of s.ghosts) {
            g.scared = true
            g.scaredTimer = 300
          }
        }

        // Mouth animation
        p.mouthAngle += 0.15 * p.mouthDir
        if (p.mouthAngle > 0.35) p.mouthDir = -1
        if (p.mouthAngle < 0.05) p.mouthDir = 1
      }

      // Ghost movement — every 12 frames (18 when scared)
      s.ghostMoveTimer++
      if (s.ghostMoveTimer >= (s.powerTimer > 0 ? 18 : 12)) {
        s.ghostMoveTimer = 0
        for (const g of s.ghosts) {
          if (!g.released) continue
          g.dir = ghostAI(g, s.pacman, s.map)
          const nx = g.x + g.dir.x
          const ny = g.y + g.dir.y
          const w = wrapPos(nx, ny)
          if (canMove(s.map, w.x, w.y)) {
            g.x = w.x
            g.y = w.y
          }
        }
      }

      // Power pellet timer
      if (s.powerTimer > 0) {
        s.powerTimer--
        if (s.powerTimer === 0) {
          for (const g of s.ghosts) {
            g.scared = false
          }
        }
      }
      for (const g of s.ghosts) {
        if (g.scaredTimer > 0) {
          g.scaredTimer--
          if (g.scaredTimer === 0) g.scared = false
        }
      }

      // Collision with ghosts
      const p = s.pacman
      for (let i = 0; i < s.ghosts.length; i++) {
        const g = s.ghosts[i]
        if (!g.released) continue
        if (g.x === p.x && g.y === p.y) {
          if (g.scared) {
            // Eat ghost
            s.score += 200
            g.x = 8 + i
            g.y = 10
            g.scared = false
            g.scaredTimer = 0
            g.released = false
            g.releaseTimer = 60
          } else {
            // Lose life
            s.lives--
            setHud({ score: s.score, lives: s.lives })
            if (s.lives <= 0) {
              setScreen('gameover')
              return
            }
            // Reset positions
            p.x = 9
            p.y = 13
            p.dir = DIRS.left
            p.nextDir = null
            for (let j = 0; j < s.ghosts.length; j++) {
              s.ghosts[j].x = 8 + j
              s.ghosts[j].y = 8
              s.ghosts[j].scared = false
              s.ghosts[j].scaredTimer = 0
              s.ghosts[j].released = j === 0
              s.ghosts[j].releaseTimer = j * 120
            }
            s.powerTimer = 0
            return
          }
        }
      }

      // Win check
      if (s.dotsEaten >= s.totalDots) {
        s.score += 500
        // Reset level with new dots
        const newMap = parseMap()
        s.map = newMap
        s.dotsEaten = 0
        s.totalDots = countDots(newMap)
        p.x = 9
        p.y = 13
        p.dir = DIRS.left
        for (let j = 0; j < s.ghosts.length; j++) {
          s.ghosts[j].x = 8 + j
          s.ghosts[j].y = 8
          s.ghosts[j].released = j === 0
          s.ghosts[j].releaseTimer = j * 90
          s.ghosts[j].scared = false
        }
        s.powerTimer = 0
      }

      setHud({ score: s.score, lives: s.lives })
    }

    const draw = () => {
      const s = stateRef.current

      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      if (!s) return

      // Draw map
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const v = s.map[r][c]
          const cx = c * CELL + CELL / 2
          const cy = r * CELL + CELL / 2

          if (v === 1) {
            ctx.fillStyle = '#1a1a8a'
            ctx.fillRect(c * CELL, r * CELL, CELL, CELL)
            // Draw wall borders
            ctx.strokeStyle = '#3333cc'
            ctx.lineWidth = 1
            ctx.strokeRect(c * CELL + 0.5, r * CELL + 0.5, CELL - 1, CELL - 1)
          } else if (v === 2) {
            ctx.fillStyle = '#FFB8A0'
            ctx.beginPath()
            ctx.arc(cx, cy, 2, 0, Math.PI * 2)
            ctx.fill()
          } else if (v === 3) {
            ctx.fillStyle = '#FFB8A0'
            ctx.beginPath()
            ctx.arc(cx, cy, 5, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // Draw Pacman
      const p = s.pacman
      const pcx = p.x * CELL + CELL / 2
      const pcy = p.y * CELL + CELL / 2
      let angle = 0
      if (p.dir === DIRS.right) angle = 0
      else if (p.dir === DIRS.left) angle = Math.PI
      else if (p.dir === DIRS.up) angle = -Math.PI / 2
      else if (p.dir === DIRS.down) angle = Math.PI / 2

      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(pcx, pcy, CELL / 2 - 2, angle + p.mouthAngle, angle + Math.PI * 2 - p.mouthAngle)
      ctx.lineTo(pcx, pcy)
      ctx.closePath()
      ctx.fill()

      // Eye
      const eyeX = pcx + Math.cos(angle - 0.6) * 4
      const eyeY = pcy + Math.sin(angle - 0.6) * 4
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(eyeX, eyeY, 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Draw ghosts
      for (const g of s.ghosts) {
        if (!g.released && s.map[g.y]?.[g.x] === 4) continue // hide in house
        const gx = g.x * CELL + CELL / 2
        const gy = g.y * CELL + CELL / 2
        const r = CELL / 2 - 2

        const flashing = g.scared && g.scaredTimer < 80 && Math.floor(g.scaredTimer / 8) % 2
        ctx.fillStyle = g.scared ? (flashing ? '#fff' : '#2222ff') : g.color

        // Ghost body
        ctx.beginPath()
        ctx.arc(gx, gy - 2, r, Math.PI, 0)
        ctx.lineTo(gx + r, gy + r)
        // Wavy bottom
        const waves = 3
        for (let i = 0; i < waves; i++) {
          const wx = gx + r - (i * 2 * r) / waves - r / waves
          ctx.quadraticCurveTo(wx + r / waves, gy + r - 4, wx, gy + r)
        }
        ctx.closePath()
        ctx.fill()

        // Eyes
        if (!g.scared) {
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(gx - 3, gy - 3, 3, 0, Math.PI * 2)
          ctx.arc(gx + 3, gy - 3, 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#00f'
          const edx = g.dir.x * 1.5
          const edy = g.dir.y * 1.5
          ctx.beginPath()
          ctx.arc(gx - 3 + edx, gy - 3 + edy, 1.5, 0, Math.PI * 2)
          ctx.arc(gx + 3 + edx, gy - 3 + edy, 1.5, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // Scared face
          ctx.fillStyle = g.scared && !flashing ? '#fff' : '#f00'
          ctx.beginPath()
          ctx.arc(gx - 3, gy - 3, 1.5, 0, Math.PI * 2)
          ctx.arc(gx + 3, gy - 3, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // HUD on canvas
      if (screen === 'playing') {
        ctx.fillStyle = '#F0EBE1'
        ctx.font = 'bold 11px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`SCORE: ${s.score}`, 4, H - 4)

        ctx.textAlign = 'right'
        // Lives as pacman icons
        for (let i = 0; i < s.lives; i++) {
          const lx = W - 10 - i * 18
          const ly = H - 8
          ctx.fillStyle = '#FFD700'
          ctx.beginPath()
          ctx.arc(lx, ly, 6, 0.25, Math.PI * 2 - 0.25)
          ctx.lineTo(lx, ly)
          ctx.closePath()
          ctx.fill()
        }
      }
    }

    const loop = () => {
      update()
      draw()
      raf = requestAnimationFrame(loop)
    }

    const onKey = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault()
      }

      if (e.type !== 'keydown' || !stateRef.current || screen !== 'playing') return

      const p = stateRef.current.pacman
      if (e.key === 'ArrowUp' || e.key === 'w') p.nextDir = DIRS.up
      else if (e.key === 'ArrowDown' || e.key === 's') p.nextDir = DIRS.down
      else if (e.key === 'ArrowLeft' || e.key === 'a') p.nextDir = DIRS.left
      else if (e.key === 'ArrowRight' || e.key === 'd') p.nextDir = DIRS.right
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
    <div className="flex flex-col h-full items-center justify-center" style={{ background: '#000' }}>
      <div className="relative" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} style={{ width: W, height: H }} />

        {(screen === 'start' || screen === 'gameover') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 2, background: 'rgba(0,0,0,0.75)' }}>
            <div className="text-center" style={{ fontFamily: 'monospace' }}>
              {screen === 'gameover' ? (
                <>
                  <div className="text-xl font-bold mb-1" style={{ color: '#FF0000' }}>
                    GAME OVER
                  </div>
                  <div className="text-sm mb-4" style={{ color: '#FFD700' }}>
                    Score: {hud.score}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold mb-1" style={{ color: '#FFD700' }}>
                    PAC-MAN
                  </div>
                  <div className="text-xs mb-4" style={{ color: '#888' }}>
                    Arrow keys or WASD to move
                  </div>
                </>
              )}
              <button
                onClick={startGame}
                className="px-4 py-1.5 text-sm font-bold cursor-pointer border-none"
                style={{ background: '#FFD700', color: '#000', fontFamily: 'monospace' }}
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
