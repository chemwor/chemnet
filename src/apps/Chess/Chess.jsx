import { useState, useCallback, useEffect, useRef } from 'react'
import { submitWin, submitLoss, submitDraw, getGameScore } from '../../lib/highscores'

// ── Piece constants ──
const EMPTY = 0
const PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6
const WHITE = 8, BLACK = 16

const pieceColor = (p) => p & 24
const pieceType = (p) => p & 7
const isWhite = (p) => (p & WHITE) !== 0
const isBlack = (p) => (p & BLACK) !== 0

// Kenyan-themed piece symbols — Swahili names as tooltips
const PIECE_SYMBOLS = {
  [WHITE | PAWN]: '♙', [WHITE | KNIGHT]: '♘', [WHITE | BISHOP]: '♗',
  [WHITE | ROOK]: '♖', [WHITE | QUEEN]: '♕', [WHITE | KING]: '♔',
  [BLACK | PAWN]: '♟', [BLACK | KNIGHT]: '♞', [BLACK | BISHOP]: '♝',
  [BLACK | ROOK]: '♜', [BLACK | QUEEN]: '♛', [BLACK | KING]: '♚',
}

const PIECE_NAMES = {
  [PAWN]: 'Askari', [KNIGHT]: 'Farasi', [BISHOP]: 'Tembo',
  [ROOK]: 'Ngome', [QUEEN]: 'Waziri', [KING]: 'Mfalme',
}

// ── Initial board ──
function initialBoard() {
  const b = new Array(64).fill(EMPTY)
  const backRank = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK]
  for (let i = 0; i < 8; i++) {
    b[i] = BLACK | backRank[i]
    b[8 + i] = BLACK | PAWN
    b[48 + i] = WHITE | PAWN
    b[56 + i] = WHITE | backRank[i]
  }
  return b
}

// ── Move generation ──
const toRC = (sq) => [Math.floor(sq / 8), sq % 8]
const toSq = (r, c) => r * 8 + c
const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8

function pseudoLegalMoves(board, sq, enPassant, castling) {
  const piece = board[sq]
  if (piece === EMPTY) return []
  const color = pieceColor(piece)
  const type = pieceType(piece)
  const [r, c] = toRC(sq)
  const moves = []
  const enemy = color === WHITE ? BLACK : WHITE

  const addIfValid = (tr, tc, flag) => {
    if (!inBounds(tr, tc)) return false
    const target = board[toSq(tr, tc)]
    if (target !== EMPTY && pieceColor(target) === color) return false
    moves.push({ from: sq, to: toSq(tr, tc), flag })
    return target === EMPTY // can continue sliding
  }

  if (type === PAWN) {
    const dir = color === WHITE ? -1 : 1
    const startRow = color === WHITE ? 6 : 1
    const promoRow = color === WHITE ? 0 : 7
    // Forward
    if (inBounds(r + dir, c) && board[toSq(r + dir, c)] === EMPTY) {
      if (r + dir === promoRow) {
        for (const pt of [QUEEN, ROOK, BISHOP, KNIGHT]) moves.push({ from: sq, to: toSq(r + dir, c), promo: pt })
      } else {
        moves.push({ from: sq, to: toSq(r + dir, c) })
      }
      // Double push
      if (r === startRow && board[toSq(r + 2 * dir, c)] === EMPTY) {
        moves.push({ from: sq, to: toSq(r + 2 * dir, c), flag: 'double' })
      }
    }
    // Captures
    for (const dc of [-1, 1]) {
      if (!inBounds(r + dir, c + dc)) continue
      const tgt = board[toSq(r + dir, c + dc)]
      if (tgt !== EMPTY && pieceColor(tgt) === enemy) {
        if (r + dir === promoRow) {
          for (const pt of [QUEEN, ROOK, BISHOP, KNIGHT]) moves.push({ from: sq, to: toSq(r + dir, c + dc), promo: pt })
        } else {
          moves.push({ from: sq, to: toSq(r + dir, c + dc) })
        }
      }
      // En passant
      if (enPassant === toSq(r + dir, c + dc)) {
        moves.push({ from: sq, to: enPassant, flag: 'ep' })
      }
    }
  }

  if (type === KNIGHT) {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      addIfValid(r + dr, c + dc)
    }
  }

  if (type === BISHOP || type === QUEEN) {
    for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
      for (let i = 1; i < 8; i++) { if (!addIfValid(r + dr * i, c + dc * i)) break }
    }
  }

  if (type === ROOK || type === QUEEN) {
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      for (let i = 1; i < 8; i++) { if (!addIfValid(r + dr * i, c + dc * i)) break }
    }
  }

  if (type === KING) {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      addIfValid(r + dr, c + dc)
    }
    // Castling
    if (castling) {
      const row = color === WHITE ? 7 : 0
      if (r === row && c === 4) {
        const ks = color === WHITE ? 'K' : 'k'
        const qs = color === WHITE ? 'Q' : 'q'
        if (castling.includes(ks) && board[toSq(row, 5)] === EMPTY && board[toSq(row, 6)] === EMPTY) {
          moves.push({ from: sq, to: toSq(row, 6), flag: 'castle-k' })
        }
        if (castling.includes(qs) && board[toSq(row, 3)] === EMPTY && board[toSq(row, 2)] === EMPTY && board[toSq(row, 1)] === EMPTY) {
          moves.push({ from: sq, to: toSq(row, 2), flag: 'castle-q' })
        }
      }
    }
  }

  return moves
}

