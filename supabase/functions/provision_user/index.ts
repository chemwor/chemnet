// ════════════════════════════════════════════════════════════════════════
// provision_user — "Make your own" provisioning endpoint (Phase 1)
// ════════════════════════════════════════════════════════════════════════
// POST /provision_user { handle }
//   - requires an authenticated caller (verifies the JWT → auth.uid())
//   - re-validates the handle (regex + uniqueness, enforced again in SQL)
//   - delegates to platform.provision_member(uid, handle), which atomically
//     inserts the profile + desktop_config and seeds a welcome post + system
//     ChemMail (idempotent; member tables only — never public.*)
//   - returns { handle }
//
// Deploy (human step):
//   supabase functions deploy provision_user
// The function uses the service-role key (auto-injected as SUPABASE_SERVICE_ROLE_KEY)
// purely to call the locked-down SECURITY DEFINER RPC; it never writes tables
// directly and never touches Eric's public.* data.
// ════════════════════════════════════════════════════════════════════════
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const HANDLE_RE = /^[a-z0-9_]{3,20}$/

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const authHeader = req.headers.get('Authorization') || ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '')
  if (!jwt) return json({ error: 'unauthorized' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  // Verify the caller's identity from their JWT.
  const { data: { user }, error: userErr } = await admin.auth.getUser(jwt)
  if (userErr || !user) return json({ error: 'unauthorized' }, 401)

  let handle = ''
  try {
    const body = await req.json()
    handle = String(body?.handle ?? '').trim().toLowerCase()
  } catch {
    return json({ error: 'bad_request' }, 400)
  }
  if (!HANDLE_RE.test(handle)) return json({ error: 'invalid_handle' }, 400)

  // Atomic, idempotent provisioning (members.* + platform.profiles only).
  const { data, error } = await admin
    .schema('platform')
    .rpc('provision_member', { p_user_id: user.id, p_handle: handle })

  if (error) {
    const msg = error.message || ''
    if (msg.includes('handle_taken')) return json({ error: 'handle_taken' }, 409)
    if (msg.includes('invalid_handle')) return json({ error: 'invalid_handle' }, 400)
    return json({ error: 'provision_failed', detail: msg }, 500)
  }

  return json({ handle: data })
})
