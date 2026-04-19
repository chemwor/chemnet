import { useState, useCallback, useEffect, useRef } from 'react'
import { submitSolitaire, getGameScore } from '../../lib/highscores'

// ── Constants ──
const SUITS = ['♠', '♥', '♦', '♣']
const SUIT_SYMBOLS = { '♠': '♠', '♥': '♥', '♦': '♦', '♣': '♣' }
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const RED_SUITS = new Set(['♥', '♦'])

const CARD_W = 73
const CARD_H = 98
const CARD_GAP = 4
const FACE_DOWN_OFFSET = 5
const FACE_UP_OFFSET = 22

function isRed(card) { return RED_SUITS.has(card.suit) }

// ── Deck & Deal ──
function createDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (let r = 0; r < RANKS.length; r++) {
      deck.push({ suit, rank: RANKS[r], value: r + 1, faceUp: false, id: `${RANKS[r]}${suit}` })
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function dealGame() {
  const deck = createDeck()
  const tableau = Array.from({ length: 7 }, () => [])
  let idx = 0
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[idx++] }
      card.faceUp = row === col
      tableau[col].push(card)
    }
  }
  const stock = deck.slice(idx).map(c => ({ ...c, faceUp: false }))
  return { tableau, foundations: [[], [], [], []], stock, waste: [], score: 0 }
}

// ── Card Back ──
function CardBack({ onClick, style, draggable, onDragStart }) {
  return (
    <div
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      className="select-none"
      style={{
        ...style,
        width: CARD_W, height: CARD_H, borderRadius: 5,
        background: '#1a1a8a',
        border: '2px solid #fff',
        boxShadow: '1px 1px 2px rgba(0,0,0,0.4)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        width: CARD_W - 10, height: CARD_H - 10, borderRadius: 3,
        border: '1px solid #4444cc',
        background: 'repeating-conic-gradient(#2222aa 0% 25%, #1a1a8a 0% 50%) 50% / 8px 8px',
      }} />
    </div>
  )
}

// ── Card Face ──
function CardFace({ card, onClick, onDoubleClick, style, highlighted, draggable, onDragStart }) {
  const color = isRed(card) ? '#d40000' : '#000'
  const isRoyal = ['J', 'Q', 'K'].includes(card.rank)

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      draggable={draggable}
      onDragStart={onDragStart}
      className="select-none"
      style={{
        ...style,
        width: CARD_W, height: CARD_H, borderRadius: 5,
        background: highlighted ? '#d0e8ff' : '#fff',
        border: highlighted ? '2px solid #0066cc' : '2px solid #999',
        boxShadow: highlighted
          ? '0 0 6px rgba(0,102,204,0.5), 1px 1px 2px rgba(0,0,0,0.3)'
          : '1px 1px 2px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        padding: '3px 5px',
        fontFamily: 'Georgia, "Times New Roman", serif',
        color,
        position: 'relative',
      }}
    >
      {/* Top-left rank + suit */}
      <div style={{ lineHeight: 1, fontSize: 13, fontWeight: 'bold' }}>
        {card.rank}
        <br />
        <span style={{ fontSize: 14 }}>{card.suit}</span>
      </div>

      {/* Center suit */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isRoyal ? 28 : 32,
        opacity: isRoyal ? 1 : 0.7,
        pointerEvents: 'none',
      }}>
        {isRoyal ? (
          <span style={{ fontSize: 22, fontWeight: 'bold' }}>
            {card.rank === 'J' ? '🃏' : card.rank === 'Q' ? '👑' : '♚'}
          </span>
        ) : card.suit}
      </div>

      {/* Bottom-right rank + suit (inverted) */}
      <div style={{
        lineHeight: 1, fontSize: 13, fontWeight: 'bold',
        marginTop: 'auto', alignSelf: 'flex-end',
        transform: 'rotate(180deg)',
      }}>
        {card.rank}
        <br />
        <span style={{ fontSize: 14 }}>{card.suit}</span>
      </div>
    </div>
  )
}

// ── Empty Slot ──
function EmptySlot({ onClick, label, onDragOver, onDrop, style }) {
  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        width: CARD_W, height: CARD_H, borderRadius: 5,
        border: '2px solid rgba(255,255,255,0.25)',
        background: 'rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, color: 'rgba(255,255,255,0.3)',
        cursor: 'pointer',
        ...style,
      }}
    >
      {label}
    </div>
  )
}

