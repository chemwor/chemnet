import { useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { WISHLIST_ITEMS } from './wishlist-data'

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'fashion', label: 'Fashion & Apparel' },
  { id: 'tech', label: 'Electronics' },
  { id: 'other', label: 'Collectibles & More' },
]

const SORT_OPTIONS = [
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'name', label: 'Name: A-Z' },
  { id: 'priority', label: 'Most Wanted' },
]

function sortItems(items, sort) {
  return [...items].sort((a, b) => {
    if (sort === 'price-high') return b.price - a.price
    if (sort === 'price-low') return a.price - b.price
    if (sort === 'name') return a.name.localeCompare(b.name)
    const pri = { high: 0, medium: 1, low: 2 }
    return (pri[a.priority] ?? 1) - (pri[b.priority] ?? 1)
  })
}

// ══════════════════════════════════════════
// DESKTOP — Early 2000s Shopping Site
// ══════════════════════════════════════════

function DesktopWishList() {
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('priority')
  const [selectedId, setSelectedId] = useState(null)

  const filtered = sortItems(
    category === 'all' ? WISHLIST_ITEMS : WISHLIST_ITEMS.filter(i => i.category === category),
    sort
  )
  const selected = WISHLIST_ITEMS.find(i => i.id === selectedId)
  const totalValue = WISHLIST_ITEMS.reduce((s, i) => s + i.price, 0)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#f5f5f5', fontFamily: 'Verdana, Geneva, Tahoma, sans-serif', color: '#333', fontSize: 12 }}>
      {/* Top banner */}
      <div style={{ background: 'linear-gradient(to bottom, #232f3e, #131921)', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
          ✨ Eric's Wish List
        </div>
        <div style={{ color: '#ccc', fontSize: 10 }}>
          {WISHLIST_ITEMS.length} items · ${totalValue.toLocaleString()} total
        </div>
      </div>

      {/* Nav bar */}
      <div style={{ background: '#37475a', padding: '4px 12px', display: 'flex', gap: 2 }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => { setCategory(c.id); setSelectedId(null) }}
            style={{
              padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: 11,
              background: category === c.id ? '#e47911' : 'transparent',
              color: '#fff', fontFamily: 'inherit',
              borderRadius: 2,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar — category filter + sort */}
        <div style={{ width: 160, background: '#fff', borderRight: '1px solid #ddd', overflow: 'auto', padding: 8, shrink: 0 }}>
          <div style={{ fontWeight: 'bold', fontSize: 11, color: '#c45500', borderBottom: '1px solid #eee', paddingBottom: 4, marginBottom: 6 }}>
            Sort By
          </div>
          {SORT_OPTIONS.map(s => (
            <label key={s.id} style={{ display: 'block', fontSize: 10, padding: '2px 0', cursor: 'pointer' }}>
              <input type="radio" name="sort" checked={sort === s.id} onChange={() => setSort(s.id)} style={{ marginRight: 4 }} />
              {s.label}
            </label>
          ))}

          <div style={{ fontWeight: 'bold', fontSize: 11, color: '#c45500', borderBottom: '1px solid #eee', paddingBottom: 4, marginTop: 12, marginBottom: 6 }}>
            Price Range
          </div>
          <div style={{ fontSize: 10, color: '#555' }}>
            Under $50: {WISHLIST_ITEMS.filter(i => i.price < 50).length}<br />
            $50–$150: {WISHLIST_ITEMS.filter(i => i.price >= 50 && i.price < 150).length}<br />
            $150–$300: {WISHLIST_ITEMS.filter(i => i.price >= 150 && i.price < 300).length}<br />
            $300+: {WISHLIST_ITEMS.filter(i => i.price >= 300).length}
          </div>

          <div style={{ fontWeight: 'bold', fontSize: 11, color: '#c45500', borderBottom: '1px solid #eee', paddingBottom: 4, marginTop: 12, marginBottom: 6 }}>
            Priority
          </div>
          <div style={{ fontSize: 10, color: '#555' }}>
            🔥 Must Have: {WISHLIST_ITEMS.filter(i => i.priority === 'high').length}<br />
            👍 Nice to Have: {WISHLIST_ITEMS.filter(i => i.priority === 'medium').length}<br />
            💭 Someday: {WISHLIST_ITEMS.filter(i => i.priority === 'low').length}
          </div>
        </div>

        {/* Product grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {/* Results header */}
          <div style={{ fontSize: 11, color: '#555', marginBottom: 8, borderBottom: '1px solid #eee', paddingBottom: 4 }}>
            Showing {filtered.length} of {WISHLIST_ITEMS.length} results
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                style={{
                  background: '#fff',
                  border: selectedId === item.id ? '2px solid #e47911' : '1px solid #ddd',
                  padding: 8,
                  cursor: 'pointer',
                  borderRadius: 2,
                }}
              >
                {/* Product image placeholder */}
                <div style={{
                  width: '100%', height: 80, background: '#f7f7f7', borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, marginBottom: 6, border: '1px solid #eee',
                }}>
                  {item.image ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 2 }} /> : '🎁'}
                </div>

                {/* Title */}
                <div style={{ fontSize: 11, color: '#0066c0', fontWeight: 'bold', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {item.name}
                </div>

                {/* Price */}
                <div style={{ fontSize: 14, fontWeight: 'bold', color: '#b12704', marginBottom: 2 }}>
                  ${item.price.toLocaleString()}
                </div>

                {/* Priority */}
                <div style={{ fontSize: 9, color: item.priority === 'high' ? '#b12704' : item.priority === 'medium' ? '#c45500' : '#888' }}>
                  {item.priority === 'high' ? '🔥 Must Have' : item.priority === 'medium' ? '👍 Nice to Have' : '💭 Someday'}
                </div>

                {/* Link */}
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'block', marginTop: 6, fontSize: 10, textAlign: 'center', padding: '3px 6px', background: 'linear-gradient(to bottom, #f7dfa5, #f0c14b)', border: '1px solid #a88734', borderRadius: 2, color: '#111', textDecoration: 'none', fontFamily: 'inherit' }}>
                    View Product
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: 200, background: '#fff', borderLeft: '1px solid #ddd', overflow: 'auto', padding: 10, shrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#0066c0', marginBottom: 4 }}>{selected.name}</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#b12704', marginBottom: 6 }}>${selected.price.toLocaleString()}</div>
            <div style={{ fontSize: 10, marginBottom: 4 }}>
              <span style={{ color: '#007600', fontWeight: 'bold' }}>♦ In Stock</span> — on wish list
            </div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 8 }}>Category: {selected.category}</div>
            {selected.notes && <div style={{ fontSize: 10, color: '#333', lineHeight: 1.4, marginBottom: 8, padding: 6, background: '#fafafa', border: '1px solid #eee' }}>{selected.notes}</div>}
            {selected.link && (
              <a href={selected.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '6px', background: 'linear-gradient(to bottom, #f7dfa5, #f0c14b)', border: '1px solid #a88734', borderRadius: 3, color: '#111', textDecoration: 'none', fontSize: 11, fontWeight: 'bold', fontFamily: 'inherit' }}>
                View on Store ↗
              </a>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: '#232f3e', padding: '4px 12px', textAlign: 'center', fontSize: 9, color: '#999' }}>
        Eric's Wish List · {WISHLIST_ITEMS.length} items · Updated 2026
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MOBILE — Old eBay/shopping app style
// ══════════════════════════════════════════

