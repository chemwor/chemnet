import { useState, useEffect } from 'react'
import { getTopScores, getMostActive, getGameStats, getLeaderboard, getPlayerName, setPlayerName } from '../../lib/highscores'

const GAME_NAMES = {
  asteroids: 'Asteroids',
  pacman: 'Pac-Man',
  spaceinvaders: 'Space Invaders',
  arkanoid: 'Arkanoid',
  solitaire: 'Solitaire',
  minesweeper: 'Minesweeper',
  tabletennis: 'Table Tennis',
  chess: 'Chess',
  fighter: "Rock'em Sock'em",
  tetris: 'Tetris',
  sudoku: 'Sudoku',
  doodlejump: 'Doodle Jump',
  fruitninja: 'Fruit Ninja',
  snake: 'Snake',
  '2048': '2048',
  flappybird: 'Flappy Bird',
}

const SCORE_GAMES = ['asteroids', 'pacman', 'spaceinvaders', 'arkanoid', 'solitaire', 'tetris', 'doodlejump', 'fruitninja', 'snake', '2048', 'flappybird']
const RECORD_GAMES = ['tabletennis', 'chess', 'fighter']

const PERIODS = [
  { id: null, label: 'All Time' },
  { id: 'year', label: 'This Year' },
  { id: 'month', label: 'This Month' },
  { id: 'day', label: 'Today' },
]

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 text-xs border-none cursor-pointer"
      style={{
        background: active ? '#000080' : '#c0c0c0',
        color: active ? '#fff' : '#000',
        fontFamily: 'Tahoma, Arial, sans-serif',
        borderTop: active ? '2px solid #fff' : '2px solid #808080',
        borderLeft: active ? '1px solid #fff' : '1px solid #808080',
        borderRight: active ? '1px solid #808080' : '1px solid #808080',
        borderBottom: active ? 'none' : '1px solid #808080',
        marginBottom: active ? -1 : 0,
      }}
    >
      {label}
    </button>
  )
}

function NamePrompt({ currentName, onSave }) {
  const [name, setName] = useState(currentName)
  return (
    <div className="flex items-center gap-2 px-3 py-2" style={{ background: '#ffffcc', borderBottom: '1px solid #cccc88', fontFamily: 'Tahoma, Arial, sans-serif', fontSize: 11 }}>
      <span>Your name for leaderboards:</span>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        maxLength={20}
        className="px-1 py-0.5 border outline-none"
        style={{ borderColor: '#999', fontSize: 11, fontFamily: 'inherit', width: 120 }}
      />
      <button
        onClick={() => { setPlayerName(name.trim()); onSave(name.trim()) }}
        className="px-2 py-0.5 text-xs cursor-pointer"
        style={{ background: '#c0c0c0', border: '2px outset #c0c0c0', fontFamily: 'inherit' }}
      >
        Save
      </button>
    </div>
  )
}

