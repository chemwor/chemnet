import { useState, useEffect, useCallback } from 'react'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'
import { brandPrefix } from '../../lib/customization'

// Feed of recent public posts from the people the current user follows.
// Visibility is enforced by RLS / the platform.feed_posts view — the client
// just renders what comes back.
function Avatar({ p, size = 32 }) {
  const initial = (p.display_name || p.handle || '?').charAt(0).toUpperCase()
  if (p.avatar_url) return <img src={p.avatar_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--color-accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: size * 0.45 }}>{initial}</div>
}

export default function ChemFeed() {
  const repo = useRepo()
  const { currentUser, node } = useProfile()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const data = await repo.social.feed.list()
    setPosts(data)
    setLoading(false)
  }, [repo])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const reportPost = async (id) => {
    const reason = window.prompt('Why are you reporting this post?')
    if (reason === null) return
    await repo.social.report({ targetType: 'posts', targetId: id, reason })
    alert('Reported. Thanks — our team will review.')
  }

  if (!currentUser) {
    return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontFamily: '"Courier Prime", monospace', padding: 20, textAlign: 'center' }}>Sign in and follow some nodes to fill your feed.</div>
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontFamily: '"Courier Prime", "Courier New", monospace' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-bevel-dark)', fontWeight: 'bold', fontSize: 13 }}>📡 {brandPrefix(node)}Feed</div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 20, color: 'var(--color-text-secondary)', fontSize: 12 }}>Loading…</div>
        ) : posts.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--color-text-secondary)', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
            Your feed is empty.<br />Follow some nodes from the hub Directory to fill it.
          </div>
        ) : posts.map(p => (
          <div key={p.id} style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-bevel-dark)' }}>
            <a href={`/u/${p.handle}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--color-text-primary)', marginBottom: 6 }}>
              <Avatar p={p} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 'bold' }}>{p.display_name || p.handle}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>@{p.handle} · {new Date(p.created_at).toLocaleDateString()}</div>
              </div>
            </a>
            <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{p.title}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {(p.content || '').slice(0, 240)}
            </div>
            <button onClick={() => reportPost(p.id)} style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-disabled)', fontSize: 10, textDecoration: 'underline', fontFamily: 'inherit' }}>Report</button>
          </div>
        ))}
      </div>
    </div>
  )
}
