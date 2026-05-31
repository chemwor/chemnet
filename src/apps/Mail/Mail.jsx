import { useState } from 'react'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'

// Mail — a send-only contact form. It emails the node owner via the send_mail
// Edge Function (the owner's address is resolved server-side and never reaches
// the browser). No account required, no in-app inbox (DMs live in Messages).
const ERR = {
  invalid_email: 'Please enter a valid email address.',
  empty_body: 'Write a message first.',
  rate_limited: 'Too many messages just now — try again later.',
  mail_disabled: 'This person has turned off their contact form.',
  mail_unavailable: 'Mail isn’t configured yet. Try again later.',
  not_found: 'Could not find this node.',
  send_failed: 'Could not send. Try again.',
}

const field = {
  width: '100%', padding: '8px 10px', background: 'var(--color-desktop-bg)', color: 'var(--color-text-primary)',
  border: '1px solid var(--color-bevel-dark)', outline: 'none', fontFamily: 'inherit', fontSize: 13, marginTop: 4,
}

export default function Mail() {
  const repo = useRepo()
  const { node } = useProfile()
  const handle = node.kind === 'member' ? node.handle : ''
  const who = node.kind === 'member' ? `@${handle}` : 'Eric'

  const [fromEmail, setFromEmail] = useState('')
  const [fromName, setFromName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    setError('')
    if (!fromEmail.trim()) { setError(ERR.invalid_email); return }
    if (!body.trim()) { setError(ERR.empty_body); return }
    setBusy(true)
    const res = await repo.social.sendMail({ handle, fromEmail, fromName, subject, body })
    setBusy(false)
    if (res.error) { setError(ERR[res.error] || 'Could not send. Try again.'); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontFamily: '"Courier Prime", monospace', padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 36 }}>✉️</div>
        <div style={{ fontWeight: 'bold' }}>Message sent to {who}.</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>They’ll reply straight to your email.</div>
        <button onClick={() => { setSent(false); setSubject(''); setBody('') }} style={{ marginTop: 6, padding: '6px 14px', background: 'var(--color-accent)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit', fontSize: 12 }}>Send another</button>
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontFamily: '"Courier Prime", "Courier New", monospace' }}>
      <div style={{ padding: 16, maxWidth: 460, margin: '0 auto' }}>
        <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 2 }}>✉️ Contact {who}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
          Drop {who} a message — it goes straight to their inbox, and replies come back to your email.
        </div>

        <label style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Your email *
          <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="you@email.com" style={field} />
        </label>
        <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginTop: 10 }}>Your name
          <input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="optional" style={field} />
        </label>
        <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginTop: 10 }}>Subject
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="optional" style={field} />
        </label>
        <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginTop: 10 }}>Message *
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} placeholder="Say hello…" style={{ ...field, resize: 'vertical' }} />
        </label>

        <button onClick={send} disabled={busy} style={{ marginTop: 14, width: '100%', padding: '9px 12px', background: 'var(--color-accent)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit', fontSize: 13, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Sending…' : 'Send message'}
        </button>
        {error && <div style={{ marginTop: 8, fontSize: 12, color: '#FF5555' }}>{error}</div>}
      </div>
    </div>
  )
}
