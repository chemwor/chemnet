import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

// "Make your own" — the signup → handle-claim → provision flow, shown on the
// flagship hub. Desktop-native styling via theme CSS vars.
const panel = {
  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--color-surface)', fontFamily: '"Courier Prime", "Courier New", monospace', padding: 20,
}
const card = {
  maxWidth: 360, width: '100%', background: 'var(--color-titlebar-inactive)',
  border: '1px solid var(--color-bevel-dark)', boxShadow: '2px 2px 0 rgba(0,0,0,0.4)', padding: 20,
  color: 'var(--color-text-primary)',
}
const input = {
  width: '100%', padding: '8px 10px', background: 'var(--color-desktop-bg)', color: 'var(--color-text-primary)',
  border: '1px solid var(--color-bevel-dark)', outline: 'none', fontFamily: 'inherit', fontSize: 13,
}
const button = {
  width: '100%', padding: '8px 12px', background: 'var(--color-accent)', color: '#000',
  border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: 13, marginTop: 10,
}

const ERR_TEXT = {
  handle_taken: 'That handle is taken. Try another.',
  invalid_handle: 'Use 3–20 chars: lowercase letters, numbers, underscores.',
  provision_failed: 'Something went wrong provisioning your node. Try again.',
}

export default function Signup() {
  const { user, profile, needsHandle, loading, loginWithMagicLink, loginWithGoogle, claimHandle } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [handle, setHandle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (loading) {
    return <div style={{ ...panel, color: 'var(--color-text-secondary)' }}>Loading…</div>
  }

  // Step 3 — already has a node
  if (user && profile) {
    return (
      <div style={panel}>
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🛰️</div>
          <div style={{ fontWeight: 'bold', marginBottom: 6 }}>You're on the network.</div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 14 }}>
            Your node lives at <code style={{ color: 'var(--color-accent)' }}>/u/{profile.handle}</code>.
          </div>
          <a href={`/u/${profile.handle}`} style={{ ...button, display: 'block', textDecoration: 'none', textAlign: 'center' }}>
            Go to my desktop →
          </a>
          <a href={`/u/${profile.handle}?edit=1`} style={{ display: 'block', marginTop: 8, fontSize: 12, color: 'var(--color-accent)' }}>
            Customize it
          </a>
        </div>
      </div>
    )
  }

  // Step 2 — logged in, needs to claim a handle
  if (user && needsHandle) {
    const submit = async () => {
      setError('')
      setBusy(true)
      const res = await claimHandle(handle)
      setBusy(false)
      if (res.error) { setError(ERR_TEXT[res.error.message] || res.error.message); return }
      // Land on the new node in edit mode.
      window.location.href = `/u/${res.handle}?edit=1`
    }
    return (
      <div style={panel}>
        <div style={card}>
          <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>🌐</div>
          <div style={{ fontWeight: 'bold', marginBottom: 4, textAlign: 'center' }}>Claim your handle</div>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 14, textAlign: 'center' }}>
            This becomes your address: <code>/u/&lt;handle&gt;</code>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>/u/</span>
            <input
              value={handle}
              onChange={e => { setHandle(e.target.value.toLowerCase()); setError('') }}
              onKeyDown={e => e.key === 'Enter' && !busy && submit()}
              placeholder="your_handle"
              maxLength={20}
              autoFocus
              style={input}
            />
          </div>
          <button onClick={submit} disabled={busy} style={{ ...button, opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Provisioning…' : 'Make my node'}
          </button>
          {error && <div style={{ marginTop: 8, fontSize: 12, color: '#FF5555' }}>{error}</div>}
        </div>
      </div>
    )
  }

  // Step 1 — not logged in
  const send = async () => {
    setError('')
    const { error: err } = await loginWithMagicLink(email)
    if (err) { setError(err.message); return }
    setSent(true)
  }
  return (
    <div style={panel}>
      <div style={card}>
        <div style={{ fontSize: 32, marginBottom: 8, textAlign: 'center' }}>✨</div>
        <div style={{ fontWeight: 'bold', marginBottom: 4, textAlign: 'center' }}>Make your own ChemNet</div>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 14, textAlign: 'center', lineHeight: 1.5 }}>
          Get your own retro-OS desktop at <code>/u/&lt;handle&gt;</code>. Sign in with a magic link to start.
        </div>
        {sent ? (
          <div style={{ textAlign: 'center', color: 'var(--color-accent)', fontSize: 13 }}>
            Magic link sent to {email}.<br />Check your inbox, then come back here.
          </div>
        ) : (
          <>
            <button
              onClick={async () => { setError(''); const { error: err } = await loginWithGoogle(); if (err) setError(err.message) }}
              style={{ ...button, marginTop: 0, background: '#fff', color: '#3c4043', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid var(--color-bevel-dark)' }}
            >
              <span style={{ fontWeight: 'bold', color: '#4285F4' }}>G</span> Sign in with Google
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0', color: 'var(--color-text-disabled)', fontSize: 11 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-bevel-dark)' }} /> or email <div style={{ flex: 1, height: 1, background: 'var(--color-bevel-dark)' }} />
            </div>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="you@email.com"
              type="email"
              style={input}
            />
            <button onClick={send} style={button}>Send magic link</button>
            {error && <div style={{ marginTop: 8, fontSize: 12, color: '#FF5555' }}>{error}</div>}
          </>
        )}
      </div>
    </div>
  )
}