function isSquareAttacked(board, sq, byColor) {
  for (let i = 0; i < 64; i++) {
    if (board[i] === EMPTY || pieceColor(board[i]) !== byColor) continue
    const moves = pseudoLegalMoves(board, i, -1, '')
    if (moves.some(m => m.to === sq)) return true
  }
  return false
}

function findKing(board, color) {
  for (let i = 0; i < 64; i++) {
    if (board[i] === (color | KING)) return i
  }
  return -1
}

function makeMove(board, move) {
  const newBoard = [...board]
  const piece = newBoard[move.from]
  newBoard[move.to] = move.promo ? (pieceColor(piece) | move.promo) : piece
  newBoard[move.from] = EMPTY

  if (move.flag === 'ep') {
    const dir = isWhite(piece) ? 1 : -1
    newBoard[move.to + dir * 8] = EMPTY
  }
  if (move.flag === 'castle-k') {
    const row = Math.floor(move.from / 8)
    newBoard[toSq(row, 5)] = newBoard[toSq(row, 7)]
    newBoard[toSq(row, 7)] = EMPTY
  }
  if (move.flag === 'castle-q') {
    const row = Math.floor(move.from / 8)
    newBoard[toSq(row, 3)] = newBoard[toSq(row, 0)]
    newBoard[toSq(row, 0)] = EMPTY
  }
  return newBoard
}

function legalMoves(board, color, enPassant, castling) {
  const moves = []
  const enemy = color === WHITE ? BLACK : WHITE
  for (let sq = 0; sq < 64; sq++) {
    if (board[sq] === EMPTY || pieceColor(board[sq]) !== color) continue
    for (const m of pseudoLegalMoves(board, sq, enPassant, castling)) {
      // Filter castling through check
      if (m.flag === 'castle-k' || m.flag === 'castle-q') {
        const row = Math.floor(m.from / 8)
        if (isSquareAttacked(board, toSq(row, 4), enemy)) continue
        if (m.flag === 'castle-k' && isSquareAttacked(board, toSq(row, 5), enemy)) continue
        if (m.flag === 'castle-q' && isSquareAttacked(board, toSq(row, 3), enemy)) continue
      }
      const nb = makeMove(board, m)
      const kingSq = findKing(nb, color)
      if (kingSq >= 0 && !isSquareAttacked(nb, kingSq, enemy)) {
        moves.push(m)
      }
    }
  }
  return moves
}

// ── Simple AI ──
const PIECE_VALUES = { [PAWN]: 100, [KNIGHT]: 320, [BISHOP]: 330, [ROOK]: 500, [QUEEN]: 900, [KING]: 20000 }

// Piece-square tables (simplified, from white's perspective)
const CENTER_BONUS = [
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
  0,0,5,10,10,5,0,0,
  0,5,10,20,20,10,5,0,
  0,5,10,20,20,10,5,0,
  0,0,5,10,10,5,0,0,
  0,0,0,0,0,0,0,0,
  0,0,0,0,0,0,0,0,
]

function evaluate(board) {
  let score = 0
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq]
    if (p === EMPTY) continue
    const val = PIECE_VALUES[pieceType(p)] + CENTER_BONUS[sq]
    score += isWhite(p) ? val : -val
  }
  return score
}

