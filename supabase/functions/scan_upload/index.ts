// ════════════════════════════════════════════════════════════════════════
// scan_upload — the moderation gate for user uploads (Phase 3)
// ════════════════════════════════════════════════════════════════════════
// POST /scan_upload { bucket: 'avatars'|'wallpapers'|'photos'|'music', path }
//   - `path` is an object the caller already uploaded to the PRIVATE `uploads`
//     bucket, under their own folder: "{uid}/...".
//   - verifies the caller owns the path
//   - runs a content-safety scan (see scanContent) — FAILS CLOSED: if no
//     scanner is configured the upload stays private/pending and is NOT made
//     public.
//   - only on "approved" does it copy the object into the PUBLIC target bucket
//     and return its public URL.
//
// ⚠️ HUMAN DECISION: wire scanContent() to a real CSAM/NSFW vendor before
//    public launch. Until then it returns 'pending' unless SCAN_ALLOW_ALL=true
//    is explicitly set (for local/dev testing only — never in production).
//
// Deploy: supabase functions deploy scan_upload
// ════════════════════════════════════════════════════════════════════════
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const PUBLIC_BUCKETS = ['avatars', 'wallpapers', 'photos', 'music']

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// Content-safety scan. FAIL CLOSED: default to not-approved.
async function scanContent(_bytes: Uint8Array, _contentType: string): Promise<{ approved: boolean; reason?: string }> {
  // TODO: integrate a CSAM/NSFW provider here and return { approved } from it.
  if (Deno.env.get('SCAN_ALLOW_ALL') === 'true') return { approved: true }
  return { approved: false, reason: 'scanning_unavailable' }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!jwt) return json({ error: 'unauthorized' }, 401)

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(url, serviceKey)

  const { data: { user }, error: userErr } = await admin.auth.getUser(jwt)
  if (userErr || !user) return json({ error: 'unauthorized' }, 401)

  let bucket = '', path = ''
  try {
    const body = await req.json()
    bucket = String(body?.bucket || '')
    path = String(body?.path || '')
  } catch {
    return json({ error: 'bad_request' }, 400)
  }
  if (!PUBLIC_BUCKETS.includes(bucket)) return json({ error: 'invalid_bucket' }, 400)
  // The quarantine object must live in the caller's own folder.
  if (!path.startsWith(`${user.id}/`)) return json({ error: 'forbidden' }, 403)

  // Pull the quarantined object.
  const { data: blob, error: dlErr } = await admin.storage.from('uploads').download(path)
  if (dlErr || !blob) return json({ error: 'not_found' }, 404)
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const contentType = blob.type || 'application/octet-stream'

  // Scan — fail closed.
  const scan = await scanContent(bytes, contentType)
  if (!scan.approved) {
    return json({ status: 'pending', reason: scan.reason || 'not_approved' })
  }

  // Approved → copy into the public target bucket under {uid}/<filename>.
  const filename = path.split('/').pop() || `file-${user.id}`
  const dest = `${user.id}/${filename}`
  const { error: upErr } = await admin.storage.from(bucket).upload(dest, blob, { contentType, upsert: true })
  if (upErr) return json({ error: 'copy_failed', detail: upErr.message }, 500)

  // Best-effort cleanup of the quarantine copy.
  await admin.storage.from('uploads').remove([path])

  const { data: pub } = admin.storage.from(bucket).getPublicUrl(dest)
  return json({ status: 'approved', url: pub.publicUrl })
})
