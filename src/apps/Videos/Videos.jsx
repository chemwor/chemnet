import { useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

const FOLDERS = {
  root: {
    path: 'C:\\Media\\Videos',
    items: [
      { id: 'my-videos', name: 'My Videos', type: 'folder', icon: '📁', description: 'Videos from my YouTube channel.' },
      { id: 'watching', name: 'Interested In', type: 'folder', icon: '📁', description: 'Videos I want to share.' },
    ],
  },
  'my-videos': {
    path: 'C:\\Media\\Videos\\My Videos',
    items: [
      { name: 'SkyJump Las Vegas.mp4', type: 'youtube', url: 'https://youtu.be/6S7bkah5O0U', size: 'YT', date: '', description: '' },
      { name: 'Spectrum Piano Cover.mp4', type: 'youtube', url: 'https://youtube.com/shorts/WSJFbDv7Aw8', size: 'YT', date: '', description: '' },
    ],
  },
  watching: {
    path: 'C:\\Media\\Videos\\Interested In',
    items: [],
  },
}

const ICON_MAP = {
  folder: '📁',
  video: '🎬',
  link: '🔗',
  youtube: '▶️',
}

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&]+)/)
  return m ? m[1] : null
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

function DesktopVideos() {
  const [currentFolder, setCurrentFolder] = useState('root')
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [preview, setPreview] = useState(null)
  const [playing, setPlaying] = useState(null)

  const folder = FOLDERS[currentFolder]
  const items = folder.items

  const handleDoubleClick = (item) => {
    if (item.type === 'folder') {
      setCurrentFolder(item.id)
      setSelectedIdx(-1)
      setPreview(null)
      setPlaying(null)
    } else if (item.type === 'youtube') {
      setPlaying(item)
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
            onClick={() => { setCurrentFolder('root'); setSelectedIdx(-1); setPreview(null); setPlaying(null) }}
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
          {playing ? (
            <div className="flex flex-col h-full" style={{ background: '#000' }}>
              <div className="flex items-center gap-2 px-2 py-1 shrink-0" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-bevel-dark)' }}>
                <button
                  onClick={() => setPlaying(null)}
                  className="text-xs border-none bg-transparent cursor-pointer underline"
                  style={{ color: 'var(--color-accent)', fontFamily: 'monospace' }}
                >
                  ← Back to {folder.path.split('\\').pop()}
                </button>
                <span className="text-xs flex-1 truncate" style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{playing.name}</span>
                <a
                  href={playing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline"
                  style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}
                >Open on YouTube ↗</a>
              </div>
              <div className="flex-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', padding: 8 }}>
                {(() => {
                  const id = getYouTubeId(playing.url)
                  if (!id) return <div style={{ color: '#888', fontFamily: 'monospace', fontSize: 12 }}>Invalid URL</div>
                  return (
                    <div style={{ position: 'relative', width: '100%', maxWidth: 900, aspectRatio: '16 / 9', background: '#000' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${id}?autoplay=1`}
                        title={playing.name}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )
                })()}
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center h-full" style={{ color: '#888', fontFamily: 'monospace', fontSize: 12 }}>
              This folder is empty.
            </div>
          ) : (
            items.map((item, i) => (
              <FileRow
                key={item.name}
                item={item}
                isSelected={selectedIdx === i}
                onClick={() => { setSelectedIdx(i); setPreview(null) }}
                onDoubleClick={() => handleDoubleClick(item)}
              />
            ))
          )}
        </div>

        {/* Preview panel */}
        {(selectedIdx >= 0 || preview) && (
          <div className="shrink-0 overflow-auto p-3" style={{ width: 200, background: '#f5f5f5', borderLeft: '1px solid #ddd' }}>
            {(() => {
              const sel = preview || (selectedIdx >= 0 ? items[selectedIdx] : null)
              if (!sel) return null
              const ytId = sel.type === 'youtube' ? getYouTubeId(sel.url) : null
              return (
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#333' }}>
                  {ytId ? (
                    <img src={`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`} alt={sel.name} style={{ width: '100%', display: 'block', marginBottom: 8, border: '1px solid #ccc' }} />
                  ) : (
                    <div className="text-center text-2xl mb-2">{ICON_MAP[sel.type]}</div>
                  )}
                  <div className="font-bold mb-2" style={{ fontSize: 12 }}>{sel.name}</div>
                  {sel.description && <p style={{ color: '#555', lineHeight: 1.5 }}>{sel.description}</p>}
                  {sel.type === 'folder' && (
                    <div className="mt-2 text-xs" style={{ color: '#888' }}>Double-click to open</div>
                  )}
                  {sel.type === 'youtube' && (
                    <div className="mt-2 text-xs" style={{ color: '#888' }}>Double-click to play</div>
                  )}
                </div>
              )
            })()}
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

// ══════════════════════════════════════════
// MOBILE — Old YouTube circa 2013-2014
// ══════════════════════════════════════════

const TABS = [
  { id: 'my-videos', label: 'My Videos' },
  { id: 'watching',  label: 'Interested In' },
]

function MobileVideos() {
  const [tab, setTab] = useState('my-videos')
  const [playing, setPlaying] = useState(null)

  const items = FOLDERS[tab].items

  // Strip the ".mp4" suffix from the synthetic file-style names so the
  // mobile view reads more like a real YouTube card.
  const cleanTitle = (name) => name.replace(/\.(mp4|mov|m4v|webm)$/i, '')

  if (playing) {
    const id = getYouTubeId(playing.url)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        {/* Player */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000', flexShrink: 0 }}>
          {id ? (
            <iframe
              src={`https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1`}
              title={playing.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Invalid URL</div>
          )}
        </div>

        {/* Title + meta */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #e5e5e5' }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: '#222', lineHeight: 1.35 }}>{cleanTitle(playing.name)}</div>
          <div style={{ fontSize: 12, color: '#767676', marginTop: 4 }}>Eric Chemwor</div>
          <a
            href={playing.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#cc0000', textDecoration: 'none', fontWeight: 500 }}
          >Open on YouTube ↗</a>
        </div>

        {/* Back to list */}
        <button
          onClick={() => setPlaying(null)}
          style={{ margin: 12, padding: '10px 14px', background: '#cc0000', color: '#fff', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}
        >‹ Back to list</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f1f1', fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      {/* Top bar — old YouTube red */}
      <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 14px', background: '#cc0000', color: '#fff', flexShrink: 0, gap: 6 }}>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>You</span>
        <span style={{ fontSize: 16, fontWeight: 700, padding: '2px 6px', background: '#fff', color: '#cc0000', borderRadius: 3, letterSpacing: -0.5 }}>Tube</span>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', background: '#cc0000', borderTop: '1px solid #a30000', flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '11px 8px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id ? '3px solid #fff' : '3px solid transparent',
              color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.7)',
              fontSize: 13,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Video list */}
      <div className="flex-1 overflow-auto" style={{ background: '#f1f1f1' }}>
        {items.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#767676', fontSize: 14 }}>
            No videos here yet.
          </div>
        ) : (
          items.map(item => {
            const id = getYouTubeId(item.url)
            return (
              <div
                key={item.name}
                onClick={() => setPlaying(item)}
                style={{ background: '#fff', marginBottom: 8, cursor: 'pointer' }}
              >
                {/* Thumbnail */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
                  {id && (
                    <img
                      src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                      alt={cleanTitle(item.name)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 22,
                      paddingLeft: 4,
                    }}
                  >▶</div>
                </div>
                {/* Title */}
                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#222', lineHeight: 1.3 }}>{cleanTitle(item.name)}</div>
                  <div style={{ fontSize: 12, color: '#767676', marginTop: 4 }}>Eric Chemwor</div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function Videos() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  return isMobile ? <MobileVideos /> : <DesktopVideos />
}
