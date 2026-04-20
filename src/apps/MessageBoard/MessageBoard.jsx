import { useState, useRef, useEffect } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

// ── Mock data ──
const INITIAL_THREADS = [
  {
    id: 1,
    subject: 'Welcome to the ChemNet Message Board!',
    author: 'SysOp_Eric',
    date: '2026-04-01 09:00',
    posts: [
      { id: 1, author: 'SysOp_Eric', date: '2026-04-01 09:00', body: 'Welcome to the board! This is a place to hang out, ask questions, share ideas, or just say what\'s up.\n\nKeep it chill. Be cool to each other. That\'s about it for rules.\n\n— Eric (SysOp)' },
      { id: 2, author: 'nightcoder_42', date: '2026-04-02 23:41', body: 'This site is wild. Feels like I just time-traveled to 1997. Love it.' },
      { id: 3, author: 'SysOp_Eric', date: '2026-04-03 08:15', body: 'That\'s exactly the vibe I was going for. Glad you\'re here!' },
    ],
  },
  {
    id: 2,
    subject: 'Found an easter egg!',
    author: 'explorer_jane',
    date: '2026-04-05 14:22',
    posts: [
      { id: 4, author: 'explorer_jane', date: '2026-04-05 14:22', body: 'I typed something in the terminal and my whole screen turned blue. Was that supposed to happen?? 😂' },
      { id: 5, author: 'SysOp_Eric', date: '2026-04-05 15:10', body: '👀 You found one. There are more. I won\'t say how many.' },
      { id: 6, author: 'k3nyan_dev', date: '2026-04-06 11:30', body: 'Wait there are EASTER EGGS?? BRB going to try everything.' },
    ],
  },
  {
    id: 3,
    subject: 'Best game on here?',
    author: 'pixel_punk',
    date: '2026-04-08 16:45',
    posts: [
      { id: 7, author: 'pixel_punk', date: '2026-04-08 16:45', body: 'Been playing all the games. Asteroids is addicting but the Chess AI keeps destroying me. What\'s everyone\'s favorite?' },
      { id: 8, author: 'nightcoder_42', date: '2026-04-08 20:12', body: 'Minesweeper on expert mode. I\'m a masochist apparently.' },
      { id: 9, author: 'explorer_jane', date: '2026-04-09 09:33', body: 'The Rock\'em Sock\'em robots!! I\'m just mashing spacebar like my life depends on it lol' },
    ],
  },
  {
    id: 4,
    subject: 'How was this site built?',
    author: 'curious_cat',
    date: '2026-04-10 10:00',
    posts: [
      { id: 10, author: 'curious_cat', date: '2026-04-10 10:00', body: 'Seriously impressed by this. Is this all React? How long did it take?' },
      { id: 11, author: 'SysOp_Eric', date: '2026-04-10 11:45', body: 'React + Vite + react95 + Tailwind + Framer Motion. The games are all canvas-based. Took a while but it was fun to build.\n\nCheck out the Terminal and type "neofetch" for the full stack info.' },
    ],
  },
]

const SCREEN_NAME_COLORS = {
  'SysOp_Eric': '#FF6B35',
  'nightcoder_42': '#44DD44',
  'explorer_jane': '#44AAFF',
  'k3nyan_dev': '#FFD700',
  'pixel_punk': '#FF44FF',
  'curious_cat': '#44FFDD',
}

