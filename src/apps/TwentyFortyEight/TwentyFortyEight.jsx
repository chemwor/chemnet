import { useState, useCallback, useRef, useEffect } from 'react'
import { submitScore, getGameScore } from '../../lib/highscores'

const SIZE = 4

const TILE_COLORS = {
  2: { bg: '#eee4da', text: '#776e65' },
  4: { bg: '#ede0c8', text: '#776e65' },
  8: { bg: '#f2b179', text: '#f9f6f2' },
  16: { bg: '#f59563', text: '#f9f6f2' },
  32: { bg: '#f67c5f', text: '#f9f6f2' },
  64: { bg: '#f65e3b', text: '#f9f6f2' },
  128: { bg: '#edcf72', text: '#f9f6f2' },
  256: { bg: '#edcc61', text: '#f9f6f2' },
  512: { bg: '#edc850', text: '#f9f6f2' },
  1024: { bg: '#edc53f', text: '#f9f6f2' },
  2048: { bg: '#edc22e', text: '#f9f6f2' },
}

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
}

function addRandom(grid) {
  const empty = []
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c] === 0) empty.push([r, c])
  if (empty.length === 0) return grid
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  const newGrid = grid.map(row => [...row])
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4
  return newGrid
}

function slideRow(row) {
  const filtered = row.filter(v => v !== 0)
  const merged = []
  let points = 0
  let i = 0
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2)
      points += filtered[i] * 2
      i += 2
    } else {
      merged.push(filtered[i])
      i++
    }
  }
  while (merged.length < SIZE) merged.push(0)
  return { row: merged, points }
}

function move(grid, direction) {
  let newGrid = grid.map(row => [...row])
  let totalPoints = 0
  let moved = false

  if (direction === 'left') {
    for (let r = 0; r < SIZE; r++) {
      const { row, points } = slideRow(newGrid[r])
      if (row.some((v, i) => v !== newGrid[r][i])) moved = true
      newGrid[r] = row
      totalPoints += points
    }
  } else if (direction === 'right') {
    for (let r = 0; r < SIZE; r++) {
      const { row, points } = slideRow([...newGrid[r]].reverse())
      row.reverse()
      if (row.some((v, i) => v !== newGrid[r][i])) moved = true
      newGrid[r] = row
      totalPoints += points
    }
  } else if (direction === 'up') {
    for (let c = 0; c < SIZE; c++) {
      const col = newGrid.map(row => row[c])
      const { row, points } = slideRow(col)
      if (row.some((v, i) => v !== newGrid[i][c])) moved = true
      for (let r = 0; r < SIZE; r++) newGrid[r][c] = row[r]
      totalPoints += points
    }
  } else if (direction === 'down') {
    for (let c = 0; c < SIZE; c++) {
      const col = newGrid.map(row => row[c]).reverse()
      const { row, points } = slideRow(col)
      row.reverse()
      if (row.some((v, i) => v !== newGrid[i][c])) moved = true
      for (let r = 0; r < SIZE; r++) newGrid[r][c] = row[r]
      totalPoints += points
    }
  }

  return { grid: newGrid, points: totalPoints, moved }
}

function canMove(grid) {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true
      if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true
      if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true
    }
  return false
}

function hasWon(grid) {
  return grid.some(row => row.some(v => v >= 2048))
}

