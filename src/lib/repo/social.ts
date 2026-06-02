// ════════════════════════════════════════════════════════════════════════
// socialApi — the platform-wide social graph (follows, notifications, feed,
// directory). These operate on the CURRENT authenticated user + platform.*,
// independent of which node is being viewed, so the same singleton is shared
// by both flagshipRepo and memberRepo (exposed as `repo.social`).
// ════════════════════════════════════════════════════════════════════════
import { supabase } from '../supabase'
import type { Row } from './types'

const platform = () => supabase.schema('platform')
const m = () => supabase.schema('members')

async function uid(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

async function profilesByIds(ids: string[]): Promise<Row[]> {
  if (!ids.length) return []
  const { data } = await platform().from('profiles').select('id, handle, display_name, avatar_url').in('id', ids)
  return data || []
}

export interface SocialApi {
  follows: {
    isFollowing(userId: string): Promise<boolean>
    follow(userId: string): Promise<{ error?: string }>
    unfollow(userId: string): Promise<{ error?: string }>
    counts(userId: string): Promise<{ followers: number; following: number }>
    followers(userId: string): Promise<Row[]>
    following(userId: string): Promise<Row[]>
  }
  notifications: {
    list(limit?: number): Promise<Row[]>
    unreadCount(): Promise<number>
    markRead(id: string | number): Promise<void>
    markAllRead(): Promise<void>
  }
  feed: {
    list(limit?: number): Promise<Row[]>
    activity(limit?: number): Promise<Row[]>
    subscribe(onChange: () => void): () => void
  }
  reactions: {
    summary(targetType: string, ids: Array<string | number>): Promise<Record<string, { count: number; liked: boolean }>>
    like(targetType: string, targetId: string | number): Promise<void>
    unlike(targetType: string, targetId: string | number): Promise<void>
  }
  directory: {
    list(opts?: { search?: string }): Promise<Row[]>
    resolveHandle(handle: string): Promise<Row | null>
  }
  updateMyProfile(patch: Row): Promise<{ error?: string }>
  blocks: {
    isBlocked(userId: string): Promise<boolean>
    block(userId: string): Promise<{ error?: string }>
    unblock(userId: string): Promise<{ error?: string }>
  }
  report(input: { targetType: string; targetId: string; reason?: string }): Promise<{ error?: string }>
  // Mail contact form → send_mail Edge Function (owner email resolved server-side).
  sendMail(input: { handle?: string; fromEmail: string; fromName?: string; subject?: string; body: string }): Promise<{ ok?: boolean; error?: string }>
  // Mutual, accepted friendship graph (distinct from one-directional follows).
  friends: {
    relationships(): Promise<{ accepted: string[]; incoming: string[]; outgoing: string[] }>
    list(): Promise<Row[]>
    incoming(): Promise<Row[]>
    request(userId: string): Promise<{ error?: string }>
    accept(requesterId: string): Promise<{ error?: string }>
    unfriend(userId: string): Promise<{ error?: string }>
    myCode(): Promise<string | null>
    redeem(code: string): Promise<{ ownerId?: string; error?: string }>
  }
  chat: {
    conversations(): Promise<Row[]>
    thread(otherId: string): Promise<Row[]>
    send(otherId: string, body: string): Promise<Row | null>
    markReadFrom(otherId: string): Promise<void>
    subscribe(onChange: () => void): () => void
  }
  moderation: {
    listReports(status?: string): Promise<Row[]>
    resolveReport(id: string | number, status: string): Promise<void>
    setHidden(table: string, id: string | number, hidden: boolean, reason?: string): Promise<void>
    setSuspended(userId: string, suspended: boolean): Promise<void>
  }
}

export const socialApi: SocialApi = {
  follows: {
    async isFollowing(userId) {
      const me = await uid()
      if (!me) return false
      const { data } = await platform().from('follows')
        .select('follower_id').eq('follower_id', me).eq('followee_id', userId).maybeSingle()
      return !!data
    },
    async follow(userId) {
      const me = await uid()
      if (!me) return { error: 'auth' }
      const { error } = await platform().from('follows').insert({ follower_id: me, followee_id: userId })
      return { error: error?.message }
    },
    async unfollow(userId) {
      const me = await uid()
      if (!me) return { error: 'auth' }
      const { error } = await platform().from('follows').delete().eq('follower_id', me).eq('followee_id', userId)
      return { error: error?.message }
    },
    async counts(userId) {
      const [followersRes, followingRes] = await Promise.all([
        platform().from('follows').select('*', { count: 'exact', head: true }).eq('followee_id', userId),
        platform().from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
      ])
      return { followers: followersRes.count || 0, following: followingRes.count || 0 }
    },
    async followers(userId) {
      const { data } = await platform().from('follows').select('follower_id').eq('followee_id', userId)
      return profilesByIds((data || []).map(r => r.follower_id))
    },
    async following(userId) {
      const { data } = await platform().from('follows').select('followee_id').eq('follower_id', userId)
      return profilesByIds((data || []).map(r => r.followee_id))
    },
  },

  notifications: {
    async list(limit = 50) {
      const { data } = await platform().from('notifications_view')
        .select('*').order('created_at', { ascending: false }).limit(limit)
      return data || []
    },
    async unreadCount() {
      const me = await uid()
      if (!me) return 0
      const { count } = await platform().from('notifications')
        .select('*', { count: 'exact', head: true }).eq('user_id', me).eq('read', false)
      return count || 0
    },
    async markRead(id) {
      await platform().from('notifications').update({ read: true }).eq('id', id)
    },
    async markAllRead() {
      const me = await uid()
      if (!me) return
      await platform().from('notifications').update({ read: true }).eq('user_id', me).eq('read', false)
    },
  },

  feed: {
    async list(limit = 50) {
      const { data } = await platform().from('feed_posts')
        .select('*').order('created_at', { ascending: false }).limit(limit)
      return data || []
    },
    // ChemFeed v2: chronological activity from people you follow (RLS enforces
    // public + not-blocked; the view adds the followee filter + actor profile).
    async activity(limit = 80) {
      const { data } = await platform().from('activity_feed')
        .select('*').order('created_at', { ascending: false }).limit(limit)
      return data || []
    },
    subscribe(onChange) {
      const ch = supabase
        .channel('activity-feed')
        .on('postgres_changes', { event: 'INSERT', schema: 'platform', table: 'activity' }, () => onChange())
        .subscribe()
      return () => { supabase.removeChannel(ch) }
    },
  },

  reactions: {
    // Like counts + whether I liked, for a batch of targets (computed client-side
    // from the rows; fine for a feed page).
    async summary(targetType, ids) {
      const out: Record<string, { count: number; liked: boolean }> = {}
      for (const id of ids) out[String(id)] = { count: 0, liked: false }
      if (!ids.length) return out
      const me = await uid()
      const { data } = await platform().from('reactions')
        .select('target_id, user_id').eq('target_type', targetType).in('target_id', ids.map(String))
      for (const r of data || []) {
        const k = String(r.target_id)
        if (!out[k]) out[k] = { count: 0, liked: false }
        out[k].count++
        if (me && r.user_id === me) out[k].liked = true
      }
      return out
    },
    async like(targetType, targetId) {
      const me = await uid()
      if (!me) return
      await platform().from('reactions').insert({ user_id: me, target_type: targetType, target_id: String(targetId) })
    },
    async unlike(targetType, targetId) {
      const me = await uid()
      if (!me) return
      await platform().from('reactions').delete()
        .eq('user_id', me).eq('target_type', targetType).eq('target_id', String(targetId))
    },
  },

  directory: {
    async list({ search } = {}) {
      // platform.directory excludes anyone in a block relationship with me.
      let q = platform().from('directory')
        .select('id, handle, display_name, avatar_url, bio, created_at')
      const s = (search || '').trim()
      if (s) q = q.or(`handle.ilike.%${s}%,display_name.ilike.%${s}%`)
      const { data } = await q.order('created_at', { ascending: false }).limit(100)
      return data || []
    },
    async resolveHandle(handle) {
      const { data } = await platform().from('profiles')
        .select('id, handle, display_name, bio, avatar_url, location, tagline, links, is_public, created_at')
        .eq('handle', String(handle || '').trim().toLowerCase())
        .maybeSingle()
      return data || null
    },
  },

  async updateMyProfile(patch) {
    const me = await uid()
    if (!me) return { error: 'auth' }
    const { error } = await platform().from('profiles').update(patch).eq('id', me)
    return { error: error?.message }
  },

  blocks: {
    async isBlocked(userId) {
      const me = await uid()
      if (!me) return false
      const { data } = await platform().from('blocks')
        .select('blocker_id').eq('blocker_id', me).eq('blocked_id', userId).maybeSingle()
      return !!data
    },
    async block(userId) {
      const me = await uid()
      if (!me) return { error: 'auth' }
      const { error } = await platform().from('blocks').insert({ blocker_id: me, blocked_id: userId })
      return { error: error?.message }
    },
    async unblock(userId) {
      const me = await uid()
      if (!me) return { error: 'auth' }
      const { error } = await platform().from('blocks').delete().eq('blocker_id', me).eq('blocked_id', userId)
      return { error: error?.message }
    },
  },

  async report({ targetType, targetId, reason }) {
    const me = await uid()
    if (!me) return { error: 'auth' }
    const { error } = await platform().from('reports')
      .insert({ reporter_id: me, target_type: targetType, target_id: String(targetId), reason, status: 'open' })
    return { error: error?.message }
  },

  async sendMail({ handle, fromEmail, fromName, subject, body }) {
    const { data, error } = await supabase.functions.invoke('send_mail', {
      body: { handle, fromEmail, fromName, subject, body },
    })
    if (error) {
      let code = 'send_failed'
      try { const b = await error.context.json(); code = b?.error || code } catch { /* ignore */ }
      return { error: code }
    }
    if (data?.error) return { error: data.error }
    return { ok: true }
  },

  friends: (() => {
    let _hubId: string | null | undefined
    async function hubId() {
      if (_hubId === undefined) {
        const { data } = await platform().rpc('flagship_owner_id')
        _hubId = data || null
      }
      return _hubId
    }
    async function myRows(): Promise<Row[]> {
      const me = await uid()
      if (!me) return []
      const { data } = await platform().from('friendships').select('*')
        .or(`requester_id.eq.${me},addressee_id.eq.${me}`)
      return data || []
    }
    return {
      async relationships() {
        const me = await uid()
        const out = { accepted: [] as string[], incoming: [] as string[], outgoing: [] as string[] }
        if (!me) return out
        for (const r of await myRows()) {
          const other = r.requester_id === me ? r.addressee_id : r.requester_id
          if (r.status === 'accepted') out.accepted.push(other)
          else if (r.addressee_id === me) out.incoming.push(r.requester_id)
          else out.outgoing.push(r.addressee_id)
        }
        return out
      },
      async list() {
        const me = await uid()
        if (!me) return []
        const accepted = (await myRows()).filter(r => r.status === 'accepted')
          .map(r => (r.requester_id === me ? r.addressee_id : r.requester_id))
        const hub = await hubId()
        const profs = await profilesByIds(accepted.filter(id => id !== hub))
        const pmap = new Map(profs.map(p => [p.id, p]))
        const out: Row[] = []
        for (const id of accepted) {
          if (id === hub) out.push({ id, handle: '', display_name: 'ChemNet Hub', isHub: true })
          else if (pmap.has(id)) out.push(pmap.get(id))
        }
        return out
      },
      async incoming() {
        const me = await uid()
        if (!me) return []
        const ids = (await myRows()).filter(r => r.status === 'pending' && r.addressee_id === me).map(r => r.requester_id)
        return profilesByIds(ids)
      },
      async request(userId) {
        const me = await uid()
        if (!me) return { error: 'auth' }
        const { error } = await platform().from('friendships')
          .insert({ requester_id: me, addressee_id: userId, status: 'pending' })
        return { error: error?.message }
      },
      async accept(requesterId) {
        const me = await uid()
        if (!me) return { error: 'auth' }
        const { error } = await platform().from('friendships')
          .update({ status: 'accepted' }).eq('requester_id', requesterId).eq('addressee_id', me)
        return { error: error?.message }
      },
      async unfriend(userId) {
        const me = await uid()
        if (!me) return { error: 'auth' }
        const { error } = await platform().from('friendships').delete()
          .or(`and(requester_id.eq.${me},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${me})`)
        return { error: error?.message }
      },
      async myCode() {
        const { data } = await platform().rpc('my_invite_code')
        return data || null
      },
      async redeem(code) {
        const { data, error } = await platform().rpc('redeem_invite', { p_code: String(code || '').trim() })
        if (error) {
          const m = error.message || ''
          const known = ['invalid_code', 'self', 'blocked', 'auth'].find(k => m.includes(k))
          return { error: known || 'redeem_failed' }
        }
        return { ownerId: data }
      },
    }
  })(),

  chat: {
    // Buddy-list: group my messages by the other participant, newest first.
    async conversations() {
      const me = await uid()
      if (!me) return []
      const { data } = await m().from('messages')
        .select('id, sender_id, recipient_id, body, read, created_at')
        .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
        .order('created_at', { ascending: false })
      const rows = data || []
      const byOther = new Map<string, Row>()
      for (const r of rows) {
        const other = r.sender_id === me ? r.recipient_id : r.sender_id
        if (!other) continue
        if (!byOther.has(other)) byOther.set(other, { otherId: other, lastBody: r.body, lastAt: r.created_at, unread: 0 })
        if (r.recipient_id === me && r.sender_id === other && !r.read) byOther.get(other).unread++
      }
      const convos = [...byOther.values()]
      const profs = await profilesByIds(convos.map(c => c.otherId))
      const pmap = new Map(profs.map(p => [p.id, p]))
      return convos.map(c => ({ ...c, ...(pmap.get(c.otherId) || {}) }))
    },
    async thread(otherId) {
      const me = await uid()
      if (!me) return []
      const { data } = await m().from('messages')
        .select('*')
        .or(`and(sender_id.eq.${me},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${me})`)
        .order('created_at', { ascending: true })
      return data || []
    },
    async send(otherId, body) {
      const me = await uid()
      if (!me) return null
      const { data, error } = await m().from('messages')
        .insert({ sender_id: me, recipient_id: otherId, body }).select().single()
      return error ? null : data
    },
    async markReadFrom(otherId) {
      const me = await uid()
      if (!me) return
      await m().from('messages').update({ read: true }).eq('recipient_id', me).eq('sender_id', otherId).eq('read', false)
    },
    // Realtime: fire onChange on any new message addressed to me (RLS-scoped on
    // the actual refetch; payload is intentionally ignored to avoid leaks).
    subscribe(onChange) {
      const ch = supabase
        .channel('chat-messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'members', table: 'messages' }, () => onChange())
        .subscribe()
      return () => { supabase.removeChannel(ch) }
    },
  },

  moderation: {
    async listReports(status = 'open') {
      let q = platform().from('reports_view').select('*').order('created_at', { ascending: false }).limit(200)
      if (status && status !== 'all') q = q.eq('status', status)
      const { data } = await q
      return data || []
    },
    async resolveReport(id, status) {
      await platform().rpc('mod_resolve_report', { p_id: id, p_status: status })
    },
    async setHidden(table, id, hidden, reason) {
      await platform().rpc('mod_set_hidden', { p_table: table, p_id: id, p_hidden: hidden, p_reason: reason || null })
    },
    async setSuspended(userId, suspended) {
      await platform().rpc('mod_set_suspended', { p_user_id: userId, p_suspended: suspended })
    },
  },
}