function aiMove(board, enPassant, castling) {
  const moves = legalMoves(board, BLACK, enPassant, castling)
  if (moves.length === 0) return null

  let bestScore = Infinity
  let bestMoves = []

  for (const m of moves) {
    const nb = makeMove(board, m)
    // Look 1 move ahead for opponent's best reply
    const opMoves = legalMoves(nb, WHITE, -1, castling)
    let worstForBlack = -Infinity
    if (opMoves.length === 0) {
      worstForBlack = evaluate(nb)
    } else {
      for (const om of opMoves) {
        const nb2 = makeMove(nb, om)
        worstForBlack = Math.max(worstForBlack, evaluate(nb2))
      }
    }
    if (worstForBlack < bestScore) {
      bestScore = worstForBlack
      bestMoves = [m]
    } else if (worstForBlack === bestScore) {
      bestMoves.push(m)
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)]
}

// ── Component ──
const FILE_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export default function Chess() {
  const [board, setBoard] = useState(initialBoard)
  const [selected, setSelected] = useState(-1)
  const [validMoves, setValidMoves] = useState([])
  const [turn, setTurn] = useState(WHITE)
  const [enPassant, setEnPassant] = useState(-1)
  const [castling, setCastling] = useState('KQkq')
  const [status, setStatus] = useState('') // '', 'check', 'checkmate', 'stalemate'
  const [captured, setCaptured] = useState({ white: [], black: [] })
  const [moveHistory, setMoveHistory] = useState([])
  const [thinking, setThinking] = useState(false)
  const boardRef = useRef(null)

  const checkGameState = useCallback((newBoard, color, ep, cast) => {
    const moves = legalMoves(newBoard, color, ep, cast)
    const enemy = color === WHITE ? BLACK : WHITE
    const kingSq = findKing(newBoard, color)
    const inCheck = kingSq >= 0 && isSquareAttacked(newBoard, kingSq, enemy)

    if (moves.length === 0) {
      return inCheck ? 'checkmate' : 'stalemate'
    }
    return inCheck ? 'check' : ''
  }, [])

  const handleSquareClick = useCallback((sq) => {
    if (turn !== WHITE || thinking) return
    if (status === 'checkmate' || status === 'stalemate') return

    const piece = board[sq]

    // If clicking on own piece — select it
    if (piece !== EMPTY && isWhite(piece)) {
      setSelected(sq)
      const moves = legalMoves(board, WHITE, enPassant, castling)
      setValidMoves(moves.filter(m => m.from === sq))
      return
    }

    // If a piece is selected and clicking a valid destination
    if (selected >= 0) {
      const move = validMoves.find(m => m.to === sq)
      if (!move) {
        setSelected(-1)
        setValidMoves([])
        return
      }

      // Execute move
      const capturedPiece = board[sq]
      const newBoard = makeMove(board, move)

      // Track captures
      if (capturedPiece !== EMPTY || move.flag === 'ep') {
        const cap = capturedPiece !== EMPTY ? capturedPiece : (BLACK | PAWN)
        setCaptured(prev => ({ ...prev, white: [...prev.white, cap] }))
      }

      // Update castling rights
      let newCastling = castling
      if (pieceType(board[move.from]) === KING) {
        newCastling = newCastling.replace(isWhite(board[move.from]) ? /[KQ]/g : /[kq]/g, '')
      }
      if (move.from === 56 || move.to === 56) newCastling = newCastling.replace('Q', '')
      if (move.from === 63 || move.to === 63) newCastling = newCastling.replace('K', '')
      if (move.from === 0 || move.to === 0) newCastling = newCastling.replace('q', '')
      if (move.from === 7 || move.to === 7) newCastling = newCastling.replace('k', '')

      // En passant
      const newEP = move.flag === 'double' ? (move.from + move.to) / 2 : -1

      // Record move
      const [fr, fc] = toRC(move.from)
      const [tr, tc] = toRC(move.to)
      const notation = `${PIECE_SYMBOLS[board[move.from]] || ''}${FILE_LABELS[fc]}${8 - fr}→${FILE_LABELS[tc]}${8 - tr}`
      setMoveHistory(prev => [...prev, notation])

      setBoard(newBoard)
      setCastling(newCastling)
      setEnPassant(newEP)
      setSelected(-1)
      setValidMoves([])

      const gameState = checkGameState(newBoard, BLACK, newEP, newCastling)
      setStatus(gameState)

      if (gameState !== 'checkmate' && gameState !== 'stalemate') {
        setTurn(BLACK)
        setThinking(true)
      }
    }
  }, [board, selected, validMoves, turn, enPassant, castling, status, thinking, checkGameState])

  // AI turn
  useEffect(() => {
    if (turn !== BLACK || !thinking) return
    const timer = setTimeout(() => {
      const move = aiMove(board, enPassant, castling)
      if (!move) {
        setThinking(false)
        return
      }

      const capturedPiece = board[move.to]
      const newBoard = makeMove(board, move)

      if (capturedPiece !== EMPTY || move.flag === 'ep') {
        const cap = capturedPiece !== EMPTY ? capturedPiece : (WHITE | PAWN)
        setCaptured(prev => ({ ...prev, black: [...prev.black, cap] }))
      }

      let newCastling = castling
      if (pieceType(board[move.from]) === KING) newCastling = newCastling.replace(/[kq]/g, '')
      if (move.from === 0 || move.to === 0) newCastling = newCastling.replace('q', '')
      if (move.from === 7 || move.to === 7) newCastling = newCastling.replace('k', '')

      const newEP = move.flag === 'double' ? (move.from + move.to) / 2 : -1

      const [fr, fc] = toRC(move.from)
      const [tr, tc] = toRC(move.to)
      const notation = `${PIECE_SYMBOLS[board[move.from]] || ''}${FILE_LABELS[fc]}${8 - fr}→${FILE_LABELS[tc]}${8 - tr}`
      setMoveHistory(prev => [...prev, notation])

      setBoard(newBoard)
      setCastling(newCastling)
      setEnPassant(newEP)
      setTurn(WHITE)
      setThinking(false)

      const gameState = checkGameState(newBoard, WHITE, newEP, newCastling)
      setStatus(gameState)
    }, 400 + Math.random() * 300)

    return () => clearTimeout(timer)
  }, [turn, thinking, board, enPassant, castling, checkGameState])

  useEffect(() => {
    if (status === 'checkmate') {
      if (turn === BLACK) submitWin('chess')
      else submitLoss('chess')
    } else if (status === 'stalemate') {
      submitDraw('chess')
    }
  }, [status, turn])

  const newGame = useCallback(() => {
    setBoard(initialBoard())
    setSelected(-1)
    setValidMoves([])
    setTurn(WHITE)
    setEnPassant(-1)
    setCastling('KQkq')
    setStatus('')
    setCaptured({ white: [], black: [] })
    setMoveHistory([])
    setThinking(false)
  }, [])

  const validTargets = new Set(validMoves.map(m => m.to))
  const kingInCheck = status === 'check' || status === 'checkmate'
    ? findKing(board, turn) : -1

  return (
    <div className="flex h-full" style={{ background: '#1a1a1a', fontFamily: 'monospace' }}>
      {/* Board */}
      <div className="flex flex-col items-center justify-center flex-1 p-2">
        {/* Status bar */}
        <div className="flex items-center justify-between w-full mb-1 px-1" style={{ maxWidth: 340 }}>
          <button
            onClick={newGame}
            className="text-xs px-2 py-0.5 cursor-pointer border-none rounded"
            style={{ background: '#333', color: '#ccc' }}
          >
            Mchezo Mpya
          </button>
          <span className="text-xs" style={{
            color: status === 'checkmate' ? '#FF4444'
              : status === 'stalemate' ? '#FFD700'
              : status === 'check' ? '#FF8800'
              : thinking ? '#888' : '#4ADE80'
          }}>
            {status === 'checkmate' ? (turn === WHITE ? 'Umeshindwa! (Defeat)' : 'Ushindi! (Victory)')
              : status === 'stalemate' ? 'Sare! (Draw)'
              : status === 'check' ? 'Kapa! (Check)'
              : thinking ? 'Anafikiri... (Thinking)'
              : 'Zamu yako (Your turn)'}
          </span>
        </div>

        {/* Captured by black */}
        <div className="flex gap-0 mb-0.5 h-5" style={{ maxWidth: 340 }}>
          {captured.black.map((p, i) => (
            <span key={i} className="text-sm" style={{ color: '#F0EBE1', lineHeight: 1 }}>{PIECE_SYMBOLS[p]}</span>
          ))}
        </div>

        {/* Board grid */}
        <div
          ref={boardRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            width: 'min(340px, calc(100vw - 120px))',
            aspectRatio: '1',
            border: '3px solid #8B4513',
            boxShadow: '0 0 0 2px #000, 0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          {Array.from({ length: 64 }, (_, sq) => {
            const [r, c] = toRC(sq)
            const isLight = (r + c) % 2 === 0
            const piece = board[sq]
            const isSelected = sq === selected
            const isTarget = validTargets.has(sq)
            const isCheck = sq === kingInCheck

            // Kenyan flag colors: green/black for board, red accents
            const bgColor = isSelected ? '#C8553D'
              : isCheck ? '#FF444480'
              : isLight ? '#F0EBE1' : '#006600'

            return (
              <div
                key={sq}
                onClick={() => handleSquareClick(sq)}
                style={{
                  background: bgColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                  cursor: (turn === WHITE && !thinking) ? 'pointer' : 'default',
                }}
              >
                {/* Rank/file labels */}
                {c === 0 && (
                  <span className="absolute text-[8px] top-0 left-0.5" style={{ color: isLight ? '#006600' : '#F0EBE1', opacity: 0.6 }}>
                    {8 - r}
                  </span>
                )}
                {r === 7 && (
                  <span className="absolute text-[8px] bottom-0 right-0.5" style={{ color: isLight ? '#006600' : '#F0EBE1', opacity: 0.6 }}>
                    {FILE_LABELS[c]}
                  </span>
                )}

                {/* Valid move indicator */}
                {isTarget && piece === EMPTY && (
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: 'rgba(192, 57, 43, 0.5)',
                    position: 'absolute',
                  }} />
                )}
                {isTarget && piece !== EMPTY && (
                  <div style={{
                    position: 'absolute', inset: 2,
                    border: '2px solid rgba(192, 57, 43, 0.6)',
                    borderRadius: '50%',
                  }} />
                )}

                {/* Piece */}
                {piece !== EMPTY && (
                  <span
                    style={{
                      fontSize: 'min(3.2vw, 30px)',
                      lineHeight: 1,
                      color: isWhite(piece) ? '#F0EBE1' : '#1a1a1a',
                      textShadow: isWhite(piece) ? '1px 1px 1px rgba(0,0,0,0.5)' : '1px 1px 1px rgba(255,255,255,0.2)',
                      filter: isCheck && sq === kingInCheck ? 'drop-shadow(0 0 4px #FF0000)' : 'none',
                      cursor: (isWhite(piece) && turn === WHITE && !thinking) ? 'grab' : 'default',
                    }}
                    title={`${isWhite(piece) ? 'White' : 'Black'} ${PIECE_NAMES[pieceType(piece)]}`}
                  >
                    {PIECE_SYMBOLS[piece]}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Captured by white */}
        <div className="flex gap-0 mt-0.5 h-5" style={{ maxWidth: 340 }}>
          {captured.white.map((p, i) => (
            <span key={i} className="text-sm" style={{ color: '#1a1a1a', lineHeight: 1 }}>{PIECE_SYMBOLS[p]}</span>
          ))}
        </div>

        {/* Kenyan shield decoration */}
        <div className="mt-2 text-center text-xs" style={{ color: '#555' }}>
          <span style={{ color: '#000' }}>⬛</span>
          <span style={{ color: '#CC0000' }}>🔴</span>
          <span style={{ color: '#006600' }}>🟢</span>
          <span className="ml-2">Mchezo wa Chess</span>
        </div>
      </div>

      {/* Side panel — move history */}
      <div
        className="flex flex-col shrink-0 overflow-hidden"
        style={{ width: 100, background: '#111', borderLeft: '1px solid #333' }}
      >
        <div className="px-2 py-1.5 text-[10px] font-bold shrink-0" style={{ color: '#006600', borderBottom: '1px solid #333' }}>
          Historia
        </div>
        <div className="flex-1 overflow-auto px-2 py-1">
          {moveHistory.map((m, i) => (
            <div key={i} className="text-[9px]" style={{ color: i % 2 === 0 ? '#F0EBE1' : '#888' }}>
              {Math.floor(i / 2) + 1}{i % 2 === 0 ? '.' : '...'} {m}
            </div>
          ))}
        </div>
        <div className="px-2 py-1 text-[9px] shrink-0" style={{ color: '#555', borderTop: '1px solid #333' }}>
          Wewe: Nyeupe<br />
          CPU: Nyeusi<br />
          Record: {getGameScore('chess').wins || 0}W-{getGameScore('chess').losses || 0}L-{getGameScore('chess').draws || 0}D
        </div>
      </div>
    </div>
  )
}