export default function TwentyFortyEight() {
  const [grid, setGrid] = useState(() => addRandom(addRandom(emptyGrid())))
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const touchStart = useRef(null)

  const handleMove = useCallback((direction) => {
    if (gameOver) return
    const result = move(grid, direction)
    if (!result.moved) return

    const newGrid = addRandom(result.grid)
    const newScore = score + result.points
    setGrid(newGrid)
    setScore(newScore)

    if (hasWon(newGrid) && !won) setWon(true)

    if (!canMove(newGrid)) {
      setGameOver(true)
      submitScore('2048', newScore)
    }
  }, [grid, score, gameOver, won])

  const newGame = useCallback(() => {
    setGrid(addRandom(addRandom(emptyGrid())))
    setScore(0)
    setGameOver(false)
    setWon(false)
  }, [])

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') { handleMove('left'); e.preventDefault() }
      if (e.key === 'ArrowRight' || e.key === 'd') { handleMove('right'); e.preventDefault() }
      if (e.key === 'ArrowUp' || e.key === 'w') { handleMove('up'); e.preventDefault() }
      if (e.key === 'ArrowDown' || e.key === 's') { handleMove('down'); e.preventDefault() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleMove])

  // Touch swipe
  const handleTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return
    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 0 ? 'right' : 'left')
    } else {
      handleMove(dy > 0 ? 'down' : 'up')
    }
  }

  const cellSize = 68
  const gap = 8
  const boardSize = SIZE * cellSize + (SIZE + 1) * gap

  return (
    <div
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#faf8ef', fontFamily: '-apple-system, Arial, sans-serif' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3" style={{ width: boardSize }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#776e65' }}>2048</div>
        </div>
        <div className="flex gap-2">
          <div className="text-center px-3 py-1 rounded" style={{ background: '#bbada0', color: '#fff', minWidth: 60 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase' }}>Score</div>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{score}</div>
          </div>
          <div className="text-center px-3 py-1 rounded" style={{ background: '#bbada0', color: '#fff', minWidth: 60 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase' }}>Best</div>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{getGameScore('2048').highScore || 0}</div>
          </div>
        </div>
      </div>

      {/* Controls hint + new game */}
      <div className="flex items-center justify-between mb-2" style={{ width: boardSize }}>
        <span style={{ fontSize: 10, color: '#999' }}>Swipe or arrow keys</span>
        <button
          onClick={newGame}
          className="px-3 py-1 text-xs font-bold border-none cursor-pointer rounded"
          style={{ background: '#8f7a66', color: '#f9f6f2' }}
        >
          New Game
        </button>
      </div>

      {/* Board */}
      <div
        className="relative"
        style={{
          width: boardSize,
          height: boardSize,
          background: '#bbada0',
          borderRadius: 6,
          padding: gap,
        }}
      >
        {/* Empty cells */}
        {Array.from({ length: SIZE * SIZE }, (_, i) => {
          const r = Math.floor(i / SIZE), c = i % SIZE
          return (
            <div
              key={`empty-${i}`}
              style={{
                position: 'absolute',
                left: gap + c * (cellSize + gap),
                top: gap + r * (cellSize + gap),
                width: cellSize,
                height: cellSize,
                background: 'rgba(238,228,218,0.35)',
                borderRadius: 3,
              }}
            />
          )
        })}

        {/* Tiles */}
        {grid.map((row, r) =>
          row.map((val, c) => {
            if (val === 0) return null
            const colors = TILE_COLORS[val] || { bg: '#3c3a32', text: '#f9f6f2' }
            const fontSize = val >= 1024 ? 18 : val >= 128 ? 22 : val >= 16 ? 26 : 30
            return (
              <div
                key={`${r}-${c}`}
                style={{
                  position: 'absolute',
                  left: gap + c * (cellSize + gap),
                  top: gap + r * (cellSize + gap),
                  width: cellSize,
                  height: cellSize,
                  background: colors.bg,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize,
                  fontWeight: 'bold',
                  color: colors.text,
                  transition: 'all 0.1s',
                }}
              >
                {val}
              </div>
            )
          })
        )}

        {/* Game over overlay */}
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center rounded" style={{ background: 'rgba(238,228,218,0.73)' }}>
            <div className="text-center">
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#776e65', marginBottom: 8 }}>Game Over!</div>
              <div style={{ fontSize: 14, color: '#776e65', marginBottom: 12 }}>Score: {score}</div>
              <button
                onClick={newGame}
                className="px-4 py-2 text-sm font-bold border-none cursor-pointer rounded"
                style={{ background: '#8f7a66', color: '#f9f6f2' }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Win overlay */}
        {won && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center rounded" style={{ background: 'rgba(237,194,46,0.5)' }}>
            <div className="text-center">
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f9f6f2', marginBottom: 8 }}>You Win!</div>
              <button
                onClick={() => setWon(false)}
                className="px-4 py-2 text-sm font-bold border-none cursor-pointer rounded"
                style={{ background: '#8f7a66', color: '#f9f6f2' }}
              >
                Keep Going
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