function LeaderboardView({ period }) {
  const [selectedGame, setSelectedGame] = useState('asteroids')
  const scores = getTopScores(selectedGame, period, 15)

  return (
    <div className="flex-1 overflow-auto">
      {/* Game selector */}
      <div className="flex flex-wrap gap-1 px-3 py-2" style={{ borderBottom: '1px solid #808080' }}>
        {SCORE_GAMES.map(id => (
          <button
            key={id}
            onClick={() => setSelectedGame(id)}
            className="px-2 py-0.5 text-xs cursor-pointer border-none"
            style={{
              background: selectedGame === id ? '#000080' : '#e0e0e0',
              color: selectedGame === id ? '#fff' : '#000',
              fontFamily: 'Tahoma, Arial, sans-serif',
            }}
          >
            {GAME_NAMES[id]}
          </button>
        ))}
      </div>

      {/* Scores table */}
      <div className="px-3 py-1">
        <div className="font-bold text-xs mb-2" style={{ color: '#000080', fontFamily: 'Tahoma, Arial, sans-serif' }}>
          🏆 {GAME_NAMES[selectedGame]} — Top Scores
        </div>

        {scores.length === 0 ? (
          <div className="text-xs py-4 text-center" style={{ color: '#888', fontFamily: 'Tahoma, Arial, sans-serif' }}>
            No scores yet. Go play some games!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Tahoma, Arial, sans-serif', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#d4d0c8', borderBottom: '1px solid #808080' }}>
                <th style={{ textAlign: 'left', padding: '2px 6px', width: 25 }}>#</th>
                <th style={{ textAlign: 'left', padding: '2px 6px' }}>Player</th>
                <th style={{ textAlign: 'right', padding: '2px 6px', width: 70 }}>Score</th>
                <th style={{ textAlign: 'right', padding: '2px 6px', width: 80 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i === 0 ? '#fffff0' : 'transparent' }}>
                  <td style={{ padding: '2px 6px', color: i < 3 ? '#FFD700' : '#888' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </td>
                  <td style={{ padding: '2px 6px', fontWeight: i === 0 ? 'bold' : 'normal' }}>{s.name}</td>
                  <td style={{ padding: '2px 6px', textAlign: 'right', fontWeight: 'bold', color: '#000080' }}>{s.value.toLocaleString()}</td>
                  <td style={{ padding: '2px 6px', textAlign: 'right', color: '#888' }}>{formatDate(s.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function GamesOverview({ period }) {
  const stats = getGameStats(period)
  const allGames = [...SCORE_GAMES, ...RECORD_GAMES]

  return (
    <div className="flex-1 overflow-auto px-3 py-2">
      <div className="font-bold text-xs mb-2" style={{ color: '#000080', fontFamily: 'Tahoma, Arial, sans-serif' }}>
        📊 All Games Overview
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Tahoma, Arial, sans-serif', fontSize: 11 }}>
        <thead>
          <tr style={{ background: '#d4d0c8', borderBottom: '1px solid #808080' }}>
            <th style={{ textAlign: 'left', padding: '2px 6px' }}>Game</th>
            <th style={{ textAlign: 'right', padding: '2px 6px', width: 50 }}>Plays</th>
            <th style={{ textAlign: 'right', padding: '2px 6px', width: 70 }}>Top Score</th>
            <th style={{ textAlign: 'left', padding: '2px 6px', width: 90 }}>Top Player</th>
          </tr>
        </thead>
        <tbody>
          {allGames.map(id => {
            const s = stats[id] || { plays: 0, topScore: 0, topPlayer: '—' }
            return (
              <tr key={id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '3px 6px' }}>{GAME_NAMES[id]}</td>
                <td style={{ padding: '3px 6px', textAlign: 'right' }}>{s.plays}</td>
                <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 'bold', color: s.topScore > 0 ? '#000080' : '#ccc' }}>
                  {s.topScore > 0 ? s.topScore.toLocaleString() : '—'}
                </td>
                <td style={{ padding: '3px 6px', color: s.topPlayer ? '#333' : '#ccc' }}>
                  {s.topPlayer || '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PlayersView({ period }) {
  const active = getMostActive(period, 20)
  const allEntries = getLeaderboard(null, period)

  // Per-player game breakdown
  const playerGames = {}
  for (const e of allEntries) {
    if (!playerGames[e.name]) playerGames[e.name] = {}
    playerGames[e.name][e.gameId] = (playerGames[e.name][e.gameId] || 0) + 1
  }

  return (
    <div className="flex-1 overflow-auto px-3 py-2">
      <div className="font-bold text-xs mb-2" style={{ color: '#000080', fontFamily: 'Tahoma, Arial, sans-serif' }}>
        👾 Most Active Players
      </div>

      {active.length === 0 ? (
        <div className="text-xs py-4 text-center" style={{ color: '#888', fontFamily: 'Tahoma, Arial, sans-serif' }}>
          No activity yet. Play some games to see stats!
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Tahoma, Arial, sans-serif', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#d4d0c8', borderBottom: '1px solid #808080' }}>
              <th style={{ textAlign: 'left', padding: '2px 6px', width: 25 }}>#</th>
              <th style={{ textAlign: 'left', padding: '2px 6px' }}>Player</th>
              <th style={{ textAlign: 'right', padding: '2px 6px', width: 60 }}>Games</th>
              <th style={{ textAlign: 'left', padding: '2px 6px' }}>Favorite</th>
            </tr>
          </thead>
          <tbody>
            {active.map((p, i) => {
              const games = playerGames[p.name] || {}
              const favorite = Object.entries(games).sort((a, b) => b[1] - a[1])[0]
              return (
                <tr key={i} style={{ borderBottom: '1px solid #e0e0e0', background: i === 0 ? '#fffff0' : 'transparent' }}>
                  <td style={{ padding: '2px 6px', color: '#888' }}>{i + 1}.</td>
                  <td style={{ padding: '2px 6px', fontWeight: i === 0 ? 'bold' : 'normal' }}>{p.name}</td>
                  <td style={{ padding: '2px 6px', textAlign: 'right', fontWeight: 'bold' }}>{p.games}</td>
                  <td style={{ padding: '2px 6px', color: '#666' }}>
                    {favorite ? `${GAME_NAMES[favorite[0]] || favorite[0]} (${favorite[1]})` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

function RecentActivity({ period }) {
  const entries = getLeaderboard(null, period).slice(-30).reverse()

  const describeEntry = (e) => {
    const game = GAME_NAMES[e.gameId] || e.gameId
    if (e.type === 'score') return `scored ${e.value.toLocaleString()} in ${game}`
    if (e.type === 'win') return `won at ${game}`
    if (e.type === 'loss') return `lost at ${game}`
    if (e.type === 'draw') return `drew at ${game}`
    if (e.type === 'time') return `cleared ${game} in ${e.value}s`
    return `played ${game}`
  }

  return (
    <div className="flex-1 overflow-auto px-3 py-2">
      <div className="font-bold text-xs mb-2" style={{ color: '#000080', fontFamily: 'Tahoma, Arial, sans-serif' }}>
        📋 Recent Activity
      </div>

      {entries.length === 0 ? (
        <div className="text-xs py-4 text-center" style={{ color: '#888', fontFamily: 'Tahoma, Arial, sans-serif' }}>
          No activity yet.
        </div>
      ) : (
        entries.map((e, i) => (
          <div key={i} className="flex items-center gap-2 py-1 text-xs" style={{ borderBottom: '1px solid #f0f0f0', fontFamily: 'Tahoma, Arial, sans-serif' }}>
            <span style={{ color: e.type === 'win' ? '#008000' : e.type === 'loss' ? '#c00' : e.type === 'score' ? '#000080' : '#666' }}>
              {e.type === 'win' ? '✅' : e.type === 'loss' ? '❌' : e.type === 'score' ? '🏆' : e.type === 'draw' ? '🤝' : '🎮'}
            </span>
            <span style={{ fontWeight: 'bold' }}>{e.name}</span>
            <span style={{ color: '#666' }}>{describeEntry(e)}</span>
            <span className="ml-auto" style={{ color: '#aaa', fontSize: 9 }}>{formatDate(e.date)}</span>
          </div>
        ))
      )}
    </div>
  )
}

export default function Stats() {
  const [tab, setTab] = useState('leaderboard')
  const [period, setPeriod] = useState(null)
  const [playerName, setName] = useState(getPlayerName())

  return (
    <div className="flex flex-col h-full" style={{ background: '#fff', fontFamily: 'Tahoma, Arial, sans-serif' }}>
      {/* Name prompt */}
      {!playerName && (
        <NamePrompt currentName="" onSave={setName} />
      )}

      {/* Header */}
      <div className="px-3 py-1.5 shrink-0" style={{ background: '#000080', color: '#fff' }}>
        <div className="font-bold text-sm">🏆 ChemNet Scoreboard</div>
        {playerName && <div className="text-xs" style={{ color: '#aaa' }}>Playing as: {playerName}</div>}
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-1 px-3 py-1 shrink-0" style={{ background: '#e8e8e8', borderBottom: '1px solid #ccc' }}>
        <span className="text-xs mr-1" style={{ color: '#666' }}>Period:</span>
        {PERIODS.map(p => (
          <button
            key={p.label}
            onClick={() => setPeriod(p.id)}
            className="px-2 py-0.5 text-xs cursor-pointer border-none"
            style={{
              background: period === p.id ? '#000080' : 'transparent',
              color: period === p.id ? '#fff' : '#333',
              fontFamily: 'inherit',
              borderRadius: 2,
            }}
          >
            {p.label}
          </button>
        ))}
        {playerName && (
          <button
            onClick={() => {
              const newName = prompt('Change your name:', playerName)
              if (newName?.trim()) { setPlayerName(newName.trim()); setName(newName.trim()) }
            }}
            className="ml-auto px-2 py-0.5 text-xs cursor-pointer border-none underline"
            style={{ color: '#666', fontFamily: 'inherit', background: 'transparent' }}
          >
            Change Name
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex px-2 pt-1 shrink-0" style={{ background: '#d4d0c8' }}>
        <Tab label="🏆 Leaderboard" active={tab === 'leaderboard'} onClick={() => setTab('leaderboard')} />
        <Tab label="📊 Games" active={tab === 'games'} onClick={() => setTab('games')} />
        <Tab label="👾 Players" active={tab === 'players'} onClick={() => setTab('players')} />
        <Tab label="📋 Activity" active={tab === 'activity'} onClick={() => setTab('activity')} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0, border: '1px solid #808080' }}>
        {tab === 'leaderboard' && <LeaderboardView period={period} />}
        {tab === 'games' && <GamesOverview period={period} />}
        {tab === 'players' && <PlayersView period={period} />}
        {tab === 'activity' && <RecentActivity period={period} />}
      </div>

      {/* Status */}
      <div className="px-2 py-0.5 text-xs shrink-0" style={{ background: '#d4d0c8', borderTop: '1px solid #808080', color: '#666' }}>
        All scores stored locally in your browser
      </div>
    </div>
  )
}
