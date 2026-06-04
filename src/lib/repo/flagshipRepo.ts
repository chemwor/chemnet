// ════════════════════════════════════════════════════════════════════════
// flagshipRepo — Eric's hub node (`/`). Reads his existing public.* tables
// and the few apps that still read from local JS files. This MUST reproduce
// today's behavior exactly; it is the one place allowed to import `supabase`
// and the local data files.
//
// WRITES are no-ops here: Eric edits his hub through the Admin app, and the
// in-place owner editor is gated to member nodes only. Keeping the no-ops
// satisfies the Repo interface without changing flagship behavior.
// ════════════════════════════════════════════════════════════════════════
import { supabase } from '../supabase'
import { AI_PAPER } from '../../apps/Blog/ai-paper'
import { WISHLIST_ITEMS } from '../../apps/WishList/wishlist-data'
import { socialApi } from './social'
import { storageApi } from './storage'
import type { Repo, Row, BoardThread } from './types'

// Blog falls back to a hardcoded post when the DB is empty/slow/offline.
const FALLBACK_POSTS: Row[] = [
  {
    id: 'fallback-1',
    title: 'Break Down of Artificial Intelligence and Its Impact on Human Life',
    filename: 'Artificial Intelligence in The Workforce.doc',
    content: AI_PAPER, raw: null,
    note: 'Research paper written at John McEachern High School, Fall/Spring 2015-2016.',
    created_at: '2016-05-18T12:00:00Z', views: 0, category: 'tech',
  },
]

// Eric's videos for the flagship ChemTube (formerly hardcoded in Videos.jsx).
const FLAGSHIP_VIDEOS: Row[] = [
  { id: 'v1', title: 'SkyJump Las Vegas', url: 'https://youtu.be/6S7bkah5O0U', description: 'Jumping off the Stratosphere in Las Vegas.', folder: 'my-videos', sort_order: 0 },
  { id: 'v2', title: 'Spectrum Piano Cover', url: 'https://youtube.com/shorts/WSJFbDv7Aw8', description: 'A piano cover I recorded.', folder: 'my-videos', sort_order: 1 },
]

// Mirror the 3s abort-or-fallback pattern the apps used inline.
function withTimeout(ms: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, done: () => clearTimeout(timer) }
}

// No-op write mixin — flagship content is edited via the Admin app.
const ro = {
  async create(): Promise<Row | null> { return null },
  async update(): Promise<Row | null> { return null },
  async remove(): Promise<boolean> { return false },
}