// ── Win Animation ──
function WinAnimation() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.parentElement.clientWidth
    canvas.height = canvas.parentElement.clientHeight

    const cards = Array.from({ length: 20 }, () => ({
      x: Math.random() * canvas.width,
      y: -CARD_H - Math.random() * 300,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 2 + 1,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 8,
      suit: SUITS[Math.floor(Math.random() * 4)],
      rank: RANKS[Math.floor(Math.random() * 13)],
    }))

    let raf
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const c of cards) {
        c.x += c.vx
        c.vy += 0.15
        c.y += c.vy
        c.rot += c.vr

        // Bounce off bottom
        if (c.y > canvas.height - CARD_H) {
          c.y = canvas.height - CARD_H
          c.vy *= -0.6
          if (Math.abs(c.vy) < 1) c.vy = 0
        }

        // Leave trail
        ctx.save()
        ctx.translate(c.x + CARD_W / 2, c.y + CARD_H / 2)
        ctx.rotate((c.rot * Math.PI) / 180)
        ctx.fillStyle = '#fff'
        ctx.fillRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H)
        ctx.strokeStyle = '#999'
        ctx.lineWidth = 1.5
        ctx.strokeRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H)

        const isRedSuit = RED_SUITS.has(c.suit)
        ctx.fillStyle = isRedSuit ? '#d40000' : '#000'
        ctx.font = 'bold 16px Georgia'
        ctx.textAlign = 'center'
        ctx.fillText(c.rank, 0, -10)
        ctx.font = '22px serif'
        ctx.fillText(c.suit, 0, 18)
        ctx.restore()
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ zIndex: 10, pointerEvents: 'none' }}
    />
  )
}

// ── Timer ──
function Timer({ running }) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [running])
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  return <span>{mins}:{secs}</span>
}

