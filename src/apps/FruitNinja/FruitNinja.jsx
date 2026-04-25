import { useEffect, useRef, useState, useCallback } from 'react'
import { submitScore, getGameScore } from '../../lib/highscores'
import GameOver from '../../lib/GameOver'

const FRUITS = [
  { emoji: '🍎', color: '#FF3333', points: 1 },
  { emoji: '🍊', color: '#FF8800', points: 1 },
  { emoji: '🍋', color: '#FFDD00', points: 1 },
  { emoji: '🍉', color: '#44CC44', points: 2 },
  { emoji: '🍇', color: '#8844CC', points: 2 },
  { emoji: '🍑', color: '#FFAA88', points: 1 },
  { emoji: '🥝', color: '#88AA44', points: 1 },
  { emoji: '🍍', color: '#CCAA00', points: 3 },
]

const BOMB = { emoji: '💣', color: '#333' }

export default function FruitNinja() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const [screen, setScreen] = useState('start')
  const [finalScore, setFinalScore] = useState(0)
  const sliceTrail = useRef([])

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight
    stateRef.current = {
      w: canvas.width, h: canvas.height,
      fruits: [], slices: [], particles: [],
      score: 0, lives: 3, combo: 0,
      spawnTimer: 0, spawnInterval: 50,
      tick: 0,
    }
    sliceTrail.current = []
    setScreen('playing')
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight

    let raf
    let isSlicing = false

    const spawnFruit = (s) => {
      const isBomb = Math.random() < 0.12
      const fruit = isBomb ? BOMB : FRUITS[Math.floor(Math.random() * FRUITS.length)]
      const x = 30 + Math.random() * (s.w - 60)
      s.fruits.push({
        x, y: s.h + 20,
        vx: (Math.random() - 0.5) * 3,
        vy: -(8 + Math.random() * 5),
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        ...fruit,
        isBomb,
        sliced: false,
        radius: 22,
      })
    }

    const checkSlice = (x, y, s) => {
      for (const f of s.fruits) {
        if (f.sliced) continue
        const dist = Math.hypot(x - f.x, y - f.y)
        if (dist < f.radius + 10) {
          f.sliced = true
          if (f.isBomb) {
            // Hit bomb — lose a life
            s.lives--
            s.combo = 0
            for (let i = 0; i < 12; i++) {
              const ang = Math.random() * Math.PI * 2
              s.particles.push({ x: f.x, y: f.y, vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5, life: 20, color: '#FF4400' })
            }
            if (s.lives <= 0) {
              submitScore('fruitninja', s.score)
              setFinalScore(s.score)
              setScreen('gameover')
            }
          } else {
            s.score += f.points
            s.combo++
            // Juice particles
            for (let i = 0; i < 8; i++) {
              const ang = Math.random() * Math.PI * 2
              s.particles.push({ x: f.x, y: f.y, vx: Math.cos(ang) * 4, vy: Math.sin(ang) * 4, life: 15, color: f.color })
            }
            // Combo text
            if (s.combo >= 3) {
              s.particles.push({ x: f.x, y: f.y - 20, vx: 0, vy: -1.5, life: 30, text: `${s.combo}x COMBO!`, color: '#FFD700' })
            }
          }
        }
      }
    }

    const update = () => {
      const s = stateRef.current
      if (!s || screen !== 'playing') return
      s.tick++

      // Spawn
      s.spawnTimer++
      if (s.spawnTimer >= s.spawnInterval) {
        s.spawnTimer = 0
        const count = 1 + Math.floor(s.score / 20)
        for (let i = 0; i < Math.min(count, 4); i++) spawnFruit(s)
        s.spawnInterval = Math.max(25, 50 - Math.floor(s.score / 10))
      }

      // Physics
      for (let i = s.fruits.length - 1; i >= 0; i--) {
        const f = s.fruits[i]
        f.x += f.vx
        f.vy += 0.25
        f.y += f.vy
        f.rotation += f.rotSpeed

        // Off screen — miss (lose combo, but not a life for missed fruit)
        if (f.y > s.h + 40) {
          if (!f.sliced && !f.isBomb) s.combo = 0
          s.fruits.splice(i, 1)
        }
      }

      // Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i]
        p.x += p.vx || 0; p.y += p.vy || 0
        if (!p.text) p.vy += 0.1
        p.life--
        if (p.life <= 0) s.particles.splice(i, 1)
      }

      // Decay slice trail
      sliceTrail.current = sliceTrail.current.filter(p => Date.now() - p.time < 150)
    }

    const draw = () => {
      const s = stateRef.current
      const w = canvas.width, h = canvas.height

      // Background — wood texture
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#2C1810')
      bg.addColorStop(0.5, '#3D261A')
      bg.addColorStop(1, '#2C1810')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Wood grain lines
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      ctx.lineWidth = 1
      for (let y = 0; y < h; y += 8) {
        ctx.beginPath()
        ctx.moveTo(0, y + Math.sin(y * 0.1) * 3)
        ctx.lineTo(w, y + Math.sin(y * 0.1 + 2) * 3)
        ctx.stroke()
      }

      if (!s) return

      // Slice trail
      if (sliceTrail.current.length > 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(sliceTrail.current[0].x, sliceTrail.current[0].y)
        for (let i = 1; i < sliceTrail.current.length; i++) {
          ctx.lineTo(sliceTrail.current[i].x, sliceTrail.current[i].y)
        }
        ctx.stroke()
      }

      // Fruits
      for (const f of s.fruits) {
        if (f.sliced) continue
        ctx.save()
        ctx.translate(f.x, f.y)
        ctx.rotate((f.rotation * Math.PI) / 180)
        ctx.font = '32px serif'
        ctx.textAlign = 'center'
        ctx.fillText(f.emoji, 0, 10)
        ctx.restore()
      }

      // Particles
      for (const p of s.particles) {
        if (p.text) {
          ctx.globalAlpha = p.life / 30
          ctx.fillStyle = p.color
          ctx.font = 'bold 14px -apple-system, Arial, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(p.text, p.x, p.y)
        } else {
          ctx.globalAlpha = p.life / 15
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1

      // HUD
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 24px -apple-system, Arial, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(s.score, 12, 32)

      // Lives
      ctx.textAlign = 'right'
      ctx.font = '18px serif'
      for (let i = 0; i < s.lives; i++) {
        ctx.fillText('❌', w - 10 - i * 26, 28)
      }
    }

    const loop = () => { update(); draw(); raf = requestAnimationFrame(loop) }

    // Mouse/touch slicing
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect()
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height),
      }
    }

    const onStart = (e) => {
      if (screen !== 'playing') return
      e.preventDefault()
      isSlicing = true
      const pos = getPos(e)
      sliceTrail.current = [{ ...pos, time: Date.now() }]
    }
    const onMove = (e) => {
      if (!isSlicing || screen !== 'playing') return
      e.preventDefault()
      const pos = getPos(e)
      sliceTrail.current.push({ ...pos, time: Date.now() })
      if (stateRef.current) checkSlice(pos.x, pos.y, stateRef.current)
    }
    const onEnd = () => { isSlicing = false }

    canvas.addEventListener('mousedown', onStart)
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseup', onEnd)
    canvas.addEventListener('touchstart', onStart, { passive: false })
    canvas.addEventListener('touchmove', onMove, { passive: false })
    canvas.addEventListener('touchend', onEnd)

    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('mousedown', onStart)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseup', onEnd)
      canvas.removeEventListener('touchstart', onStart)
      canvas.removeEventListener('touchmove', onMove)
      canvas.removeEventListener('touchend', onEnd)
    }
  }, [screen, startGame])

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#2C1810' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />

      {screen === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(44,24,16,0.9)' }}>
          <div className="text-center" style={{ fontFamily: '-apple-system, Arial, sans-serif' }}>
            <div className="text-3xl mb-1">🍉🔪</div>
            <div className="text-xl font-bold mb-1" style={{ color: '#fff' }}>Fruit Ninja</div>
            <div className="text-xs mb-1" style={{ color: '#aaa' }}>Swipe to slice · Avoid bombs</div>
            <div className="text-xs mb-3" style={{ color: '#666' }}>Best: {getGameScore('fruitninja').highScore || 0}</div>
            <button
              onClick={startGame}
              className="px-5 py-2 text-sm font-bold cursor-pointer border-none rounded"
              style={{ background: '#FF6B35', color: '#fff' }}
            >
              Start
            </button>
          </div>
        </div>
      )}

      {screen === 'gameover' && (
        <GameOver gameId="fruitninja" score={finalScore} onRestart={startGame} />
      )}
    </div>
  )
}
