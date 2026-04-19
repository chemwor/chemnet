import { useState } from 'react'

const FOLDERS = {
  root: {
    path: 'C:\\Media\\Music',
    items: [
      { id: 'my-music', name: 'My Music', type: 'folder', icon: '📁', description: 'Music I\'ve made and produced' },
      { id: 'listening', name: 'Current Rotation', type: 'folder', icon: '📁', description: 'What I\'m listening to right now' },
    ],
  },
  'my-music': {
    path: 'C:\\Media\\Music\\My Music',
    items: [
      { name: 'Late Night Sessions - Beat 01.mp3', type: 'audio', size: '4.2 MB', date: '2026-03-10', description: 'Late night piano loop. Chopped and looped until it felt right. Lo-fi vibes.' },
      { name: 'Nairobi Sunrise (Guitar).mp3', type: 'audio', size: '3.8 MB', date: '2026-02-14', description: 'Fingerpicking piece inspired by early mornings in Nairobi. Clean tone, no effects.' },
      { name: 'Demo - Untitled 003.mp3', type: 'audio', size: '5.1 MB', date: '2026-01-28', description: 'Work in progress. Piano, bass, and a beat that\'s almost there but not quite.' },
      { name: 'Guitar Loop - Am7 Progression.mp3', type: 'audio', size: '2.1 MB', date: '2025-12-15', description: 'Simple chord loop I made for sampling. Am7 → Dm9 → G → Cmaj7.' },
      { name: 'First Piano Recording.mp3', type: 'audio', size: '3.4 MB', date: '2025-10-20', description: 'First thing I recorded when I got the keyboard. Rough but honest.' },
    ],
  },
  listening: {
    path: 'C:\\Media\\Music\\Current Rotation',
    items: [
      { name: '── Hip Hop / Rap ──', type: 'header' },
      { name: 'Kendrick Lamar - GNX', type: 'album', date: '2025', description: 'Kendrick doing what Kendrick does. Every track hits.' },
      { name: 'J. Cole - The Fall Off', type: 'album', date: '2025', description: 'Cole went back to his roots. The storytelling is unmatched.' },
      { name: 'Tyler, the Creator - CHROMAKOPIA', type: 'album', date: '2025', description: 'Tyler keeps evolving. The production on this is insane.' },
      { name: '', type: 'spacer' },
      { name: '── Afrobeats / African ──', type: 'header' },
      { name: 'Burna Boy - I Told Them', type: 'album', date: '2024', description: 'The African Giant. This album is a whole mood.' },
      { name: 'Wizkid - Morayo', type: 'album', date: '2024', description: 'Big Wiz with the vibes. Smooth from front to back.' },
      { name: 'Sauti Sol - Midnight Train', type: 'album', date: '2020', description: 'Kenyan excellence. Still in rotation years later.' },
      { name: '', type: 'spacer' },
      { name: '── Other ──', type: 'header' },
      { name: 'Daniel Caesar - Never Enough', type: 'album', date: '2023', description: 'Silky vocals over lush production. Late night essential.' },
      { name: 'Mac Miller - Circles', type: 'album', date: '2020', description: 'Still beautiful. Still hurts. Still perfect.' },
      { name: 'Khruangbin - A La Sala', type: 'album', date: '2024', description: 'Vibes only. No genre, just feelings.' },
    ],
  },
}

const ICON_MAP = {
  folder: '📁',
  audio: '🎵',
  album: '💿',
  header: '',
  spacer: '',
}

