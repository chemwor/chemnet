import { useState, useEffect, useCallback } from 'react'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'

// Profile + social actions for the member node being viewed: owner identity,
// follower/following counts and lists, and a Follow/Unfollow button (hidden on
// your own node; prompts auth when logged out).
function Avatar({ profile, size = 44 }) {
  const initial = (profile?.display_name || profile?.handle || '?').charAt(0).toUpperCase()
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--color-accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: size * 0.45 }}>
      {initial}
    </div>
  )
}

function PersonRow({ p }) {
  return (
    <a href={`/u/${p.handle}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', textDecoration: 'none', color: 'var(--color-text-primary)' }}>
      <Avatar profile={p} size={28} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name || p.handle}</div>
        <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>@{p.handle}</div>
      </div>
    </a>
  )
}

export default function Profile() {
  const repo = useRepo()
  const { node, isOwner, currentUser } = useProfile()
  const [owner, setOwner] = useState(null)
  const [counts, setCounts] = useState({ followers: 0, following: 0 })
  const [following, setFollowing] = useState(false)
  const [tab, setTab] = useState(null)          // null | 'followers' | 'following'
  const [people, setPeople] = useState([])
  const [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [note, setNote] = useState('')

  const userId = node.kind === 'member' ? node.userId : null

  const load = useCallback(async () => {
    if (!userId) return
    const [prof, c] = await Promise.all([
      repo.social.directory.resolveHandle(node.handle),
      repo.social.follows.counts(userId),
    ])
    setOwner(prof)
    setCounts(c)
    if (currentUser && currentUser.id !== userId) {
      const [f, b] = await Promise.all([
        repo.social.follows.isFollowing(userId),
        repo.social.blocks.isBlocked(userId),
      ])
      setFollowing(f)
      setBlocked(b)
    }
  }, [repo, node, userId, currentUser])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const openList = async (which) => {
    if (tab === which) { setTab(null); return }
    setTab(which)
    const list = which === 'followers'
      ? await repo.social.follows.followers(userId)
      : await repo.social.follows.following(userId)
    setPeople(list)
  }

  const promptAuth = () => window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: 'signup' }))

  const toggleFollow = async () => {
    if (!currentUser) { promptAuth(); return }
    setBusy(true)
    const res = following ? await repo.social.follows.unfollow(userId) : await repo.social.follows.follow(userId)
    setBusy(false)
    if (res?.error) { setNote(blocked ? 'Unblock first to follow.' : 'Could not update follow.'); return }
    setFollowing(!following)
    load()
  }

  const toggleBlock = async () => {
    if (!currentUser) { promptAuth(); return }
    setBusy(true)
    if (blocked) await repo.social.blocks.unblock(userId)
    else { await repo.social.blocks.block(userId); setFollowing(false) }
    setBlocked(!blocked)
    setBusy(false)
    setNote(blocked ? 'Unblocked.' : 'Blocked. They can no longer follow, message, or sign your guestbook.')
    load()
  }

  const report = async () => {
    if (!currentUser) { promptAuth(); return }
    const reason = window.prompt('Why are you reporting this profile?')
    if (reason === null) return
    const res = await repo.social.report({ targetType: 'profile', targetId: userId, reason })
    setNote(res?.error ? 'Could not file report.' : 'Reported. Thanks — our team will review.')
  }

  if (node.kind !== 'member') {
    return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontFamily: '"Courier Prime", monospace' }}>Profiles live on member nodes.</div>
  }

  const showFollow = !isOwner

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontFamily: '"Courier Prime", "Courier New", monospace' }}>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar profile={owner} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{owner?.display_name || node.handle}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>@{node.handle}</div>
          </div>
          {showFollow && (
            <button
              onClick={toggleFollow}
              disabled={busy}
              style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: 12,
                background: following ? 'var(--color-titlebar-inactive)' : 'var(--color-accent)',
                color: following ? 'var(--color-text-primary)' : '#000',
              }}
            >
              {!currentUser ? 'Sign in to follow' : following ? 'Following ✓' : '+ Follow'}
            </button>
          )}
        </div>

        {showFollow && currentUser && (
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button onClick={toggleBlock} disabled={busy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: blocked ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontSize: 11, textDecoration: 'underline', fontFamily: 'inherit' }}>
              {blocked ? 'Unblock' : 'Block'}
            </button>
            <button onClick={report} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 11, textDecoration: 'underline', fontFamily: 'inherit' }}>
              Report
            </button>
          </div>
        )}
        {note && <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-accent)' }}>{note}</div>}

        {owner?.bio && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{owner.bio}</div>}

        <div style={{ display: 'flex', gap: 18, marginTop: 16, borderTop: '1px solid var(--color-bevel-dark)', paddingTop: 12 }}>
          <button onClick={() => openList('followers')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)', fontFamily: 'inherit' }}>
            <b>{counts.followers}</b> <span style={{ color: 'var(--color-text-secondary)' }}>followers</span>
          </button>
          <button onClick={() => openList('following')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)', fontFamily: 'inherit' }}>
            <b>{counts.following}</b> <span style={{ color: 'var(--color-text-secondary)' }}>following</span>
          </button>
        </div>

        {tab && (
          <div style={{ marginTop: 10, border: '1px solid var(--color-bevel-dark)' }}>
            <div style={{ padding: '4px 8px', fontSize: 11, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-bevel-dark)' }}>{tab}</div>
            {people.length === 0
              ? <div style={{ padding: 10, fontSize: 12, color: 'var(--color-text-secondary)' }}>Nobody yet.</div>
              : people.map(p => <PersonRow key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
