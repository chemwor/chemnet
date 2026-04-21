import { useState, useEffect } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { supabase } from '../../lib/supabase'

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'tech', label: '💻 Tech' },
  { id: 'fashion', label: '👟 Fashion' },
  { id: 'home', label: '🏠 Home' },
  { id: 'gear', label: '⚙️ Gear' },
  { id: 'experiences', label: '🎯 Experiences' },
  { id: 'food', label: '🍕 Food' },
  { id: 'other', label: '📦 Other' },
]

import { WISHLIST_ITEMS } from './wishlist-data'

function PriorityBadge({ priority }) {
  const styles = {
    high: { bg: '#3a1a1a', color: '#FF6B35', label: 'WANT' },
    medium: { bg: '#2a2a1a', color: '#FBBF24', label: 'NICE' },
    low: { bg: '#1a1a2a', color: '#60A5FA', label: 'SOMEDAY' },
  }
  const s = styles[priority] || styles.medium
  return <span style={{ background: s.bg, color: s.color, fontSize: 8, padding: '2px 5px' }}>{s.label}</span>
}

// ── Desktop View ──
function DesktopWishList({ items }) {
  const [category, setCategory] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const filtered = category === 'all' ? items : items.filter(i => i.category === category)
  const selected = items.find(i => i.id === selectedId)
  const totalWant = filtered.reduce((sum, i) => sum + (i.price || 0), 0)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0f0a14', fontFamily: 'monospace', color: '#F0EBE1' }}>
      <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ background: '#1a1020', borderBottom: '1px solid #2a2030' }}>
        <div className="flex items-center gap-1">
          <span>✨</span>
          <span className="font-bold text-sm">Wish List</span>
        </div>
        <span className="text-xs" style={{ color: '#888' }}>
          {filtered.length} items · ${totalWant.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center gap-1 px-3 py-1 shrink-0 flex-wrap" style={{ background: '#12101a', borderBottom: '1px solid #2a2030' }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => { setCategory(c.id); setSelectedId(null) }} className="px-2 py-0.5 text-xs border-none cursor-pointer" style={{ background: category === c.id ? '#FF6B35' : 'transparent', color: category === c.id ? '#000' : '#666', fontFamily: 'inherit' }}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <div className="flex-1 overflow-auto">
          {filtered.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2 cursor-pointer"
              style={{ background: selectedId === item.id ? '#1a1030' : 'transparent', borderBottom: '1px solid #1a1018' }}
              onClick={() => setSelectedId(item.id)}
            >
              {item.image ? (
                <img src={item.image} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 4, background: '#1a1a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎁</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate" style={{ color: item.acquired ? '#4ADE80' : '#F0EBE1' }}>
                  {item.acquired && '✓ '}{item.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <PriorityBadge priority={item.priority} />
                  <span className="text-xs" style={{ color: '#555' }}>{item.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs" style={{ color: '#888' }}>
                  {item.price > 0 ? `$${item.price.toLocaleString()}` : ''}
                </span>
                {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs" style={{ color: '#4A90D9' }}>🔗</a>}
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="shrink-0 overflow-auto p-3" style={{ width: 220, background: '#12101a', borderLeft: '1px solid #2a2030' }}>
            {selected.image && <img src={selected.image} alt="" style={{ width: '100%', borderRadius: 6, marginBottom: 8, objectFit: 'cover', maxHeight: 160 }} />}
            <div className="font-bold text-sm mb-1">{selected.name}</div>
            {selected.price > 0 && <div className="text-xs mb-1" style={{ color: '#FF6B35' }}>${selected.price.toLocaleString()}</div>}
            <div className="flex gap-1 mb-2">
              <PriorityBadge priority={selected.priority} />
              <span className="text-xs" style={{ color: '#555' }}>{selected.category}</span>
            </div>
            {selected.notes && <div className="text-xs leading-relaxed mb-2" style={{ color: '#aaa' }}>{selected.notes}</div>}
            {selected.link && <a href={selected.link} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: '#4A90D9' }}>🔗 View Product</a>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Mobile View — iOS Shopping List style ��─
function MobileWishList({ items }) {
  const [category, setCategory] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const filtered = category === 'all' ? items : items.filter(i => i.category === category)
  const selected = items.find(i => i.id === selectedId)

  if (selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
        <div className="flex items-center px-3 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea' }}>
          <button onClick={() => setSelectedId(null)} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15, fontFamily: 'inherit' }}>‹ Back</button>
        </div>
        <div className="flex-1 overflow-auto">
          {selected.image && <img src={selected.image} alt="" style={{ width: '100%', maxHeight: 250, objectFit: 'cover' }} />}
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{selected.name}</div>
            {selected.price > 0 && <div style={{ fontSize: 18, color: '#FF9500', fontWeight: 600, marginBottom: 8 }}>${selected.price.toLocaleString()}</div>}
            <div className="flex gap-2 mb-3">
              <span style={{ fontSize: 12, padding: '3px 8px', background: '#f2f2f7', borderRadius: 10, color: '#666' }}>{selected.category}</span>
              <span style={{ fontSize: 12, padding: '3px 8px', background: '#f2f2f7', borderRadius: 10, color: '#666' }}>{selected.priority}</span>
            </div>
            {selected.notes && <div style={{ fontSize: 15, color: '#333', lineHeight: 1.6, marginBottom: 16 }}>{selected.notes}</div>}
            {selected.link && (
              <a href={selected.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#007AFF', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                View Product
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f2f2f7', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      {/* Category pills */}
      <div style={{ padding: '8px 12px', overflowX: 'auto', display: 'flex', gap: 6, background: '#f2f2f7' }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)} className="border-none cursor-pointer shrink-0" style={{ padding: '6px 12px', borderRadius: 16, fontSize: 12, background: category === c.id ? '#007AFF' : '#e5e5ea', color: category === c.id ? '#fff' : '#333', fontFamily: 'inherit' }}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.map(item => (
          <div key={item.id} onClick={() => setSelectedId(item.id)} style={{ padding: '12px 16px', background: '#fff', borderBottom: '0.5px solid #e5e5ea', display: 'flex', gap: 12, alignItems: 'center' }}>
            {item.image ? (
              <img src={item.image} alt="" style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 50, height: 50, borderRadius: 8, background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎁</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: item.acquired ? '#34C759' : '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.acquired && '✓ '}{item.name}
              </div>
              <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>{item.category}</div>
            </div>
            <div style={{ textAlign: 'right', shrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              {item.price > 0 && <div style={{ fontSize: 15, fontWeight: 600, color: '#000' }}>${item.price}</div>}
              {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#007AFF', fontSize: 12, textDecoration: 'none' }}>Link</a>}
              <span style={{ color: '#c7c7cc', fontSize: 16 }}>›</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──
export default function WishList() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [items, setItems] = useState(WISHLIST_ITEMS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Load from Supabase wishlist table when created
    // For now use fallback
    setLoading(false)
  }, [])

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0f0a14', color: '#555', fontFamily: 'monospace' }}>Loading...</div>
  }

  return isMobile ? <MobileWishList items={items} /> : <DesktopWishList items={items} />
}
