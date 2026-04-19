import { useState } from 'react'

const FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: '📥', count: 3 },
  { id: 'drafts', label: 'Drafts', icon: '📝', count: 0 },
  { id: 'sent', label: 'Sent Items', icon: '📤', count: 0 },
  { id: 'trash', label: 'Deleted Items', icon: '🗑️', count: 0 },
]

const INBOX_MESSAGES = [
  {
    id: 1,
    from: 'SysOp_Eric',
    subject: 'Welcome to ChemNet Mail',
    date: '2026-04-01',
    read: true,
    body: `Hey — welcome to ChemNet Mail.

This isn't a real email client (obviously). But if you want to reach me, hit "New Message" and write something. It'll come through to my actual inbox.

Talk soon.

— Eric`,
  },
  {
    id: 2,
    from: 'SysOp_Eric',
    subject: 'Re: Thanks for visiting',
    date: '2026-04-05',
    read: true,
    body: `Glad you're enjoying the site. I actually read every message that comes through here, so don't be shy.

If you found any easter eggs, I'd love to know which ones.

— Eric`,
  },
  {
    id: 3,
    from: 'ChemNet System',
    subject: 'Tip: Try the Terminal',
    date: '2026-04-08',
    read: false,
    body: `Did you know ChemNet has a fully working terminal?

Open it from the Start Menu or the desktop and try:
  • ls -a (to see hidden files)
  • whoami (for a surprise)
  • neofetch (system info)
  • cowsay hello

There's a whole filesystem to explore.

— ChemNet Automated Message`,
  },
]

function FolderPanel({ folders, activeFolder, onSelect }) {
  return (
    <div className="shrink-0 overflow-auto" style={{ width: 130, background: '#d4d0c8', borderRight: '1px solid #808080' }}>
      <div className="px-2 py-1.5 text-xs font-bold" style={{ background: '#000080', color: '#fff' }}>
        ChemNet Mail
      </div>
      {folders.map(f => (
        <div
          key={f.id}
          className="flex items-center gap-1.5 px-2 py-1 cursor-pointer text-xs"
          style={{
            background: activeFolder === f.id ? '#000080' : 'transparent',
            color: activeFolder === f.id ? '#fff' : '#000',
            fontFamily: 'Tahoma, Arial, sans-serif',
          }}
          onClick={() => onSelect(f.id)}
        >
          <span>{f.icon}</span>
          <span className="flex-1">{f.label}</span>
          {f.count > 0 && (
            <span style={{ color: activeFolder === f.id ? '#ccc' : '#666', fontSize: 10 }}>({f.count})</span>
          )}
        </div>
      ))}
    </div>
  )
}

function MessageList({ messages, selectedId, onSelect }) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: '#888', fontFamily: 'Tahoma, Arial, sans-serif', fontSize: 12 }}>
        No messages in this folder
      </div>
    )
  }
  return (
    <div className="flex-1 overflow-auto" style={{ background: '#fff' }}>
      {/* Column headers */}
      <div className="flex items-center px-2 py-0.5 text-xs sticky top-0" style={{ background: '#d4d0c8', borderBottom: '1px solid #808080', fontFamily: 'Tahoma, Arial, sans-serif', color: '#000' }}>
        <div style={{ width: 20 }} />
        <div className="flex-1 font-bold">From</div>
        <div className="flex-1 font-bold">Subject</div>
        <div style={{ width: 70, textAlign: 'right' }} className="font-bold">Date</div>
      </div>
      {messages.map(m => (
        <div
          key={m.id}
          className="flex items-center px-2 py-1 cursor-pointer text-xs"
          style={{
            background: selectedId === m.id ? '#0a246a' : 'transparent',
            color: selectedId === m.id ? '#fff' : '#000',
            fontFamily: 'Tahoma, Arial, sans-serif',
            fontWeight: m.read ? 'normal' : 'bold',
          }}
          onClick={() => onSelect(m.id)}
        >
          <div style={{ width: 20 }}>{m.read ? '📧' : '✉️'}</div>
          <div className="flex-1 truncate">{m.from}</div>
          <div className="flex-1 truncate">{m.subject}</div>
          <div style={{ width: 70, textAlign: 'right', color: selectedId === m.id ? '#aaa' : '#666' }}>{m.date}</div>
        </div>
      ))}
    </div>
  )
}

