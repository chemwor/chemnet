import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Site-wide online presence over a single shared Realtime channel.
// The shells call usePresence({ track: <uid> }) so any signed-in user shows as
// online site-wide; the Directory calls usePresence() to read the online set.
let channel = null
let trackedId = null
let onlineIds = new Set()
const listeners = new Set()

function ensureChannel() {
  if (channel) return channel
  channel = supabase.channel('site-presence')
  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    const ids = new Set()
    Object.values(state).forEach(metas => metas.forEach(m => { if (m.user_id) ids.add(m.user_id) }))
    onlineIds = ids
    listeners.forEach(l => l(ids))
  })
  channel.subscribe(status => {
    if (status === 'SUBSCRIBED' && trackedId) channel.track({ user_id: trackedId })
  })
  return channel
}

export function usePresence({ track } = {}) {
  const [online, setOnline] = useState(onlineIds)

  useEffect(() => {
    const ch = ensureChannel()
    if (track) {
      trackedId = track
      if (ch.state === 'joined') ch.track({ user_id: track })
    }
    const l = (ids) => setOnline(ids)
    listeners.add(l)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(onlineIds)
    return () => { listeners.delete(l) }
  }, [track])

  return online
}
