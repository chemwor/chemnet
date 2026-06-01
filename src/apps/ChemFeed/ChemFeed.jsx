import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'
import { brandPrefix } from '../../lib/customization'

// ChemFeed v2 — a chronological activity stream of what the people you follow
// have done across their member nodes, with likes and deep-links into the item
// on its owner's node. Visibility (public + not-blocked) is enforced by RLS.

const SEEN_KEY = 'chemnet_feed_seen'
const KINDS = [
  { id: 'all', label: 'All' },
  { id: 'photo', label: 'Photos' },
  { id: 'blog', label: 'Blogs' },
  { id: 'review', label: 'Reviews' },
  { id: 'food', label: 'Food' },
  { id: 'travel', label: 'Travel' },
  { id: 'music', label: 'Music' },
  { id: 'wishlist', label: 'Wishlist' },
]

function actionText(kind) {
  switch (kind) {
    case 'blog': return 'wrote a blog post'
    case 'photo': return 'posted a photo'
    case 'review': return 'reviewed'
    case 'food': return 'added to their food list'
    case 'travel': return 'added a trip'
    case 'carmod': return 'logged a car mod'
    case 'project': return 'added a project'
    case 'music': return 'added music'
    case 'digest': return 'shared'
    case 'wishlist': return 'added to their wishlist'
    default: return 'posted'
  }
}

const isImg = (s) => typeof s === 'string' && /^https?:\/\//.test(s)

