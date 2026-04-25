import { useEffect, useRef, useState, useCallback } from 'react'
import { submitScore, getGameScore } from '../../lib/highscores'
import GameOver from '../../lib/GameOver'

const GRAVITY = 0.4
const FLAP = -6.5
const PIPE_GAP = 120
const PIPE_W = 44
const PIPE_SPEED = 2.2
const PIPE_INTERVAL = 100
const BIRD_SIZE = 20
const BIRD_X = 60

export default function FlappyBird() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const [screen, setScreen] = useState('start')
  const [finalScore, setFinalScore] = useState(0)

  const initGame = useCallback((canvas) => {
    return {
      w: canvas.width,
      h: canvas.height,
      bird: { y: canvas.height / 2, vy: 0, rotation: 0 },
      pipes: [],
      pipeTimer: 0,
      score: 0,
      tick: 0,
    }
  }, [])

  const startGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight
    stateRef.current = initGame(canvas)
    setScreen('playing')
  }, [initGame])

  const flap = useCallback(() => {
    if (screen === 'start') { startGame(); return }
    if (screen === 'gameover') return
    const s = stateRef.current
    if (s) s.bird.vy = FLAP
  }, [screen, startGame])

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

      s.tick++

      // Bird physics
      s.bird.vy += GRAVITY
      s.bird.y += s.bird.vy
      s.bird.rotation = Math.min(Math.max(s.bird.vy * 3, -30), 70)

      // Spawn pipes
      s.pipeTimer++
      if (s.pipeTimer >= PIPE_INTERVAL) {
        s.pipeTimer = 0
        const minTop = 50
        const maxTop = s.h - PIPE_GAP - 50
        const topH = minTop + Math.random() * (maxTop - minTop)
        s.pipes.push({
          x: s.w + 10,
          topH,
          scored: false,
        })
      }

      // Move pipes
      for (let i = s.pipes.length - 1; i >= 0; i--) {
        s.pipes[i].x -= PIPE_SPEED

        // Score
        if (!s.pipes[i].scored && s.pipes[i].x + PIPE_W < BIRD_X) {
          s.pipes[i].scored = true
          s.score++
        }

        // Remove off-screen
        if (s.pipes[i].x + PIPE_W < -10) s.pipes.splice(i, 1)
      }

      // Collision — ground/ceiling
      if (s.bird.y + BIRD_SIZE > s.h || s.bird.y < 0) {
        submitScore('flappybird', s.score)
        setFinalScore(s.score)
        setScreen('gameover')
        return
      }

      // Collision — pipes
      for (const pipe of s.pipes) {
        if (BIRD_X + BIRD_SIZE > pipe.x && BIRD_X < pipe.x + PIPE_W) {
          if (s.bird.y < pipe.topH || s.bird.y + BIRD_SIZE > pipe.topH + PIPE_GAP) {
            submitScore('flappybird', s.score)
            setFinalScore(s.score)
            setScreen('gameover')
            return
          }
        }
      }
    }

    const draw = () => {
      const s = stateRef.current
      const w = canvas.width, h = canvas.height

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h)
      sky.addColorStop(0, '#4EC0CA')
      sky.addColorStop(1, '#71C8D4')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)

      // Ground
      ctx.fillStyle = '#DED895'
      ctx.fillRect(0, h - 30, w, 30)
      ctx.fillStyle = '#D2C56C'
      ctx.fillRect(0, h - 30, w, 4)

      if (!s) return

      // Pipes
      for (const pipe of s.pipes) {
        // Top pipe
        const topGrd = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0)
        topGrd.addColorStop(0, '#73BF2E')
        topGrd.addColorStop(0.3, '#8ED53E')
        topGrd.addColorStop(1, '#5EA622')
        ctx.fillStyle = topGrd
        ctx.fillRect(pipe.x, 0, PIPE_W, pipe.topH)
        // Lip
        ctx.fillRect(pipe.x - 3, pipe.topH - 20, PIPE_W + 6, 20)
        ctx.strokeStyle = '#4A8A1C'
        ctx.lineWidth = 1
        ctx.strokeRect(pipe.x - 3, pipe.topH - 20, PIPE_W + 6, 20)

        // Bottom pipe
        const botY = pipe.topH + PIPE_GAP
        ctx.fillStyle = topGrd
        ctx.fillRect(pipe.x, botY, PIPE_W, h - botY - 30)
        // Lip
        ctx.fillRect(pipe.x - 3, botY, PIPE_W + 6, 20)
        ctx.strokeRect(pipe.x - 3, botY, PIPE_W + 6, 20)
      }

      // Bird
      ctx.save()
      ctx.translate(BIRD_X + BIRD_SIZE / 2, s.bird.y + BIRD_SIZE / 2)
      ctx.rotate((s.bird.rotation * Math.PI) / 180)

      // Body
      ctx.fillStyle = '#F5C842'
      ctx.beginPath()
      ctx.ellipse(0, 0, BIRD_SIZE / 2 + 2, BIRD_SIZE / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#D4A017'
      ctx.lineWidth = 1
      ctx.stroke()

      // Wing
      const wingY = Math.sin(s.tick * 0.3) * 3
      ctx.fillStyle = '#E8B830'
      ctx.beginPath()
      ctx.ellipse(-4, 2 + wingY, 8, 5, -0.3, 0, Math.PI * 2)
      ctx.fill()

      // Eye
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(5, -3, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(6, -3, 2, 0, Math.PI * 2)
      ctx.fill()

      // Beak
      ctx.fillStyle = '#E86A17'
      ctx.beginPath()
      ctx.moveTo(10, 0)
      ctx.lineTo(16, 2)
      ctx.lineTo(10, 4)
      ctx.closePath()
      ctx.fill()

      ctx.restore()

      // Score
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.font = 'bold 32px -apple-system, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.strokeText(s.score, w / 2, 50)
      ctx.fillText(s.score, w / 2, 50)
    }

    const loop = () => {
      update()
      draw()
      raf = requestAnimationFrame(loop)
    }

    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp') { flap(); e.preventDefault() }
    }

    window.addEventListener('keydown', onKey)
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey) }
  }, [screen, initGame, flap])

  return (
    <div
      style={{ position: 'absolute', inset: 0, background: '#4EC0CA' }}
      onClick={flap}
      onTouchStart={(e) => { e.preventDefault(); flap() }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {screen === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="text-center" style={{ fontFamily: '-apple-system, Arial, sans-serif' }}>
            <div className="text-3xl font-bold mb-2" style={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Flappy Bird</div>
            <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>Tap to flap</div>
            <div className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Best: {getGameScore('flappybird').highScore || 0}</div>
            <button
              onClick={(e) => { e.stopPropagation(); startGame() }}
              onTouchStart={(e) => { e.stopPropagation() }}
              className="px-5 py-2 text-sm font-bold cursor-pointer border-none rounded-full"
              style={{ background: '#F5C842', color: '#5A4008', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
            >
              Start
            </button>
          </div>
        </div>
      )}

      {screen === 'gameover' && (
        <GameOver gameId="flappybird" score={finalScore} onRestart={startGame} />
      )}
    </div>
  )
}
