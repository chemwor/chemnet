import { useState, useEffect } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { supabase } from '../../lib/supabase'

const CATEGORIES = [
  { id: 'been', label: 'Been To', icon: '✅' },
  { id: 'want', label: 'Want To Try', icon: '📍' },
  { id: 'cook', label: 'Want To Cook', icon: '👨‍🍳' },
]

const RESTAURANTS = [
  // Been to
  {
    id: 1, status: 'been', name: 'Carnivore', location: 'Nairobi, Kenya', cuisine: 'BBQ / Game Meat',
    rating: 9, icon: '🥩',
    review: 'The beast of a feast. All-you-can-eat game meat served on Maasai swords. Crocodile, ostrich, the works. Tourist trap? Maybe. Worth it? Absolutely.',
    favorite: 'Ostrich meatballs + the dawa cocktail',
    vibe: 'Safari lodge meets food hall',
  },
  {
    id: 2, status: 'been', name: 'About Thyme', location: 'Nairobi, Kenya', cuisine: 'Modern European',
    rating: 8, icon: '🌿',
    review: 'Clean, thoughtful plating. The kind of restaurant where the chef actually cares. Great wine list. Service is on point without being stuffy.',
    favorite: 'Lamb shank',
    vibe: 'Date night, impress someone',
  },
  {
    id: 3, status: 'been', name: 'Mama Oliech', location: 'Nairobi, Kenya', cuisine: 'Kenyan / Fish',
    rating: 9, icon: '🐟',
    review: 'The best fish in Nairobi, full stop. Fried tilapia with ugali and sukuma wiki. No frills, just legendary food. Obama ate here. Enough said.',
    favorite: 'Fried whole tilapia + ugali',
    vibe: 'No-nonsense, the food speaks',
  },
  {
    id: 4, status: 'been', name: 'Kilimanjaro Jamia', location: 'Nairobi, Kenya', cuisine: 'Swahili / Coast',
    rating: 8, icon: '🍛',
    review: 'Biryanis that hit different. This is comfort food for the soul. Old school Nairobi institution. The mishkaki is a must.',
    favorite: 'Chicken biryani + mishkaki',
    vibe: 'Local legend, been here forever',
  },
  {
    id: 5, status: 'been', name: 'Hereford & Hops', location: 'Nairobi, Kenya', cuisine: 'Gastropub',
    rating: 7, icon: '🍔',
    review: 'Solid burgers, good craft beer selection. Nothing revolutionary but consistent. Good place to catch a game with friends.',
    favorite: 'The classic burger + a pale ale',
    vibe: 'Casual hangout, sports bar energy',
  },
  {
    id: 6, status: 'been', name: 'Tin Roof Café', location: 'Nairobi, Kenya', cuisine: 'Brunch / Café',
    rating: 8, icon: '☕',
    review: 'Best brunch spot in Karen. The garden setting is beautiful. Eggs benny is reliable. Coffee is great. Go early on weekends — it fills up fast.',
    favorite: 'Eggs benedict + fresh juice',
    vibe: 'Weekend brunch, garden vibes',
  },

  // Want to try
  {
    id: 20, status: 'want', name: 'Nobu', location: 'Malibu, CA', cuisine: 'Japanese',
    rating: 0, icon: '🍣',
    review: '',
    favorite: '',
    why: 'The black cod miso is legendary. Need to experience it at the Malibu location.',
  },
  {
    id: 21, status: 'want', name: 'Supper', location: 'Nairobi, Kenya', cuisine: 'Pan-Asian',
    rating: 0, icon: '🥢',
    review: '',
    favorite: '',
    why: 'Everyone keeps telling me to go. Pan-Asian fusion in Westlands. The sushi is supposedly incredible.',
  },
  {
    id: 22, status: 'want', name: 'Sushi Saito', location: 'Tokyo, Japan', cuisine: 'Omakase',
    rating: 0, icon: '🏯',
    review: '',
    favorite: '',
    why: 'Three Michelin stars. 8-seat counter. The ultimate sushi experience. Life goal.',
  },
  {
    id: 23, status: 'want', name: 'Asador Etxebarri', location: 'Basque Country, Spain', cuisine: 'Grill',
    rating: 0, icon: '🔥',
    review: '',
    favorite: '',
    why: 'They grill everything — even the dessert. Top 10 in the world. The smoky flavors are supposed to be unreal.',
  },
  {
    id: 24, status: 'want', name: 'Franklin BBQ', location: 'Austin, TX', cuisine: 'BBQ',
    rating: 0, icon: '🍖',
    review: '',
    favorite: '',
    why: 'The 4-hour line is the price of admission. Brisket that people say changes your understanding of what meat can be.',
  },

  // Want to cook
  {
    id: 30, status: 'cook', name: 'Birria Tacos', location: 'Home', cuisine: 'Mexican',
    rating: 0, icon: '🌮',
    review: '', favorite: '', vibe: '',
    why: 'The consomme dip makes these. Saw a video and now I can\'t stop thinking about it. Need a dutch oven first.',
  },
  {
    id: 31, status: 'cook', name: 'Homemade Ramen (Tonkotsu)', location: 'Home', cuisine: 'Japanese',
    rating: 0, icon: '🍜',
    review: '', favorite: '', vibe: '',
    why: 'The broth takes 12+ hours. It\'s a weekend project. Want to nail the soft-boiled egg too.',
  },
  {
    id: 32, status: 'cook', name: 'Pilau (Kenyan spiced rice)', location: 'Home', cuisine: 'Kenyan',
    rating: 0, icon: '🍛',
    review: '', favorite: '', vibe: '',
    why: 'Mom makes the best pilau. Need to get her recipe and actually learn it properly instead of just eating it.',
  },
  {
    id: 33, status: 'cook', name: 'Smash Burgers', location: 'Home', cuisine: 'American',
    rating: 0, icon: '🍔',
    review: '', favorite: '', vibe: '',
    why: 'Cast iron, American cheese, Martin\'s potato bun. Simple but I want to perfect the technique.',
  },
  {
    id: 34, status: 'cook', name: 'Beef Wellington', location: 'Home', cuisine: 'British',
    rating: 0, icon: '🥩',
    review: '', favorite: '', vibe: '',
    why: 'The Gordon Ramsay of it all. This is the cooking boss fight. Probably going to fail the first time.',
  },
]

