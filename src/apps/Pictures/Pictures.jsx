import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useMediaQuery } from '../../hooks/useMediaQuery'

// ══════════════════════════════════════════
// DESKTOP — Win95 File Browser with thumbnail grid
// ══════════════════════════════════════════

function DesktopPictures() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: false })
      setPhotos(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (selected) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#1e1c28', fontFamily: '"Courier New", monospace' }}>
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ background: 'var(--color-surface, #2C2A35)', borderBottom: '1px solid #4A4555' }}>
          <button onClick={() => setSelected(null)} className="text-xs border-none bg-transparent cursor-pointer" style={{ color: '#FF6B35', fontFamily: 'inherit' }}>← Back</button>
          <span className="text-xs" style={{ color: '#A09AB0' }}>{selected.title}</span>
          <span className="ml-auto text-xs" style={{ color: '#5A5465' }}>{new Date(selected.created_at).toLocaleDateString()}</span>
        </div>

        {/* Image + caption */}
        <div className="flex-1 overflow-auto" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16 }}>
          <div style={{ maxWidth: 600, width: '100%' }}>
            <img
              src={selected.url}
              alt={selected.title}
              style={{ width: '100%', maxHeight: 500, objectFit: 'contain', display: 'block', border: '2px inset #4A4555', background: '#0a0a18' }}
            />
            <div style={{ marginTop: 12, padding: 12, background: '#12121a', border: '1px solid #2a2840' }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#F0EBE1', marginBottom: 6 }}>{selected.title}</div>
              {selected.caption && (
                <div style={{ fontSize: 12, color: '#A09AB0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.caption}</div>
              )}
              <div style={{ fontSize: 10, color: '#5A5465', marginTop: 8 }}>{new Date(selected.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#1e1c28', fontFamily: '"Courier New", monospace' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ background: 'var(--color-surface, #2C2A35)', borderBottom: '1px solid #4A4555' }}>
        <span className="text-xs font-bold" style={{ color: '#F0EBE1' }}>📁 Pictures</span>
        <span className="ml-auto text-xs" style={{ color: '#5A5465' }}>{photos.length} file(s)</span>
      </div>

      {/* Address bar */}
      <div className="px-3 py-1 shrink-0" style={{ background: '#12121a', borderBottom: '1px solid #2a2840' }}>
        <div className="text-xs px-2 py-0.5" style={{ background: '#fff', color: '#000', display: 'inline-block' }}>
          C:\Eric\Pictures\
        </div>
      </div>

      {/* Thumbnail grid */}
      <div className="flex-1 overflow-auto p-3" style={{ background: '#fff' }}>
        {loading ? (
          <div className="text-center py-8" style={{ color: '#888', fontSize: 12 }}>Loading...</div>
        ) : photos.length === 0 ? (
          <div className="text-center py-8" style={{ color: '#888', fontSize: 12 }}>No pictures yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {photos.map(photo => (
              <div
                key={photo.id}
                onClick={() => setSelected(photo)}
                className="cursor-pointer"
                style={{ textAlign: 'center', padding: 6, border: '1px solid transparent', borderRadius: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e0e0ff'; e.currentTarget.style.border = '1px dotted #008' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.border = '1px solid transparent' }}
              >
                <div style={{ width: '100%', aspectRatio: '1', background: '#f0f0f0', border: '1px solid #ccc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontSize: 10, color: '#000', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Tahoma, sans-serif' }}>
                  {photo.title}.jpg
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-3 py-1 shrink-0" style={{ background: '#c0c0c0', borderTop: '1px solid #888', display: 'flex', gap: 16 }}>
        <span style={{ fontSize: 10, color: '#000', fontFamily: 'Tahoma, sans-serif' }}>{photos.length} object(s)</span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MOBILE — Old iPhone Photo Gallery
// ══════════════════════════════════════════

function MobilePictures() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: false })
      setPhotos(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
        {/* Nav bar */}
        <div className="flex items-center justify-between px-3 shrink-0" style={{ height: 44, background: '#1c1c1e', borderBottom: '0.5px solid #38383a' }}>
          <button onClick={() => setSelected(null)} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15, fontFamily: 'inherit' }}>‹ Photos</button>
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>1 of {photos.length}</span>
          <div style={{ width: 50 }} />
        </div>

        {/* Full image */}
        <div className="flex-1 overflow-auto" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', minHeight: 200 }}>
            <img src={selected.url} alt={selected.title} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
          </div>

          {/* Caption area */}
          <div style={{ padding: 16, background: '#1c1c1e' }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{selected.title}</div>
            {selected.caption && (
              <div style={{ fontSize: 15, color: '#8e8e93', lineHeight: 1.5 }}>{selected.caption}</div>
            )}
            <div style={{ fontSize: 13, color: '#48484a', marginTop: 10 }}>{new Date(selected.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 shrink-0" style={{ height: 44, background: '#1c1c1e', borderBottom: '0.5px solid #38383a' }}>
        <span style={{ color: '#fff', fontSize: 17, fontWeight: 600 }}>Photos</span>
        <span style={{ color: '#8e8e93', fontSize: 13 }}>{photos.length} photos</span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="text-center py-8" style={{ color: '#8e8e93', fontSize: 15 }}>Loading...</div>
        ) : photos.length === 0 ? (
          <div className="text-center py-8" style={{ color: '#8e8e93', fontSize: 15 }}>No photos yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 2 }}>
            {photos.map(photo => (
              <div
                key={photo.id}
                onClick={() => setSelected(photo)}
                style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer' }}
              >
                <img src={photo.url} alt={photo.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Pictures() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  return isMobile ? <MobilePictures /> : <DesktopPictures />
}
