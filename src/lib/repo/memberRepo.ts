// ════════════════════════════════════════════════════════════════════════
// memberRepo(userId) — a member node (`/u/:handle`). Reads members.* filtered
// by the node owner's user_id; writes are stamped with user_id (RLS enforces
// that auth.uid() === user_id for own-row writes — see …_rls.sql).
// ════════════════════════════════════════════════════════════════════════
import { supabase } from '../supabase'
import { socialApi } from './social'
import { storageApi } from './storage'
import type { Repo, Row, BoardThread } from './types'

// All member content lives in the `members` Postgres schema. Requires
// `members` in the PostgREST exposed-schemas list (see schema migration).
const m = () => supabase.schema('members')

export function memberRepo(userId: string): Repo {
  // Shared create/update/remove for a user-owned table. Reads/writes always
  // scope to this node's user_id; RLS independently checks auth.uid().
  function write(table: string) {
    return {
      async create(row: Row) {
        const { data, error } = await m().from(table).insert({ ...row, user_id: userId }).select().single()
        return error ? null : data
      },
      async update(id: string | number, patch: Row) {
        const { data, error } = await m().from(table).update(patch).eq('id', id).eq('user_id', userId).select().single()
        return error ? null : data
      },
      async remove(id: string | number) {
        const { error } = await m().from(table).delete().eq('id', id).eq('user_id', userId)
        return !error
      },
    }
  }

  return {
    posts: {
      ...write('posts'),
      async list() {
        const { data } = await m().from('posts').select('*').eq('user_id', userId)
          .order('sort_order', { ascending: true }).order('created_at', { ascending: false })
        return data || []
      },
      // Anonymous visitors can't increment a member's view count (RLS). No-op.
      async incrementViews() { /* no-op */ },
    },

    photos: {
      ...write('photos'),
      async list() {
        const { data } = await m().from('photos').select('*').eq('user_id', userId)
          .order('sort_order', { ascending: true }).order('created_at', { ascending: false })
        return data || []
      },
    },

    reviews: {
      ...write('reviews'),
      async list() {
        const { data } = await m().from('reviews').select('*').eq('user_id', userId).order('title')
        return data || []
      },
    },

    foodItems: {
      ...write('food_items'),
      async list() {
        const { data } = await m().from('food_items').select('*').eq('user_id', userId).order('name')
        return data || []
      },
    },

    guestbook: {
      async list() {
        const { data } = await m().from('guestbook_entries').select('*').eq('profile_id', userId)
          .order('created_at', { ascending: true })
        // Map members shape → the shape the Guestbook app renders. Resolving
        // the signer's display name from platform.profiles is a Phase 2 join.
        return (data || []).map(r => ({ id: r.id, name: 'Guest', location: null, message: r.body, created_at: r.created_at }))
      },
      async sign(entry) {
        // Anonymous signing is allowed on public nodes (RLS enforces public +
        // rate limit); a logged-in signer is recorded as author_id.
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await m().from('guestbook_entries')
          .insert({ profile_id: userId, author_id: user?.id ?? null, body: entry.message.trim() }).select().single()
        return error ? null : data
      },
      async remove(id) {
        // RLS allows the book owner or the original signer to delete.
        const { error } = await m().from('guestbook_entries').delete().eq('id', id)
        return !error
      },
    },

    board: {
      async load(): Promise<BoardThread[]> {
        const { data: threadData } = await m().from('board_threads').select('*').eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (!threadData || threadData.length === 0) return []
        const { data: postData } = await m().from('board_posts').select('*').eq('user_id', userId)
          .order('created_at', { ascending: true })
        return threadData.map(t => ({
          ...t,
          date: t.created_at,
          posts: (postData || []).filter(p => p.thread_id === t.id).map(p => ({ ...p, date: p.created_at })),
        }))
      },
      async reply({ threadId, author, email, body }) {
        const { data, error } = await m().from('board_posts')
          .insert({ user_id: userId, thread_id: threadId, author, email: email || null, body, is_sysop: false })
          .select().single()
        return error ? null : data
      },
      async createThread({ subject, author, email, body }) {
        const { data: thread, error: thErr } = await m().from('board_threads')
          .insert({ user_id: userId, subject, author }).select().single()
        if (thErr || !thread) return null
        const { data: post } = await m().from('board_posts')
          .insert({ user_id: userId, thread_id: thread.id, author, email: email || null, body, is_sysop: false })
          .select().single()
        return { thread, post: post || null }
      },
      async removeThread(id) {
        const { error } = await m().from('board_threads').delete().eq('id', id).eq('user_id', userId)
        return !error
      },
    },

    digest: {
      ...write('digest_entries'),
      async list() {
        const { data } = await m().from('digest_entries').select('*').eq('user_id', userId)
          .order('published_date', { ascending: false }).order('created_at', { ascending: false })
        return data || []
      },
    },

    wishlist: {
      ...write('wishlist_items'),
      async list() {
        const { data } = await m().from('wishlist_items').select('*').eq('user_id', userId)
          .order('sort_order', { ascending: true }).order('created_at', { ascending: true })
        return data || []
      },
    },

    travelLog: {
      ...write('travel_log'),
      async list() {
        const { data } = await m().from('travel_log').select('*').eq('user_id', userId)
          .order('sort_order', { ascending: true })
        return data || []
      },
    },

    carMods: {
      ...write('car_mods'),
      async list() {
        const { data } = await m().from('car_mods').select('*').eq('user_id', userId)
          .order('sort_order', { ascending: true })
        return data || []
      },
    },

    projects: {
      ...write('projects'),
      async list() {
        const { data } = await m().from('projects').select('*').eq('user_id', userId)
          .order('sort_order', { ascending: true })
        return data || []
      },
    },

    music: {
      ...write('music_tracks'),
      async list() {
        const { data } = await m().from('music_tracks').select('*').eq('user_id', userId)
          .order('sort_order', { ascending: true })
        return data || []
      },
    },

    messages: {
      async listInbox() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []
        const { data } = await m().from('messages').select('*').eq('recipient_id', user.id)
          .order('created_at', { ascending: false })
        return data || []
      },
      // recipientId defaults to this node's owner — a visitor sends the owner mail.
      async send({ recipientId, subject, body }) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null
        const { data, error } = await m().from('messages')
          .insert({ sender_id: user.id, recipient_id: recipientId || userId, subject, body }).select().single()
        return error ? null : data
      },
      async markRead(id) {
        await m().from('messages').update({ read: true }).eq('id', id)
      },
    },

    desktopConfig: {
      async get() {
        const { data } = await m().from('desktop_config').select('*').eq('user_id', userId).maybeSingle()
        return data || null
      },
      async upsert(config) {
        const { data, error } = await m().from('desktop_config')
          .upsert({ ...config, user_id: userId, updated_at: new Date().toISOString() }).select().single()
        return error ? null : data
      },
    },

    // Social graph + uploads are user-global, identical on every node.
    social: socialApi,
    storage: storageApi,
  }
}