function getNameColor(name) {
  if (SCREEN_NAME_COLORS[name]) return SCREEN_NAME_COLORS[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 60%)`
}

// ── Views ──

function ThreadList({ threads, onOpen, onNew }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#000', color: '#ccc', fontFamily: '"Courier New", monospace', fontSize: 12 }}>
      {/* Header */}
      <div className="px-3 py-2 shrink-0" style={{ background: '#000080', color: '#fff' }}>
        <div className="text-center font-bold text-sm">╔═══════════════════════════════════════╗</div>
        <div className="text-center font-bold text-sm">║   ChemNet Message Board  ·  BBS v1.0  ║</div>
        <div className="text-center font-bold text-sm">╚═══════════════════════════════════════╝</div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1 shrink-0" style={{ background: '#000066', borderBottom: '1px solid #0000AA' }}>
        <button
          onClick={onNew}
          className="px-2 py-0.5 text-xs border-none cursor-pointer font-bold"
          style={{ background: '#FF6B35', color: '#000', fontFamily: 'inherit' }}
        >
          [NEW THREAD]
        </button>
        <span className="text-xs" style={{ color: '#8888FF' }}>{threads.length} thread(s)</span>
        <span className="ml-auto text-xs" style={{ color: '#666' }}>Screen Name required to post</span>
      </div>

      {/* Column headers */}
      <div className="flex px-3 py-1 text-xs shrink-0" style={{ background: '#111', borderBottom: '1px solid #333', color: '#888' }}>
        <div style={{ width: 30 }}>#</div>
        <div className="flex-1">Subject</div>
        <div style={{ width: 110 }}>Author</div>
        <div style={{ width: 40, textAlign: 'right' }}>Posts</div>
        <div style={{ width: 90, textAlign: 'right' }}>Last Post</div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-auto">
        {threads.map((t, i) => (
          <div
            key={t.id}
            className="flex items-center px-3 py-1.5 cursor-pointer"
            style={{ borderBottom: '1px solid #1a1a1a' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#111' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            onClick={() => onOpen(t.id)}
          >
            <div style={{ width: 30, color: '#666' }}>{i + 1}.</div>
            <div className="flex-1 truncate" style={{ color: '#FFD700' }}>{t.subject}</div>
            <div style={{ width: 110, color: getNameColor(t.author) }}>{t.author}</div>
            <div style={{ width: 40, textAlign: 'right', color: '#888' }}>{t.posts.length}</div>
            <div style={{ width: 90, textAlign: 'right', color: '#555' }}>{t.posts[t.posts.length - 1].date.split(' ')[0]}</div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="px-3 py-1 text-xs shrink-0" style={{ background: '#000066', color: '#8888FF' }}>
        Click a thread to read · [NEW THREAD] to start one
      </div>
    </div>
  )
}

function ThreadView({ thread, onBack, onReply }) {
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread.posts.length])

  return (
    <div className="flex flex-col h-full" style={{ background: '#000', color: '#ccc', fontFamily: '"Courier New", monospace', fontSize: 12 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ background: '#000066', borderBottom: '1px solid #0000AA' }}>
        <button
          onClick={onBack}
          className="px-2 py-0.5 text-xs border-none cursor-pointer"
          style={{ background: '#333', color: '#ccc', fontFamily: 'inherit' }}
        >
          [BACK]
        </button>
        <span className="flex-1 truncate font-bold" style={{ color: '#FFD700' }}>{thread.subject}</span>
        <span className="text-xs" style={{ color: '#666' }}>{thread.posts.length} post(s)</span>
      </div>

      {/* Posts */}
      <div className="flex-1 overflow-auto px-3 py-2">
        {thread.posts.map((post, i) => (
          <div key={post.id} className="mb-3" style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: 8 }}>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: getNameColor(post.author), fontWeight: 'bold' }}>{post.author}</span>
              {post.author === 'SysOp_Eric' && (
                <span className="text-xs px-1" style={{ background: '#FF6B35', color: '#000', fontSize: 9 }}>SYSOP</span>
              )}
              <span className="ml-auto" style={{ color: '#555', fontSize: 10 }}>{post.date}</span>
            </div>
            <div style={{ color: '#ccc', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{post.body}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply form */}
      <ReplyForm onSubmit={onReply} />
    </div>
  )
}

function ReplyForm({ onSubmit, isNewThread }) {
  const [screenName, setScreenName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!screenName.trim()) { setError('Screen name required'); return }
    if (!body.trim()) { setError('Message cannot be empty'); return }
    if (isNewThread && !subject.trim()) { setError('Subject required'); return }
    setError('')
    onSubmit({ screenName: screenName.trim(), email: email.trim(), subject: subject.trim(), body: body.trim() })
    setBody('')
    if (isNewThread) setSubject('')
  }

  return (
    <div className="px-3 py-2 shrink-0" style={{ background: '#0a0a1a', borderTop: '1px solid #333', fontFamily: '"Courier New", monospace', fontSize: 12 }}>
      <div className="flex gap-2 mb-1.5">
        <div className="flex items-center gap-1">
          <span style={{ color: '#888' }}>Name:</span>
          <input
            value={screenName}
            onChange={(e) => setScreenName(e.target.value)}
            placeholder="your_screen_name"
            className="px-1 py-0.5 border-none outline-none"
            style={{ background: '#111', color: '#44DD44', fontFamily: 'inherit', fontSize: 11, width: 120 }}
          />
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: '#888' }}>Email:</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="optional"
            className="px-1 py-0.5 border-none outline-none"
            style={{ background: '#111', color: '#888', fontFamily: 'inherit', fontSize: 11, width: 120 }}
          />
        </div>
      </div>
      {isNewThread && (
        <div className="flex items-center gap-1 mb-1.5">
          <span style={{ color: '#888' }}>Subj:</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Thread subject"
            className="px-1 py-0.5 border-none outline-none flex-1"
            style={{ background: '#111', color: '#FFD700', fontFamily: 'inherit', fontSize: 11 }}
          />
        </div>
      )}
      <div className="flex gap-2 items-end">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type your message..."
          rows={2}
          className="flex-1 px-1 py-0.5 border-none outline-none resize-none"
          style={{ background: '#111', color: '#ccc', fontFamily: 'inherit', fontSize: 11 }}
        />
        <button
          onClick={handleSubmit}
          className="px-2 py-1 border-none cursor-pointer font-bold shrink-0"
          style={{ background: '#FF6B35', color: '#000', fontFamily: 'inherit', fontSize: 11 }}
        >
          {isNewThread ? '[POST]' : '[REPLY]'}
        </button>
      </div>
      {error && <div className="mt-1 text-xs" style={{ color: '#FF4444' }}>{error}</div>}
      <div className="mt-1 text-xs" style={{ color: '#444' }}>Email is private — only used if SysOp replies to you directly</div>
    </div>
  )
}

function NewThreadView({ onBack, onSubmit }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#000', color: '#ccc', fontFamily: '"Courier New", monospace', fontSize: 12 }}>
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0" style={{ background: '#000066', borderBottom: '1px solid #0000AA' }}>
        <button
          onClick={onBack}
          className="px-2 py-0.5 text-xs border-none cursor-pointer"
          style={{ background: '#333', color: '#ccc', fontFamily: 'inherit' }}
        >
          [BACK]
        </button>
        <span className="font-bold" style={{ color: '#FFD700' }}>New Thread</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div style={{ width: 340 }}>
          <ReplyForm onSubmit={onSubmit} isNewThread />
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MOBILE VIEW — iOS Messages style
// ══════════════════════════════════════════

function getAvatarColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 50%, 45%)`
}

