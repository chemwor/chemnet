import { useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useProfile } from '../../context/ProfileContext'
import { brandPrefix } from '../../lib/customization'

const FOLDERS = {
  'my-videos': {
    label: 'My Videos',
    items: [
      { name: 'SkyJump Las Vegas.mp4', type: 'youtube', url: 'https://youtu.be/6S7bkah5O0U', description: 'Jumping off the Stratosphere in Las Vegas.' },
      { name: 'Spectrum Piano Cover.mp4', type: 'youtube', url: 'https://youtube.com/shorts/WSJFbDv7Aw8', description: 'A piano cover I recorded.' },
    ],
  },
  watching: {
    label: 'Interested In',
    items: [],
  },
}

const TABS = [
  { id: 'my-videos', label: 'My Videos' },
  { id: 'watching', label: 'Interested In' },
]

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&]+)/)
  return m ? m[1] : null
}

const cleanTitle = (name) => name.replace(/\.(mp4|mov|m4v|webm)$/i, '')

function Stars({ n = 5, size = 12 }) {
  return <span style={{ color: '#ECB100', fontSize: size, letterSpacing: 1 }}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</span>
}

// ══════════════════════════════════════════
// DESKTOP — YouTube circa 2006 (watch page + sidebar)
// ══════════════════════════════════════════

function Wordmark({ brand, size = 26 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
      <span style={{ fontSize: size, fontWeight: 'bold', color: '#222', letterSpacing: -1 }}>{brand}</span>
      <span style={{ fontSize: size - 4, fontWeight: 'bold', background: '#ff0000', color: '#fff', padding: '1px 7px', borderRadius: 5, letterSpacing: -1, marginLeft: 1 }}>Tube</span>
    </span>
  )
}

const linkStyle = { color: '#2b6fb7', textDecoration: 'none', cursor: 'pointer' }

