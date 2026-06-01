import { useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'

// Mail — styled like a classic email client (Outlook Express on desktop, old
// iPhone Mail on mobile). Under the hood it is still a send-only contact form:
// composing a message emails the node owner via the send_mail Edge Function
// (their real address is resolved server-side and never reaches the browser).
// There is no real received-mail inbox; the Inbox shows a friendly intro from
// the owner. Replies go to the sender's own email.
const ERR = {
  invalid_email: 'Please enter a valid email address.',
  empty_body: 'Write a message first.',
  rate_limited: 'Too many messages just now. Try again later.',
  mail_disabled: 'This person has turned off their contact form.',
  mail_unavailable: 'Mail is not configured yet. Try again later.',
  not_found: 'Could not find this node.',
  send_failed: 'Could not send. Try again.',
}

const today = () => new Date().toISOString().slice(0, 10)

// ══════════════════════════════════════════
// DESKTOP — Outlook Express
// ══════════════════════════════════════════

function ComposeDesktop({ toLabel, onSend, onCancel }) {
  const [from, setFrom] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async () => {
    setError('')
    if (!from.trim()) { setError('Enter your email so they can reply.'); return }
    if (!body.trim()) { setError('Write a message first.'); return }
    setBusy(true)
    const res = await onSend({ from: from.trim(), subject: subject.trim(), body: body.trim() })
    setBusy(false)
    if (res?.error) { setError(res.error); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col h-full items-center justify-center" style={{ background: '#d4d0c8', fontFamily: 'Tahoma, Arial, sans-serif' }}>
        <div className="text-center p-6" style={{ background: '#fff', border: '2px solid #808080', maxWidth: 320 }}>
          <div className="text-2xl mb-2">✅</div>
          <div className="font-bold mb-2" style={{ fontSize: 14 }}>Message Sent</div>
          <div className="text-xs mb-3" style={{ color: '#666' }}>Delivered to {toLabel}. A reply will come to your email.</div>
          <button onClick={onCancel} className="px-3 py-1 text-xs cursor-pointer" style={{ background: '#d4d0c8', border: '2px outset #d4d0c8', fontFamily: 'inherit' }}>OK</button>
        </div>
      </div>
    )
  }

  const headerRow = { display: 'flex', alignItems: 'center', padding: '4px 8px', borderBottom: '1px solid #eee' }
  const headerLabel = { color: '#666', width: 60, flexShrink: 0, fontSize: 12 }
  const inputStyle = { color: '#000', fontFamily: 'inherit', fontSize: 12 }

  return (
    <div className="flex flex-col h-full" style={{ background: '#d4d0c8', fontFamily: 'Tahoma, Arial, sans-serif' }}>
      <div className="flex items-center gap-1 px-1 py-1 shrink-0" style={{ borderBottom: '1px solid #808080' }}>
        <button onClick={submit} disabled={busy} className="flex items-center gap-1 px-2 py-0.5 text-xs cursor-pointer" style={{ background: '#d4d0c8', border: '2px outset #d4d0c8', fontFamily: 'inherit', opacity: busy ? 0.6 : 1 }}>📨 Send</button>
        <button onClick={onCancel} className="flex items-center gap-1 px-2 py-0.5 text-xs cursor-pointer" style={{ background: '#d4d0c8', border: '2px outset #d4d0c8', fontFamily: 'inherit' }}>✖ Cancel</button>
      </div>
      <div className="shrink-0" style={{ background: '#fff', borderBottom: '1px solid #d4d0c8' }}>
        <div style={headerRow}>
          <span style={headerLabel}>To:</span>
          <span style={{ ...inputStyle, fontWeight: 'bold' }}>{toLabel}</span>
        </div>
        <div style={headerRow}>
          <span style={headerLabel}>From:</span>
          <input value={from} onChange={e => setFrom(e.target.value)} placeholder="your@email.com" className="flex-1 border-none outline-none bg-transparent" style={inputStyle} />
        </div>
        <div style={{ ...headerRow, borderBottom: 'none' }}>
          <span style={headerLabel}>Subject:</span>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What is this about?" className="flex-1 border-none outline-none bg-transparent" style={inputStyle} />
        </div>
      </div>
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message here..." className="flex-1 p-3 border-none outline-none resize-none" style={{ background: '#fff', color: '#000', fontFamily: 'Tahoma, Arial, sans-serif', fontSize: 12, lineHeight: 1.6 }} />
      {error && <div className="px-2 py-1 text-xs shrink-0" style={{ color: '#c00', background: '#ffe0e0' }}>⚠ {error}</div>}
      <div className="px-2 py-0.5 text-xs shrink-0" style={{ borderTop: '1px solid #808080', color: '#666', fontFamily: 'inherit' }}>Composing a message to {toLabel}</div>
    </div>
  )
}

function DesktopMail({ intro, sentItems, onSend, toLabel, ownerName }) {
  const [folder, setFolder] = useState('inbox')
  const [selectedId, setSelectedId] = useState('intro')
  const [composing, setComposing] = useState(false)

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: '📥', count: 1 },
    { id: 'sent', label: 'Sent Items', icon: '📤', count: sentItems.length },
    { id: 'drafts', label: 'Drafts', icon: '📝', count: 0 },
    { id: 'trash', label: 'Deleted Items', icon: '🗑️', count: 0 },
  ]
  const messages = folder === 'inbox' ? [intro] : folder === 'sent' ? sentItems : []
  const selected = messages.find(m => String(m.id) === String(selectedId))

  if (composing) {
    return <ComposeDesktop toLabel={toLabel} onSend={onSend} onCancel={() => setComposing(false)} />
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#d4d0c8', fontFamily: 'Tahoma, Arial, sans-serif' }}>
      <div className="flex items-center gap-3 px-2 py-0.5 shrink-0 text-xs" style={{ borderBottom: '1px solid #808080' }}>
        <span>File</span><span>Edit</span><span>View</span><span>Message</span><span>Help</span>
      </div>
      <div className="flex items-center gap-1 px-1 py-1 shrink-0" style={{ borderBottom: '1px solid #808080' }}>
        <button onClick={() => setComposing(true)} className="flex items-center gap-1 px-2 py-0.5 text-xs cursor-pointer" style={{ background: '#d4d0c8', border: '2px outset #d4d0c8', fontFamily: 'inherit' }}>✏️ New Message</button>
        <button disabled className="px-2 py-0.5 text-xs" style={{ background: '#d4d0c8', border: '2px outset #d4d0c8', fontFamily: 'inherit', color: '#888' }}>↩️ Reply</button>
        <button disabled className="px-2 py-0.5 text-xs" style={{ background: '#d4d0c8', border: '2px outset #d4d0c8', fontFamily: 'inherit', color: '#888' }}>🗑️ Delete</button>
      </div>
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <div className="shrink-0 overflow-auto" style={{ width: 130, background: '#d4d0c8', borderRight: '1px solid #808080' }}>
          <div className="px-2 py-1.5 text-xs font-bold" style={{ background: '#000080', color: '#fff' }}>Mail — {ownerName}</div>
          {folders.map(f => (
            <div key={f.id} onClick={() => { setFolder(f.id); setSelectedId(f.id === 'inbox' ? 'intro' : null) }} className="flex items-center gap-1.5 px-2 py-1 cursor-pointer text-xs" style={{ background: folder === f.id ? '#000080' : 'transparent', color: folder === f.id ? '#fff' : '#000' }}>
              <span>{f.icon}</span><span className="flex-1">{f.label}</span>
              {f.count > 0 && <span style={{ color: folder === f.id ? '#ccc' : '#666', fontSize: 10 }}>({f.count})</span>}
            </div>
          ))}
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <div style={{ height: '42%', borderBottom: '2px solid #808080', overflow: 'auto', background: '#fff' }}>
            <div className="flex items-center px-2 py-0.5 text-xs sticky top-0" style={{ background: '#d4d0c8', borderBottom: '1px solid #808080', color: '#000' }}>
              <div style={{ width: 18 }} /><div className="flex-1 font-bold">From</div><div className="flex-1 font-bold">Subject</div><div style={{ width: 70, textAlign: 'right' }} className="font-bold">Date</div>
            </div>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center text-xs" style={{ color: '#888', padding: 20 }}>No messages in this folder</div>
            ) : messages.map(m => (
              <div key={m.id} onClick={() => setSelectedId(m.id)} className="flex items-center px-2 py-1 cursor-pointer text-xs" style={{ background: String(selectedId) === String(m.id) ? '#0a246a' : 'transparent', color: String(selectedId) === String(m.id) ? '#fff' : '#000', fontWeight: m.read ? 'normal' : 'bold' }}>
                <div style={{ width: 18 }}>{m.read ? '📧' : '✉️'}</div>
                <div className="flex-1 truncate">{m.from}</div>
                <div className="flex-1 truncate">{m.subject}</div>
                <div style={{ width: 70, textAlign: 'right', color: String(selectedId) === String(m.id) ? '#aaa' : '#666' }}>{m.date}</div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
            {selected ? (
              <div className="flex flex-col h-full">
                <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid #d4d0c8', fontSize: 12 }}>
                  <div className="flex gap-2 mb-1"><span style={{ color: '#666', width: 45 }}>From:</span><span style={{ fontWeight: 'bold' }}>{selected.from}</span></div>
                  <div className="flex gap-2 mb-1"><span style={{ color: '#666', width: 45 }}>Date:</span><span>{selected.date}</span></div>
                  <div className="flex gap-2"><span style={{ color: '#666', width: 45 }}>Subject:</span><span style={{ fontWeight: 'bold' }}>{selected.subject}</span></div>
                </div>
                <div className="flex-1 px-3 py-2" style={{ fontSize: 12, lineHeight: 1.6, color: '#000', whiteSpace: 'pre-wrap' }}>{selected.body}</div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs" style={{ color: '#888' }}>Select a message to read</div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center px-2 py-0.5 text-xs shrink-0" style={{ borderTop: '1px solid #808080', color: '#666' }}>
        <span>{messages.length} message(s)</span>
        <span className="ml-auto">Mail — reach {toLabel}</span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// MOBILE — old iPhone Mail
// ══════════════════════════════════════════

function ComposeMobile({ toLabel, onSend, onCancel }) {
  const [from, setFrom] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const canSend = from && body && !busy

  const submit = async () => {
    setError('')
    setBusy(true)
    const res = await onSend({ from: from.trim(), subject: subject.trim(), body: body.trim() })
    setBusy(false)
    if (res?.error) { setError(res.error); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#fff', fontFamily: '-apple-system, sans-serif' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Sent</div>
        <div style={{ fontSize: 14, color: '#8e8e93', marginBottom: 20, textAlign: 'center', padding: '0 40px' }}>Delivered to {toLabel}. Replies come to your email.</div>
        <button onClick={onCancel} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 16, fontFamily: 'inherit' }}>Done</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      <div className="flex items-center justify-between px-3 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea' }}>
        <button onClick={onCancel} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15, fontFamily: 'inherit' }}>Cancel</button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>New Message</span>
        <button onClick={() => canSend && submit()} className="border-none bg-transparent cursor-pointer" style={{ color: canSend ? '#007AFF' : '#c7c7cc', fontSize: 15, fontWeight: 600, fontFamily: 'inherit' }}>Send</button>
      </div>
      <div className="flex-1 overflow-auto">
        <div style={{ padding: '0 16px', borderBottom: '0.5px solid #e5e5ea' }}>
          <div className="flex items-center py-2" style={{ fontSize: 14 }}><span style={{ color: '#8e8e93', width: 50 }}>To:</span><span style={{ color: '#000' }}>{toLabel}</span></div>
        </div>
        <div style={{ padding: '0 16px', borderBottom: '0.5px solid #e5e5ea' }}>
          <div className="flex items-center py-2"><span style={{ color: '#8e8e93', width: 50, fontSize: 14 }}>From:</span><input value={from} onChange={e => setFrom(e.target.value)} placeholder="your@email.com" className="flex-1 border-none outline-none" style={{ fontSize: 14, fontFamily: 'inherit' }} /></div>
        </div>
        <div style={{ padding: '0 16px', borderBottom: '0.5px solid #e5e5ea' }}>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full border-none outline-none py-2" style={{ fontSize: 14, fontFamily: 'inherit' }} />
        </div>
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..." className="w-full border-none outline-none p-4 resize-none" style={{ fontSize: 15, fontFamily: 'inherit', lineHeight: 1.6, minHeight: 200 }} />
        {error && <div style={{ padding: '8px 16px', fontSize: 13, color: '#c00' }}>{error}</div>}
      </div>
    </div>
  )
}

function MobileMail({ intro, sentItems, onSend, toLabel }) {
  const [open, setOpen] = useState(null)   // message being read
  const [composing, setComposing] = useState(false)
  const messages = [intro, ...sentItems]

  if (composing) return <ComposeMobile toLabel={toLabel} onSend={onSend} onCancel={() => setComposing(false)} />

  if (open) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
        <div className="flex items-center px-3 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea' }}>
          <button onClick={() => setOpen(null)} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 15 }}>‹ Inbox</button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{open.subject}</div>
          <div className="flex items-center gap-2 mb-3 pb-3" style={{ borderBottom: '0.5px solid #e5e5ea' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600 }}>{open.from.charAt(0).toUpperCase()}</div>
            <div><div style={{ fontSize: 14, fontWeight: 600 }}>{open.from}</div><div style={{ fontSize: 12, color: '#8e8e93' }}>{open.date}</div></div>
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: '#333', whiteSpace: 'pre-wrap' }}>{open.body}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f2f2f7', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      <div className="flex items-center justify-between px-4 shrink-0" style={{ height: 44, borderBottom: '0.5px solid #e5e5ea' }}>
        <span style={{ fontSize: 11, color: '#007AFF' }}>Mailboxes</span>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Inbox</span>
        <button onClick={() => setComposing(true)} className="border-none bg-transparent cursor-pointer" style={{ color: '#007AFF', fontSize: 13, fontFamily: 'inherit' }}>New Message</button>
      </div>
      <div className="flex-1 overflow-auto">
        {messages.map(m => (
          <div key={m.id} onClick={() => setOpen(m)} style={{ padding: '12px 16px', background: '#fff', borderBottom: '0.5px solid #e5e5ea' }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 15, fontWeight: m.read ? 400 : 600, color: '#000' }}>{m.from}</span>
              <span style={{ fontSize: 12, color: '#8e8e93' }}>{m.date}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: m.read ? 400 : 600, color: '#000', marginTop: 2 }}>{m.subject}</div>
            <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.body.slice(0, 70).replace(/\n/g, ' ')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Mail() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const repo = useRepo()
  const { node } = useProfile()
  const handle = node.kind === 'member' ? node.handle : ''
  const ownerName = node.kind === 'member' ? `@${handle}` : 'Eric Chemwor'
  const toLabel = ownerName

  const [sentItems, setSentItems] = useState([])

  const intro = {
    id: 'intro',
    from: ownerName,
    subject: `You have reached ${ownerName}`,
    date: today(),
    read: false,
    body: `Hey, thanks for stopping by.\n\nThis is ${ownerName}'s mailbox. Tap "New Message" to send a note. It goes straight to my real inbox, and any reply comes back to the email address you provide, so no account is needed.\n\nTalk soon.`,
  }

  const handleSend = async ({ from, subject, body }) => {
    const res = await repo.social.sendMail({ handle, fromEmail: from, fromName: '', subject, body })
    if (res.error) return { error: ERR[res.error] || 'Could not send. Try again.' }
    setSentItems(prev => [{ id: Date.now(), from: 'You', subject: subject || '(no subject)', date: today(), read: true, body }, ...prev])
    return { ok: true }
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {isMobile
        ? <MobileMail intro={intro} sentItems={sentItems} onSend={handleSend} toLabel={toLabel} />
        : <DesktopMail intro={intro} sentItems={sentItems} onSend={handleSend} toLabel={toLabel} ownerName={ownerName} />}
    </div>
  )
}
