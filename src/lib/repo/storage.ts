// ════════════════════════════════════════════════════════════════════════
// storageApi — fail-closed upload pipeline (Phase 3). Validates type/size,
// uploads to the PRIVATE `uploads` quarantine under the user's own folder,
// then calls the scan_upload Edge Function. The asset only becomes public
// (and gets a usable URL) once scanning approves it.
// ════════════════════════════════════════════════════════════════════════
import { supabase } from '../supabase'

const IMG = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const LIMITS: Record<string, { types: string[]; max: number }> = {
  avatars: { types: ['image/jpeg', 'image/png', 'image/webp'], max: 5 * 1024 * 1024 },
  wallpapers: { types: ['image/jpeg', 'image/png', 'image/webp'], max: 5 * 1024 * 1024 },
  photos: { types: IMG, max: 8 * 1024 * 1024 },
  music: { types: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg'], max: 15 * 1024 * 1024 },
}

export interface StorageApi {
  // Returns { status: 'approved'|'pending', url? } or { error } (a code).
  upload(input: { bucket: string; file: File }): Promise<{ status?: string; url?: string; error?: string }>
  limitsFor(bucket: string): { types: string[]; max: number } | null
}

export const storageApi: StorageApi = {
  limitsFor(bucket) {
    return LIMITS[bucket] || null
  },
  async upload({ bucket, file }) {
    const lim = LIMITS[bucket]
    if (!lim) return { error: 'invalid_bucket' }
    if (!lim.types.includes(file.type)) return { error: 'type' }
    if (file.size > lim.max) return { error: 'size' }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'auth' }

    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${user.id}/${bucket}/${Date.now()}-${safe}`

    const { error: upErr } = await supabase.storage.from('uploads')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (upErr) return { error: upErr.message }

    // Scan gate (fail closed): only returns a public URL when approved.
    const { data, error } = await supabase.functions.invoke('scan_upload', { body: { bucket, path } })
    if (error) {
      let code = 'scan_failed'
      try { const b = await error.context.json(); code = b?.error || code } catch { /* ignore */ }
      return { error: code }
    }
    return { status: data?.status, url: data?.url }
  },
}
