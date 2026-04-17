import { useState, useCallback } from 'react'

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const RED_SUITS = ['♥', '♦']

function createDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (let r = 0; r < RANKS.length; r++) {
      deck.push({ suit, rank: RANKS[r], value: r + 1, faceUp: false })
    }
  }
  // Fisher-Yates shuffle
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
  return { tableau, foundations: [[], [], [], []], stock, waste: [] }
}

function isRed(card) {
  return RED_SUITS.includes(card.suit)
}

function cardKey(card) {
  return `${card.rank}${card.suit}`
}

function Card({ card, onClick, style, dimmed }) {
  if (!card) return null
  if (!card.faceUp) {
    return (
      <div
        onClick={onClick}
        className="select-none"
        style={{
          ...style,
          width: 48, height: 68, borderRadius: 4,
          background: '#3D2B1F',
          border: '1px solid var(--color-bevel-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 16, color: 'var(--color-accent)',
        }}
      >
        🂠
      </div>
    )
  }
  const color = isRed(card) ? '#FF6B35' : '#F0EBE1'
  return (
    <div
      onClick={onClick}
      className="select-none"
      style={{
        ...style,
        width: 48, height: 68, borderRadius: 4,
        background: '#1E1C28',
        border: '1px solid var(--color-bevel-light)',
        display: 'flex', flexDirection: 'column',
        padding: '2px 4px', cursor: 'pointer',
        opacity: dimmed ? 0.5 : 1,
        fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace',
        color,
      }}
    >
      <span>{card.rank}</span>
      <span style={{ fontSize: 16, textAlign: 'center', marginTop: 'auto' }}>{card.suit}</span>
    </div>
  )
}

function EmptySlot({ onClick, label }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 48, height: 68, borderRadius: 4,
        border: '1px dashed var(--color-bevel-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: 'var(--color-text-disabled)', cursor: 'pointer',
      }}
    >
      {label}
    </div>
  )
}