function MobileWishList() {
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('priority')
  const [selectedId, setSelectedId] = useState(null)

  const filtered = sortItems(
    category === 'all' ? WISHLIST_ITEMS : WISHLIST_ITEMS.filter(i => i.category === category),
    sort
  )
  const selected = WISHLIST_ITEMS.find(i => i.id === selectedId)

  if (selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
        <div className="flex items-center px-3 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea' }}>
          <button onClick={() => setSelectedId(null)} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15, fontFamily: 'inherit' }}>‹ Back</button>
        </div>
        <div className="flex-1 overflow-auto">
          <div style={{ width: '100%', height: 200, background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60 }}>
            {selected.image ? <img src={selected.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎁'}
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selected.name}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#b12704', marginBottom: 8 }}>${selected.price.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: '#007600', fontWeight: 600, marginBottom: 12 }}>♦ On Wish List</div>
            <div className="flex gap-2 mb-3">
              <span style={{ fontSize: 12, padding: '3px 10px', background: '#f2f2f7', borderRadius: 10, color: '#666' }}>{selected.category}</span>
              <span style={{ fontSize: 12, padding: '3px 10px', background: selected.priority === 'high' ? '#fff0e6' : '#f2f2f7', borderRadius: 10, color: selected.priority === 'high' ? '#b12704' : '#666' }}>
                {selected.priority === 'high' ? '🔥 Must Have' : selected.priority === 'medium' ? '👍 Nice' : '💭 Someday'}
              </span>
            </div>
            {selected.notes && <div style={{ fontSize: 14, color: '#555', lineHeight: 1.5, marginBottom: 16 }}>{selected.notes}</div>}
            {selected.link && (
              <a href={selected.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'linear-gradient(to bottom, #f7dfa5, #f0c14b)', border: '1px solid #a88734', borderRadius: 8, color: '#111', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                View on Store ↗
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#eaeded', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#232f3e', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>✨ Wish List</span>
        <span style={{ color: '#ccc', fontSize: 11 }}>{filtered.length} items</span>
      </div>

      {/* Category tabs */}
      <div style={{ padding: '6px 8px', overflowX: 'auto', display: 'flex', gap: 6, background: '#37475a' }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)} className="border-none cursor-pointer shrink-0" style={{ padding: '5px 12px', borderRadius: 14, fontSize: 11, background: category === c.id ? '#e47911' : 'rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'inherit' }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div style={{ padding: '4px 12px', background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10, color: '#555' }}>Sort:</span>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ fontSize: 10, border: '1px solid #ccc', borderRadius: 3, padding: '2px 4px', fontFamily: 'inherit' }}>
          {SORT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {/* Product grid — 2 col on mobile */}
      <div className="flex-1 overflow-auto" style={{ padding: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {filtered.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: 8, cursor: 'pointer' }}
            >
              <div style={{ width: '100%', height: 70, background: '#f9f9f9', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 6 }}>
                {item.image ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} /> : '🎁'}
              </div>
              <div style={{ fontSize: 11, color: '#0066c0', fontWeight: 600, lineHeight: 1.3, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {item.name}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#b12704' }}>${item.price}</div>
              <div style={{ fontSize: 8, color: item.priority === 'high' ? '#b12704' : '#888', marginTop: 2 }}>
                {item.priority === 'high' ? '🔥 Must Have' : item.priority === 'medium' ? '👍 Nice' : '💭 Someday'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function WishList() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  return isMobile ? <MobileWishList /> : <DesktopWishList />
}
