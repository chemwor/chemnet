import { useState } from 'react'

const PROJECTS = [
  {
    id: 1, name: 'The Daily', status: 'active',
    car: '2019 Honda Accord Sport 2.0T',
    icon: '🏎️',
    mods: [
      { name: 'Tinted Windows', status: 'done', cost: 250, notes: '20% all around, 50% windshield. Worth every penny.' },
      { name: 'K&N Cold Air Intake', status: 'done', cost: 350, notes: 'Noticeable difference in throttle response. The turbo sounds better too.' },
      { name: 'Ktuner V2', status: 'done', cost: 400, notes: 'Stage 1+ tune. The car woke up. Should have done this first.' },
      { name: 'Coilovers', status: 'planned', cost: 1200, notes: 'Looking at BC Racing BR series. Want a 1.5" drop without sacrificing ride quality.' },
      { name: 'Front Lip', status: 'planned', cost: 200, notes: 'OEM style lip. Nothing crazy, just clean up the front end.' },
      { name: 'Exhaust (Catback)', status: 'researching', cost: 800, notes: 'Torn between RV6 and PRL. Want something deep but not obnoxious.' },
    ],
    photos: [],
    notes: 'The 2.0T is underrated. With the tune it pulls hard. Goal is a clean daily that\'s fun to drive, not a track car.',
  },
]

const STATUS_COLORS = {
  done: { bg: '#1a3a1a', color: '#4ADE80', label: 'DONE' },
  planned: { bg: '#1a1a3a', color: '#60A5FA', label: 'PLANNED' },
  researching: { bg: '#3a2a1a', color: '#FBBF24', label: 'RESEARCHING' },
  'in-progress': { bg: '#3a1a1a', color: '#FF6B35', label: 'IN PROGRESS' },
}

function ModRow({ mod }) {
  const st = STATUS_COLORS[mod.status] || STATUS_COLORS.planned
  return (
    <div className="flex items-start gap-2 px-3 py-2" style={{ borderBottom: '1px solid #1a1a1a' }}>
      <span className="text-xs px-1.5 py-0.5 shrink-0 mt-0.5" style={{ background: st.bg, color: st.color, fontSize: 9 }}>{st.label}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: '#F0EBE1' }}>{mod.name}</span>
          {mod.cost > 0 && <span className="text-xs" style={{ color: '#888' }}>${mod.cost}</span>}
        </div>
        {mod.notes && <div className="text-xs mt-0.5" style={{ color: '#888', lineHeight: 1.4 }}>{mod.notes}</div>}
      </div>
    </div>
  )
}

export default function CarMods() {
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0])
  const [filter, setFilter] = useState('all')

  const filteredMods = selectedProject.mods.filter(m => filter === 'all' || m.status === filter)
  const totalSpent = selectedProject.mods.filter(m => m.status === 'done').reduce((sum, m) => sum + m.cost, 0)
  const totalPlanned = selectedProject.mods.filter(m => m.status !== 'done').reduce((sum, m) => sum + m.cost, 0)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0f0f14', fontFamily: 'monospace', color: '#F0EBE1' }}>
      {/* Header */}
      <div className="px-3 py-2 shrink-0" style={{ background: '#1a1a24', borderBottom: '1px solid #2a2a3a' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{selectedProject.icon}</span>
          <div>
            <div className="font-bold text-sm">{selectedProject.name}</div>
            <div className="text-xs" style={{ color: '#888' }}>{selectedProject.car}</div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 px-3 py-1.5 shrink-0" style={{ background: '#12121a', borderBottom: '1px solid #2a2a3a', fontSize: 10 }}>
        <span style={{ color: '#4ADE80' }}>Spent: ${totalSpent.toLocaleString()}</span>
        <span style={{ color: '#60A5FA' }}>Planned: ${totalPlanned.toLocaleString()}</span>
        <span style={{ color: '#888' }}>{selectedProject.mods.length} mods total</span>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1 px-3 py-1 shrink-0" style={{ background: '#0f0f14', borderBottom: '1px solid #1a1a1a' }}>
        {['all', 'done', 'in-progress', 'planned', 'researching'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-1.5 py-0.5 text-xs border-none cursor-pointer"
            style={{
              background: filter === f ? '#FF6B35' : 'transparent',
              color: filter === f ? '#000' : '#555',
              fontFamily: 'inherit',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Mod list */}
      <div className="flex-1 overflow-auto">
        {filteredMods.map((mod, i) => (
          <ModRow key={i} mod={mod} />
        ))}
      </div>

      {/* Notes */}
      {selectedProject.notes && (
        <div className="px-3 py-2 shrink-0" style={{ background: '#12121a', borderTop: '1px solid #2a2a3a' }}>
          <div className="text-xs" style={{ color: '#666', lineHeight: 1.4 }}>{selectedProject.notes}</div>
        </div>
      )}
    </div>
  )
}
