import { useState, useEffect, useCallback } from 'react'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'

// Notifications surface: recent follow / guestbook / ChemMail items for the
// current user, with mark-as-read and a link to the source. Polls on open
// (Realtime is a later enhancement — noted as a gap).
function describe(n) {
  const who = n.actor_display_name || (n.actor_handle ? '@' + n.actor_handle : 'Someone')
  switch (n.kind) {
    case 'follow': return { icon: '👤', text: `${who} started following you`, href: n.actor_handle ? `/u/${n.actor_handle}` : null }
    case 'guestbook_sign': return { icon: '📖', text: `${who} signed your guestbook`, open: 'guestbook' }
    case 'chemmail': return { icon: '✉️', text: `${who} sent you ChemMail${n.payload?.subject ? `: ${n.payload.subject}` : ''}`, open: 'email' }
    default: return { icon: '🔔', text: `${who} — ${n.kind}`, href: null }
  }
}

export default function Notifications() {
  const repo = useRepo()
  const { currentUser } = useProfile()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const data = await repo.social.notifications.list()
    setItems(data)
    setLoading(false)
  }, [repo])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const act = async (n) => {
    if (!n.read) {
      await repo.social.notifications.markRead(n.id)
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      window.dispatchEvent(new CustomEvent('chemnet:notifications-read'))
    }
    const d = describe(n)
    if (d.href) window.location.assign(d.href)
    else if (d.open) window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: d.open }))
  }

  const markAll = async () => {
    await repo.social.notifications.markAllRead()
    setItems(prev => prev.map(x => ({ ...x, read: true })))
    window.dispatchEvent(new CustomEvent('chemnet:notifications-read'))
  }

  if (!currentUser) {
    return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontFamily: '"Courier Prime", monospace', padding: 20, textAlign: 'center' }}>Sign in to see your notifications.</div>
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontFamily: '"Courier Prime", "Courier New", monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid var(--color-bevel-dark)' }}>
        <span style={{ fontWeight: 'bold', fontSize: 13 }}>🔔 Notifications</span>
        <button onClick={markAll} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}>Mark all read</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 20, color: 'var(--color-text-secondary)', fontSize: 12 }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 20, color: 'var(--color-text-secondary)', fontSize: 12 }}>No notifications yet. Activity on your node shows up here.</div>
        ) : items.map(n => {
          const d = describe(n)
          return (
            <button
              key={n.id}
              onClick={() => act(n)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: '10px 12px', border: 'none', borderBottom: '1px solid var(--color-bevel-dark)', cursor: 'pointer',
                background: n.read ? 'transparent' : 'rgba(255,107,53,0.12)', color: 'var(--color-text-primary)', fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 18 }}>{d.icon}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{d.text}</span>
              {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent)' }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
