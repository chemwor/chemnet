import { useState, useCallback, useEffect, useRef } from 'react'

// ── Difficulty presets ──
const PRESETS = {
  beginner:     { rows: 9,  cols: 9,  mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert:       { rows: 16, cols: 30, mines: 99 },
}

const NUMBER_COLORS = {
  1: '#0000FF', 2: '#008000', 3: '#FF0000', 4: '#000080',
  5: '#800000', 6: '#008080', 7: '#000000', 8: '#808080',
}

// ── Board generation ──
function createBoard(rows, cols, mines, firstR, firstC) {
  const board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false, revealed: false, flagged: false, adjacent: 0,
    }))
  )

  // Place mines avoiding first click and its neighbors
  const safe = new Set()
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      safe.add(`${firstR + dr},${firstC + dc}`)
    }
  }

  let placed = 0
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    if (!board[r][c].mine && !safe.has(`${r},${c}`)) {
      board[r][c].mine = true
      placed++
    }
  }

  // Calculate adjacency
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue
      let count = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) {
            count++
          }
        }
      }
      board[r][c].adjacent = count
    }
  }

  return board
}

function floodReveal(board, r, c, rows, cols) {
  const stack = [[r, c]]
  while (stack.length > 0) {
    const [cr, cc] = stack.pop()
    if (cr < 0 || cr >= rows || cc < 0 || cc >= cols) continue
    const cell = board[cr][cc]
    if (cell.revealed || cell.flagged || cell.mine) continue
    cell.revealed = true
    if (cell.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          stack.push([cr + dr, cc + dc])
        }
      }
    }
  }
}

function countRevealed(board) {
  let count = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell.revealed) count++
    }
  }
  return count
}

// ── Cell component ──
function Cell({ cell, onClick, onContextMenu, gameOver, cellSize }) {
  const base = {
    width: cellSize, height: cellSize,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: cellSize > 20 ? 13 : 10,
    fontWeight: 'bold',
    fontFamily: 'Arial, sans-serif',
    cursor: gameOver ? 'default' : 'pointer',
    userSelect: 'none',
    lineHeight: 1,
  }

  if (!cell.revealed) {
    return (
      <div
        onClick={onClick}
        onContextMenu={onContextMenu}
        style={{
          ...base,
          background: '#c0c0c0',
          borderTop: '2px solid #fff',
          borderLeft: '2px solid #fff',
          borderBottom: '2px solid #808080',
          borderRight: '2px solid #808080',
        }}
      >
        {cell.flagged ? '🚩' : ''}
      </div>
    )
  }

  if (cell.mine) {
    return (
      <div style={{
        ...base,
        background: cell.exploded ? '#ff0000' : '#c0c0c0',
        border: '1px solid #808080',
      }}>
        💣
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{
        ...base,
        background: '#c0c0c0',
        border: '1px solid #808080',
        color: NUMBER_COLORS[cell.adjacent] || '#000',
      }}
    >
      {cell.adjacent > 0 ? cell.adjacent : ''}
    </div>
  )
}

// ── Seven-segment display ──
function SegmentDisplay({ value }) {
  const str = String(Math.max(-99, Math.min(999, value))).padStart(3, ' ')
  return (
    <div style={{
      background: '#000',
      color: '#ff0000',
      fontFamily: '"Courier New", monospace',
      fontSize: 22,
      fontWeight: 'bold',
      padding: '2px 4px',
      minWidth: 46,
      textAlign: 'center',
      letterSpacing: 2,
      border: '1px inset #808080',
    }}>
      {str}
    </div>
  )
}

// ── Timer ──
function useTimer(running) {
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => Math.min(999, s + 1)), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const reset = useCallback(() => setSeconds(0), [])
  return { seconds, reset }
}

