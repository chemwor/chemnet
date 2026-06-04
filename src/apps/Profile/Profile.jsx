import { useState, useEffect, useCallback } from 'react'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'
import { Monogram as Avatar } from '../_shared/Monogram'

// Profile = the SOCIAL CARD for the member node being viewed: avatar/handle, a
// one-line tagline, follower/following counts + lists, block/report, and the
// two social actions side by side:
//   • Follow — one-way; their posts show up in your ChemFeed (no approval).
//   • Add friend — mutual; they accept, then you're in each other's friends
//     list (managed in the Directory). Both reachable here so the difference
//     is visible in one place.
// The DETAILED bio lives in the About app — clear division of labor.
// Avatars use the shared auto monogram until avatar upload lands (Phase 3).

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
  const [friendStatus, setFriendStatus] = useState('none')  // none | outgoing | incoming | accepted
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
      const [f, b, rel] = await Promise.all([
        repo.social.follows.isFollowing(userId),
        repo.social.blocks.isBlocked(userId),
        repo.social.friends.relationships(),
      ])
      setFollowing(f)
      setBlocked(b)
      setFriendStatus(
        rel.accepted.includes(userId) ? 'accepted'
          : rel.incoming.includes(userId) ? 'incoming'
            : rel.outgoing.includes(userId) ? 'outgoing' : 'none',
      )
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

  const friendAction = async () => {
    if (!currentUser) { promptAuth(); return }
    if (friendStatus === 'accepted' && !window.confirm('Remove this friend?')) return
    setBusy(true)
    const res = friendStatus === 'incoming' ? await repo.social.friends.accept(userId)
      : (friendStatus === 'accepted' || friendStatus === 'outgoing') ? await repo.social.friends.unfriend(userId)
        : await repo.social.friends.request(userId)
    setBusy(false)
    if (res?.error) { setNote('Could not update friendship.'); return }
    setNote(friendStatus === 'none' ? 'Friend request sent.' : friendStatus === 'incoming' ? "You're now friends." : '')
    load()
  }
  const friendLabel = !currentUser ? '+ Add friend'
    : friendStatus === 'accepted' ? '✓ Friends'
      : friendStatus === 'incoming' ? 'Accept request'
        : friendStatus === 'outgoing' ? 'Requested' : '+ Add friend'

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
        </div>

        {/* Social actions — Follow (one-way feed) + Add friend (mutual), side by side. */}
        {showFollow && (
          <>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button
                onClick={toggleFollow}
                disabled={busy}
                style={{ padding: '6px 14px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: 12, background: following ? 'var(--color-titlebar-inactive)' : 'var(--color-accent)', color: following ? 'var(--color-text-primary)' : '#000' }}
              >
                {!currentUser ? 'Sign in to follow' : following ? 'Following ✓' : '+ Follow'}
              </button>
              <button
                onClick={friendAction}
                disabled={busy}
                style={{ padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: 12, background: friendStatus === 'incoming' ? 'var(--color-accent)' : 'transparent', color: friendStatus === 'incoming' ? '#000' : 'var(--color-accent)', border: '1px solid var(--color-accent)' }}
              >
                {friendLabel}
              </button>
            </div>
            {currentUser && (
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                Follow to see their posts in your feed. Friend to connect — they accept, then you both appear in each other's friends list.
              </div>
            )}
          </>
        )}

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

        {/* One-line tagline only — the full bio lives in the About app. */}
        {owner?.tagline && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-accent)', lineHeight: 1.5 }}>{owner.tagline}</div>}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: 'aboutme' }))}
          style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 11, textDecoration: 'underline', fontFamily: 'inherit', padding: 0 }}
        >
          View full About →
        </button>

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
