import { useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

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
    analysis: `Dune: Part Two picks up where the first left off and somehow raises the stakes even higher. Villeneuve understood something that most directors adapting dense source material miss — you don't have to explain everything. You just have to make people feel it.

The sound design alone deserves its own review. The voice, the worms, the way battle sounds like weather. Zimmer's score isn't music, it's atmosphere. It doesn't play over scenes, it breathes with them.

Austin Butler as Feyd-Rautha was the casting choice of the year. He plays it like a coiled snake — every smile is a threat. The gladiator scene in black and white is one of the best sequences I've seen in any film recently.

What I appreciated most is Chalamet's arc. Paul doesn't become a hero. He becomes something worse — a leader who knows what he's doing is dangerous and does it anyway. The movie doesn't let you root for him comfortably, and that's the point.

The ending doesn't give you resolution. It gives you dread. That's courage in blockbuster filmmaking.

9/10 — Would have been a 10 if they gave Alia more screen time.`,
  },
  {
    id: 2, category: 'movies', title: 'Past Lives', year: 2023, rating: 9,
    status: 'watched', poster: '💫',
    review: 'Quietly devastating. The kind of movie that sits with you for weeks. Greta Lee is incredible. Made me think about every "what if" I\'ve ever had.',
    tags: ['Drama', 'Romance'],
    analysis: null,
  },
  {
    id: 3, category: 'movies', title: 'Oppenheimer', year: 2023, rating: 8,
    status: 'watched', poster: '💣',
    review: 'Nolan at his most restrained and his most ambitious at the same time. RDJ deserved that Oscar. The courtroom scenes hit harder than the bomb.',
    tags: ['Drama', 'History'],
    analysis: null,
  },
  {
    id: 4, category: 'movies', title: 'Everything Everywhere All at Once', year: 2022, rating: 10,
    status: 'watched', poster: '🥯',
    review: 'The most creative movie I\'ve ever seen. It\'s about everything — literally — and somehow it all works. Cried three times. The rock scene broke me.',
    tags: ['Sci-Fi', 'Comedy', 'Drama'],
    analysis: `Everything Everywhere All at Once shouldn't work. A movie about a laundromat owner who discovers the multiverse while doing her taxes. Directed by the guys who made Swiss Army Man. Starring Michelle Yeoh, Ke Huy Quan, and a raccoon puppet. On paper, it's chaos.

On screen, it's the best movie I've seen in years.

What the Daniels did is take every tool that cinema has — action, comedy, drama, absurdism, horror, animation — and used all of them to tell one story about a mother and daughter who can't communicate. Strip away all the multiverse stuff and it's about that. A parent who doesn't understand her kid. A kid who feels unseen. That's it.

The googly eye scene is the most emotionally devastating thing I've watched. Two rocks on a cliff, subtitles on screen, and I'm crying in a theater. How did they do that? They earned it. Every absurd joke, every hot dog finger universe, every silly detail — it all built to that moment where sincerity hits you like a truck because you weren't guarding against it.

Ke Huy Quan's comeback is the feel-good story of the decade. He left acting because Hollywood didn't have roles for him. He came back and won an Oscar. The scene where Waymond says "when I choose to see the good side of things, I'm not being naive. It is strategic and necessary" — that's the thesis of the whole film.

10/10 — I don't give these out often. This one earned it.`,
  },
  {
    id: 5, category: 'movies', title: 'The Brutalist', year: 2025, rating: 0,
    status: 'watchlist', poster: '🏗️',
    review: '', tags: ['Drama'], analysis: null,
  },
  {
    id: 6, category: 'movies', title: 'Sinners', year: 2025, rating: 0,
    status: 'watchlist', poster: '🎸',
    review: '', tags: ['Horror', 'Drama'], analysis: null,
  },

  // TV Shows
  {
    id: 10, category: 'tv', title: 'Severance', year: 2022, rating: 10,
    status: 'watched', poster: '🧠',
    review: 'The best show on TV right now. The concept is genius but the execution is what makes it. Season 2 finale had me standing up in my living room.',
    tags: ['Thriller', 'Sci-Fi'],
    analysis: `Severance asks a simple question: what if you could split yourself in two? One version of you goes to work and knows nothing about your life. The other lives your life and knows nothing about work. Clean separation. No bleeding.

Except it does bleed. That's the show.

The genius of Severance isn't the concept — it's the execution. The Lumon office is designed to feel wrong. The lighting, the corridors, the way people talk. Everything is slightly off. It's corporate dystopia played completely straight, which makes it more unsettling than any horror show.

Adam Scott plays Mark with this quiet devastation that builds across both seasons. He's a man who chose to sever himself because the grief of losing his wife was too much to carry for a full day. That's not sci-fi. That's something real people wish they could do.

Season 2 raised the stakes in every direction. The finale — without spoiling it — is one of those TV moments where you realize the show was always heading here, you just couldn't see it. I was on my feet. Literally standing in my living room.

The show respects your intelligence. It doesn't explain things twice. It trusts you to sit with the discomfort. That's rare.

10/10 — The best show on television. Not a hot take. A fact.`,
  },
  {
    id: 11, category: 'tv', title: 'The Bear', year: 2022, rating: 9,
    status: 'watched', poster: '🍳',
    review: 'The anxiety of this show is a feature not a bug. Carmy is frustrating in a way that feels real. The Christmas episode is an all-timer. Season 3 dipped a bit but still good.',
    tags: ['Drama', 'Food'],
    analysis: null,
  },
  {
    id: 12, category: 'tv', title: 'Shogun', year: 2024, rating: 9,
    status: 'watched', poster: '⚔️',
    review: 'Slow in the best way. Every frame is a painting. Toranaga is the most compelling character on TV. Felt like reading a great book.',
    tags: ['Drama', 'History'],
    analysis: null,
  },
  {
    id: 13, category: 'tv', title: 'Fallout', year: 2024, rating: 8,
    status: 'watched', poster: '☢️',
    review: 'Didn\'t think a video game adaptation would hit this hard. Walton Goggins is perfect. The world-building respects the source material without being a slave to it.',
    tags: ['Sci-Fi', 'Action'],
    analysis: null,
  },
  {
    id: 14, category: 'tv', title: 'Arcane', year: 2021, rating: 10,
    status: 'watched', poster: '⚡',
    review: 'Animation at its absolute peak. The art style, the story, the music. I don\'t even play League and this is one of my favorite shows ever. Season 2 stuck the landing.',
    tags: ['Animation', 'Action'],
    analysis: null,
  },
  {
    id: 15, category: 'tv', title: 'White Lotus S3', year: 2025, rating: 0,
    status: 'watchlist', poster: '🌺',
    review: '', tags: ['Drama', 'Satire'], analysis: null,
  },
]

