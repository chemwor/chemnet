import { useState, useCallback } from 'react'

// ── Sudoku generator ──
function generateSolved() {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0))

  function isValid(grid, r, c, num) {
    for (let i = 0; i < 9; i++) {
      if (grid[r][i] === num || grid[i][c] === num) return false
    }
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3
    for (let dr = 0; dr < 3; dr++)
      for (let dc = 0; dc < 3; dc++)
        if (grid[br + dr][bc + dc] === num) return false
    return true
  }

  function solve(grid) {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] !== 0) continue
        const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5)
        for (const n of nums) {
          if (isValid(grid, r, c, n)) {
            grid[r][c] = n
            if (solve(grid)) return true
            grid[r][c] = 0
          }
        }
        return false
      }
    return true
  }

  solve(grid)
  return grid
}

function createPuzzle(difficulty) {
  const solved = generateSolved()
  const puzzle = solved.map(r => [...r])
  const remove = difficulty === 'easy' ? 35 : difficulty === 'medium' ? 45 : 55

  let removed = 0
  const cells = []
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) cells.push([r, c])
  cells.sort(() => Math.random() - 0.5)

  for (const [r, c] of cells) {
    if (removed >= remove) break
    puzzle[r][c] = 0
    removed++
  }

  return { puzzle, solved }
}

function checkComplete(grid, solved) {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (grid[r][c] !== solved[r][c]) return false
  return true
}

const DIFFICULTIES = ['easy', 'medium', 'hard']

export default function Sudoku() {
  const [difficulty, setDifficulty] = useState('easy')
  const [{ puzzle, solved }, setGame] = useState(() => createPuzzle('easy'))
  const [grid, setGrid] = useState(() => puzzle.map(r => [...r]))
  const [selected, setSelected] = useState(null) // [r, c]
  const [won, setWon] = useState(false)
  const [errors, setErrors] = useState(new Set())

  const isGiven = useCallback((r, c) => puzzle[r][c] !== 0, [puzzle])

  const newGame = useCallback((diff) => {
    const d = diff || difficulty
    setDifficulty(d)
    const g = createPuzzle(d)
    setGame(g)
    setGrid(g.puzzle.map(r => [...r]))
    setSelected(null)
    setWon(false)
    setErrors(new Set())
  }, [difficulty])

  const handleCellClick = (r, c) => {
    if (won) return
    setSelected([r, c])
  }

  const handleNumberInput = (num) => {
    if (!selected || won) return
    const [r, c] = selected
    if (isGiven(r, c)) return

    const newGrid = grid.map(row => [...row])
    newGrid[r][c] = num

    // Check for errors
    const newErrors = new Set()
    for (let row = 0; row < 9; row++)
      for (let col = 0; col < 9; col++) {
        if (newGrid[row][col] !== 0 && newGrid[row][col] !== solved[row][col]) {
          newErrors.add(`${row},${col}`)
        }
      }

    setGrid(newGrid)
    setErrors(newErrors)

    if (checkComplete(newGrid, solved)) setWon(true)
  }

  const handleClear = () => {
    if (!selected || won) return
    const [r, c] = selected
    if (isGiven(r, c)) return
    const newGrid = grid.map(row => [...row])
    newGrid[r][c] = 0
    setGrid(newGrid)
    errors.delete(`${r},${c}`)
    setErrors(new Set(errors))
  }

  const cellSize = 36

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#F5F0E8', fontFamily: '-apple-system, Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between w-full px-3 py-2 shrink-0" style={{ maxWidth: cellSize * 9 + 20 }}>
        <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Sudoku</div>
        <div className="flex gap-1">
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => newGame(d)}
              className="px-2 py-0.5 text-xs cursor-pointer border-none rounded"
              style={{
                background: difficulty === d ? '#4A90D9' : '#ddd',
                color: difficulty === d ? '#fff' : '#666',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex items-center justify-center overflow-auto" style={{ minHeight: 0 }}>
        <div style={{ padding: 8 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(9, ${cellSize}px)`,
              gridTemplateRows: `repeat(9, ${cellSize}px)`,
              border: '2px solid #333',
            }}
          >
            {grid.map((row, r) =>
              row.map((val, c) => {
                const isSelected = selected && selected[0] === r && selected[1] === c
                const isSameNum = selected && val !== 0 && val === grid[selected[0]][selected[1]]
                const isError = errors.has(`${r},${c}`)
                const given = isGiven(r, c)

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: given ? 'bold' : 'normal',
                      color: isError ? '#D9534F' : given ? '#333' : '#4A90D9',
                      background: isSelected ? '#D4E6F9' : isSameNum ? '#E8F0FE' : '#fff',
                      cursor: 'pointer',
                      borderRight: (c + 1) % 3 === 0 && c < 8 ? '2px solid #333' : '1px solid #ccc',
                      borderBottom: (r + 1) % 3 === 0 && r < 8 ? '2px solid #333' : '1px solid #ccc',
                      borderLeft: c === 0 ? 'none' : undefined,
                      borderTop: r === 0 ? 'none' : undefined,
                      transition: 'background 0.1s',
                    }}
                  >
                    {val !== 0 ? val : ''}
                  </div>
                )
              })
            )}
          </div>

          {/* Number pad */}
          <div className="flex justify-center gap-1 mt-3">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button
                key={n}
                onClick={() => handleNumberInput(n)}
                className="cursor-pointer border-none rounded"
                style={{
                  width: cellSize,
                  height: cellSize,
                  fontSize: 18,
                  fontWeight: 'bold',
                  background: '#4A90D9',
                  color: '#fff',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-1 mt-1">
            <button
              onClick={handleClear}
              className="px-4 py-1.5 text-sm cursor-pointer border-none rounded"
              style={{ background: '#ddd', color: '#666' }}
            >
              Clear
            </button>
            <button
              onClick={() => newGame()}
              className="px-4 py-1.5 text-sm cursor-pointer border-none rounded"
              style={{ background: '#ddd', color: '#666' }}
            >
              New Game
            </button>
          </div>
        </div>
      </div>

      {/* Win overlay */}
      {won && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.9)' }}>
          <div className="text-center">
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#4A90D9', marginBottom: 8 }}>Solved!</div>
            <div className="text-sm mb-4" style={{ color: '#888' }}>{difficulty} puzzle completed</div>
            <button
              onClick={() => newGame()}
              className="px-5 py-2 text-sm font-bold cursor-pointer border-none rounded"
              style={{ background: '#4A90D9', color: '#fff' }}
            >
              New Puzzle
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