// ── Main Component ──
export default function Solitaire() {
  const [game, setGame] = useState(dealGame)
  const [selected, setSelected] = useState(null)
  const [moves, setMoves] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [dragData, setDragData] = useState(null)

  const won = game.foundations.every(f => f.length === 13)

  useEffect(() => {
    if (won) {
      setTimerRunning(false)
      submitSolitaire(game.score, moves)
    }
  }, [won])

  const newGame = useCallback(() => {
    setGame(dealGame())
    setSelected(null)
    setMoves(0)
    setTimerRunning(false)
  }, [])

  const startTimer = useCallback(() => {
    if (!timerRunning) setTimerRunning(true)
  }, [timerRunning])

  // ── Game logic helpers ──
  const canPlaceOnTableau = (card, targetCol) => {
    if (targetCol.length === 0) return card.rank === 'K'
    const top = targetCol[targetCol.length - 1]
    if (!top.faceUp) return false
    return top.value === card.value + 1 && isRed(card) !== isRed(top)
  }

  const canPlaceOnFoundation = (card, foundation) => {
    if (foundation.length === 0) return card.rank === 'A'
    const top = foundation[foundation.length - 1]
    return top.suit === card.suit && top.value === card.value - 1
  }

  const flipTopCard = (col) => {
    if (col.length > 0 && !col[col.length - 1].faceUp) {
      col[col.length - 1] = { ...col[col.length - 1], faceUp: true }
    }
  }

  const removeFromSource = (next, sel) => {
    if (sel.source === 'waste') {
      next.waste = next.waste.slice(0, -1)
    } else if (sel.source === 'tableau') {
      next.tableau[sel.colIdx] = next.tableau[sel.colIdx].slice(0, sel.cardIdx)
      flipTopCard(next.tableau[sel.colIdx])
    } else if (sel.source === 'foundation') {
      next.foundations[sel.colIdx] = next.foundations[sel.colIdx].slice(0, -1)
    }
  }

  const getCardsFromSelection = (prev, sel) => {
    if (sel.source === 'waste') {
      return prev.waste.length > 0 ? [prev.waste[prev.waste.length - 1]] : []
    } else if (sel.source === 'tableau') {
      return prev.tableau[sel.colIdx].slice(sel.cardIdx)
    } else if (sel.source === 'foundation') {
      const f = prev.foundations[sel.colIdx]
      return f.length > 0 ? [f[f.length - 1]] : []
    }
    return []
  }

  // ── Draw from stock ──
  const drawFromStock = useCallback(() => {
    startTimer()
    setGame(prev => {
      if (prev.stock.length === 0) {
        return {
          ...prev,
          stock: [...prev.waste].reverse().map(c => ({ ...c, faceUp: false })),
          waste: [],
        }
      }
      const stock = [...prev.stock]
      const card = { ...stock.pop(), faceUp: true }
      return { ...prev, stock, waste: [...prev.waste, card] }
    })
    setSelected(null)
  }, [startTimer])

  // ── Try to place selection at target ──
  const tryPlace = useCallback((sel, target, targetColIdx) => {
    startTimer()
    setGame(prev => {
      const cards = getCardsFromSelection(prev, sel)
      if (cards.length === 0) return prev

      const next = {
        ...prev,
        tableau: prev.tableau.map(c => [...c]),
        foundations: prev.foundations.map(f => [...f]),
        waste: [...prev.waste],
        stock: [...prev.stock],
      }

      if (target === 'foundation' && cards.length === 1) {
        if (canPlaceOnFoundation(cards[0], next.foundations[targetColIdx])) {
          removeFromSource(next, sel)
          next.foundations[targetColIdx] = [...next.foundations[targetColIdx], cards[0]]
          next.score = prev.score + 10
          setMoves(m => m + 1)
          setSelected(null)
          return next
        }
      }

      if (target === 'tableau') {
        if (canPlaceOnTableau(cards[0], next.tableau[targetColIdx])) {
          removeFromSource(next, sel)
          next.tableau[targetColIdx] = [...next.tableau[targetColIdx], ...cards]
          next.score = prev.score + (sel.source === 'waste' ? 5 : 0)
          setMoves(m => m + 1)
          setSelected(null)
          return next
        }
      }

      return prev
    })
  }, [startTimer])

  // ── Click handler ──
  const handleClick = useCallback((source, colIdx, cardIdx) => {
    if (selected) {
      const placed = { source, colIdx, cardIdx }
      // Clicking same card deselects
      if (selected.source === source && selected.colIdx === colIdx && selected.cardIdx === cardIdx) {
        setSelected(null)
        return
      }
      tryPlace(selected, source, colIdx)
      // If tryPlace didn't clear selection, re-select the new card
      setSelected(prev => prev ? { source, colIdx, cardIdx } : null)
    } else {
      setSelected({ source, colIdx, cardIdx })
    }
  }, [selected, tryPlace])

  // ── Double-click: auto-send to foundation ──
  const handleDoubleClick = useCallback((source, colIdx, cardIdx) => {
    startTimer()
    setGame(prev => {
      const sel = { source, colIdx, cardIdx }
      const cards = getCardsFromSelection(prev, sel)
      if (cards.length !== 1) return prev

      const next = {
        ...prev,
        tableau: prev.tableau.map(c => [...c]),
        foundations: prev.foundations.map(f => [...f]),
        waste: [...prev.waste],
        stock: [...prev.stock],
      }

      for (let f = 0; f < 4; f++) {
        if (canPlaceOnFoundation(cards[0], next.foundations[f])) {
          removeFromSource(next, sel)
          next.foundations[f] = [...next.foundations[f], cards[0]]
          next.score = prev.score + 10
          setMoves(m => m + 1)
          setSelected(null)
          return next
        }
      }
      return prev
    })
  }, [startTimer])

  // ── Drag & Drop ──
  const handleDragStart = useCallback((e, source, colIdx, cardIdx) => {
    const data = { source, colIdx, cardIdx }
    setDragData(data)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(data))
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e, target, targetColIdx) => {
    e.preventDefault()
    if (!dragData) return
    tryPlace(dragData, target, targetColIdx)
    setDragData(null)
  }, [dragData, tryPlace])

  // ── Selection highlight check ──
  const isSelected = (source, colIdx, cardIdx) => {
    if (!selected) return false
    if (selected.source !== source) return false
    if (selected.colIdx !== colIdx) return false
    if (source === 'tableau') return cardIdx >= selected.cardIdx
    return true
  }

  return (
    <div className="flex flex-col h-full relative" style={{ background: '#277714', minHeight: 0 }}>
      {/* Menu bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 shrink-0"
        style={{ background: '#1e5c10', borderBottom: '1px solid #0f3a08' }}
      >
        <div className="flex gap-3">
          <button
            onClick={newGame}
            className="px-2 py-0.5 text-xs cursor-pointer border-none"
            style={{
              background: 'transparent', color: '#c8e6c0',
              fontFamily: 'Tahoma, Arial, sans-serif',
            }}
          >
            Game
          </button>
          <button
            onClick={newGame}
            className="px-2 py-0.5 text-xs cursor-pointer border-none"
            style={{
              background: 'transparent', color: '#c8e6c0',
              fontFamily: 'Tahoma, Arial, sans-serif',
            }}
          >
            Deal
          </button>
        </div>
        <div className="flex gap-4 text-xs" style={{ color: '#c8e6c0', fontFamily: 'Tahoma, Arial, sans-serif' }}>
          <span>Score: {game.score}</span>
          <span>Best: {getGameScore('solitaire').highScore || 0}</span>
          <span>Moves: {moves}</span>
          <span><Timer running={timerRunning} /></span>
        </div>
      </div>

      {/* Playing field */}
      <div className="flex-1 overflow-auto p-3" style={{ minHeight: 0 }}>
        {/* Top row: Stock, Waste, gap, Foundations */}
        <div className="flex items-start mb-4" style={{ gap: CARD_GAP }}>
          {/* Stock */}
          {game.stock.length > 0 ? (
            <CardBack onClick={drawFromStock} />
          ) : (
            <EmptySlot onClick={drawFromStock} label="↻" />
          )}

          {/* Waste — show up to 3 fanned */}
          <div className="relative" style={{ width: CARD_W + 30, height: CARD_H }}>
            {game.waste.length === 0 ? (
              <EmptySlot label="" />
            ) : (
              game.waste.slice(-3).map((card, i, arr) => {
                const isTop = i === arr.length - 1
                return (
                  <div key={card.id} style={{ position: 'absolute', left: i * 15 }}>
                    <CardFace
                      card={card}
                      highlighted={isTop && isSelected('waste')}
                      onClick={isTop ? () => handleClick('waste') : undefined}
                      onDoubleClick={isTop ? () => handleDoubleClick('waste') : undefined}
                      draggable={isTop}
                      onDragStart={isTop ? (e) => handleDragStart(e, 'waste') : undefined}
                    />
                  </div>
                )
              })
            )}
          </div>

          {/* Spacer */}
          <div style={{ width: CARD_W }} />

          {/* Foundations */}
          {game.foundations.map((f, i) => (
            <div
              key={i}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'foundation', i)}
            >
              {f.length > 0 ? (
                <CardFace
                  card={f[f.length - 1]}
                  onClick={() => handleClick('foundation', i)}
                />
              ) : (
                <EmptySlot
                  onClick={() => handleClick('foundation', i)}
                  label={SUITS[i]}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'foundation', i)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Tableau */}
        <div className="flex" style={{ gap: CARD_GAP }}>
          {game.tableau.map((col, colIdx) => (
            <div
              key={colIdx}
              className="relative"
              style={{ width: CARD_W, minHeight: CARD_H + 100 }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'tableau', colIdx)}
            >
              {col.length === 0 ? (
                <EmptySlot
                  onClick={() => handleClick('tableau', colIdx, 0)}
                  label=""
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'tableau', colIdx)}
                />
              ) : (
                col.map((card, cardIdx) => {
                  let top = 0
                  for (let k = 0; k < cardIdx; k++) {
                    top += col[k].faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET
                  }

                  if (!card.faceUp) {
                    return (
                      <div key={card.id} style={{ position: 'absolute', top }}>
                        <CardBack />
                      </div>
                    )
                  }

                  return (
                    <div key={card.id} style={{ position: 'absolute', top }}>
                      <CardFace
                        card={card}
                        highlighted={isSelected('tableau', colIdx, cardIdx)}
                        onClick={() => handleClick('tableau', colIdx, cardIdx)}
                        onDoubleClick={() => handleDoubleClick('tableau', colIdx, cardIdx)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'tableau', colIdx, cardIdx)}
                      />
                    </div>
                  )
                })
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Win animation */}
      {won && <WinAnimation />}

      {won && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 20 }}
        >
          <div
            className="text-center p-6 rounded"
            style={{
              background: 'rgba(0,0,0,0.85)',
              border: '3px solid #ffd700',
              color: '#ffd700',
              fontFamily: 'Georgia, serif',
            }}
          >
            <div className="text-2xl font-bold mb-2">You Win!</div>
            <div className="text-sm mb-3" style={{ color: '#fff' }}>
              Score: {game.score} &middot; Moves: {moves}
            </div>
            <button
              onClick={newGame}
              className="px-4 py-1.5 cursor-pointer border-none rounded text-sm font-bold"
              style={{ background: '#ffd700', color: '#000' }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