function MobileThreadList({ threads, onOpen, onNew }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea' }}>
        <div style={{ width: 50 }} />
        <span style={{ fontSize: 16, fontWeight: 600, color: '#000' }}>Messages</span>
        <button onClick={onNew} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 13, fontFamily: '-apple-system, sans-serif' }}>New Message</button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-auto">
        {threads.map(t => {
          const lastPost = t.posts[t.posts.length - 1]
          const preview = lastPost.body.slice(0, 50).replace(/\n/g, ' ')
          return (
            <div
              key={t.id}
              onClick={() => onOpen(t.id)}
              className="flex items-center gap-3"
              style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0f0' }}
            >
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: getAvatarColor(t.author),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 16, fontWeight: 600, shrink: 0,
              }}>
                {t.author.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#000' }}>{t.subject}</span>
                  <span style={{ fontSize: 12, color: '#8e8e93', shrink: 0 }}>
                    {new Date(t.posts[t.posts.length - 1].date || t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {lastPost.author}: {preview}
                </div>
              </div>
              <span style={{ color: '#c7c7cc', fontSize: 16 }}>›</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MobileThreadView({ thread, onBack, onReply }) {
  const [message, setMessage] = useState('')
  const [screenName, setScreenName] = useState('')
  const [showNameInput, setShowNameInput] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread.posts.length])

  const handleSend = () => {
    if (!message.trim()) return
    if (!screenName.trim()) { setShowNameInput(true); return }
    onReply({ screenName: screenName.trim(), body: message.trim() })
    setMessage('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      {/* Header */}
      <div className="flex items-center px-3 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea', background: '#f8f8f8' }}>
        <button onClick={onBack} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15, fontFamily: 'inherit' }}>
          ‹ Back
        </button>
        <span className="flex-1 text-center truncate" style={{ fontSize: 15, fontWeight: 600, color: '#000', padding: '0 40px' }}>
          {thread.subject}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto" style={{ background: '#e5e5ea', padding: '8px 12px' }}>
        {thread.posts.map((post, i) => {
          const isSysop = post.author === 'SysOp_Eric' || post.is_sysop
          const isMe = post.author === screenName
          // Eric's messages (SysOp) are always blue/right — it's his phone
          const alignRight = isSysop || isMe

          return (
            <div key={post.id || i} style={{ display: 'flex', justifyContent: alignRight ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
              <div style={{ maxWidth: '75%' }}>
                {/* Name label */}
                {!alignRight && (
                  <div style={{ fontSize: 10, color: '#8e8e93', marginBottom: 2, paddingLeft: 10 }}>
                    {post.author} {isSysop ? '· SysOp' : ''}
                  </div>
                )}
                {/* Bubble */}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 18,
                  background: alignRight ? '#007AFF' : '#fff',
                  color: alignRight ? '#fff' : '#000',
                  fontSize: 14,
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 0.5px 1px rgba(0,0,0,0.1)',
                }}>
                  {post.body}
                </div>
                <div style={{ fontSize: 9, color: '#8e8e93', marginTop: 2, textAlign: alignRight ? 'right' : 'left', paddingLeft: alignRight ? 0 : 10, paddingRight: alignRight ? 10 : 0 }}>
                  {post.date ? new Date(post.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Name input (shown once) */}
      {showNameInput && !screenName && (
        <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ background: '#f8f8f8', borderTop: '0.5px solid #e5e5ea' }}>
          <input
            value={screenName}
            onChange={(e) => setScreenName(e.target.value)}
            placeholder="Enter your name first"
            className="flex-1 px-3 py-1.5 border-none outline-none"
            style={{ background: '#e5e5ea', borderRadius: 18, fontSize: 14, fontFamily: 'inherit' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && screenName.trim()) setShowNameInput(false) }}
          />
          <button
            onClick={() => { if (screenName.trim()) setShowNameInput(false) }}
            className="border-none bg-transparent cursor-pointer"
            style={{ color: screenName.trim() ? '#007AFF' : '#c7c7cc', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}
          >
            Set
          </button>
        </div>
      )}

      {/* Message input */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ background: '#f8f8f8', borderTop: '0.5px solid #e5e5ea' }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={screenName ? 'Message' : 'Set your name first'}
          disabled={!screenName}
          className="flex-1 px-3 py-1.5 border-none outline-none"
          style={{ background: '#e5e5ea', borderRadius: 18, fontSize: 14, fontFamily: 'inherit' }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
        />
        <button
          onClick={handleSend}
          className="border-none bg-transparent cursor-pointer"
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: message.trim() && screenName ? '#007AFF' : '#e5e5ea',
            color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}

function MobileNewThread({ onBack, onSubmit }) {
  const [screenName, setScreenName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const handleSend = () => {
    if (!screenName.trim() || !subject.trim() || !body.trim()) return
    onSubmit({ screenName: screenName.trim(), subject: subject.trim(), body: body.trim() })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      <div className="flex items-center px-3 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea' }}>
        <button onClick={onBack} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15, fontFamily: 'inherit' }}>Cancel</button>
        <span className="flex-1 text-center" style={{ fontSize: 15, fontWeight: 600 }}>New Message</span>
        <button onClick={handleSend} className="border-none bg-transparent cursor-pointer" style={{ color: (screenName && subject && body) ? '#007AFF' : '#c7c7cc', fontSize: 15, fontWeight: 600, fontFamily: 'inherit' }}>Send</button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <input value={screenName} onChange={e => setScreenName(e.target.value)} placeholder="Your name" className="w-full px-0 py-2 border-none outline-none" style={{ borderBottom: '0.5px solid #e5e5ea', fontSize: 15, fontFamily: 'inherit' }} />
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full px-0 py-2 border-none outline-none" style={{ borderBottom: '0.5px solid #e5e5ea', fontSize: 15, fontFamily: 'inherit' }} />
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..." className="w-full px-0 py-2 border-none outline-none resize-none" rows={6} style={{ fontSize: 15, fontFamily: 'inherit', lineHeight: 1.5 }} />
      </div>
    </div>
  )
}

// ── Main ──
export default function MessageBoard() {
  const [threads, setThreads] = useState(INITIAL_THREADS)
  const [view, setView] = useState('list') // list, thread, new
  const [activeThreadId, setActiveThreadId] = useState(null)

  const activeThread = threads.find(t => t.id === activeThreadId)

  const handleOpenThread = (id) => {
    setActiveThreadId(id)
    setView('thread')
  }

  const handleReply = ({ screenName, body }) => {
    setThreads(prev => prev.map(t => {
      if (t.id !== activeThreadId) return t
      return {
        ...t,
        posts: [...t.posts, {
          id: Date.now(),
          author: screenName,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          body,
        }],
      }
    }))
  }

  const handleNewThread = ({ screenName, subject, body }) => {
    const newThread = {
      id: Date.now(),
      subject,
      author: screenName,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      posts: [{
        id: Date.now() + 1,
        author: screenName,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        body,
      }],
    }
    setThreads(prev => [newThread, ...prev])
    setActiveThreadId(newThread.id)
    setView('thread')
  }

  const isMobile = useMediaQuery('(max-width: 768px)')

  // Mobile — iMessage style
  if (isMobile) {
    if (view === 'new') return <MobileNewThread onBack={() => setView('list')} onSubmit={handleNewThread} />
    if (view === 'thread' && activeThread) return <MobileThreadView thread={activeThread} onBack={() => setView('list')} onReply={handleReply} />
    return <MobileThreadList threads={threads} onOpen={handleOpenThread} onNew={() => setView('new')} />
  }

  // Desktop — BBS style
  if (view === 'new') {
    return <NewThreadView onBack={() => setView('list')} onSubmit={handleNewThread} />
  }

  if (view === 'thread' && activeThread) {
    return <ThreadView thread={activeThread} onBack={() => setView('list')} onReply={handleReply} />
  }

  return <ThreadList threads={threads} onOpen={handleOpenThread} onNew={() => setView('new')} />
}
