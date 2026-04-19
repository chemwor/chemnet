import { useState } from 'react'

const CATEGORIES = [
  { id: 'movies', label: 'Movies' },
  { id: 'tv', label: 'TV Shows' },
]

const REVIEWS = [
  // Movies
  {
    id: 1, category: 'movies', title: 'Dune: Part Two', year: 2024, rating: 9,
    status: 'watched', poster: '🏜️',
    review: 'Villeneuve did it again. The scale, the sound design, the performances. Austin Butler as Feyd-Rautha is terrifying. This is what blockbusters should be.',
    tags: ['Sci-Fi', 'Epic'],
  },
  {
    id: 2, category: 'movies', title: 'Past Lives', year: 2023, rating: 9,
    status: 'watched', poster: '💫',
    review: 'Quietly devastating. The kind of movie that sits with you for weeks. Greta Lee is incredible. Made me think about every "what if" I\'ve ever had.',
    tags: ['Drama', 'Romance'],
  },
  {
    id: 3, category: 'movies', title: 'Oppenheimer', year: 2023, rating: 8,
    status: 'watched', poster: '💣',
    review: 'Nolan at his most restrained and his most ambitious at the same time. RDJ deserved that Oscar. The courtroom scenes hit harder than the bomb.',
    tags: ['Drama', 'History'],
  },
  {
    id: 4, category: 'movies', title: 'Everything Everywhere All at Once', year: 2022, rating: 10,
    status: 'watched', poster: '🥯',
    review: 'The most creative movie I\'ve ever seen. It\'s about everything — literally — and somehow it all works. Cried three times. The rock scene broke me.',
    tags: ['Sci-Fi', 'Comedy', 'Drama'],
  },
  {
    id: 5, category: 'movies', title: 'The Brutalist', year: 2025, rating: 0,
    status: 'watchlist', poster: '🏗️',
    review: '',
    tags: ['Drama'],
  },
  {
    id: 6, category: 'movies', title: 'Sinners', year: 2025, rating: 0,
    status: 'watchlist', poster: '🎸',
    review: '',
    tags: ['Horror', 'Drama'],
  },

  // TV Shows
  {
    id: 10, category: 'tv', title: 'Severance', year: 2022, rating: 10,
    status: 'watched', poster: '🧠',
    review: 'The best show on TV right now. The concept is genius but the execution is what makes it. Season 2 finale had me standing up in my living room.',
    tags: ['Thriller', 'Sci-Fi'],
  },
  {
    id: 11, category: 'tv', title: 'The Bear', year: 2022, rating: 9,
    status: 'watched', poster: '🍳',
    review: 'The anxiety of this show is a feature not a bug. Carmy is frustrating in a way that feels real. The Christmas episode is an all-timer. Season 3 dipped a bit but still good.',
    tags: ['Drama', 'Food'],
  },
  {
    id: 12, category: 'tv', title: 'Shogun', year: 2024, rating: 9,
    status: 'watched', poster: '⚔️',
    review: 'Slow in the best way. Every frame is a painting. Toranaga is the most compelling character on TV. Felt like reading a great book.',
    tags: ['Drama', 'History'],
  },
  {
    id: 13, category: 'tv', title: 'Fallout', year: 2024, rating: 8,
    status: 'watched', poster: '☢️',
    review: 'Didn\'t think a video game adaptation would hit this hard. Walton Goggins is perfect. The world-building respects the source material without being a slave to it.',
    tags: ['Sci-Fi', 'Action'],
  },
  {
    id: 14, category: 'tv', title: 'Arcane', year: 2021, rating: 10,
    status: 'watched', poster: '⚡',
    review: 'Animation at its absolute peak. The art style, the story, the music. I don\'t even play League and this is one of my favorite shows ever. Season 2 stuck the landing.',
    tags: ['Animation', 'Action'],
  },
  {
    id: 15, category: 'tv', title: 'White Lotus S3', year: 2025, rating: 0,
    status: 'watchlist', poster: '🌺',
    review: '',
    tags: ['Drama', 'Satire'],
  },
]

function StarRating({ rating }) {
  const stars = []
  for (let i = 1; i <= 10; i++) {
    stars.push(
      <span key={i} style={{ color: i <= rating ? '#FFD700' : '#333', fontSize: 11 }}>
        {i <= rating ? '★' : '☆'}
      </span>
    )
  }
  return <span className="inline-flex gap-0">{stars}</span>
}

