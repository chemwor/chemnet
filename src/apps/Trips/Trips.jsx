import { useState } from 'react'

const TRIPS = [
  {
    id: 4, destination: 'Tokyo, Japan', status: 'planned',
    dates: 'TBD 2026', icon: '🇯🇵',
    summary: 'Sushi Saito. Shibuya. Akihabara. Temples in Kyoto. Ramen.',
    highlights: [],
    photos: [],
    notes: 'The bucket list trip. Want to do 2 weeks minimum — Tokyo, Kyoto, Osaka. Hit as many ramen spots as possible. Sushi Saito if I can get a reservation.',
  },
  {
    id: 5, destination: 'Barcelona, Spain', status: 'planned',
    dates: 'TBD 2026', icon: '🇪🇸',
    summary: 'Sagrada Familia. La Boqueria. Gothic Quarter. Beach. Tapas.',
    highlights: [],
    photos: [],
    notes: 'Architecture + food + beach. The whole package. Would love to catch a Barça game if timing works.',
  },
  { id: 6,  destination: 'Portugal',              status: 'planned', dates: 'TBD', icon: '🇵🇹', summary: '', highlights: [], photos: [], notes: '' },
  { id: 7,  destination: 'Switzerland',           status: 'planned', dates: 'TBD', icon: '🇨🇭', summary: '', highlights: [], photos: [], notes: '' },
  { id: 8,  destination: 'Amsterdam, Netherlands', status: 'planned', dates: 'TBD', icon: '🇳🇱', summary: '', highlights: [], photos: [], notes: '' },
  { id: 9,  destination: 'France',                status: 'planned', dates: 'TBD', icon: '🇫🇷', summary: '', highlights: [], photos: [], notes: '' },
  { id: 10, destination: 'Rome, Italy',           status: 'planned', dates: 'TBD', icon: '🇮🇹', summary: '', highlights: [], photos: [], notes: '' },
  { id: 11, destination: 'Thailand',              status: 'planned', dates: 'TBD', icon: '🇹🇭', summary: '', highlights: [], photos: [], notes: '' },
  { id: 12, destination: 'Mexico',                status: 'planned', dates: 'TBD', icon: '🇲🇽', summary: '', highlights: [], photos: [], notes: '' },
  { id: 13, destination: 'Hong Kong',             status: 'planned', dates: 'TBD', icon: '🇭🇰', summary: '', highlights: [], photos: [], notes: '' },
  { id: 14, destination: 'Ghana',                 status: 'planned', dates: 'TBD', icon: '🇬🇭', summary: '', highlights: [], photos: [], notes: '' },
  { id: 15, destination: 'India',                 status: 'planned', dates: 'TBD', icon: '🇮🇳', summary: '', highlights: [], photos: [], notes: '' },
  { id: 16, destination: 'China',                 status: 'planned', dates: 'TBD', icon: '🇨🇳', summary: '', highlights: [], photos: [], notes: '' },
  { id: 17, destination: 'Brazil',                status: 'planned', dates: 'TBD', icon: '🇧🇷', summary: '', highlights: [], photos: [], notes: '' },
]

const STATUS_STYLES = {
  completed: { bg: '#1a3a1a', color: '#4ADE80', label: 'BEEN' },
  planned: { bg: '#1a1a3a', color: '#60A5FA', label: 'PLANNED' },
  'in-progress': { bg: '#3a2a1a', color: '#FBBF24', label: 'ACTIVE' },
}

