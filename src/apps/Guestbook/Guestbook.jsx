import { useState, useRef, useEffect } from 'react'

const INITIAL_ENTRIES = [
  { id: 1, name: 'nightcoder_42', location: 'San Francisco, CA', date: '2026-04-02', message: 'This is the coolest personal site I\'ve ever seen. The terminal with the hidden files is genius.' },
  { id: 2, name: 'explorer_jane', location: 'London, UK', date: '2026-04-05', message: 'Stumbled onto this from Twitter. Played Asteroids for way too long. Signed the book before I forget. ✌️' },
  { id: 3, name: 'k3nyan_dev', location: 'Nairobi, Kenya', date: '2026-04-06', message: 'Mkenya mwenzangu! Love seeing Kenyan devs build cool things. The chess Swahili names are a nice touch. Hongera!' },
  { id: 4, name: 'pixel_punk', location: 'Tokyo, Japan', date: '2026-04-08', message: 'The Win95 aesthetic is perfect. Reminds me of my first computer. Never stop building weird stuff on the internet.' },
  { id: 5, name: 'curious_cat', location: 'Toronto, Canada', date: '2026-04-10', message: 'Found the social media manifesto in .hidden. "The algorithm just isn\'t going to hand it to you." — real talk. Signing as proof I was here.' },
  { id: 6, name: 'anon', location: 'The Internet', date: '2026-04-12', message: 'sudo rm -rf / 😂 you got me with that one. GG.' },
]

function GuestEntry({ entry }) {
  return (
    <div className="mb-3 pb-3" style={{ borderBottom: '1px dashed #446' }}>
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color: '#FFD700', fontWeight: 'bold' }}>✎ {entry.name}</span>
        {entry.location && (
          <span style={{ color: '#555', fontSize: 10 }}>from {entry.location}</span>
        )}
        <span className="ml-auto" style={{ color: '#444', fontSize: 10 }}>{entry.date}</span>
      </div>
      <div style={{ color: '#aab', lineHeight: 1.5, paddingLeft: 16 }}>{entry.message}</div>
    </div>
  )
}

export default function Guestbook() {
  const [entries, setEntries] = useState(INITIAL_ENTRIES)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [message, setMessage] = useState('')
  const [signed, setSigned] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  const handleSign = () => {
    if (!name.trim()) { setError('Name required — even a fake one'); return }
    if (!message.trim()) { setError('Say something! Anything.'); return }
    setError('')

    const newEntry = {
      id: Date.now(),
      name: name.trim(),
      location: location.trim() || null,
      date: new Date().toISOString().split('T')[0],
      message: message.trim(),
    }
    setEntries(prev => [...prev, newEntry])
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

        {entries.map(entry => (
          <GuestEntry key={entry.id} entry={entry} />
        ))}

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
