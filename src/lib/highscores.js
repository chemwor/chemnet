// ── High Score Tracker — localStorage-based with leaderboard ──

const STORAGE_KEY = 'chemnet_highscores'
const LEADERBOARD_KEY = 'chemnet_leaderboard'
const PLAYER_KEY = 'chemnet_player'
const MAX_ENTRIES = 50

// ── Personal scores (backward compatible) ──
const DEFAULT_SCORES = {
  asteroids:     { highScore: 0, games: 0 },
  pacman:        { highScore: 0, games: 0 },
  spaceinvaders: { highScore: 0, games: 0 },
  arkanoid:      { highScore: 0, games: 0 },
  solitaire:     { highScore: 0, bestMoves: null, wins: 0, games: 0 },
  minesweeper:   { bestTime: null, wins: 0, games: 0 },
  pong:          { wins: 0, losses: 0, games: 0 },
  chess:         { wins: 0, losses: 0, draws: 0, games: 0 },
  fighter:       { wins: 0, losses: 0, games: 0 },
  tabletennis:   { wins: 0, losses: 0, games: 0 },
  snake:         { highScore: 0, games: 0 },
  '2048':        { highScore: 0, games: 0 },
  flappybird:    { highScore: 0, games: 0 },
}

function load() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return { ...DEFAULT_SCORES }
    return { ...DEFAULT_SCORES, ...JSON.parse(data) }
  } catch { return { ...DEFAULT_SCORES } }
}

function save(scores) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(scores)) } catch {}
}

// ── Leaderboard (all entries with names) ──
function loadLeaderboard() {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

function saveLeaderboard(entries) {
  try { localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES * 10))) } catch {}
}

// ── Player name ──
export function getPlayerName() {
  try { return localStorage.getItem(PLAYER_KEY) || '' } catch { return '' }
}

export function setPlayerName(name) {
  try { localStorage.setItem(PLAYER_KEY, name) } catch {}
}

// ── Personal score getters ──
export function getScores() { return load() }
export function getGameScore(gameId) { return load()[gameId] || {} }

// ── Submit functions (update personal + leaderboard) ──
function addLeaderboardEntry(gameId, type, value, name) {
  const entries = loadLeaderboard()
  entries.push({
    gameId,
    type, // 'score', 'win', 'loss', 'draw', 'time'
    value,
    name: name || getPlayerName() || 'Anonymous',
    date: new Date().toISOString(),
  })
  saveLeaderboard(entries)
}

export function submitScore(gameId, score) {
  const scores = load()
  if (!scores[gameId]) scores[gameId] = {}
  const g = scores[gameId]
  g.games = (g.games || 0) + 1
  const isNew = score > (g.highScore || 0)
  if (isNew) g.highScore = score
  save(scores)
  addLeaderboardEntry(gameId, 'score', score)
  return isNew
}

export function submitWin(gameId) {
  const scores = load()
  if (!scores[gameId]) scores[gameId] = {}
  scores[gameId].wins = (scores[gameId].wins || 0) + 1
  scores[gameId].games = (scores[gameId].games || 0) + 1
  save(scores)
  addLeaderboardEntry(gameId, 'win', 1)
}

export function submitLoss(gameId) {
  const scores = load()
  if (!scores[gameId]) scores[gameId] = {}
  scores[gameId].losses = (scores[gameId].losses || 0) + 1
  scores[gameId].games = (scores[gameId].games || 0) + 1
  save(scores)
  addLeaderboardEntry(gameId, 'loss', 0)
}

export function submitDraw(gameId) {
  const scores = load()
  if (!scores[gameId]) scores[gameId] = {}
  scores[gameId].draws = (scores[gameId].draws || 0) + 1
  scores[gameId].games = (scores[gameId].games || 0) + 1
  save(scores)
  addLeaderboardEntry(gameId, 'draw', 0)
}

export function submitTime(gameId, seconds) {
  const scores = load()
  if (!scores[gameId]) scores[gameId] = {}
  const g = scores[gameId]
  g.games = (g.games || 0) + 1
  g.wins = (g.wins || 0) + 1
  const isNew = g.bestTime === null || seconds < g.bestTime
  if (isNew) g.bestTime = seconds
  save(scores)
  addLeaderboardEntry(gameId, 'time', seconds)
  return isNew
}

export function submitSolitaire(score, moves) {
  const scores = load()
  if (!scores.solitaire) scores.solitaire = {}
  const g = scores.solitaire
  g.games = (g.games || 0) + 1
  g.wins = (g.wins || 0) + 1
  let isNew = false
  if (score > (g.highScore || 0)) { g.highScore = score; isNew = true }
  if (g.bestMoves === null || moves < g.bestMoves) { g.bestMoves = moves; isNew = true }
  save(scores)
  addLeaderboardEntry('solitaire', 'score', score)
  return isNew
}

// ── Leaderboard queries ──
export function getLeaderboard(gameId, period) {
  const entries = loadLeaderboard()
  let filtered = gameId ? entries.filter(e => e.gameId === gameId) : entries

  if (period) {
    const now = new Date()
    const cutoff = new Date()
    if (period === 'day') cutoff.setDate(now.getDate() - 1)
    else if (period === 'month') cutoff.setMonth(now.getMonth() - 1)
    else if (period === 'year') cutoff.setFullYear(now.getFullYear() - 1)
    filtered = filtered.filter(e => new Date(e.date) >= cutoff)
  }

  return filtered
}

export function getTopScores(gameId, period, limit = 10) {
  const entries = getLeaderboard(gameId, period)
  return entries
    .filter(e => e.type === 'score')
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

export function getMostActive(period, limit = 10) {
  const entries = getLeaderboard(null, period)
  const counts = {}
  for (const e of entries) {
    counts[e.name] = (counts[e.name] || 0) + 1
  }
  return Object.entries(counts)
    .map(([name, games]) => ({ name, games }))
    .sort((a, b) => b.games - a.games)
    .slice(0, limit)
}

export function getGameStats(period) {
  const entries = getLeaderboard(null, period)
  const stats = {}
  for (const e of entries) {
    if (!stats[e.gameId]) stats[e.gameId] = { plays: 0, topScore: 0, topPlayer: '' }
    stats[e.gameId].plays++
    if (e.type === 'score' && e.value > stats[e.gameId].topScore) {
      stats[e.gameId].topScore = e.value
      stats[e.gameId].topPlayer = e.name
    }
  }
  return stats
}

export function resetScores() {
  save({ ...DEFAULT_SCORES })
  saveLeaderboard([])
}
