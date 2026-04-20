import { useState } from 'react'

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'tech', label: 'Tech' },
  { id: 'gear', label: 'Gear' },
  { id: 'experiences', label: 'Experiences' },
  { id: 'home', label: 'Home' },
]

const ITEMS = [
  // Tech
  { id: 1, name: 'Studio Display', category: 'tech', price: 1599, priority: 'high', link: 'apple.com', notes: 'The monitor upgrade. 5K, great speakers, one cable to the MacBook.', acquired: false },
  { id: 2, name: 'Teenage Engineering OP-1 Field', category: 'tech', price: 2199, priority: 'medium', link: 'teenage.engineering', notes: 'The ultimate portable synth/sampler. Way overpriced but I want it anyway.', acquired: false },
  { id: 3, name: 'Stream Deck XL', category: 'tech', price: 249, priority: 'low', link: 'elgato.com', notes: 'For automating workflows. Could map shortcuts, launch apps, control music.', acquired: false },

  // Gear
  { id: 4, name: 'Fender American Pro II Stratocaster', category: 'gear', price: 1799, priority: 'high', link: 'fender.com', notes: 'Upgrade from the MIM. The neck profile on the Pro II is perfect.', acquired: false },
  { id: 5, name: 'Peloton Bike', category: 'gear', price: 1445, priority: 'medium', link: 'onepeloton.com', notes: 'Cardio at home without having to drive to the gym. The classes keep it interesting.', acquired: false },
  { id: 6, name: 'Shoyoroll Gi', category: 'gear', price: 250, priority: 'low', link: 'shoyoroll.com', notes: 'If they ever drop one I actually like. The limited drops are annoying.', acquired: false },

  // Experiences
  { id: 7, name: 'Skydiving', category: 'experiences', price: 300, priority: 'high', link: '', notes: 'Been saying I\'ll do this for years. Just need to commit and book it.', acquired: false },
  { id: 8, name: 'Scuba Certification', category: 'experiences', price: 500, priority: 'medium', link: '', notes: 'PADI Open Water cert. Want to dive in Mombasa and Zanzibar.', acquired: false },
  { id: 9, name: 'Track Day (Autocross)', category: 'experiences', price: 150, priority: 'medium', link: '', notes: 'Take the Accord out on a track day. See what the 2.0T can really do.', acquired: false },

  // Home
  { id: 10, name: 'Espresso Machine', category: 'home', price: 700, priority: 'high', link: '', notes: 'Breville Bambino Plus. Tired of spending $6/day on lattes.', acquired: false },
  { id: 11, name: 'Standing Desk (FlexiSpot E7)', category: 'home', price: 479, priority: 'medium', link: 'flexispot.com', notes: 'The one with the programmable height presets. Need to stop sitting 10 hours.', acquired: false },
]

const PRIORITY_COLORS = {
  high: { color: '#FF6B35', label: '!!!' },
  medium: { color: '#FBBF24', label: '!!' },
  low: { color: '#888', label: '!' },
}

export default function WishList() {
  const [category, setCategory] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const filtered = ITEMS.filter(i => category === 'all' || i.category === category)
  const selected = ITEMS.find(i => i.id === selectedId)
  const totalWant = filtered.reduce((sum, i) => sum + i.price, 0)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0f0a14', fontFamily: 'monospace', color: '#F0EBE1' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ background: '#1a1020', borderBottom: '1px solid #2a2030' }}>
        <div className="flex items-center gap-1">
          <span>✨</span>
          <span className="font-bold text-sm">Wish List</span>
        </div>
        <span className="text-xs" style={{ color: '#888' }}>Total: ${totalWant.toLocaleString()}</span>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-1 px-3 py-1 shrink-0" style={{ background: '#12101a', borderBottom: '1px solid #2a2030' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => { setCategory(c.id); setSelectedId(null) }}
            className="px-2 py-0.5 text-xs border-none cursor-pointer"
            style={{
              background: category === c.id ? '#FF6B35' : 'transparent',
              color: category === c.id ? '#000' : '#666',
              fontFamily: 'inherit',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* List */}
        <div className="flex-1 overflow-auto">
          {filtered.map(item => {
            const pri = PRIORITY_COLORS[item.priority]
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                style={{
                  background: selectedId === item.id ? '#1a1030' : 'transparent',
                  borderBottom: '1px solid #1a1018',
                }}
                onClick={() => setSelectedId(item.id)}
              >
                <span className="text-xs shrink-0" style={{ color: pri.color }}>{pri.label}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: item.acquired ? '#4ADE80' : '#F0EBE1' }}>
                    {item.acquired && '✓ '}{item.name}
                  </div>
                  <div className="text-xs" style={{ color: '#555' }}>{item.category}</div>
                </div>
                <span className="text-xs shrink-0" style={{ color: '#888' }}>${item.price.toLocaleString()}</span>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="shrink-0 overflow-auto p-3" style={{ width: 200, background: '#12101a', borderLeft: '1px solid #2a2030' }}>
            <div className="font-bold text-sm mb-1">{selected.name}</div>
            <div className="text-xs mb-1" style={{ color: '#888' }}>{selected.category} · ${selected.price}</div>
            <div className="text-xs mb-2" style={{ color: PRIORITY_COLORS[selected.priority].color }}>
              Priority: {selected.priority}
            </div>
            {selected.notes && (
              <div className="text-xs leading-relaxed mb-2" style={{ color: '#aaa' }}>{selected.notes}</div>
            )}
            {selected.link && (
              <div className="text-xs" style={{ color: '#555' }}>🔗 {selected.link}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
