import { useState, useEffect, useCallback, useRef } from 'react'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'

// Notifications, styled as a 2000s pager / beeper. The window IS the device:
// an amber LCD you read "pages" off of, with physical ▲▼ / READ / CLEAR ALL
// buttons. No schema changes — reads platform.notifications via the repo and
// marks read through the existing path. New pages buzz + (if unmuted) beep.

function ago(ts) {
  const s = (Date.now() - new Date(ts).getTime()) / 1000
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

const who = (n) => n.actor_handle || 'someone'

// kind → pager shorthand (lowercase, abbreviated) + plain label + navigation.
function pageOf(n) {
  const h = who(n)
  switch (n.kind) {
    case 'like': return { lcd: `★ ${h} liked yr post`, plain: `${h} liked your activity`, code: '143', open: 'chemfeed' }
    case 'follow': return { lcd: `+ ${h} followed u`, plain: `${h} followed you`, href: n.actor_handle ? `/u/${n.actor_handle}` : null }
    case 'friend_request': return { lcd: `+? ${h} wants 2b friends`, plain: `${h} sent a friend request`, open: 'directory' }
    case 'friend_accept': return { lcd: `+ ${h} accepted u`, plain: `${h} accepted your friend request`, href: n.actor_handle ? `/u/${n.actor_handle}` : null }
    case 'guestbook_sign': return { lcd: `✎ ${h} signed yr book`, plain: `${h} signed your guestbook`, open: 'guestbook' }
    case 'chemmail': return { lcd: `✉ msg from ${h}`, plain: `${h} sent you a message`, open: 'messageboard' }
    case 'board_reply': return { lcd: `↩ ${h} replied`, plain: `${h} replied`, open: 'messageboard' }
    default: return { lcd: `• ${h}: ${n.kind}`, plain: `${h}: ${n.kind}`, href: n.actor_handle ? `/u/${n.actor_handle}` : null }
  }
}

const reducedMotion = typeof window !== 'undefined' && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Self-contained pager "device" art (hardcoded device hex allowed here).
const BODY = { background: 'linear-gradient(160deg, #3b414e 0%, #232733 60%, #181b24 100%)', border: '2px solid #11131a', borderRadius: 14, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 4px 4px 0 rgba(0,0,0,0.35)' }
const LCD = { background: '#161a14', border: '2px inset #0c0e0a', borderRadius: 4 }

export default function Notifications() {
  const repo = useRepo()
  const { currentUser } = useProfile()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState(0)
  const [muted, setMuted] = useState(true)
  const [buzz, setBuzz] = useState(false)
  const [announce, setAnnounce] = useState('')
  const lastTopRef = useRef(null)   // newest id seen, to detect arrivals
  const audioRef = useRef(null)

  const beep = useCallback(() => {
    if (muted || !audioRef.current) return
    try {
      const ctx = audioRef.current
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'square'; o.frequency.value = 1480; g.gain.value = 0.04
      o.connect(g); g.connect(ctx.destination)
      o.start(); o.stop(ctx.currentTime + 0.1)
    } catch { /* ignore */ }
  }, [muted])

  const load = useCallback(async () => {
    const data = await repo.social.notifications.list()
    setItems(data)
    setLoading(false)
    const top = data[0]?.id ?? null
    if (lastTopRef.current !== null && top !== null && top !== lastTopRef.current) {
      // a new page arrived
      const fresh = pageOf(data[0])
      setAnnounce(fresh.plain)
      if (!reducedMotion) { setBuzz(true); setTimeout(() => setBuzz(false), 600) }
      beep()
    }
    lastTopRef.current = top
  }, [repo, beep])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // Poll for new pages (platform.notifications is not on the realtime publication,
  // so we poll rather than subscribe — keeps this a pure UI change).
  useEffect(() => {
    const id = setInterval(load, 20000)
    const onVis = () => { if (!document.hidden) load() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [load])

  // Audio may only init after a gesture — so we create the context when the
  // user unmutes (a click), never automatically.
  const toggleMute = () => {
    setMuted(m => {
      const next = !m
      if (!next && !audioRef.current) {
        try { audioRef.current = new (window.AudioContext || window.webkitAudioContext)() } catch { /* ignore */ }
      }
      if (!next && audioRef.current?.state === 'suspended') audioRef.current.resume()
      return next
    })
  }

  const unread = items.filter(n => !n.read)
  const unreadCount = unread.length
  const deviceCode = unreadCount >= 10 ? '911' : null

  const markRead = async (n) => {
    if (n.read) return
    await repo.social.notifications.markRead(n.id)
    setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    window.dispatchEvent(new CustomEvent('chemnet:notifications-read'))
  }
  const clearAll = async () => {
    await repo.social.notifications.markAllRead()
    setItems(prev => prev.map(x => ({ ...x, read: true })))
    window.dispatchEvent(new CustomEvent('chemnet:notifications-read'))
  }
  const openPage = async (n) => {
    await markRead(n)
    const p = pageOf(n)
    if (p.href) window.location.assign(p.href)
    else if (p.open) window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: p.open }))
  }

  const move = (d) => setSel(s => Math.max(0, Math.min(items.length - 1, s + d)))
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
    else if (e.key === 'Enter' && items[sel]) { e.preventDefault(); openPage(items[sel]) }
  }

  if (!currentUser) {
    return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontFamily: '"Courier Prime", monospace', padding: 20, textAlign: 'center' }}>Sign in to read your pages.</div>
  }

  const newItems = items.filter(n => !n.read)
  const earlier = items.filter(n => n.read)

  const renderLine = (n, idx) => {
    const p = pageOf(n)
    const active = idx === sel
    return (
      <button
        key={n.id}
        onClick={() => { setSel(idx); openPage(n) }}
        aria-label={`${p.plain}, ${new Date(n.created_at).toLocaleString()}${n.read ? '' : ', unread'}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: '100%', textAlign: 'left',
          padding: '2px 6px', border: 'none', cursor: 'pointer', fontFamily: '"Courier Prime", monospace', fontSize: 12,
          background: active ? 'var(--color-accent)' : 'transparent',
          color: active ? '#161a14' : 'var(--color-accent)',
          fontWeight: n.read ? 'normal' : 'bold',
          textShadow: active ? 'none' : '0 0 4px rgba(255,140,60,0.45)',
        }}
      >
        {!n.read && <span aria-hidden style={{ opacity: 0.9 }}>▸</span>}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.lcd}</span>
        {p.code && <span aria-hidden style={{ opacity: 0.7, fontSize: 10 }}>{p.code}</span>}
        <span style={{ opacity: 0.7, fontSize: 10 }}>{ago(n.created_at)}</span>
        {!n.read && active && <span aria-hidden style={{ animation: reducedMotion ? 'none' : 'pgblink 1s steps(2) infinite' }}>_</span>}
      </button>
    )
  }

  const btn = {
    padding: '6px 10px', borderRadius: 6, border: '2px outset #4a505e', background: 'linear-gradient(#3a3f4b,#262a34)',
    color: '#d7dbe2', cursor: 'pointer', fontFamily: '"Courier Prime", monospace', fontSize: 11, fontWeight: 'bold',
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)', padding: 10 }}>
      <style>{`@keyframes pgblink{0%,100%{opacity:1}50%{opacity:0}}@keyframes pgbuzz{0%,100%{transform:translate(0,0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-2px,0)}80%{transform:translate(1px,1px)}}`}</style>

      {/* aria-live for screen readers */}
      <div aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{announce}</div>

      <div
        tabIndex={0}
        onKeyDown={onKey}
        style={{ ...BODY, width: '100%', maxWidth: 340, maxHeight: '100%', display: 'flex', flexDirection: 'column', padding: 12, gap: 8, outline: 'none', animation: buzz ? 'pgbuzz 0.5s linear' : 'none' }}
      >
        {/* Bezel: label, battery, NEW count, LED, speaker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#aeb4c0', fontFamily: '"Courier Prime", monospace', fontSize: 11 }}>
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: unreadCount > 0 ? 'var(--color-accent)' : '#3a3f4b', boxShadow: unreadCount > 0 ? '0 0 6px var(--color-accent)' : 'none', animation: (unreadCount > 0 && !reducedMotion) ? 'pgblink 1.4s steps(2) infinite' : 'none' }} />
          <span style={{ fontWeight: 'bold', letterSpacing: 1 }}>PAGER</span>
          <span style={{ marginLeft: 'auto' }} aria-hidden>🔋</span>
          <button onClick={toggleMute} aria-label={muted ? 'Unmute beeps' : 'Mute beeps'} style={{ ...btn, padding: '2px 6px', fontSize: 12 }}>{muted ? '🔇' : '🔊'}</button>
        </div>

        {/* LCD */}
        <div style={{ ...LCD, flex: 1, minHeight: 120, overflow: 'auto', padding: '6px 4px', position: 'relative', backgroundImage: 'repeating-linear-gradient(#161a14, #161a14 2px, #12150f 3px)' }}>
          <div style={{ padding: '0 4px 4px', fontFamily: '"Courier Prime", monospace', fontSize: 11, color: 'var(--color-accent)', opacity: 0.9, display: 'flex', justifyContent: 'space-between' }}>
            <span>{unreadCount > 0 ? `${unreadCount} NEW PAGE${unreadCount > 1 ? 'S' : ''}` : 'INBOX'}</span>
            {deviceCode && <span aria-hidden style={{ fontWeight: 'bold' }}>{deviceCode}</span>}
          </div>
          {loading ? (
            <div style={{ padding: 10, color: 'var(--color-accent)', fontFamily: 'monospace', fontSize: 12, opacity: 0.7 }}>...loading...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 16, color: 'var(--color-accent)', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', opacity: 0.8 }}>-- no new pages --</div>
          ) : (
            <>
              {newItems.length > 0 && <div style={{ padding: '2px 6px', fontSize: 10, color: 'var(--color-accent)', opacity: 0.6, letterSpacing: 1 }}>--- NEW ---</div>}
              {newItems.map(n => renderLine(n, items.indexOf(n)))}
              {earlier.length > 0 && <div style={{ padding: '4px 6px 2px', fontSize: 10, color: 'var(--color-accent)', opacity: 0.6, letterSpacing: 1 }}>--- EARLIER ---</div>}
              {earlier.map(n => renderLine(n, items.indexOf(n)))}
            </>
          )}
        </div>

        {/* Physical buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => move(-1)} aria-label="Previous page" style={btn}>▲</button>
          <button onClick={() => move(1)} aria-label="Next page" style={btn}>▼</button>
          <button onClick={() => items[sel] && openPage(items[sel])} aria-label="Read selected page" style={{ ...btn, flex: 1 }}>READ</button>
          <button onClick={clearAll} aria-label="Mark all pages read" style={{ ...btn, flex: 1 }}>CLEAR ALL</button>
        </div>
      </div>
    </div>
  )
}
