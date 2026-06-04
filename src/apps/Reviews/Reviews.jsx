import { useState, useEffect, useCallback } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'
import { useInitialItem } from '../../hooks/useInitialItem'
import { OwnerManager } from '../_shared/OwnerManager'

const CATEGORIES = [
  { id: 'movies', label: 'Movies' },
  { id: 'tv', label: 'TV Shows' },
  { id: 'anime', label: 'Anime' },
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

// ── Video-store browse pieces (poster cases on shelves) ──
const MEMBERSHIP = 'MEMBER NO. 0 4815 162342'
const CASE_GRADIENTS = [
  ['#3a2c5a', '#171026'], ['#5a2c2c', '#26110f'], ['#2c4a5a', '#0f1f26'],
  ['#5a4a2c', '#261d0f'], ['#2c5a3a', '#0f261a'], ['#4a2c5a', '#1d0f26'],
]
// Deterministic cover gradient (so emoji cases vary but stay stable across renders).
function colorFor(key) {
  let h = 0
  const s = String(key || '')
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const [a, b] = CASE_GRADIENTS[h % CASE_GRADIENTS.length]
  return `linear-gradient(150deg, ${a}, ${b})`
}

// Round rating sticker — gold with the score once rated, neutral "NR" at 0.
function RatingSticker({ rating }) {
  const rated = (rating || 0) > 0
  return (
    <div style={{ position: 'absolute', top: 6, right: 6, width: 30, height: 30, borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(8deg)', background: rated ? 'radial-gradient(circle at 35% 30%, #FFE36B, #F5B800)' : '#cfc7b6', color: '#3a2a00', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', fontFamily: 'monospace' }}>
      <span style={{ fontSize: rated ? 13 : 9, fontWeight: 800, lineHeight: 1 }}>{rated ? rating : 'NR'}</span>
      {rated && <span style={{ fontSize: 6, fontWeight: 700, letterSpacing: 0.5 }}>/10</span>}
    </div>
  )
}

function NewTag() {
  return (
    <div style={{ position: 'absolute', top: 8, left: -2, background: '#e10600', color: '#fff', fontFamily: 'monospace', fontWeight: 800, fontSize: 10, letterSpacing: 1, padding: '2px 9px 2px 6px', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', clipPath: 'polygon(0 0, 100% 0, 88% 50%, 100% 100%, 0 100%)' }}>NEW</div>
  )
}

// A rental case: poster cover + rating sticker (watched) or NEW tag (watchlist),
// title strip below. Click opens the unchanged review detail page.
function PosterCase({ item, onOpen }) {
  const watched = item.status === 'watched'
  return (
    <button className="vhs-case" onClick={() => onOpen(item.id)} title={item.title} style={{ display: 'block', textAlign: 'left', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent', width: '100%' }}>
      <div style={{ position: 'relative', aspectRatio: '2 / 3', background: item.image ? '#000' : colorFor(item.title), border: '2px solid #0a0a0a', borderRadius: 3, overflow: 'hidden', boxShadow: 'inset 4px 0 6px rgba(0,0,0,0.4)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: 'linear-gradient(90deg, rgba(255,255,255,0.18), transparent)' }} />
        {item.image
          ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.6em' }}>{item.poster}</div>}
        {watched ? <RatingSticker rating={item.rating} /> : <NewTag />}
      </div>
      <div style={{ background: '#0c0c12', padding: '4px 6px', borderRadius: '0 0 3px 3px', borderTop: '1px solid #FFD200' }}>
        <div style={{ color: '#F0EBE1', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
        <div style={{ color: '#7a7a8a', fontFamily: 'monospace', fontSize: 9 }}>{item.year}{item.analysis ? ' · IN-DEPTH' : ''}</div>
      </div>
    </button>
  )
}

// Blockbuster-style marquee band (blue + yellow).
function Marquee({ count }) {
  return (
    <div className="shrink-0" style={{ background: 'linear-gradient(#0033A0, #00237a)', borderBottom: '3px solid #FFD200', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#FFD200', fontFamily: '"Arial Black", Impact, sans-serif', fontWeight: 900, fontSize: 18, letterSpacing: 1, textShadow: '1px 1px 0 #001a52', lineHeight: 1 }}>THE VIDEO STORE</div>
        <div style={{ color: '#bcd0ff', fontFamily: 'monospace', fontSize: 10, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>be kind, rewind · {MEMBERSHIP}</div>
      </div>
      <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: 10, textAlign: 'right', opacity: 0.9 }}>{count} on the shelf</div>
    </div>
  )
}

function EmptyStore({ aisle }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8a8a9a', fontFamily: 'monospace' }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>📼</div>
      <div style={{ fontSize: 13 }}>{aisle ? 'No titles in this aisle yet.' : 'The shelves are empty — add your first title.'}</div>
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
            {item.image ? (
              <img src={item.image} alt="" style={{ width: 120, height: 170, borderRadius: 6, objectFit: 'cover', margin: '0 auto 8px', display: 'block', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }} />
            ) : (
              <div className="text-5xl mb-2">{item.poster}</div>
            )}
            <h1 style={{ fontSize: 20, fontWeight: 'bold', margin: '0 0 4px', color: '#F0EBE1' }}>{item.title}</h1>
            <div className="text-xs mb-2" style={{ color: '#666' }}>{item.year} · {(item.tags || []).join(' · ')}</div>
            <StarRating rating={item.rating} size={14} />
            <div className="text-xs mt-1" style={{ color: '#888' }}>{item.rating}/10</div>
            {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs mt-2 inline-block" style={{ color: '#4A90D9' }}>View on IMDb ↗</a>}
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

function MobileReviewDetail({ item, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      <div className="flex items-center px-3 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea' }}>
        <button onClick={onBack} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15, fontFamily: 'inherit' }}>‹ Back</button>
      </div>
      <div className="flex-1 overflow-auto">
        <div style={{ textAlign: 'center', padding: '20px 16px 12px' }}>
          {item.image ? (
            <img src={item.image} alt="" style={{ width: 120, height: 170, borderRadius: 8, objectFit: 'cover', margin: '0 auto 8px', display: 'block', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
          ) : (
            <div style={{ fontSize: 50, marginBottom: 8 }}>{item.poster}</div>
          )}
          <div style={{ fontSize: 20, fontWeight: 700 }}>{item.title}</div>
          <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 4 }}>{item.year} · {(item.tags || []).join(' · ')}</div>
          {item.status === 'watched' && (
            <div style={{ fontSize: 16, color: '#FF9500', marginTop: 8 }}>{'★'.repeat(Math.round((item.rating || 0) / 2))}{'☆'.repeat(5 - Math.round((item.rating || 0) / 2))} <span style={{ color: '#000', fontWeight: 600 }}>{item.rating || 0}/10</span></div>
          )}
          {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 13, color: '#007AFF', textDecoration: 'none' }}>View on IMDb ↗</a>}
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

function MobileReviews({ data }) {
  const items = data || REVIEWS
  const [category, setCategory] = useState('movies')
  const [openId, setOpenId] = useState(null)

  const filtered = filterByCategory(items, category).sort((a, b) => {
    if (a.status === 'watchlist' && b.status !== 'watchlist') return 1
    if (b.status === 'watchlist' && a.status !== 'watchlist') return -1
    return (b.rating || 0) - (a.rating || 0)
  })

  const openItem = items.find(r => r.id === openId)
  if (openItem) return <MobileReviewDetail item={openItem} onBack={() => setOpenId(null)} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#14141c', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      {/* Sticky marquee + segmented control */}
      <div className="shrink-0" style={{ position: 'sticky', top: 0, zIndex: 2 }}>
        <Marquee count={filtered.length} />
        <div style={{ padding: '8px 12px', background: '#101018' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 2 }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)} className="flex-1 border-none cursor-pointer" style={{ padding: '6px 0', borderRadius: 6, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', background: category === c.id ? '#FFD200' : 'transparent', color: category === c.id ? '#001a52' : '#cfcfe0', boxShadow: category === c.id ? '0 1px 2px rgba(0,0,0,0.3)' : 'none' }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto" style={{ padding: 12 }}>
        {items.length === 0 ? <EmptyStore /> : filtered.length === 0 ? <EmptyStore aisle /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {filtered.map(item => <PosterCase key={item.id} item={item} onOpen={setOpenId} />)}
          </div>
        )}
      </div>
    </div>
  )
}

// Filter helper — anime is tv category with Anime tag
function filterByCategory(items, cat) {
  if (cat === 'anime') return items.filter(r => r.tags?.includes('Anime'))
  if (cat === 'tv') return items.filter(r => r.category === 'tv' && !r.tags?.includes('Anime'))
  return items.filter(r => r.category === cat)
}

function ReviewsView({ data, loading }) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [category, setCategory] = useState('movies')
  const [filter, setFilter] = useState('all')
  const [openId, setOpenId] = useState(null)

  // Deep-link: open a specific review when arriving from ChemFeed.
  const initialItem = useInitialItem('reviews')
  useEffect(() => {
    if (!initialItem || !data?.length) return
    const it = data.find(r => String(r.id) === String(initialItem))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (it) setOpenId(it.id)
  }, [initialItem, data])

  if (loading) {
    return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#14141c', color: '#888', fontFamily: 'monospace' }}>Loading…</div>
  }

  if (isMobile) return <MobileReviews data={data} />

  const filtered = filterByCategory(data, category)
    .filter(r => filter === 'all' || r.status === filter)
    .sort((a, b) => {
      if (a.status === 'watchlist' && b.status !== 'watchlist') return 1
      if (b.status === 'watchlist' && a.status !== 'watchlist') return -1
      return (b.rating || 0) - (a.rating || 0)
    })

  const openItem = data.find(r => r.id === openId)
  if (openItem) {
    return <FullReview item={openItem} onBack={() => setOpenId(null)} />
  }

  // Keep the all/watched/watchlist filter, framed as the store's sections.
  const FILTERS = [{ id: 'all', label: 'All' }, { id: 'watched', label: 'In Store' }, { id: 'watchlist', label: 'New Releases' }]

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#14141c', fontFamily: 'monospace', color: '#F0EBE1' }}>
      <Marquee count={filtered.length} />

      {/* Aisle tabs + section filter */}
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0 flex-wrap" style={{ background: '#101018', borderBottom: '1px solid #2a2a3a' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className="px-2.5 py-0.5 text-xs border-none cursor-pointer"
            style={{ background: category === c.id ? '#FFD200' : 'transparent', color: category === c.id ? '#001a52' : '#9a9aae', fontFamily: 'inherit', fontWeight: 700, borderRadius: 3 }}
          >
            {c.label}
          </button>
        ))}
        <div style={{ width: 1, height: 14, background: '#2a2a3a', margin: '0 4px' }} />
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-1.5 py-0.5 text-xs border-none cursor-pointer"
            style={{ background: 'transparent', color: filter === f.id ? '#FFD200' : '#666', fontFamily: 'inherit', textDecoration: filter === f.id ? 'underline' : 'none' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Poster wall */}
      <div className="flex-1 overflow-auto" style={{ padding: 14 }}>
        {data.length === 0 ? <EmptyStore /> : filtered.length === 0 ? <EmptyStore aisle /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 14, alignContent: 'start' }}>
            {filtered.map(item => <PosterCase key={item.id} item={item} onOpen={setOpenId} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Reviews() {
  const repo = useRepo()
  const { node } = useProfile()
  // Eric's hub falls back to the hand-written sample reviews when the DB is
  // empty; a member node shows only that member's rows (no fallback).
  const [data, setData] = useState(node.kind === 'flagship' ? REVIEWS : [])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const rows = await repo.reviews.list()
    if (rows && rows.length > 0) setData(rows)
    setLoading(false)
  }, [repo])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  return (
    <>
      <ReviewsView data={data} loading={loading} />
      <OwnerManager resource="reviews" onChange={load} />
    </>
  )
}
