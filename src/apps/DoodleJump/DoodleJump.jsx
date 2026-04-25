import { useEffect, useRef, useState, useCallback } from 'react'
import { submitScore, getGameScore } from '../../lib/highscores'
import GameOver from '../../lib/GameOver'

const PLAT_W = 60
const PLAT_H = 12
const PLAYER_W = 30
const PLAYER_H = 30
const JUMP_FORCE = -10
const GRAVITY = 0.35
const MOVE_SPEED = 4

export default function DoodleJump() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const [screen, setScreen] = useState('start')
  const [finalScore, setFinalScore] = useState(0)
  const keysRef = useRef({})
  const tiltRef = useRef(0)

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight
    const w = canvas.width, h = canvas.height

    // Generate initial platforms
    const platforms = []
    for (let i = 0; i < 8; i++) {
      platforms.push({
        x: Math.random() * (w - PLAT_W),
        y: h - 60 - i * (h / 8),
        type: i === 0 ? 'normal' : Math.random() < 0.15 ? 'breaking' : Math.random() < 0.1 ? 'moving' : 'normal',
        broken: false,
        dx: (Math.random() > 0.5 ? 1 : -1) * 1.5,
      })
    }

    stateRef.current = {
      w, h,
      player: { x: w / 2 - PLAYER_W / 2, y: h - 100, vy: JUMP_FORCE, facing: 1 },
      platforms,
      score: 0,
      maxHeight: 0,
      cameraY: 0,
    }
    setScreen('playing')
  }, [])

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
      const { w, h, player, platforms } = s

      // Movement — keyboard or tilt
      if (keysRef.current['ArrowLeft'] || keysRef.current['a']) { player.x -= MOVE_SPEED; player.facing = -1 }
      if (keysRef.current['ArrowRight'] || keysRef.current['d']) { player.x += MOVE_SPEED; player.facing = 1 }
      player.x += tiltRef.current * MOVE_SPEED * 0.5

      // Screen wrapping
      if (player.x + PLAYER_W < 0) player.x = w
      if (player.x > w) player.x = -PLAYER_W

      // Gravity
      player.vy += GRAVITY
      player.y += player.vy

      // Camera follows player upward
      const scrollThreshold = h * 0.4
      if (player.y < s.cameraY + scrollThreshold) {
        const diff = (s.cameraY + scrollThreshold) - player.y
        s.cameraY -= diff
        s.score = Math.max(s.score, Math.floor(-s.cameraY / 10))

        // Move platforms down and recycle ones that go off screen
        for (const p of platforms) {
          if (p.y - s.cameraY > h + 20) {
            p.x = Math.random() * (w - PLAT_W)
            p.y = s.cameraY - 20 - Math.random() * 40
            p.broken = false
            p.type = Math.random() < 0.2 ? 'breaking' : Math.random() < 0.1 ? 'moving' : 'normal'
            p.dx = (Math.random() > 0.5 ? 1 : -1) * 1.5
          }
        }
      }

      // Platform collision (only when falling)
      if (player.vy > 0) {
        for (const p of platforms) {
          if (p.broken) continue
          const py = p.y - s.cameraY
          const px = p.x
          if (
            player.x + PLAYER_W > px &&
            player.x < px + PLAT_W &&
            player.y + PLAYER_H >= py &&
            player.y + PLAYER_H <= py + PLAT_H + player.vy + 2
          ) {
            if (p.type === 'breaking') {
              p.broken = true
            } else {
              player.vy = JUMP_FORCE
              player.y = py - PLAYER_H
            }
          }
        }
      }

      // Moving platforms
      for (const p of platforms) {
        if (p.type === 'moving' && !p.broken) {
          p.x += p.dx
          if (p.x < 0 || p.x + PLAT_W > w) p.dx *= -1
        }
      }

      // Fall off screen — game over
      if (player.y - s.cameraY > h + 50) {
        submitScore('doodlejump', s.score)
        setFinalScore(s.score)
        setScreen('gameover')
      }
    }

    const draw = () => {
      const s = stateRef.current
      const w = canvas.width, h = canvas.height

      // Background — notebook paper
      ctx.fillStyle = '#F5F0E0'
      ctx.fillRect(0, 0, w, h)
      // Grid lines
      ctx.strokeStyle = '#E8E0D0'
      ctx.lineWidth = 0.5
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
      ctx.strokeStyle = '#D4A0A0'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(30, h); ctx.stroke()

      if (!s) return

      // Platforms
      for (const p of s.platforms) {
        if (p.broken) continue
        const py = p.y - s.cameraY
        if (py < -20 || py > h + 20) continue

        if (p.type === 'normal') {
          ctx.fillStyle = '#5CB85C'
        } else if (p.type === 'breaking') {
          ctx.fillStyle = '#D9534F'
        } else {
          ctx.fillStyle = '#5BC0DE'
        }
        ctx.fillRect(p.x, py, PLAT_W, PLAT_H)
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.fillRect(p.x, py, PLAT_W, PLAT_H / 3)
      }

      // Player (doodle character)
      const px = s.player.x
      const py = s.player.y
      ctx.save()
      ctx.translate(px + PLAYER_W / 2, py + PLAYER_H / 2)
      ctx.scale(s.player.facing, 1)

      // Body
      ctx.fillStyle = '#3A3'
      ctx.beginPath()
      ctx.ellipse(0, 2, 12, 13, 0, 0, Math.PI * 2)
      ctx.fill()

      // Eyes
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.ellipse(-4, -4, 5, 5, 0, 0, Math.PI * 2)
      ctx.ellipse(5, -4, 5, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(-3, -4, 2, 0, Math.PI * 2)
      ctx.arc(6, -4, 2, 0, Math.PI * 2)
      ctx.fill()

      // Nose/mouth
      ctx.fillStyle = '#2A2'
      ctx.beginPath()
      ctx.ellipse(8, 2, 4, 3, 0, 0, Math.PI * 2)
      ctx.fill()

      // Feet
      ctx.fillStyle = '#3A3'
      ctx.fillRect(-10, 12, 8, 4)
      ctx.fillRect(2, 12, 8, 4)

      ctx.restore()

      // Score
      ctx.fillStyle = '#333'
      ctx.font = 'bold 16px -apple-system, Arial, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(s.score, 8, 22)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#aaa'
      ctx.font = '10px monospace'
      ctx.fillText(`Hi: ${getGameScore('doodlejump').highScore || 0}`, w - 8, 16)
    }

    const loop = () => { update(); draw(); raf = requestAnimationFrame(loop) }

    const onKey = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) e.preventDefault()
      keysRef.current[e.key] = e.type === 'keydown'
    }

    // Device tilt for mobile
    const onTilt = (e) => {
      if (e.gamma !== null) tiltRef.current = Math.max(-1, Math.min(1, e.gamma / 30))
    }

    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    window.addEventListener('deviceorientation', onTilt)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
      window.removeEventListener('deviceorientation', onTilt)
    }
  }, [screen, startGame])

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#F5F0E0' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {screen === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(245,240,224,0.9)' }}>
          <div className="text-center" style={{ fontFamily: '-apple-system, Arial, sans-serif' }}>
            <div className="text-2xl font-bold mb-1" style={{ color: '#3A3' }}>Doodle Jump</div>
            <div className="text-xs mb-1" style={{ color: '#888' }}>Tilt phone or ← → to move</div>
            <div className="text-xs mb-3" style={{ color: '#aaa' }}>Best: {getGameScore('doodlejump').highScore || 0}</div>
            <button
              onClick={startGame}
              className="px-5 py-2 text-sm font-bold cursor-pointer border-none rounded"
              style={{ background: '#5CB85C', color: '#fff' }}
            >
              Start
            </button>
          </div>
        </div>
      )}

      {screen === 'gameover' && (
        <GameOver gameId="doodlejump" score={finalScore} onRestart={startGame} />
      )}
    </div>
  )
}