function StarRating({ rating, size = 11 }) {
  return (
    <span className="inline-flex gap-0">
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} style={{ color: i < rating ? '#FFD700' : '#333', fontSize: size }}>
          {i < rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

function ReviewCard({ item, isSelected, onClick, onDoubleClick }) {
  return (
    <div
      className="flex items-start gap-2 px-3 py-2 cursor-pointer"
      style={{
        background: isSelected ? '#1a1a3a' : 'transparent',
        borderBottom: '1px solid #1a1a2a',
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
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
          {item.analysis && (
            <span className="text-xs px-1" style={{ background: '#2a1a0a', color: '#FF6B35', fontSize: 8 }}>IN-DEPTH</span>
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

// ── Full page review ──
function FullReview({ item, onBack }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0f0f1a', fontFamily: 'monospace', color: '#F0EBE1' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ background: '#1a1a30', borderBottom: '1px solid #2a2a4a' }}>
        <button
          onClick={onBack}
          className="text-xs border-none bg-transparent cursor-pointer underline"
          style={{ color: '#FF6B35', fontFamily: 'inherit' }}
        >
          ← Back
        </button>
        <span style={{ color: '#555' }}>|</span>
        <span className="text-sm">{item.poster}</span>
        <span className="font-bold text-sm">{item.title}</span>
        <span className="text-xs" style={{ color: '#555' }}>({item.year})</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 24px' }}>
          {/* Hero */}
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">{item.poster}</div>
            <h1 style={{ fontSize: 20, fontWeight: 'bold', margin: '0 0 4px', color: '#F0EBE1' }}>{item.title}</h1>
            <div className="text-xs mb-2" style={{ color: '#666' }}>{item.year} · {item.tags.join(' · ')}</div>
            <StarRating rating={item.rating} size={14} />
            <div className="text-xs mt-1" style={{ color: '#888' }}>{item.rating}/10</div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#2a2a4a', margin: '16px 0' }} />

          {/* Quick take */}
          <div className="mb-4">
            <div className="text-xs font-bold mb-1" style={{ color: '#FF6B35' }}>Quick Take</div>
            <div className="text-sm leading-relaxed" style={{ color: '#ccc' }}>{item.review}</div>
          </div>

          {/* In-depth analysis */}
          {item.analysis && (
            <>
              <div style={{ height: 1, background: '#2a2a4a', margin: '16px 0' }} />
              <div>
                <div className="text-xs font-bold mb-2" style={{ color: '#FF6B35' }}>Full Analysis</div>
                {item.analysis.split('\n\n').map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed mb-3" style={{ color: '#aaa' }}>
                    {para}
                  </p>
                ))}
              </div>
            </>
          )}

          {/* Tags */}
          <div style={{ height: 1, background: '#2a2a4a', margin: '16px 0' }} />
          <div className="flex gap-1 flex-wrap">
            {item.tags.map(t => (
              <span key={t} className="text-xs px-2 py-0.5" style={{ background: '#1a1a30', color: '#666' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="px-3 py-0.5 text-xs shrink-0" style={{ background: '#1a1a30', borderTop: '1px solid #2a2a4a', color: '#444' }}>
        {item.title} ({item.year}) — {item.rating}/10
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MOBILE VIEW — IMDb/streaming app style
// ══════════════════════════════════════════

function MobileReviewCard({ item, onTap }) {
  return (
    <div onClick={() => onTap(item.id)} style={{ padding: '12px 16px', background: '#fff', borderBottom: '0.5px solid #e5e5ea', display: 'flex', gap: 12, alignItems: 'center', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, shrink: 0 }}>
        {item.poster}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
        <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>
          {item.year} · {item.tags.join(', ')}
        </div>
        {item.status === 'watched' && (
          <div style={{ fontSize: 11, color: '#FF9500', marginTop: 2 }}>{'★'.repeat(Math.round(item.rating / 2))}{'☆'.repeat(5 - Math.round(item.rating / 2))} {item.rating}/10</div>
        )}
        {item.status === 'watchlist' && (
          <div style={{ fontSize: 11, color: '#007AFF', marginTop: 2 }}>Watchlist</div>
        )}
      </div>
      <span style={{ color: '#c7c7cc', fontSize: 16 }}>›</span>
    </div>
  )
}

function MobileReviewDetail({ item, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      <div className="flex items-center px-3 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea' }}>
        <button onClick={onBack} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15, fontFamily: 'inherit' }}>‹ Back</button>
      </div>
      <div className="flex-1 overflow-auto">
        <div style={{ textAlign: 'center', padding: '20px 16px 12px' }}>
          <div style={{ fontSize: 50, marginBottom: 8 }}>{item.poster}</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{item.title}</div>
          <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 4 }}>{item.year} · {item.tags.join(' · ')}</div>
          {item.status === 'watched' && (
            <div style={{ fontSize: 16, color: '#FF9500', marginTop: 8 }}>{'★'.repeat(Math.round(item.rating / 2))}{'☆'.repeat(5 - Math.round(item.rating / 2))} <span style={{ color: '#000', fontWeight: 600 }}>{item.rating}/10</span></div>
          )}
        </div>
        {item.review && (
          <div style={{ padding: '12px 16px', borderTop: '0.5px solid #e5e5ea' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#8e8e93', marginBottom: 6, textTransform: 'uppercase' }}>Quick Take</div>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: '#333' }}>{item.review}</div>
          </div>
        )}
        {item.analysis && (
          <div style={{ padding: '12px 16px', borderTop: '0.5px solid #e5e5ea' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#8e8e93', marginBottom: 6, textTransform: 'uppercase' }}>Full Analysis</div>
            {item.analysis.split('\n\n').map((p, i) => (
              <p key={i} style={{ fontSize: 15, lineHeight: 1.6, color: '#333', margin: '0 0 12px' }}>{p}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MobileReviews() {
  const [category, setCategory] = useState('movies')
  const [openId, setOpenId] = useState(null)

  const filtered = REVIEWS.filter(r => r.category === category).sort((a, b) => {
    if (a.status === 'watchlist' && b.status !== 'watchlist') return 1
    if (b.status === 'watchlist' && a.status !== 'watchlist') return -1
    return b.rating - a.rating
  })

  const openItem = REVIEWS.find(r => r.id === openId)
  if (openItem) return <MobileReviewDetail item={openItem} onBack={() => setOpenId(null)} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f2f2f7', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      {/* Segmented control */}
      <div style={{ padding: '8px 16px', background: '#f2f2f7' }}>
        <div style={{ display: 'flex', background: '#e5e5ea', borderRadius: 8, padding: 2 }}>
          {[{ id: 'movies', label: 'Movies' }, { id: 'tv', label: 'TV Shows' }].map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} className="flex-1 border-none cursor-pointer" style={{ padding: '6px 0', borderRadius: 6, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', background: category === c.id ? '#fff' : 'transparent', color: '#000', boxShadow: category === c.id ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {filtered.map(item => <MobileReviewCard key={item.id} item={item} onTap={setOpenId} />)}
      </div>
    </div>
  )
}

export default function Reviews() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [category, setCategory] = useState('movies')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [openId, setOpenId] = useState(null)

  if (isMobile) return <MobileReviews />

  const filtered = REVIEWS
    .filter(r => r.category === category)
    .filter(r => filter === 'all' || r.status === filter)
    .sort((a, b) => {
      if (a.status === 'watchlist' && b.status !== 'watchlist') return 1
      if (b.status === 'watchlist' && a.status !== 'watchlist') return -1
      return b.rating - a.rating
    })

  const selected = REVIEWS.find(r => r.id === selectedId)
  const openItem = REVIEWS.find(r => r.id === openId)

  if (openItem) {
    return <FullReview item={openItem} onBack={() => setOpenId(null)} />
  }

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
              onDoubleClick={() => { if (item.status === 'watched') setOpenId(item.id) }}
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
                {selected.analysis && (
                  <button
                    onClick={() => setOpenId(selected.id)}
                    className="mt-3 w-full px-2 py-1 text-xs border-none cursor-pointer"
                    style={{ background: '#2a2a4a', color: '#FF6B35', fontFamily: 'inherit' }}
                  >
                    Read Full Analysis →
                  </button>
                )}
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

            {selected.status === 'watched' && (
              <div className="text-center mt-3 text-xs" style={{ color: '#333' }}>
                Double-click to open full review
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="px-3 py-0.5 text-xs shrink-0" style={{ background: '#1a1a30', borderTop: '1px solid #2a2a4a', color: '#444' }}>
        {selected ? `${selected.title} — double-click for full review` : 'Click a title for details · Double-click for full review'}
      </div>
    </div>
  )
}