export const flagshipRepo: Repo = {
  posts: {
    ...ro,
    async list() {
      try {
        const t = withTimeout(3000)
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .abortSignal(t.signal)
        t.done()
        if (error || !data || data.length === 0) return FALLBACK_POSTS
        return data
      } catch {
        return FALLBACK_POSTS
      }
    },
    async incrementViews(id) {
      if (id && !String(id).startsWith('fallback')) {
        try { await supabase.rpc('increment_blog_views', { post_id: id }) } catch { /* best effort */ }
      }
    },
  },

  photos: {
    ...ro,
    async list() {
      const { data } = await supabase.from('photos').select('*').order('created_at', { ascending: false })
      return data || []
    },
  },

  reviews: {
    ...ro,
    async list() {
      try {
        const t = withTimeout(3000)
        const { data, error } = await supabase.from('reviews').select('*').order('title').abortSignal(t.signal)
        t.done()
        if (error || !data) return []
        return data
      } catch {
        return []
      }
    },
  },

  // The Food List is DB-backed on the flagship (public.restaurants, RLS public
  // read / admin write). Eric edits inline as the flagship owner.
  foodItems: {
    async list() {
      try {
        const t = withTimeout(3000)
        const { data, error } = await supabase.from('restaurants').select('*').order('name').abortSignal(t.signal)
        t.done()
        if (error || !data) return []
        return data
      } catch {
        return []
      }
    },
    async get(id) {
      const { data } = await supabase.from('restaurants').select('*').eq('id', id).maybeSingle()
      return data || null
    },
    async create(row) {
      const { data, error } = await supabase.from('restaurants').insert(row).select().single()
      return error ? null : data
    },
    async update(id, patch) {
      const { data, error } = await supabase.from('restaurants').update(patch).eq('id', id).select().single()
      return error ? null : data
    },
    async remove(id) {
      const { error } = await supabase.from('restaurants').delete().eq('id', id)
      return !error
    },
    async addPhoto(id, url) {
      const { data: row } = await supabase.from('restaurants').select('photo_urls').eq('id', id).maybeSingle()
      const next = [...(row?.photo_urls || []), url]
      const { data, error } = await supabase.from('restaurants').update({ photo_urls: next }).eq('id', id).select().single()
      return error ? null : data
    },
  },

  guestbook: {
    async list() {
      try {
        const { data, error } = await supabase
          .from('guestbook_entries')
          .select('*')
          .order('created_at', { ascending: true })
        if (error || !data) return []
        return data
      } catch {
        return []
      }
    },
    async sign(entry) {
      const { data, error } = await supabase
        .from('guestbook_entries')
        .insert({
          name: entry.name?.trim(),
          location: entry.location?.trim() || null,
          message: entry.message.trim(),
        })
        .select()
        .single()
      if (error) return null
      return data
    },
    async remove() { return false },
  },

  board: {
    async load(): Promise<BoardThread[]> {
      try {
        const { data: threadData } = await supabase
          .from('message_threads')
          .select('*')
          .order('created_at', { ascending: false })
        if (!threadData || threadData.length === 0) return []
        const { data: postData } = await supabase
          .from('message_posts')
          .select('*')
          .order('created_at', { ascending: true })
        return threadData.map(t => ({
          ...t,
          date: t.created_at,
          posts: (postData || []).filter(p => p.thread_id === t.id).map(p => ({ ...p, date: p.created_at })),
        }))
      } catch {
        return []
      }
    },
    async reply({ threadId, author, email, body }) {
      const { data, error } = await supabase
        .from('message_posts')
        .insert({ thread_id: threadId, author, email: email || null, body, is_sysop: false })
        .select()
        .single()
      if (error) return null
      return data
    },
    async createThread({ subject, author, email, body }) {
      const { data: thread, error: thErr } = await supabase
        .from('message_threads')
        .insert({ subject, author })
        .select()
        .single()
      if (thErr || !thread) return null
      const { data: post } = await supabase
        .from('message_posts')
        .insert({ thread_id: thread.id, author, email: email || null, body, is_sysop: false })
        .select()
        .single()
      return { thread, post: post || null }
    },
    async removeThread() { return false },
  },

  digest: {
    ...ro,
    async list() {
      const { data } = await supabase
        .from('digest_entries')
        .select('*')
        .order('published_date', { ascending: false })
        .order('created_at', { ascending: false })
      return data || []
    },
  },

  wishlist: {
    ...ro,
    async list() {
      // Eric's wishlist lives in a local JS file (members move onto a table).
      return WISHLIST_ITEMS
    },
  },

  // Travel Log is DB-backed on the flagship too (new public.travel_log table,
  // RLS: public read / admin write). Eric edits inline as the flagship owner.
  travelLog: {
    async list() {
      const { data } = await supabase.from('travel_log').select('*')
        .order('sort_order', { ascending: true }).order('created_at', { ascending: true })
      return data || []
    },
    async get(id) {
      const { data } = await supabase.from('travel_log').select('*').eq('id', id).maybeSingle()
      return data || null
    },
    async create(row) {
      const { data, error } = await supabase.from('travel_log').insert(row).select().single()
      return error ? null : data
    },
    async update(id, patch) {
      const { data, error } = await supabase.from('travel_log').update(patch).eq('id', id).select().single()
      return error ? null : data
    },
    async remove(id) {
      const { error } = await supabase.from('travel_log').delete().eq('id', id)
      return !error
    },
    async addPhoto(id, url) {
      const { data: row } = await supabase.from('travel_log').select('photo_urls').eq('id', id).maybeSingle()
      const next = [...(row?.photo_urls || []), url]
      const { data, error } = await supabase.from('travel_log').update({ photo_urls: next }).eq('id', id).select().single()
      return error ? null : data
    },
    async setPlanItems(id, items) {
      const { data, error } = await supabase.from('travel_log').update({ plan_items: items }).eq('id', id).select().single()
      return error ? null : data
    },
  },

  // ── File/inline-backed apps NOT wired to the repo on flagship ──
  // CarMods (mod list), Projects and Music render their inline data on the
  // flagship node (unchanged). memberRepo implements these against members.*.
  carMods: { ...ro, async list() { return [] } },
  projects: { ...ro, async list() { return [] } },
  music: { ...ro, async list() { return [] } },

  // Eric's videos (ChemTube). Hardcoded here so the Videos app can read every
  // node through repo.videos; member nodes get their own members.videos rows.
  videos: {
    ...ro,
    async list() { return FLAGSHIP_VIDEOS },
  },

  // ChemMail on the flagship node is a static/fake client today (no DB).
  messages: {
    async listInbox() { return [] },
    async send() { return null },
    async markRead() { /* no-op */ },
  },

  // Eric's desktop is themed via index.css; no per-node config row.
  desktopConfig: {
    async get() { return null },
    async upsert() { return null },
  },

  // Social graph + uploads are user-global, identical on every node.
  social: socialApi,
  storage: storageApi,
}