function ReviewCard({ item, isSelected, onClick }) {
  return (
    <div
      className="flex items-start gap-2 px-3 py-2 cursor-pointer"
      style={{
        background: isSelected ? '#1a1a3a' : 'transparent',
        borderBottom: '1px solid #1a1a2a',
      }}
      onClick={onClick}
    >
      <span className="text-2xl shrink-0">{item.poster}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm truncate" style={{ color: '#F0EBE1' }}>{item.title}</span>
          <span className="text-xs shrink-0" style={{ color: '#555' }}>{item.year}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {item.status === 'watched' ? (
            <StarRating rating={item.rating} />
          ) : (
            <span className="text-xs px-1.5 py-0.5" style={{ background: '#2a2a4a', color: '#8888FF', fontSize: 9 }}>WATCHLIST</span>
          )}
        </div>
        <div className="flex gap-1 mt-1">
          {item.tags.map(t => (
            <span key={t} className="text-xs px-1" style={{ background: '#1a1a30', color: '#666', fontSize: 9 }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Reviews() {
  const [category, setCategory] = useState('movies')
  const [filter, setFilter] = useState('all') // all, watched, watchlist
  const [selectedId, setSelectedId] = useState(null)

  const filtered = REVIEWS
    .filter(r => r.category === category)
    .filter(r => filter === 'all' || r.status === filter)
    .sort((a, b) => {
      if (a.status === 'watchlist' && b.status !== 'watchlist') return 1
      if (b.status === 'watchlist' && a.status !== 'watchlist') return -1
      return b.rating - a.rating
    })

  const selected = REVIEWS.find(r => r.id === selectedId)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0f0f1a', fontFamily: 'monospace', color: '#F0EBE1' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ background: '#1a1a30', borderBottom: '1px solid #2a2a4a' }}>
        <div className="flex items-center gap-1">
          <span className="text-sm">🎬</span>
          <span className="font-bold text-sm">What I've Been Watching</span>
        </div>
      </div>

      {/* Category tabs + filter */}
      <div className="flex items-center gap-2 px-3 py-1 shrink-0" style={{ background: '#12121f', borderBottom: '1px solid #2a2a4a' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => { setCategory(c.id); setSelectedId(null) }}
            className="px-2 py-0.5 text-xs border-none cursor-pointer"
            style={{
              background: category === c.id ? '#FF6B35' : 'transparent',
              color: category === c.id ? '#000' : '#888',
              fontFamily: 'inherit',
            }}
          >
            {c.label}
          </button>
        ))}
        <div style={{ width: 1, height: 14, background: '#2a2a4a', margin: '0 4px' }} />
        {['all', 'watched', 'watchlist'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-1.5 py-0.5 text-xs border-none cursor-pointer"
            style={{
              background: 'transparent',
              color: filter === f ? '#FF6B35' : '#555',
              fontFamily: 'inherit',
              textDecoration: filter === f ? 'underline' : 'none',
            }}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs" style={{ color: '#444' }}>{filtered.length} titles</span>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* List */}
        <div className="flex-1 overflow-auto">
          {filtered.map(item => (
            <ReviewCard
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onClick={() => setSelectedId(item.id)}
            />
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="shrink-0 overflow-auto p-3" style={{ width: 220, background: '#12121f', borderLeft: '1px solid #2a2a4a' }}>
            <div className="text-center text-4xl mb-2">{selected.poster}</div>
            <div className="font-bold text-sm text-center mb-1">{selected.title}</div>
            <div className="text-center text-xs mb-2" style={{ color: '#666' }}>{selected.year}</div>

            {selected.status === 'watched' ? (
              <>
                <div className="text-center mb-3">
                  <StarRating rating={selected.rating} />
                  <div className="text-xs mt-0.5" style={{ color: '#888' }}>{selected.rating}/10</div>
                </div>
                <div className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
                  {selected.review}
                </div>
              </>
            ) : (
              <div className="text-center text-xs" style={{ color: '#555' }}>
                On the watchlist — haven't seen it yet.
              </div>
            )}

            <div className="flex flex-wrap gap-1 mt-3 justify-center">
              {selected.tags.map(t => (
                <span key={t} className="text-xs px-1.5 py-0.5" style={{ background: '#1a1a30', color: '#666' }}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="px-3 py-0.5 text-xs shrink-0" style={{ background: '#1a1a30', borderTop: '1px solid #2a2a4a', color: '#444' }}>
        {selected ? selected.title : 'Click a title for details'}
      </div>
    </div>
  )
}
