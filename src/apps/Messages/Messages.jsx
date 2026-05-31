import { useState, useEffect, useCallback, useRef } from 'react'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'

// Messages — 1:1 AOL-style instant messenger over members.messages.
//   • Owner: a buddy-list of all conversations.
//   • Visitor (logged in) on a member node: a single thread with the owner.
//   • Logged out: a "sign in to chat" prompt.
// RLS guarantees you only ever load your own messages; the UI just shapes them.

function Avatar({ p, size = 28 }) {
  const initial = (p?.display_name || p?.handle || '?').charAt(0).toUpperCase()
  if (p?.avatar_url) return <img src={p.avatar_url} alt="" style={{ width: size, height: size, borderRadius: 4, objectFit: 'cover' }} />
  return <div style={{ width: size, height: size, borderRadius: 4, background: 'var(--color-accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: size * 0.45 }}>{initial}</div>
}

function ChatWindow({ otherId, otherLabel }) {
  const repo = useRepo()
  const { currentUser } = useProfile()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const endRef = useRef(null)

  const load = useCallback(async () => {
    if (!otherId) return
    const rows = await repo.social.chat.thread(otherId)
    setMessages(rows)
    repo.social.chat.markReadFrom(otherId)
  }, [repo, otherId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // Realtime: refetch on any incoming message (RLS-scoped).
  useEffect(() => {
    const unsub = repo.social.chat.subscribe(() => load())
    return unsub
  }, [repo, load])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const body = text.trim()
    if (!body) return
    setText('')
    const row = await repo.social.chat.send(otherId, body)
    if (row) setMessages(prev => [...prev, row])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-surface)' }}>
      <div style={{ padding: '5px 10px', background: 'var(--color-titlebar-active)', color: 'var(--color-titlebar-text)', fontSize: 12, fontWeight: 'bold' }}>
        💬 {otherLabel}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: '"Courier Prime", monospace', fontSize: 12 }}>
        {messages.length === 0 && <div style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>No messages yet — say hi 👋</div>}
        {messages.map(msg => {
          const mine = msg.sender_id === currentUser?.id
          return (
            <div key={msg.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
              <div style={{
                padding: '5px 9px', borderRadius: 8,
                background: mine ? 'var(--color-accent)' : 'var(--color-titlebar-inactive)',
                color: mine ? '#000' : 'var(--color-text-primary)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>{msg.body}</div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>
      <div style={{ display: 'flex', gap: 6, padding: 8, borderTop: '1px solid var(--color-bevel-dark)' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Type a message…"
          style={{ flex: 1, padding: '6px 8px', background: 'var(--color-desktop-bg)', color: 'var(--color-text-primary)', border: '1px solid var(--color-bevel-dark)', outline: 'none', fontFamily: 'inherit', fontSize: 12 }}
        />
        <button onClick={send} style={{ padding: '6px 12px', background: 'var(--color-accent)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit', fontSize: 12 }}>Send</button>
      </div>
    </div>
  )
}

function BuddyList({ onOpen, activeId }) {
  const repo = useRepo()
  const [convos, setConvos] = useState([])

  const load = useCallback(async () => { setConvos(await repo.social.chat.conversations()) }, [repo])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])
  useEffect(() => {
    const unsub = repo.social.chat.subscribe(() => load())
    return unsub
  }, [repo, load])

  return (
    <div style={{ width: 170, borderRight: '1px solid var(--color-bevel-dark)', overflow: 'auto', background: 'var(--color-titlebar-inactive)' }}>
      <div style={{ padding: '5px 8px', fontSize: 11, fontWeight: 'bold', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-bevel-dark)' }}>Buddy List</div>
      {convos.length === 0 && <div style={{ padding: 10, fontSize: 11, color: 'var(--color-text-secondary)' }}>No conversations yet.</div>}
      {convos.map(c => (
        <button key={c.otherId} onClick={() => onOpen(c)} style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
          padding: '6px 8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          background: activeId === c.otherId ? 'var(--color-accent)' : 'transparent',
          color: activeId === c.otherId ? '#000' : 'var(--color-text-primary)',
        }}>
          <Avatar p={c} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.display_name || c.handle || 'Unknown'}</div>
            <div style={{ fontSize: 10, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastBody}</div>
          </div>
          {c.unread > 0 && <span style={{ background: 'var(--color-accent)', color: '#000', borderRadius: 8, fontSize: 9, padding: '0 5px', fontWeight: 'bold' }}>{c.unread}</span>}
        </button>
      ))}
    </div>
  )
}

export default function Messages() {
  const { node, isOwner, currentUser } = useProfile()
  const [active, setActive] = useState(null)  // { otherId, handle, display_name }

  if (!currentUser) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--color-surface)', color: 'var(--color-text-secondary)', fontFamily: '"Courier Prime", monospace', padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 32 }}>💬</div>
        <div>Sign in to start a chat.</div>
        <button onClick={() => window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: 'signup' }))} style={{ padding: '6px 14px', background: 'var(--color-accent)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit', fontSize: 12 }}>Sign in</button>
      </div>
    )
  }

  // Visitor on someone else's member node → single thread with the owner.
  if (node.kind === 'member' && !isOwner) {
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <ChatWindow otherId={node.userId} otherLabel={`@${node.handle}`} />
      </div>
    )
  }

  // Owner (or flagship admin) → buddy-list of all conversations.
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', background: 'var(--color-surface)' }}>
      <BuddyList onOpen={setActive} activeId={active?.otherId} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {active
          ? <ChatWindow otherId={active.otherId} otherLabel={active.display_name || active.handle || 'Chat'} />
          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontFamily: '"Courier Prime", monospace', fontSize: 12 }}>Pick a buddy to chat.</div>}
      </div>
    </div>
  )
}