// ── Main ──
export default function Minesweeper() {
  const [difficulty, setDifficulty] = useState('beginner')
  const { rows, cols, mines } = PRESETS[difficulty]
  const [board, setBoard] = useState(null)
  const [status, setStatus] = useState('idle') // idle | playing | won | lost
  const [flagCount, setFlagCount] = useState(0)
  const { seconds, reset: resetTimer } = useTimer(status === 'playing')

  const cellSize = difficulty === 'expert' ? 20 : 24

  const newGame = useCallback((diff) => {
    if (diff) setDifficulty(diff)
    setBoard(null)
    setStatus('idle')
    setFlagCount(0)
    resetTimer()
  }, [resetTimer])

  const handleClick = useCallback((r, c) => {
    if (status === 'won' || status === 'lost') return

    setBoard(prev => {
      // First click — generate board
      let b = prev
      if (!b) {
        b = createBoard(rows, cols, mines, r, c)
        setStatus('playing')
      }

      const next = b.map(row => row.map(cell => ({ ...cell })))
      const cell = next[r][c]

      if (cell.flagged || cell.revealed) return next

      if (cell.mine) {
        // Game over — reveal all mines
        cell.revealed = true
        cell.exploded = true
        for (const row of next) {
          for (const cl of row) {
            if (cl.mine) cl.revealed = true
          }
        }
        setStatus('lost')
        return next
      }

      floodReveal(next, r, c, rows, cols)

      // Check win
      const revealed = countRevealed(next)
      if (revealed === rows * cols - mines) {
        setStatus('won')
        // Auto-flag remaining mines
        for (const row of next) {
          for (const cl of row) {
            if (cl.mine) cl.flagged = true
          }
        }
        setFlagCount(mines)
      }

      return next
    })
  }, [status, rows, cols, mines])

  const handleRightClick = useCallback((e, r, c) => {
    e.preventDefault()
    if (status === 'won' || status === 'lost') return
    if (!board) return

    setBoard(prev => {
      if (!prev) return prev
      const next = prev.map(row => row.map(cell => ({ ...cell })))
      const cell = next[r][c]
      if (cell.revealed) return prev

      cell.flagged = !cell.flagged
      setFlagCount(f => cell.flagged ? f + 1 : f - 1)
      return next
    })
  }, [status, board])

  // Chord click (click on revealed number to reveal neighbors if flags match)
  const handleChord = useCallback((r, c) => {
    if (status !== 'playing' || !board) return

    const cell = board[r][c]
    if (!cell.revealed || cell.adjacent === 0) return

    let flags = 0
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].flagged) {
          flags++
        }
      }
    }

    if (flags !== cell.adjacent) return

    // Reveal all unflagged neighbors
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          handleClick(nr, nc)
        }
      }
    }
  }, [status, board, rows, cols, handleClick])

  const face = status === 'won' ? '😎' : status === 'lost' ? '💀' : '🙂'

  return (
    <div className="flex flex-col h-full items-center" style={{ background: '#c0c0c0' }}>
      {/* Menu bar */}
      <div
        className="flex gap-3 w-full px-2 py-1 text-xs shrink-0"
        style={{
          borderBottom: '2px solid #808080',
          fontFamily: 'Tahoma, Arial, sans-serif',
          color: '#000',
        }}
      >
        {Object.keys(PRESETS).map(d => (
          <button
            key={d}
            onClick={() => newGame(d)}
            className="border-none bg-transparent cursor-pointer text-xs"
            style={{
              color: '#000',
              fontFamily: 'inherit',
              textDecoration: d === difficulty ? 'underline' : 'none',
              fontWeight: d === difficulty ? 'bold' : 'normal',
            }}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {/* Header: mine counter, face, timer */}
      <div
        className="flex items-center justify-between px-2 py-1.5 shrink-0"
        style={{
          width: cols * cellSize + 12,
          maxWidth: '100%',
          borderTop: '2px solid #808080',
          borderLeft: '2px solid #808080',
          borderBottom: '2px solid #fff',
          borderRight: '2px solid #fff',
          background: '#c0c0c0',
          marginTop: 4,
        }}
      >
        <SegmentDisplay value={mines - flagCount} />

        <button
          onClick={() => newGame()}
          className="border-none cursor-pointer"
          style={{
            fontSize: 22,
            lineHeight: 1,
            padding: '1px 3px',
            background: '#c0c0c0',
            borderTop: '2px solid #fff',
            borderLeft: '2px solid #fff',
            borderBottom: '2px solid #808080',
            borderRight: '2px solid #808080',
          }}
        >
          {face}
        </button>

        <SegmentDisplay value={seconds} />
      </div>

      {/* Board */}
      <div
        className="overflow-auto flex-1"
        style={{ padding: 4, minHeight: 0 }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
            borderTop: '3px solid #808080',
            borderLeft: '3px solid #808080',
            borderBottom: '3px solid #fff',
            borderRight: '3px solid #fff',
          }}
        >
          {(board || Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => ({
              mine: false, revealed: false, flagged: false, adjacent: 0,
            }))
          )).map((row, r) =>
            row.map((cell, c) => (
              <Cell
                key={`${r}-${c}`}
                cell={cell}
                cellSize={cellSize}
                gameOver={status === 'won' || status === 'lost'}
                onClick={() => {
                  if (cell.revealed && cell.adjacent > 0) {
                    handleChord(r, c)
                  } else {
                    handleClick(r, c)
                  }
                }}
                onContextMenu={(e) => handleRightClick(e, r, c)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