function FileRow({ item, isSelected, onClick, onDoubleClick }) {
  if (item.type === 'spacer') {
    return <div style={{ height: 8 }} />
  }
  if (item.type === 'header') {
    return (
      <div className="px-2 py-1" style={{ fontFamily: 'monospace', fontSize: 11, color: '#888', fontWeight: 'bold' }}>
        {item.name}
      </div>
    )
  }
  return (
    <div
      className="flex items-center px-2 py-1 cursor-pointer gap-2"
      style={{
        background: isSelected ? '#000080' : 'transparent',
        color: isSelected ? '#fff' : '#000',
        fontFamily: 'monospace',
        fontSize: 12,
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <span className="text-sm shrink-0">{ICON_MAP[item.type] || '📄'}</span>
      <div className="flex-1 truncate">{item.name}</div>
      <div style={{ width: 50, textAlign: 'right', color: isSelected ? '#ccc' : '#666' }}>{item.size || ''}</div>
      <div style={{ width: 50, textAlign: 'right', color: isSelected ? '#ccc' : '#666' }}>{item.date || ''}</div>
    </div>
  )
}

export default function Music() {
  const [currentFolder, setCurrentFolder] = useState('root')
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [preview, setPreview] = useState(null)

  const folder = FOLDERS[currentFolder]
  const items = folder.items
  const selectableItems = items.filter(i => i.type !== 'header' && i.type !== 'spacer')

  const handleDoubleClick = (item) => {
    if (item.type === 'folder') {
      setCurrentFolder(item.id)
      setSelectedIdx(-1)
      setPreview(null)
    } else if (item.type !== 'header' && item.type !== 'spacer') {
      setPreview(item)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#fff' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-2 py-1 shrink-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)' }}>
        {currentFolder !== 'root' && (
          <button
            onClick={() => { setCurrentFolder('root'); setSelectedIdx(-1); setPreview(null) }}
            className="text-xs border-none bg-transparent cursor-pointer underline"
            style={{ color: 'var(--color-accent)' }}
          >
            ← Back
          </button>
        )}
        <span className="text-xs flex-1" style={{ color: 'var(--color-text-secondary)' }}>
          📂 {folder.path}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-disabled)' }}>
          {selectableItems.length} item(s)
        </span>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-2 py-0.5 text-xs shrink-0 gap-2" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>
        <span className="w-5" />
        <div className="flex-1 font-bold">Name</div>
        <div className="font-bold" style={{ width: 50, textAlign: 'right' }}>Size</div>
        <div className="font-bold" style={{ width: 50, textAlign: 'right' }}>Year</div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* File list */}
        <div className="flex-1 overflow-auto" style={{ background: '#fff' }}>
          {items.map((item, i) => (
            <FileRow
              key={item.name + i}
              item={item}
              isSelected={selectedIdx === i}
              onClick={() => {
                if (item.type !== 'header' && item.type !== 'spacer') {
                  setSelectedIdx(i)
                  setPreview(null)
                }
              }}
              onDoubleClick={() => handleDoubleClick(item)}
            />
          ))}
        </div>

        {/* Preview panel */}
        {(selectedIdx >= 0 && items[selectedIdx]?.type !== 'header' && items[selectedIdx]?.type !== 'spacer') && (
          <div className="shrink-0 overflow-auto p-3" style={{ width: 190, background: '#f5f5f5', borderLeft: '1px solid #ddd' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#333' }}>
              <div className="text-center text-2xl mb-2">{ICON_MAP[preview?.type || items[selectedIdx]?.type]}</div>
              <div className="font-bold mb-2" style={{ fontSize: 12 }}>{preview?.name || items[selectedIdx]?.name}</div>
              {(preview?.description || items[selectedIdx]?.description) && (
                <p style={{ color: '#555', lineHeight: 1.5 }}>{preview?.description || items[selectedIdx]?.description}</p>
              )}
              {items[selectedIdx]?.type === 'folder' && (
                <div className="mt-2 text-xs" style={{ color: '#888' }}>Double-click to open</div>
              )}
              {items[selectedIdx]?.type === 'audio' && (
                <div className="mt-3 text-xs" style={{ color: '#888' }}>Audio player coming soon</div>
              )}
              {items[selectedIdx]?.type === 'album' && (
                <div className="mt-3 text-xs" style={{ color: '#888' }}>🎧 In heavy rotation</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center px-2 py-0.5 text-xs shrink-0" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-bevel-dark)', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
        {selectedIdx >= 0 && items[selectedIdx]?.type !== 'header' ? items[selectedIdx]?.name : 'Select an item'}
      </div>
    </div>
  )
}
