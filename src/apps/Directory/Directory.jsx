import { useState, useEffect, useCallback } from 'react'
import { useRepo } from '../../lib/repo/useRepo'
import { useProfile } from '../../context/ProfileContext'
import { usePresence } from '../../hooks/usePresence'
import { Monogram } from '../_shared/Monogram'

// AOL-style Member Directory (the hub's "find people" surface).
//   • Members — search everyone, online/offline dots, ★ friends, add/accept.
//   • Friends — your accepted friends (your hub is friends with everyone).
//   • Requests — incoming friend requests to accept/decline.
//   • Invite — your personal invite code + redeem someone else's.
// Friendships are mutual + accepted (distinct from follows). RLS-scoped.

// Shared per-person monogram (initials from display_name → handle, theme-colored).
function Avatar({ p, size = 28 }) {
  return <Monogram profile={p} size={size} square />
}

const tabBtn = (active) => ({
  padding: '4px 10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
  background: active ? 'var(--color-accent)' : 'transparent', color: active ? '#000' : 'var(--color-text-secondary)',
})
const field = {
  width: '100%', padding: '6px 8px', background: 'var(--color-desktop-bg)', color: 'var(--color-text-primary)',
  border: '1px solid var(--color-bevel-dark)', outline: 'none', fontFamily: 'inherit', fontSize: 12,
}

function Row({ p, online, right }) {
  const isHub = p.isHub
  const href = isHub ? '/' : `/u/${p.handle}`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: '1px solid var(--color-bevel-dark)' }}>
      <span title={online ? 'online' : 'offline'} style={{ fontSize: 10, color: online ? '#4ADE80' : 'var(--color-text-disabled)' }}>{online ? '●' : '○'}</span>
      <a href={href} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--color-text-primary)', flex: 1, minWidth: 0 }}>
        <Avatar p={p} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isHub ? '🛰️ ChemNet Hub' : (p.display_name || p.handle)}
          </div>
          {!isHub && <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>@{p.handle}</div>}
        </div>
      </a>
      {right}
    </div>
  )
}

