// ── High Score Tracker — localStorage-based ──

const STORAGE_KEY = 'chemnet_highscores'

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
}

function load() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return { ...DEFAULT_SCORES }
    return { ...DEFAULT_SCORES, ...JSON.parse(data) }
  } catch {
    return { ...DEFAULT_SCORES }
  }
}

function save(scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
  } catch {}
}

export function getScores() {
  return load()
}

export function getGameScore(gameId) {
  const scores = load()
  return scores[gameId] || {}
}

export function submitScore(gameId, score) {
  const scores = load()
  if (!scores[gameId]) scores[gameId] = {}
  const g = scores[gameId]
  g.games = (g.games || 0) + 1
  if (score > (g.highScore || 0)) {
    g.highScore = score
    save(scores)
    return true // new high score
  }
  save(scores)
  return false
}

export function submitWin(gameId) {
  const scores = load()
  if (!scores[gameId]) scores[gameId] = {}
  scores[gameId].wins = (scores[gameId].wins || 0) + 1
  scores[gameId].games = (scores[gameId].games || 0) + 1
  save(scores)
}

export function submitLoss(gameId) {
  const scores = load()
  if (!scores[gameId]) scores[gameId] = {}
  scores[gameId].losses = (scores[gameId].losses || 0) + 1
  scores[gameId].games = (scores[gameId].games || 0) + 1
  save(scores)
}

export function submitDraw(gameId) {
  const scores = load()
  if (!scores[gameId]) scores[gameId] = {}
  scores[gameId].draws = (scores[gameId].draws || 0) + 1
  scores[gameId].games = (scores[gameId].games || 0) + 1
  save(scores)
}

export function submitTime(gameId, seconds) {
  const scores = load()
  if (!scores[gameId]) scores[gameId] = {}
  const g = scores[gameId]
  g.games = (g.games || 0) + 1
  g.wins = (g.wins || 0) + 1
  if (g.bestTime === null || seconds < g.bestTime) {
    g.bestTime = seconds
    save(scores)
    return true // new best time
  }
  save(scores)
  return false
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
  return isNew
}

export function resetScores() {
  save({ ...DEFAULT_SCORES })
}
