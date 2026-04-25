import { useState, useEffect, useRef } from 'react'
import { getPlayerName, setPlayerName, getGameScore } from './highscores'
import { supabase } from './supabase'

// Shared game over overlay with name input and score save
// Usage: <GameOver gameId="asteroids" score={1234} onRestart={startGame} />
export default function GameOver({ gameId, score, onRestart, label }) {
  const [name, setName] = useState(() => getPlayerName() || '')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)
  const highScore = getGameScore(gameId).highScore || 0
  const isNewHigh = score >= highScore && score > 0

  useEffect(() => {
    // Focus the name input on mount
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  async function handleSave() {
    if (saving || saved) return
    const playerName = name.trim() || 'Anonymous'
    setSaving(true)

    // Save player name for next time
    setPlayerName(playerName)

    // Save to Supabase
    try {
      await supabase.from('high_scores').insert({
        game_id: gameId,
        player_name: playerName,
        score: score,
        type: 'score',
      })
    } catch {}

    setSaved(true)
    setSaving(false)
  }

  function handleKeyDown(e) {
    e.stopPropagation()
    if (e.key === 'Enter') {
      if (!saved) handleSave()
      else onRestart()
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 10, background: 'rgba(0,0,0,0.85)' }}>
      <div className="text-center" style={{ fontFamily: 'monospace', maxWidth: 280, width: '100%', padding: 16 }}>
        <div className="text-xl font-bold mb-1" style={{ color: '#FF6B35' }}>
          GAME OVER
        </div>

        {label && (
          <div className="text-xs mb-2" style={{ color: '#666' }}>{label}</div>
        )}

        <div className="text-lg font-bold mb-1" style={{ color: '#F0EBE1' }}>
          Score: {score.toLocaleString()}
        </div>

        {isNewHigh && (
          <div className="text-xs mb-1" style={{ color: '#4ADE80' }}>
            NEW HIGH SCORE!
          </div>
        )}

        <div className="text-xs mb-3" style={{ color: '#555' }}>
          Best: {Math.max(score, highScore).toLocaleString()}
        </div>

        {!saved ? (
          <>
            <div className="mb-2">
              <input
                ref={inputRef}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full px-2 py-1.5 text-sm border-none outline-none text-center"
                style={{ background: '#1a1a2a', color: '#F0EBE1', fontFamily: 'monospace', border: '1px solid #333' }}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-1.5 text-sm font-bold cursor-pointer border-none mb-2"
              style={{ background: '#4ADE80', color: '#000', fontFamily: 'monospace', opacity: saving ? 0.5 : 1 }}
            >
              {saving ? 'Saving...' : 'Save Score'}
            </button>
            <button
              onClick={onRestart}
              className="w-full px-4 py-1 text-xs cursor-pointer border-none"
              style={{ background: 'transparent', color: '#666', fontFamily: 'monospace' }}
            >
              Skip
            </button>
          </>
        ) : (
          <>
            <div className="text-xs mb-3" style={{ color: '#4ADE80' }}>
              Saved as {name.trim() || 'Anonymous'}!
            </div>
            <button
              onClick={onRestart}
              className="w-full px-4 py-1.5 text-sm font-bold cursor-pointer border-none"
              style={{ background: '#FF6B35', color: '#000', fontFamily: 'monospace' }}
            >
              Play Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
