import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useMediaQuery } from '../../hooks/useMediaQuery'

function getYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&]+)/)
  return m ? m[1] : null
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDomain(url) {
  if (!url) return ''
  try { return new URL(url).hostname.replace('www.', '') } catch { return '' }
}

// ══════════════════════════════════════════
// DESKTOP — Newspaper / Newsletter style
// ══════════════════════════════════════════

function DesktopDigest() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('digest_entries')
        .select('*')
        .order('published_date', { ascending: false })
        .order('created_at', { ascending: false })
      setEntries(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Group by date
  const grouped = {}
  for (const e of entries) {
    const d = e.published_date
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(e)
  }
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
  const activeDate = selectedDate || dates[0]
  const activeEntries = grouped[activeDate] || []

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#f5f0e8', fontFamily: 'Georgia, "Times New Roman", serif' }}>
      {/* Masthead */}
      <div style={{ padding: '12px 16px 8px', background: '#1a1a1a', borderBottom: '3px double #333', textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 'bold', color: '#F0EBE1', letterSpacing: 2, textTransform: 'uppercase' }}>The Daily Digest</div>
        <div style={{ fontSize: 10, color: '#888', marginTop: 2, fontFamily: 'monospace' }}>Interesting things from around the internet</div>
      </div>

      {/* Date tabs */}
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto', background: '#e8e0d0', borderBottom: '1px solid #ccc', padding: '0 8px' }}>
        {dates.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            style={{
              padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 11,
              background: activeDate === d ? '#1a1a1a' : 'transparent',
              color: activeDate === d ? '#F0EBE1' : '#666',
              fontFamily: 'Georgia, serif', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {formatShortDate(d)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto" style={{ padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: 13 }}>Loading...</div>
        ) : dates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: 13 }}>No entries yet. The first edition is coming.</div>
        ) : (
          <>
            {/* Date header */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: '#333', fontWeight: 'bold' }}>{formatDate(activeDate)}</div>
              <div style={{ width: 60, height: 1, background: '#999', margin: '6px auto' }} />
              <div style={{ fontSize: 10, color: '#999' }}>{activeEntries.length} item{activeEntries.length !== 1 ? 's' : ''}</div>
            </div>

            {/* Entries */}
            {activeEntries.map(entry => {
              const ytId = getYouTubeId(entry.video_url)
              return (
                <div key={entry.id} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #d0c8b8' }}>
                  {/* Title */}
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', lineHeight: 1.3, marginBottom: 6 }}>
                    {entry.url ? (
                      <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1a1a1a', textDecoration: 'none' }}>
                        {entry.title}
                      </a>
                    ) : entry.title}
                  </div>

                  {/* Source */}
                  {entry.url && (
                    <div style={{ fontSize: 10, color: '#999', marginBottom: 8, fontFamily: 'monospace' }}>
                      {getDomain(entry.url)}
                    </div>
                  )}

                  {/* Video embed */}
                  {ytId && (
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', marginBottom: 10, border: '1px solid #ccc' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}`}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={entry.title}
                      />
                    </div>
                  )}

                  {/* Note */}
                  {entry.note && (
                    <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6, fontStyle: 'italic' }}>
                      {entry.note}
                    </div>
                  )}

                  {/* Source tag */}
                  {entry.source && (
                    <div style={{ fontSize: 10, color: '#aaa', marginTop: 6, fontFamily: 'monospace' }}>via {entry.source}</div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '4px 16px', background: '#1a1a1a', textAlign: 'center', fontSize: 9, color: '#666', fontFamily: 'monospace' }}>
        The Daily Digest — Curated by Eric
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MOBILE — Apple News / Flipboard style
// ══════════════════════════════════════════

function MobileDigest() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('digest_entries')
        .select('*')
        .order('published_date', { ascending: false })
        .order('created_at', { ascending: false })
      setEntries(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Group by date
  const grouped = {}
  for (const e of entries) {
    const d = e.published_date
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(e)
  }
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  if (selectedEntry) {
    const ytId = getYouTubeId(selectedEntry.video_url)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
        <div className="flex items-center px-3 shrink-0" style={{ height: 44, background: '#1c1c1e', borderBottom: '0.5px solid #38383a' }}>
          <button onClick={() => setSelectedEntry(null)} className="border-none bg-transparent cursor-pointer" style={{ color: '#FF6B35', fontSize: 15, fontFamily: 'inherit' }}>‹ Feed</button>
        </div>
        <div className="flex-1 overflow-auto">
          {ytId && (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', background: '#111' }}>
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={selectedEntry.title}
              />
            </div>
          )}
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 8 }}>{selectedEntry.title}</div>
            {selectedEntry.source && (
              <div style={{ fontSize: 13, color: '#FF6B35', marginBottom: 8 }}>{selectedEntry.source}</div>
            )}
            {selectedEntry.url && (
              <div style={{ fontSize: 12, color: '#8e8e93', marginBottom: 12, fontFamily: 'monospace' }}>{getDomain(selectedEntry.url)}</div>
            )}
            {selectedEntry.note && (
              <div style={{ fontSize: 16, color: '#ccc', lineHeight: 1.6, marginBottom: 16 }}>{selectedEntry.note}</div>
            )}
            {selectedEntry.url && (
              <a href={selectedEntry.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: 12, background: '#FF6B35', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                Open Link
              </a>
            )}
            <div style={{ fontSize: 12, color: '#48484a', marginTop: 12 }}>{formatDate(selectedEntry.published_date)}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>Daily Digest</div>
        <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 2 }}>Interesting finds from around the internet</div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#8e8e93', fontSize: 15 }}>Loading...</div>
        ) : dates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#8e8e93', fontSize: 15 }}>No entries yet. First edition coming soon.</div>
        ) : (
          dates.map(date => (
            <div key={date}>
              {/* Date header */}
              <div style={{ padding: '16px 16px 6px', fontSize: 13, color: '#8e8e93', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {formatShortDate(date)}
              </div>

              {/* Entries for this date */}
              {grouped[date].map(entry => {
                const ytId = getYouTubeId(entry.video_url)
                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    style={{ padding: '12px 16px', borderBottom: '0.5px solid #1c1c1e', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {entry.title}
                      </div>
                      {entry.note && (
                        <div style={{ fontSize: 13, color: '#8e8e93', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {entry.note}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#48484a', marginTop: 4 }}>
                        {entry.source || getDomain(entry.url) || ''}
                        {ytId ? ' · Video' : ''}
                      </div>
                    </div>
                    {ytId && (
                      <div style={{ width: 80, height: 50, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#1c1c1e' }}>
                        <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function Digest() {
  return <DesktopDigest />
}