export default function Solitaire() {
  const [game, setGame] = useState(dealGame)
  const [selected, setSelected] = useState(null) // { source, colIdx?, cardIdx? }
  const [moves, setMoves] = useState(0)

  const newGame = useCallback(() => {
    setGame(dealGame())
    setSelected(null)
    setMoves(0)
  }, [])

  const drawFromStock = useCallback(() => {
    setGame(prev => {
      if (prev.stock.length === 0) {
        // Flip waste back to stock
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
  }, [])

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

  const handleSelect = useCallback((source, colIdx, cardIdx) => {
    if (selected) {
      // Try to place
      setGame(prev => {
        const next = JSON.parse(JSON.stringify(prev))

        // Get the cards being moved
        let cardsToMove = []
        if (selected.source === 'waste') {
          if (next.waste.length === 0) return prev
          cardsToMove = [next.waste[next.waste.length - 1]]
        } else if (selected.source === 'tableau') {
          const srcCol = next.tableau[selected.colIdx]
          cardsToMove = srcCol.slice(selected.cardIdx)
        } else if (selected.source === 'foundation') {
          const srcFound = next.foundations[selected.colIdx]
          if (srcFound.length === 0) return prev
          cardsToMove = [srcFound[srcFound.length - 1]]
        }

        if (cardsToMove.length === 0) return prev

        // Try foundation
        if (source === 'foundation' && cardsToMove.length === 1) {
          if (canPlaceOnFoundation(cardsToMove[0], next.foundations[colIdx])) {
            // Remove from source
            if (selected.source === 'waste') next.waste.pop()
            else if (selected.source === 'tableau') {
              next.tableau[selected.colIdx].splice(selected.cardIdx)
              const col = next.tableau[selected.colIdx]
              if (col.length > 0 && !col[col.length - 1].faceUp) {
                col[col.length - 1].faceUp = true
              }
            } else if (selected.source === 'foundation') {
              next.foundations[selected.colIdx].pop()
            }
            next.foundations[colIdx].push(cardsToMove[0])
            setMoves(m => m + 1)
            setSelected(null)
            return next
          }
        }

        // Try tableau
        if (source === 'tableau') {
          if (canPlaceOnTableau(cardsToMove[0], next.tableau[colIdx])) {
            if (selected.source === 'waste') next.waste.pop()
            else if (selected.source === 'tableau') {
              next.tableau[selected.colIdx].splice(selected.cardIdx)
              const col = next.tableau[selected.colIdx]
              if (col.length > 0 && !col[col.length - 1].faceUp) {
                col[col.length - 1].faceUp = true
              }
            } else if (selected.source === 'foundation') {
              next.foundations[selected.colIdx].pop()
            }
            next.tableau[colIdx].push(...cardsToMove)
            setMoves(m => m + 1)
            setSelected(null)
            return next
          }
        }

        // Invalid move — re-select if clicking a new source
        if (source === 'tableau' || source === 'waste') {
          setSelected({ source, colIdx, cardIdx })
        } else {
          setSelected(null)
        }
        return prev
      })
    } else {
      setSelected({ source, colIdx, cardIdx })
    }
  }, [selected])

  // Auto-send to foundation on double click (via quick re-select)
  const tryAutoFoundation = useCallback((card, source, colIdx, cardIdx) => {
    setGame(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      for (let f = 0; f < 4; f++) {
        if (canPlaceOnFoundation(card, next.foundations[f])) {
          if (source === 'waste') next.waste.pop()
          else if (source === 'tableau') {
            next.tableau[colIdx].splice(cardIdx)
            const col = next.tableau[colIdx]
            if (col.length > 0 && !col[col.length - 1].faceUp) {
              col[col.length - 1].faceUp = true
            }
          }
          next.foundations[f].push({ ...card })
          setMoves(m => m + 1)
          return next
        }
      }
      return prev
    })
  }, [])

  const won = game.foundations.every(f => f.length === 13)

  return (
    <div className="flex flex-col h-full" style={{ background: '#1a3d1a', minHeight: 0 }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-1 shrink-0" style={{ borderBottom: '1px solid #2a5d2a' }}>
        <button
          onClick={newGame}
          className="bevel-button px-2 py-0.5 text-xs cursor-pointer"
          style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          New Game
        </button>
        <span className="text-xs" style={{ color: '#7ab87a' }}>Moves: {moves}</span>
      </div>

      {won && (
        <div className="text-center py-2 text-sm font-bold" style={{ color: '#FF6B35' }}>
          You win! 🎉
        </div>
      )}

      {/* Stock, Waste, Foundations */}
      <div className="flex gap-2 px-3 py-2 shrink-0">
        {/* Stock */}
        {game.stock.length > 0 ? (
          <Card card={{ faceUp: false }} onClick={drawFromStock} />
        ) : (
          <EmptySlot onClick={drawFromStock} label="↻" />
        )}

        {/* Waste */}
        {game.waste.length > 0 ? (
          <Card
            card={game.waste[game.waste.length - 1]}
            dimmed={selected?.source === 'waste'}
            onClick={() => handleSelect('waste')}
            onDoubleClick={() => {
              const card = game.waste[game.waste.length - 1]
              if (card) tryAutoFoundation(card, 'waste')
            }}
          />
        ) : (
          <EmptySlot label="" />
        )}

        <div style={{ width: 16 }} />

        {/* Foundations */}
        {game.foundations.map((f, i) => (
          <div key={i} onClick={() => handleSelect('foundation', i)}>
            {f.length > 0 ? (
              <Card card={f[f.length - 1]} onClick={() => handleSelect('foundation', i)} />
            ) : (
              <EmptySlot onClick={() => handleSelect('foundation', i)} label={SUITS[i]} />
            )}
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className="flex gap-2 px-3 flex-1 overflow-auto" style={{ minHeight: 0 }}>
        {game.tableau.map((col, colIdx) => (
          <div key={colIdx} className="relative" style={{ width: 48, minHeight: 68 }}>
            {col.length === 0 ? (
              <EmptySlot onClick={() => handleSelect('tableau', colIdx, 0)} label="" />
            ) : (
              col.map((card, cardIdx) => (
                <div
                  key={cardKey(card) + cardIdx}
                  style={{ position: 'absolute', top: cardIdx * (card.faceUp ? 20 : 10) }}
                >
                  <Card
                    card={card}
                    dimmed={
                      selected?.source === 'tableau' &&
                      selected?.colIdx === colIdx &&
                      cardIdx >= selected?.cardIdx
                    }
                    onClick={() => {
                      if (card.faceUp) {
                        handleSelect('tableau', colIdx, cardIdx)
                      }
                    }}
                  />
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
