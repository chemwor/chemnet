import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function GuestEntry({ entry }) {
  return (
    <div className="mb-3 pb-3" style={{ borderBottom: '1px dashed #446' }}>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: '#FFD700', fontWeight: 'bold' }}>✎ {entry.name}</span>
        {entry.location && (
          <span style={{ color: '#555', fontSize: 10 }}>from {entry.location}</span>
        )}
        <span className="ml-auto" style={{ color: '#444', fontSize: 10 }}>
          {new Date(entry.created_at).toLocaleDateString()}
        </span>
      </div>
      <div style={{ color: '#aab', lineHeight: 1.5, paddingLeft: 16 }}>{entry.message}</div>
    </div>
  )
}

export default function Guestbook() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [message, setMessage] = useState('')
  const [signed, setSigned] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    loadEntries()
  }, [])

  async function loadEntries() {
    try {
      const { data, error } = await supabase
        .from('guestbook_entries')
        .select('*')
        .order('created_at', { ascending: true })
      if (!error && data) setEntries(data)
    } catch {}
    setLoading(false)
  }

  const handleSign = async () => {
    if (!name.trim()) { setError('Name required — even a fake one'); return }
    if (!message.trim()) { setError('Say something! Anything.'); return }
    setError('')

    const newEntry = {
      name: name.trim(),
      location: location.trim() || null,
      message: message.trim(),
    }

    const { data, error: insertErr } = await supabase
      .from('guestbook_entries')
      .insert(newEntry)
      .select()
      .single()

    if (insertErr) {
      setError('Failed to sign. Try again.')
      return
    }

    setEntries(prev => [...prev, data])
    setName('')
    setLocation('')
    setMessage('')
    setSigned(true)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a18', color: '#ccc', fontFamily: '"Courier New", monospace', fontSize: 12 }}>
      {/* Header */}
      <div className="px-3 py-2 text-center shrink-0" style={{ background: '#1a1a3a', borderBottom: '1px solid #333' }}>
        <div style={{ color: '#FFD700', fontSize: 14, fontWeight: 'bold' }}>📖 Guestbook</div>
        <div style={{ color: '#555', fontSize: 10 }}>Sign the book. Leave your mark. Prove you were here.</div>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-auto px-3 py-2">
        <div className="mb-3 text-center" style={{ color: '#446', fontSize: 10 }}>
          ─── {entries.length} signature(s) ───
        </div>

        {loading ? (
          <div className="text-center py-4" style={{ color: '#555' }}>Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-4" style={{ color: '#555' }}>No signatures yet. Be the first!</div>
        ) : (
          entries.map(entry => (
            <GuestEntry key={entry.id} entry={entry} />
          ))
        )}

        {signed && (
          <div className="text-center py-2" style={{ color: '#44DD44', fontSize: 11 }}>
            ✓ Signed! Thanks for stopping by.
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Sign form */}
      <div className="px-3 py-2 shrink-0" style={{ background: '#0f0f24', borderTop: '1px solid #333' }}>
        <div className="mb-1.5" style={{ color: '#888', fontSize: 11 }}>Sign the guestbook:</div>
        <div className="flex gap-2 mb-1.5">
          <div className="flex items-center gap-1">
            <span style={{ color: '#666' }}>Name:</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="your name"
              maxLength={30}
              className="px-1 py-0.5 border-none outline-none"
              style={{ background: '#111', color: '#FFD700', fontFamily: 'inherit', fontSize: 11, width: 110 }}
            />
          </div>
          <div className="flex items-center gap-1">
            <span style={{ color: '#666' }}>From:</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="optional"
              maxLength={40}
              className="px-1 py-0.5 border-none outline-none"
              style={{ background: '#111', color: '#888', fontFamily: 'inherit', fontSize: 11, width: 110 }}
            />
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a message..."
            rows={2}
            maxLength={280}
            className="flex-1 px-1 py-0.5 border-none outline-none resize-none"
            style={{ background: '#111', color: '#ccc', fontFamily: 'inherit', fontSize: 11 }}
          />
          <button
            onClick={handleSign}
            className="px-3 py-1.5 border-none cursor-pointer font-bold shrink-0"
            style={{ background: '#FFD700', color: '#000', fontFamily: 'inherit', fontSize: 11 }}
          >
            [SIGN]
          </button>
        </div>
        {error && <div className="mt-1 text-xs" style={{ color: '#FF4444' }}>{error}</div>}
        <div className="mt-1" style={{ color: '#333', fontSize: 9 }}>{280 - message.length} characters remaining</div>
      </div>
    </div>
  )
}