function ReadingPane({ message }) {
  if (!message) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: '#888', fontFamily: 'Tahoma, Arial, sans-serif', fontSize: 12 }}>
        Select a message to read
      </div>
    )
  }
  return (
    <div className="flex flex-col h-full overflow-auto" style={{ background: '#fff' }}>
      <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid #d4d0c8', fontFamily: 'Tahoma, Arial, sans-serif', fontSize: 12 }}>
        <div className="flex gap-2 mb-1">
          <span style={{ color: '#666', width: 45 }}>From:</span>
          <span style={{ fontWeight: 'bold' }}>{message.from}</span>
        </div>
        <div className="flex gap-2 mb-1">
          <span style={{ color: '#666', width: 45 }}>Date:</span>
          <span>{message.date}</span>
        </div>
        <div className="flex gap-2">
          <span style={{ color: '#666', width: 45 }}>Subject:</span>
          <span style={{ fontWeight: 'bold' }}>{message.subject}</span>
        </div>
      </div>
      <div className="flex-1 px-3 py-2" style={{ fontFamily: 'Tahoma, Arial, sans-serif', fontSize: 12, lineHeight: 1.6, color: '#000', whiteSpace: 'pre-wrap' }}>
        {message.body}
      </div>
    </div>
  )
}

function ComposeView({ onSend, onCancel }) {
  const [to] = useState('eric@chemnet.dev')
  const [from, setFrom] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSend = () => {
    if (!from.trim()) { setError('Please enter your email address'); return }
    if (!subject.trim()) { setError('Please enter a subject'); return }
    if (!body.trim()) { setError('Message cannot be empty'); return }
    setError('')
    setSent(true)
    onSend({ from: from.trim(), subject: subject.trim(), body: body.trim() })
  }

  if (sent) {
    return (
      <div className="flex flex-col h-full items-center justify-center" style={{ background: '#d4d0c8', fontFamily: 'Tahoma, Arial, sans-serif' }}>
        <div className="text-center p-6" style={{ background: '#fff', border: '2px solid #808080', maxWidth: 320 }}>
          <div className="text-2xl mb-2">✅</div>
          <div className="font-bold mb-2" style={{ fontSize: 14 }}>Message Sent!</div>
          <div className="text-xs mb-3" style={{ color: '#666' }}>
            Your message has been delivered to Eric's inbox.
            <br />He actually reads these. Expect a reply.
          </div>
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs cursor-pointer"
            style={{
              background: '#d4d0c8',
              border: '2px outset #d4d0c8',
              fontFamily: 'inherit',
            }}
          >
            OK
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#d4d0c8' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-1 py-1 shrink-0" style={{ borderBottom: '1px solid #808080' }}>
        <button
          onClick={handleSend}
          className="flex items-center gap-1 px-2 py-0.5 text-xs cursor-pointer"
          style={{ background: '#d4d0c8', border: '2px outset #d4d0c8', fontFamily: 'Tahoma, Arial, sans-serif' }}
        >
          📨 Send
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-2 py-0.5 text-xs cursor-pointer"
          style={{ background: '#d4d0c8', border: '2px outset #d4d0c8', fontFamily: 'Tahoma, Arial, sans-serif' }}
        >
          ✖ Cancel
        </button>
      </div>

      {/* Headers */}
      <div className="shrink-0" style={{ background: '#fff', borderBottom: '1px solid #d4d0c8', fontFamily: 'Tahoma, Arial, sans-serif', fontSize: 12 }}>
        <div className="flex items-center px-2 py-1" style={{ borderBottom: '1px solid #eee' }}>
          <span style={{ color: '#666', width: 55, shrink: 0 }}>To:</span>
          <input
            value={to}
            disabled
            className="flex-1 border-none outline-none bg-transparent text-xs"
            style={{ color: '#000', fontFamily: 'inherit' }}
          />
        </div>
        <div className="flex items-center px-2 py-1" style={{ borderBottom: '1px solid #eee' }}>
          <span style={{ color: '#666', width: 55, shrink: 0 }}>From:</span>
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 border-none outline-none bg-transparent text-xs"
            style={{ color: '#000', fontFamily: 'inherit' }}
          />
        </div>
        <div className="flex items-center px-2 py-1">
          <span style={{ color: '#666', width: 55, shrink: 0 }}>Subject:</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's this about?"
            className="flex-1 border-none outline-none bg-transparent text-xs"
            style={{ color: '#000', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message here..."
          className="flex-1 p-3 border-none outline-none resize-none"
          style={{
            background: '#fff',
            color: '#000',
            fontFamily: 'Tahoma, Arial, sans-serif',
            fontSize: 12,
            lineHeight: 1.6,
          }}
        />
      </div>

      {error && (
        <div className="px-2 py-1 text-xs shrink-0" style={{ color: '#c00', background: '#ffe0e0' }}>
          ⚠ {error}
        </div>
      )}

      {/* Status bar */}
      <div className="px-2 py-0.5 text-xs shrink-0" style={{ borderTop: '1px solid #808080', color: '#666', fontFamily: 'Tahoma, Arial, sans-serif' }}>
        Composing new message to eric@chemnet.dev
      </div>
    </div>
  )
}

// ── Main ──
export default function Email() {
  const [activeFolder, setActiveFolder] = useState('inbox')
  const [selectedMsg, setSelectedMsg] = useState(null)
  const [composing, setComposing] = useState(false)
  const [messages, setMessages] = useState(INBOX_MESSAGES)
  const [sentMessages, setSentMessages] = useState([])
  const [folders, setFolders] = useState(FOLDERS)

  const currentMessages = activeFolder === 'inbox' ? messages
    : activeFolder === 'sent' ? sentMessages
    : []

  const selectedMessage = currentMessages.find(m => m.id === selectedMsg)

  const handleSelect = (id) => {
    setSelectedMsg(id)
    // Mark as read
    if (activeFolder === 'inbox') {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m))
      setFolders(prev => prev.map(f => f.id === 'inbox' ? { ...f, count: messages.filter(m => !m.read && m.id !== id).length } : f))
    }
  }

  const handleSend = ({ from, subject, body }) => {
    const newMsg = {
      id: Date.now(),
      from: 'You (' + from + ')',
      subject,
      date: new Date().toISOString().split('T')[0],
      read: true,
      body,
    }
    setSentMessages(prev => [newMsg, ...prev])
    setFolders(prev => prev.map(f => f.id === 'sent' ? { ...f, count: sentMessages.length + 1 } : f))
    setComposing(false)
  }

  if (composing) {
    return <ComposeView onSend={handleSend} onCancel={() => setComposing(false)} />
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#d4d0c8' }}>
      {/* Menu bar */}
      <div className="flex items-center gap-3 px-2 py-0.5 shrink-0 text-xs" style={{ borderBottom: '1px solid #808080', fontFamily: 'Tahoma, Arial, sans-serif' }}>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Message</span>
        <span>Help</span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-1 py-1 shrink-0" style={{ borderBottom: '1px solid #808080' }}>
        <button
          onClick={() => setComposing(true)}
          className="flex items-center gap-1 px-2 py-0.5 text-xs cursor-pointer"
          style={{ background: '#d4d0c8', border: '2px outset #d4d0c8', fontFamily: 'Tahoma, Arial, sans-serif' }}
        >
          ✏️ New Message
        </button>
        <button
          className="flex items-center gap-1 px-2 py-0.5 text-xs cursor-pointer"
          style={{ background: '#d4d0c8', border: '2px outset #d4d0c8', fontFamily: 'Tahoma, Arial, sans-serif' }}
          disabled
        >
          ↩️ Reply
        </button>
        <button
          className="flex items-center gap-1 px-2 py-0.5 text-xs cursor-pointer"
          style={{ background: '#d4d0c8', border: '2px outset #d4d0c8', fontFamily: 'Tahoma, Arial, sans-serif' }}
          disabled
        >
          🗑️ Delete
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Folder panel */}
        <FolderPanel folders={folders} activeFolder={activeFolder} onSelect={(id) => { setActiveFolder(id); setSelectedMsg(null) }} />

        {/* Right side — list + reading pane */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Message list — top half */}
          <div style={{ height: '40%', borderBottom: '2px solid #808080', overflow: 'hidden', display: 'flex' }}>
            <MessageList messages={currentMessages} selectedId={selectedMsg} onSelect={handleSelect} />
          </div>

          {/* Reading pane — bottom half */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ReadingPane message={selectedMessage} />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center px-2 py-0.5 text-xs shrink-0" style={{ borderTop: '1px solid #808080', fontFamily: 'Tahoma, Arial, sans-serif', color: '#666' }}>
        <span>{currentMessages.length} message(s)</span>
        <span className="ml-auto">ChemNet Mail — eric@chemnet.dev</span>
      </div>
    </div>
  )
}