function ago(ts) {
  const s = (Date.now() - new Date(ts).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
function bucketOf(ts) {
  const d = new Date(ts)
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (d.getTime() >= startToday) return 'Today'
  if (d.getTime() >= Date.now() - 7 * 86400000) return 'This Week'
  return 'Earlier'
}

function Avatar({ a, size = 30 }) {
  const initial = (a.display_name || a.handle || '?').charAt(0).toUpperCase()
  if (a.avatar_url) return <img src={a.avatar_url} alt="" style={{ width: size, height: size, borderRadius: 4, objectFit: 'cover' }} />
  return <div style={{ width: size, height: size, borderRadius: 4, background: 'var(--color-accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: size * 0.45 }}>{initial}</div>
}

function Preview({ a }) {
  if (a.kind === 'photo' && isImg(a.preview)) {
    return <img src={a.preview} alt="" style={{ width: 72, height: 54, objectFit: 'cover', border: '1px solid var(--color-bevel-dark)', flexShrink: 0 }} />
  }
  if (isImg(a.preview)) {
    return <img src={a.preview} alt="" style={{ width: 40, height: 56, objectFit: 'cover', border: '1px solid var(--color-bevel-dark)', flexShrink: 0 }} />
  }
  if (a.preview && a.preview.length <= 3) {
    return <div style={{ fontSize: 28, width: 40, textAlign: 'center', flexShrink: 0 }}>{a.preview}</div>
  }
  return null
}

export default function ChemFeed() {
  const repo = useRepo()
  const { currentUser, node } = useProfile()
  const [items, setItems] = useState([])
  const [likes, setLikes] = useState({})
  const [loading, setLoading] = useState(true)
  const [kind, setKind] = useState('all')
  const [friend, setFriend] = useState('all')
  const [lastSeen] = useState(() => { try { return Number(localStorage.getItem(SEEN_KEY)) || 0 } catch { return 0 } })

  const load = useCallback(async () => {
    const data = await repo.social.feed.activity()
    setItems(data)
    setLikes(await repo.social.reactions.summary('activity', data.map(a => a.id)))
    setLoading(false)
    try { localStorage.setItem(SEEN_KEY, String(Date.now())) } catch { /* ignore */ }
  }, [repo])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  useEffect(() => {
    const unsub = repo.social.feed.subscribe(() => load())
    return unsub
  }, [repo, load])

  const friends = useMemo(() => {
    const seen = new Map()
    for (const a of items) if (!seen.has(a.actor_id)) seen.set(a.actor_id, a.display_name || a.handle)
    return [...seen.entries()]
  }, [items])

  const visible = items.filter(a => (kind === 'all' || a.kind === kind) && (friend === 'all' || a.actor_id === friend))
  const newCount = items.filter(a => new Date(a.created_at).getTime() > lastSeen).length

  const promptAuth = () => window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: 'signup' }))

  const toggleLike = async (a) => {
    if (!currentUser) { promptAuth(); return }
    const cur = likes[String(a.id)] || { count: 0, liked: false }
    const next = cur.liked ? { count: Math.max(0, cur.count - 1), liked: false } : { count: cur.count + 1, liked: true }
    setLikes(m => ({ ...m, [String(a.id)]: next }))
    if (cur.liked) await repo.social.reactions.unlike('activity', a.id)
    else await repo.social.reactions.like('activity', a.id)
  }

  if (!currentUser) {
    return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontFamily: '"Courier Prime", monospace', padding: 20, textAlign: 'center' }}>Sign in to see your feed.</div>
  }

  let lastBucket = null

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontFamily: '"Courier Prime", "Courier New", monospace' }}>
      <div style={{ padding: '6px 10px', background: 'var(--color-titlebar-active)', color: 'var(--color-titlebar-text)', fontSize: 13, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>📡 {brandPrefix(node)}Feed — Recent Activity</span>
        {newCount > 0 && <span style={{ marginLeft: 'auto', background: 'var(--color-accent)', color: '#000', borderRadius: 8, fontSize: 10, padding: '1px 7px', fontWeight: 'bold' }}>{newCount} new ↑</span>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', borderBottom: '1px solid var(--color-bevel-dark)', flexWrap: 'wrap' }}>
        {KINDS.map(k => (
          <button key={k.id} onClick={() => setKind(k.id)} style={{ padding: '2px 8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, background: kind === k.id ? 'var(--color-accent)' : 'transparent', color: kind === k.id ? '#000' : 'var(--color-text-secondary)' }}>{k.label}</button>
        ))}
        {friends.length > 1 && (
          <select value={friend} onChange={e => setFriend(e.target.value)} style={{ marginLeft: 'auto', background: 'var(--color-desktop-bg)', color: 'var(--color-text-primary)', border: '1px solid var(--color-bevel-dark)', fontFamily: 'inherit', fontSize: 11, padding: '2px 4px' }}>
            <option value="all">Everyone</option>
            {friends.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 20, color: 'var(--color-text-secondary)', fontSize: 12 }}>Loading…</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
            {items.length === 0 ? <>Your feed is empty.<br />Follow some nodes from the Members directory to fill it.</> : 'Nothing matches this filter.'}
          </div>
        ) : visible.map(a => {
          const b = bucketOf(a.created_at)
          const header = b !== lastBucket ? (lastBucket = b) : null
          const lk = likes[String(a.id)] || { count: 0, liked: false }
          const fresh = new Date(a.created_at).getTime() > lastSeen
          return (
            <div key={a.id}>
              {header && <div style={{ padding: '4px 10px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-secondary)', background: 'var(--color-titlebar-inactive)', borderBottom: '1px solid var(--color-bevel-dark)' }}>{header}</div>}
              <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderBottom: '1px solid var(--color-bevel-dark)', background: fresh ? 'rgba(255,107,53,0.08)' : 'transparent' }}>
                <a href={`/u/${a.handle}`} style={{ flexShrink: 0 }}><Avatar a={a} /></a>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                    <a href={`/u/${a.handle}`} style={{ color: 'var(--color-text-primary)', fontWeight: 'bold', textDecoration: 'none' }}>{a.display_name || a.handle}</a>
                    <span style={{ color: 'var(--color-text-secondary)' }}> {actionText(a.kind)} </span>
                    {a.title && <span style={{ fontWeight: 'bold' }}>{a.kind === 'review' || a.kind === 'digest' ? `“${a.title}”` : a.title}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 5 }}>
                    {(a.kind === 'photo' || isImg(a.preview) || (a.preview && a.preview.length <= 3)) && <Preview a={a} />}
                    {!(a.kind === 'photo' || isImg(a.preview) || (a.preview && a.preview.length <= 3)) && a.preview && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.preview}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 7, fontSize: 11 }}>
                    <button onClick={() => toggleLike(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, color: lk.liked ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                      {lk.liked ? '♥' : '♡'} {lk.count > 0 ? lk.count : ''} Like
                    </button>
                    <a href={`/u/${a.handle}?app=${a.app}&item=${encodeURIComponent(a.item_id)}`} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>open on their node ↗</a>
                    <span style={{ marginLeft: 'auto', color: 'var(--color-text-disabled)' }}>{ago(a.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