function StarRating({ rating }) {
  return (
    <span className="inline-flex gap-0">
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} style={{ color: i < rating ? '#FFD700' : '#333', fontSize: 10 }}>
          {i < rating ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

function RestaurantCard({ item, isSelected, onClick }) {
  return (
    <div
      className="flex items-start gap-2 px-3 py-2 cursor-pointer"
      style={{
        background: isSelected ? '#1f1a14' : 'transparent',
        borderBottom: '1px solid #1a1812',
      }}
      onClick={onClick}
    >
      <span className="text-xl shrink-0">{item.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs truncate" style={{ color: '#F0EBE1' }}>{item.name}</span>
          {item.status === 'been' && <StarRating rating={item.rating} />}
          {item.status === 'want' && (
            <span className="text-xs px-1" style={{ background: '#2a2218', color: '#FF6B35', fontSize: 8 }}>BUCKET LIST</span>
          )}
          {item.status === 'cook' && (
            <span className="text-xs px-1" style={{ background: '#1a2a18', color: '#4ADE80', fontSize: 8 }}>WANT TO COOK</span>
          )}
        </div>
        <div className="text-xs" style={{ color: '#888' }}>{item.location} · {item.cuisine}</div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MOBILE VIEW — Yelp/Maps style
// ══════════════════════════════════════════

function MobileRestaurantDetail({ item, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      <div className="flex items-center px-3 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea' }}>
        <button onClick={onBack} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15, fontFamily: 'inherit' }}>‹ Back</button>
      </div>
      <div className="flex-1 overflow-auto">
        <div style={{ textAlign: 'center', padding: '20px 16px 12px' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>{item.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{item.name}</div>
          <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 4 }}>{item.location} · {item.cuisine}</div>
          {item.status === 'been' && item.rating > 0 && (
            <div style={{ fontSize: 14, color: '#FF9500', marginTop: 8 }}>{'★'.repeat(Math.round(item.rating / 2))}{'☆'.repeat(5 - Math.round(item.rating / 2))} {item.rating}/10</div>
          )}
        </div>
        {item.review && (
          <div style={{ padding: '12px 16px', borderTop: '0.5px solid #e5e5ea' }}>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: '#333' }}>{item.review}</div>
          </div>
        )}
        {item.favorite && (
          <div style={{ padding: '12px 16px', borderTop: '0.5px solid #e5e5ea' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#FF9500', marginBottom: 4 }}>ORDER THIS</div>
            <div style={{ fontSize: 15, color: '#333' }}>{item.favorite}</div>
          </div>
        )}
        {item.vibe && (
          <div style={{ padding: '12px 16px', borderTop: '0.5px solid #e5e5ea' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8e8e93', marginBottom: 4 }}>VIBE</div>
            <div style={{ fontSize: 15, color: '#333' }}>{item.vibe}</div>
          </div>
        )}
        {item.why && (
          <div style={{ padding: '12px 16px', borderTop: '0.5px solid #e5e5ea' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#007AFF', marginBottom: 4 }}>WHY I WANT TO GO</div>
            <div style={{ fontSize: 15, color: '#333', lineHeight: 1.6 }}>{item.why}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function MobileRestaurants({ data }) {
  const items = data || RESTAURANTS
  const [tab, setTab] = useState('been')
  const [openId, setOpenId] = useState(null)

  const filtered = items.filter(r => r.status === tab)
  const openItem = items.find(r => r.id === openId)

  if (openItem) return <MobileRestaurantDetail item={openItem} onBack={() => setOpenId(null)} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f2f2f7', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      {/* Segmented control */}
      <div style={{ padding: '8px 16px', background: '#f2f2f7' }}>
        <div style={{ display: 'flex', background: '#e5e5ea', borderRadius: 8, padding: 2 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setTab(c.id)} className="flex-1 border-none cursor-pointer" style={{ padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', background: tab === c.id ? '#fff' : 'transparent', color: '#000', boxShadow: tab === c.id ? '0 1px 2px rgba(0,0,0,0.1)' : 'none' }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {filtered.map(item => (
          <div key={item.id} onClick={() => setOpenId(item.id)} style={{ padding: '12px 16px', background: '#fff', borderBottom: '0.5px solid #e5e5ea', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#000' }}>{item.name}</div>
              <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>{item.location} · {item.cuisine}</div>
              {item.status === 'been' && item.rating > 0 && (
                <div style={{ fontSize: 11, color: '#FF9500', marginTop: 2 }}>{'★'.repeat(Math.round(item.rating / 2))} {item.rating}/10</div>
              )}
            </div>
            <span style={{ color: '#c7c7cc', fontSize: 16 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Restaurants() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [data, setData] = useState(RESTAURANTS) // fallback to hardcoded
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('been')
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const controller = new AbortController()
        setTimeout(() => controller.abort(), 3000)
        const { data: rows, error } = await supabase
          .from('restaurants')
          .select('*')
          .order('name')
          .abortSignal(controller.signal)
        if (!error && rows && rows.length > 0) setData(rows)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#12100c', color: '#666', fontFamily: 'monospace' }}>Loading...</div>
  }

  if (isMobile) return <MobileRestaurants data={data} />

  const filtered = data.filter(r => r.status === tab)
  const selected = data.find(r => r.id === selectedId)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#12100c', fontFamily: 'monospace', color: '#F0EBE1' }}>
      {/* Header */}
      <div className="px-3 py-2 shrink-0" style={{ background: '#1a1710', borderBottom: '1px solid #2a2518' }}>
        <div className="flex items-center gap-1">
          <span className="text-sm">🍽️</span>
          <span className="font-bold text-sm">The Food List</span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: '#666' }}>Places I've eaten. Places I need to eat.</div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 py-1 shrink-0" style={{ background: '#14120e', borderBottom: '1px solid #2a2518' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => { setTab(c.id); setSelectedId(null) }}
            className="flex items-center gap-1 px-2 py-0.5 text-xs border-none cursor-pointer"
            style={{
              background: tab === c.id ? '#FF6B35' : 'transparent',
              color: tab === c.id ? '#000' : '#888',
              fontFamily: 'inherit',
            }}
          >
            <span>{c.icon}</span> {c.label}
          </button>
        ))}
        <span className="ml-auto text-xs" style={{ color: '#444' }}>{filtered.length} places</span>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* List */}
        <div className="flex-1 overflow-auto">
          {filtered.map(item => (
            <RestaurantCard
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onClick={() => setSelectedId(item.id)}
            />
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="shrink-0 overflow-auto p-3" style={{ width: 220, background: '#14120e', borderLeft: '1px solid #2a2518' }}>
            <div className="text-center text-3xl mb-2">{selected.icon}</div>
            <div className="font-bold text-sm text-center mb-0.5">{selected.name}</div>
            <div className="text-center text-xs mb-1" style={{ color: '#888' }}>{selected.location}</div>
            <div className="text-center text-xs mb-2" style={{ color: '#666' }}>{selected.cuisine}</div>

            {selected.status === 'been' ? (
              <>
                <div className="text-center mb-2">
                  <StarRating rating={selected.rating} />
                  <div className="text-xs" style={{ color: '#888' }}>{selected.rating}/10</div>
                </div>

                <div className="text-xs leading-relaxed mb-3" style={{ color: '#aaa' }}>
                  {selected.review}
                </div>

                {selected.favorite && (
                  <div className="mb-2">
                    <div className="text-xs font-bold mb-0.5" style={{ color: '#FF6B35' }}>Order this:</div>
                    <div className="text-xs" style={{ color: '#ccc' }}>{selected.favorite}</div>
                  </div>
                )}

                {selected.vibe && (
                  <div>
                    <div className="text-xs font-bold mb-0.5" style={{ color: '#FF6B35' }}>Vibe:</div>
                    <div className="text-xs" style={{ color: '#ccc' }}>{selected.vibe}</div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <div className="text-xs font-bold mb-1" style={{ color: '#FF6B35' }}>Why I want to go:</div>
                <div className="text-xs leading-relaxed" style={{ color: '#aaa' }}>{selected.why}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="px-3 py-0.5 text-xs shrink-0" style={{ background: '#1a1710', borderTop: '1px solid #2a2518', color: '#444' }}>
        {selected ? `${selected.name} — ${selected.location}` : 'Click a restaurant for details'}
      </div>
    </div>
  )
}