function TripCard({ trip, isSelected, onClick }) {
  const st = STATUS_STYLES[trip.status]
  return (
    <div
      className="flex items-start gap-2 px-3 py-2.5 cursor-pointer"
      style={{
        background: isSelected ? '#1a1a2a' : 'transparent',
        borderBottom: '1px solid #1a1a1a',
      }}
      onClick={onClick}
    >
      <span className="text-xl shrink-0">{trip.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm truncate" style={{ color: '#F0EBE1' }}>{trip.destination}</span>
          <span className="text-xs px-1 py-0.5 shrink-0" style={{ background: st.bg, color: st.color, fontSize: 8 }}>{st.label}</span>
        </div>
        <div className="text-xs" style={{ color: '#666' }}>{trip.dates}</div>
        <div className="text-xs mt-0.5 truncate" style={{ color: '#888' }}>{trip.summary}</div>
      </div>
    </div>
  )
}

function TripDetail({ trip }) {
  const st = STATUS_STYLES[trip.status]
  return (
    <div className="p-3 overflow-auto">
      <div className="text-center text-3xl mb-2">{trip.icon}</div>
      <div className="font-bold text-sm text-center mb-0.5">{trip.destination}</div>
      <div className="text-center text-xs mb-1" style={{ color: '#888' }}>{trip.dates}</div>
      <div className="text-center mb-3">
        <span className="text-xs px-1.5 py-0.5" style={{ background: st.bg, color: st.color }}>{st.label}</span>
      </div>

      <div className="text-xs leading-relaxed mb-3" style={{ color: '#aaa' }}>
        {trip.summary}
      </div>

      {trip.highlights.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-bold mb-1" style={{ color: '#FF6B35' }}>Highlights</div>
          {trip.highlights.map((h, i) => (
            <div key={i} className="text-xs pl-2 mb-1" style={{ color: '#aaa' }}>• {h}</div>
          ))}
        </div>
      )}

      {trip.notes && (
        <div>
          <div className="text-xs font-bold mb-1" style={{ color: '#FF6B35' }}>Notes</div>
          <div className="text-xs leading-relaxed" style={{ color: '#888' }}>{trip.notes}</div>
        </div>
      )}

      {trip.photos.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-bold mb-1" style={{ color: '#FF6B35' }}>Photos</div>
          <div className="grid grid-cols-2 gap-1">
            {trip.photos.map((p, i) => (
              <img key={i} src={p} alt="" className="rounded" style={{ width: '100%', height: 60, objectFit: 'cover' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Trips() {
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const filtered = TRIPS.filter(t => filter === 'all' || t.status === filter)
  const selected = TRIPS.find(t => t.id === selectedId)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0f0f1a', fontFamily: 'monospace', color: '#F0EBE1' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ background: '#1a1a30', borderBottom: '1px solid #2a2a4a' }}>
        <div className="flex items-center gap-1">
          <span>✈️</span>
          <span className="font-bold text-sm">Travel Log</span>
        </div>
        <span className="text-xs" style={{ color: '#555' }}>{TRIPS.length} trips</span>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1 px-3 py-1 shrink-0" style={{ background: '#12121f', borderBottom: '1px solid #2a2a4a' }}>
        {['all', 'planned'].map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setSelectedId(null) }}
            className="px-2 py-0.5 text-xs border-none cursor-pointer"
            style={{
              background: filter === f ? '#FF6B35' : 'transparent',
              color: filter === f ? '#000' : '#666',
              fontFamily: 'inherit',
            }}
          >
            {f === 'all' ? 'All' : 'Planned'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* List */}
        <div className="flex-1 overflow-auto">
          {filtered.map(trip => (
            <TripCard
              key={trip.id}
              trip={trip}
              isSelected={selectedId === trip.id}
              onClick={() => setSelectedId(trip.id)}
            />
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="shrink-0 overflow-auto" style={{ width: 220, background: '#12121f', borderLeft: '1px solid #2a2a4a' }}>
            <TripDetail trip={selected} />
          </div>
        )}
      </div>

      {/* Status */}
      <div className="px-3 py-0.5 text-xs shrink-0" style={{ background: '#1a1a30', borderTop: '1px solid #2a2a4a', color: '#444' }}>
        {selected ? selected.destination : 'Click a trip for details'}
      </div>
    </div>
  )
}
