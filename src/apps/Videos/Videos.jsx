import { useState } from 'react'

const FOLDERS = {
  root: {
    path: 'C:\\Media\\Videos',
    items: [
      { id: 'my-videos', name: 'My Videos', type: 'folder', icon: '📁', description: 'Videos I\'ve made' },
      { id: 'watching', name: 'Watching', type: 'folder', icon: '📁', description: 'Videos I\'m sharing' },
    ],
  },
  'my-videos': {
    path: 'C:\\Media\\Videos\\My Videos',
    items: [
      { name: 'ChemNet Site Build Timelapse.mp4', type: 'video', size: '48 MB', date: '2026-03-20', description: 'Building this site from scratch — 12 hours compressed into 3 minutes.' },
      { name: 'Kilimanjaro Summit Night.mp4', type: 'video', size: '120 MB', date: '2025-12-18', description: 'The midnight summit push. Headlamps, freezing cold, and the most beautiful sunrise of my life.' },
      { name: 'First BJJ Competition.mp4', type: 'video', size: '85 MB', date: '2025-10-05', description: 'My first tournament. Won one, lost two. Learned everything.' },
      { name: 'Guitar Cover - Neon (John Mayer).mp4', type: 'video', size: '35 MB', date: '2025-09-12', description: 'Attempted Neon by John Mayer. My thumb will never be the same.' },
      { name: 'Nairobi Street Food Tour.mp4', type: 'video', size: '95 MB', date: '2025-08-30', description: 'Exploring Nairobi\'s best street food spots. Nyama choma, mutura, and mandazi.' },
    ],
  },
  watching: {
    path: 'C:\\Media\\Videos\\Watching',
    items: [
      { name: 'How To Build A 20-Person Startup.mp4', type: 'link', size: '—', date: '2026-04-01', description: 'Great breakdown on scaling a small team without losing your mind.' },
      { name: 'The Art of Code (Dylan Beattie).mp4', type: 'link', size: '—', date: '2026-03-15', description: 'The best conference talk ever made. Code as art, music, and absurdity.' },
      { name: 'Jiro Dreams of Sushi.mp4', type: 'link', size: '—', date: '2026-02-20', description: 'Obsession, craft, and the pursuit of perfection. Applies to everything.' },
      { name: 'How The Economic Machine Works.mp4', type: 'link', size: '—', date: '2026-01-10', description: 'Ray Dalio\'s 30-minute masterclass on how economies actually function.' },
      { name: 'The Power of Vulnerability (Brene Brown).mp4', type: 'link', size: '—', date: '2025-12-05', description: 'Still hits different every time. Courage starts with showing up.' },
      { name: 'Abstract - Tinker Hatfield.mp4', type: 'link', size: '—', date: '2025-11-18', description: 'The man who designed the Air Jordan. Design thinking at its best.' },
    ],
  },
}

const ICON_MAP = {
  folder: '📁',
  video: '🎬',
  link: '🔗',
}

function FileRow({ item, isSelected, onClick, onDoubleClick }) {
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
      <div style={{ width: 60, textAlign: 'right', color: isSelected ? '#ccc' : '#666', shrink: 0 }}>{item.size || ''}</div>
      <div style={{ width: 80, textAlign: 'right', color: isSelected ? '#ccc' : '#666', shrink: 0 }}>{item.date || ''}</div>
    </div>
  )
}

export default function Videos() {
  const [currentFolder, setCurrentFolder] = useState('root')
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [preview, setPreview] = useState(null)

  const folder = FOLDERS[currentFolder]
  const items = folder.items

  const handleDoubleClick = (item) => {
    if (item.type === 'folder') {
      setCurrentFolder(item.id)
      setSelectedIdx(-1)
      setPreview(null)
    } else {
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
          {items.length} item(s)
        </span>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-2 py-0.5 text-xs shrink-0 gap-2" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>
        <span className="w-5" />
        <div className="flex-1 font-bold">Name</div>
        <div className="font-bold" style={{ width: 60, textAlign: 'right' }}>Size</div>
        <div className="font-bold" style={{ width: 80, textAlign: 'right' }}>Date</div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* File list */}
        <div className="flex-1 overflow-auto" style={{ background: '#fff' }}>
          {items.map((item, i) => (
            <FileRow
              key={item.name}
              item={item}
              isSelected={selectedIdx === i}
              onClick={() => { setSelectedIdx(i); setPreview(null) }}
              onDoubleClick={() => handleDoubleClick(item)}
            />
          ))}
        </div>

        {/* Preview panel */}
        {(selectedIdx >= 0 || preview) && (
          <div className="shrink-0 overflow-auto p-3" style={{ width: 200, background: '#f5f5f5', borderLeft: '1px solid #ddd' }}>
            {preview ? (
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#333' }}>
                <div className="text-center text-2xl mb-2">{ICON_MAP[preview.type]}</div>
                <div className="font-bold mb-2" style={{ fontSize: 12 }}>{preview.name}</div>
                <p style={{ color: '#555', lineHeight: 1.5 }}>{preview.description}</p>
                {preview.type === 'link' && (
                  <div className="mt-3 text-xs" style={{ color: '#888' }}>External video — link coming soon</div>
                )}
                {preview.type === 'video' && (
                  <div className="mt-3 text-xs" style={{ color: '#888' }}>Video player coming soon</div>
                )}
              </div>
            ) : selectedIdx >= 0 ? (
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#333' }}>
                <div className="text-center text-2xl mb-2">{ICON_MAP[items[selectedIdx].type]}</div>
                <div className="font-bold mb-2" style={{ fontSize: 12 }}>{items[selectedIdx].name}</div>
                {items[selectedIdx].description && (
                  <p style={{ color: '#555', lineHeight: 1.5 }}>{items[selectedIdx].description}</p>
                )}
                {items[selectedIdx].type === 'folder' && (
                  <div className="mt-2 text-xs" style={{ color: '#888' }}>Double-click to open</div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center px-2 py-0.5 text-xs shrink-0" style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-bevel-dark)', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
        {selectedIdx >= 0 ? items[selectedIdx].name : 'Select an item'}
      </div>
    </div>
  )
}