function DesktopVideos({ brand, uploader }) {
  const [tab, setTab] = useState('my-videos')
  const items = FOLDERS[tab].items
  const [selectedIdx, setSelectedIdx] = useState(0)
  const selected = items[selectedIdx] || null

  const pickTab = (id) => { setTab(id); setSelectedIdx(0) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: 'Arial, Helvetica, sans-serif', color: '#000' }}>
      {/* Header — logo + tagline + (period-accurate) search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 14px', borderBottom: '1px solid #ccc', flexShrink: 0 }}>
        <div>
          <Wordmark brand={brand} />
          <div style={{ fontSize: 10, color: '#999', fontStyle: 'italic', marginTop: 1 }}>Broadcast Yourself™</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <input placeholder="Search" disabled style={{ border: '1px solid #999', padding: '3px 6px', width: 180, fontSize: 12, fontFamily: 'inherit', background: '#fff', color: '#333' }} />
          <button disabled style={{ fontSize: 12, padding: '3px 10px', border: '1px solid #999', background: 'linear-gradient(#fafafa,#e2e2e2)', cursor: 'default', fontFamily: 'inherit' }}>Search</button>
        </div>
      </div>

      {/* Nav tab strip */}
      <div style={{ display: 'flex', gap: 2, padding: '0 10px', background: '#e3edf7', borderBottom: '1px solid #a8bcd4', flexShrink: 0 }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => pickTab(t.id)}
              style={{
                padding: '7px 16px', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                background: active ? '#fff' : 'transparent',
                color: active ? '#cc0000' : '#2b6fb7',
                fontWeight: active ? 'bold' : 'normal',
                borderTop: active ? '3px solid #ff0000' : '3px solid transparent',
                borderLeft: active ? '1px solid #a8bcd4' : '1px solid transparent',
                borderRight: active ? '1px solid #a8bcd4' : '1px solid transparent',
                marginBottom: -1,
              }}
            >{t.label}</button>
          )
        })}
      </div>

      {/* Body — watch column + related sidebar */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', gap: 16, padding: 16, minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <>
              <h2 style={{ fontSize: 17, margin: '0 0 8px', color: '#111' }}>{cleanTitle(selected.name)}</h2>
              <div style={{ position: 'relative', width: '100%', maxWidth: 640, aspectRatio: '16 / 9', background: '#000' }}>
                {(() => {
                  const id = getYouTubeId(selected.url)
                  if (!id) return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 12 }}>Invalid URL</div>
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${id}`}
                      title={selected.name}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )
                })()}
              </div>

              {/* Meta box */}
              <div style={{ maxWidth: 640, background: '#f4f4f4', border: '1px solid #ddd', padding: '8px 10px', marginTop: 8, fontSize: 11, color: '#666' }}>
                <div style={{ marginBottom: 5 }}><Stars n={5} /> <span style={{ marginLeft: 4 }}>Rate this video</span></div>
                <div>From: <a style={linkStyle}>{uploader}</a></div>
                <div style={{ marginTop: 5 }}>
                  <a style={linkStyle}>★ Favorite</a> <span style={{ color: '#ccc' }}>|</span>{' '}
                  <a style={linkStyle}>Share</a> <span style={{ color: '#ccc' }}>|</span>{' '}
                  <a style={linkStyle}>Add to Playlist</a> <span style={{ color: '#ccc' }}>|</span>{' '}
                  <a href={selected.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>Open on YouTube ↗</a>
                </div>
              </div>

              {selected.description && (
                <div style={{ maxWidth: 640, marginTop: 10, fontSize: 13, color: '#333', lineHeight: 1.5 }}>{selected.description}</div>
              )}
            </>
          ) : (
            <div style={{ color: '#767676', fontSize: 13, paddingTop: 30, textAlign: 'center' }}>
              No videos in “{FOLDERS[tab].label}” yet.
            </div>
          )}
        </div>

        {/* Related / more videos sidebar */}
        <div style={{ width: 230, flexShrink: 0 }}>
          <div style={{ background: '#6699cc', color: '#fff', padding: '4px 8px', fontWeight: 'bold', fontSize: 12 }}>
            More From {uploader}
          </div>
          {items.length === 0 ? (
            <div style={{ padding: 10, fontSize: 11, color: '#999' }}>Nothing here yet.</div>
          ) : items.map((item, i) => {
            const id = getYouTubeId(item.url)
            return (
              <div
                key={item.name}
                onClick={() => setSelectedIdx(i)}
                style={{ display: 'flex', gap: 8, padding: '8px 4px', borderBottom: '1px solid #eee', cursor: 'pointer', background: i === selectedIdx ? '#fffbe6' : 'transparent' }}
              >
                <div style={{ width: 100, height: 56, background: '#000', flexShrink: 0, overflow: 'hidden' }}>
                  {id && <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#2b6fb7', lineHeight: 1.25 }}>{cleanTitle(item.name)}</div>
                  <div style={{ marginTop: 3 }}><Stars n={5} size={10} /></div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{uploader}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer strip */}
      <div style={{ padding: '4px 14px', borderTop: '1px solid #ccc', fontSize: 10, color: '#999', flexShrink: 0 }}>
        {brand}Tube — Broadcast Yourself™
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MOBILE — Old YouTube circa 2013-2014
// ══════════════════════════════════════════

function MobileVideos({ brand, uploader }) {
  const [tab, setTab] = useState('my-videos')
  const [playing, setPlaying] = useState(null)
  const items = FOLDERS[tab].items

  if (playing) {
    const id = getYouTubeId(playing.url)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif' }}>
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
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #e5e5e5' }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: '#222', lineHeight: 1.35 }}>{cleanTitle(playing.name)}</div>
          <div style={{ fontSize: 12, color: '#767676', marginTop: 4 }}>{uploader}</div>
          <a href={playing.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#cc0000', textDecoration: 'none', fontWeight: 500 }}>Open on YouTube ↗</a>
        </div>
        <button
          onClick={() => setPlaying(null)}
          style={{ margin: 12, padding: '10px 14px', background: '#cc0000', color: '#fff', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}
        >‹ Back to list</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f1f1', fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 48, padding: '0 14px', background: '#cc0000', color: '#fff', flexShrink: 0, gap: 6 }}>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>{brand}</span>
        <span style={{ fontSize: 16, fontWeight: 700, padding: '2px 6px', background: '#fff', color: '#cc0000', borderRadius: 3, letterSpacing: -0.5 }}>Tube</span>
      </div>
      <div style={{ display: 'flex', background: '#cc0000', borderTop: '1px solid #a30000', flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '11px 8px', background: 'transparent', border: 'none',
              borderBottom: tab === t.id ? '3px solid #fff' : '3px solid transparent',
              color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.7)',
              fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >{t.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-auto" style={{ background: '#f1f1f1' }}>
        {items.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#767676', fontSize: 14 }}>No videos here yet.</div>
        ) : items.map(item => {
          const id = getYouTubeId(item.url)
          return (
            <div key={item.name} onClick={() => setPlaying(item)} style={{ background: '#fff', marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
                {id && <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={cleanTitle(item.name)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                <div aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, paddingLeft: 4 }}>▶</div>
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#222', lineHeight: 1.3 }}>{cleanTitle(item.name)}</div>
                <div style={{ fontSize: 12, color: '#767676', marginTop: 4 }}>{uploader}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Videos() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { node } = useProfile()
  const brand = brandPrefix(node)
  const uploader = node.kind === 'member' ? `@${node.handle}` : 'Eric Chemwor'
  return isMobile
    ? <MobileVideos brand={brand} uploader={uploader} />
    : <DesktopVideos brand={brand} uploader={uploader} />
}