export default function Directory() {
  const repo = useRepo()
  const { currentUser } = useProfile()
  const online = usePresence()
  const me = currentUser?.id

  const [tab, setTab] = useState('members')
  const [search, setSearch] = useState('')
  const [members, setMembers] = useState([])
  const [rels, setRels] = useState({ accepted: new Set(), incoming: new Set(), outgoing: new Set() })
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [code, setCode] = useState('')
  const [redeem, setRedeem] = useState('')
  const [note, setNote] = useState('')

  const loadRels = useCallback(async () => {
    if (!me) return
    const r = await repo.social.friends.relationships()
    setRels({ accepted: new Set(r.accepted), incoming: new Set(r.incoming), outgoing: new Set(r.outgoing) })
  }, [repo, me])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadRels() }, [loadRels])

  // Members search (debounced).
  useEffect(() => {
    if (tab !== 'members') return
    const t = setTimeout(async () => setMembers(await repo.social.directory.list({ search })), 220)
    return () => clearTimeout(t)
  }, [tab, search, repo])

  useEffect(() => {
    if (tab === 'friends') repo.social.friends.list().then(setFriends)
    if (tab === 'requests') repo.social.friends.incoming().then(setRequests)
    if (tab === 'invite' && me) repo.social.friends.myCode().then(c => setCode(c || ''))
  }, [tab, repo, me])

  const promptAuth = () => window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: 'signup' }))

  const refresh = async () => { await loadRels(); if (tab === 'friends') setFriends(await repo.social.friends.list()); if (tab === 'requests') setRequests(await repo.social.friends.incoming()) }

  const onAdd = async (id) => { if (!me) return promptAuth(); await repo.social.friends.request(id); refresh() }
  const onAccept = async (id) => { await repo.social.friends.accept(id); refresh() }
  const onUnfriend = async (id) => { await repo.social.friends.unfriend(id); refresh() }

  function friendButton(id) {
    if (!id || id === me) return <span style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>you</span>
    if (rels.accepted.has(id)) return <button onClick={() => onUnfriend(id)} style={{ ...tabBtn(false), fontSize: 11 }} title="Unfriend">★ Friends</button>
    if (rels.incoming.has(id)) return <button onClick={() => onAccept(id)} style={{ ...tabBtn(true), fontSize: 11 }}>Accept</button>
    if (rels.outgoing.has(id)) return <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Requested</span>
    return <button onClick={() => onAdd(id)} style={{ ...tabBtn(false), fontSize: 11, color: 'var(--color-accent)' }}>+ Add</button>
  }

  const doRedeem = async () => {
    setNote('')
    const res = await repo.social.friends.redeem(redeem)
    if (res.error) {
      setNote({ invalid_code: 'No such code.', self: "That's your own code.", blocked: 'Blocked.', auth: 'Sign in first.' }[res.error] || 'Could not redeem.')
    } else { setNote('Friend added! 🎉'); setRedeem(''); refresh() }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontFamily: '"Courier Prime", "Courier New", monospace' }}>
      <div style={{ padding: '6px 10px', background: 'var(--color-titlebar-active)', color: 'var(--color-titlebar-text)', fontSize: 13, fontWeight: 'bold' }}>📒 ChemNet Members</div>
      <div style={{ display: 'flex', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--color-bevel-dark)', flexWrap: 'wrap' }}>
        <button style={tabBtn(tab === 'members')} onClick={() => setTab('members')}>Members</button>
        <button style={tabBtn(tab === 'friends')} onClick={() => setTab('friends')}>Friends</button>
        <button style={tabBtn(tab === 'requests')} onClick={() => setTab('requests')}>
          Requests{rels.incoming.size > 0 ? ` (${rels.incoming.size})` : ''}
        </button>
        <button style={tabBtn(tab === 'invite')} onClick={() => setTab('invite')}>Invite</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'members' && (
          <>
            <div style={{ padding: 8, borderBottom: '1px solid var(--color-bevel-dark)' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 search handle or name…" style={field} />
            </div>
            {members.length === 0
              ? <div style={{ padding: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>{search ? 'No members match.' : 'No public members yet.'}</div>
              : members.map(p => <Row key={p.id} p={p} online={online.has(p.id)} right={friendButton(p.id)} />)}
          </>
        )}

        {tab === 'friends' && (
          !me ? <div style={{ padding: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>Sign in to see your friends.</div>
          : friends.length === 0
            ? <div style={{ padding: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>No friends yet — add some from the Members tab.</div>
            : friends.map(p => <Row key={p.id} p={p} online={online.has(p.id)} right={p.isHub ? null : friendButton(p.id)} />)
        )}

        {tab === 'requests' && (
          !me ? <div style={{ padding: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>Sign in to see requests.</div>
          : requests.length === 0
            ? <div style={{ padding: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>No pending friend requests.</div>
            : requests.map(p => (
              <Row key={p.id} p={p} online={online.has(p.id)} right={
                <span style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => onAccept(p.id)} style={{ ...tabBtn(true), fontSize: 11 }}>Accept</button>
                  <button onClick={() => onUnfriend(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF5555', fontSize: 11, textDecoration: 'underline', fontFamily: 'inherit' }}>Decline</button>
                </span>
              } />
            ))
        )}

        {tab === 'invite' && (
          !me ? <div style={{ padding: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>Sign in to get your invite code.</div>
          : (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Your invite code — share it; whoever redeems it becomes your friend instantly.</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <code style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--color-accent)', letterSpacing: 2 }}>{code || '········'}</code>
                  <button onClick={() => { navigator.clipboard?.writeText(code); setNote('Copied!') }} style={{ ...tabBtn(false), fontSize: 11 }}>Copy</button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Redeem a friend's code:</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={redeem} onChange={e => setRedeem(e.target.value)} placeholder="paste a code" style={{ ...field, flex: 1 }} />
                  <button onClick={doRedeem} style={{ ...tabBtn(true), fontWeight: 'bold' }}>Redeem</button>
                </div>
              </div>
              {note && <div style={{ fontSize: 12, color: 'var(--color-accent)' }}>{note}</div>}
            </div>
          )
        )}
      </div>
    </div>
  )
}
