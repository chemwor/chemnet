import { useState, useEffect, useCallback } from 'react'
import { useRepo } from '../../lib/repo/useRepo'

// Member directory on the hub — discover and search public nodes, each linking
// to /u/:handle. Read-only; reads public platform.profiles via the repo.
function Avatar({ p, size = 36 }) {
  const initial = (p.display_name || p.handle || '?').charAt(0).toUpperCase()
  if (p.avatar_url) return <img src={p.avatar_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--color-accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: size * 0.45 }}>{initial}</div>
}

export default function Directory() {
  const repo = useRepo()
  const [search, setSearch] = useState('')
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (q) => {
    setLoading(true)
    const data = await repo.social.directory.list({ search: q })
    setPeople(data)
    setLoading(false)
  }, [repo])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load('') }, [load])

  // Debounce search input.
  useEffect(() => {
    const t = setTimeout(() => load(search), 250)
    return () => clearTimeout(t)
  }, [search, load])

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontFamily: '"Courier Prime", "Courier New", monospace' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-bevel-dark)' }}>
        <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 6 }}>🗂️ Member Directory</div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search handle or name…"
          style={{ width: '100%', padding: '6px 8px', background: 'var(--color-desktop-bg)', color: 'var(--color-text-primary)', border: '1px solid var(--color-bevel-dark)', outline: 'none', fontFamily: 'inherit', fontSize: 12 }}
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 20, color: 'var(--color-text-secondary)', fontSize: 12 }}>Loading…</div>
        ) : people.length === 0 ? (
          <div style={{ padding: 20, color: 'var(--color-text-secondary)', fontSize: 12 }}>{search ? 'No nodes match.' : 'No public nodes yet.'}</div>
        ) : people.map(p => (
          <a key={p.id} href={`/u/${p.handle}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', textDecoration: 'none', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-bevel-dark)' }}>
            <Avatar p={p} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 'bold' }}>{p.display_name || p.handle}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>@{p.handle}</div>
              {p.bio && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.bio}</div>}
            </div>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>›</span>
          </a>
        ))}
      </div>
    </div>
  )
}
