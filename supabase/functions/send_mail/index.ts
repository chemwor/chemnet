// ════════════════════════════════════════════════════════════════════════
// send_mail — Mail contact form → emails the node owner (Phase 4)
// ════════════════════════════════════════════════════════════════════════
// POST /send_mail { handle, fromEmail, fromName, subject, body, captchaToken? }
//   - NO auth required (anonymous contact form).
//   - resolves handle → platform.profiles.id → auth.users.email SERVER-SIDE.
//     For the flagship/admin contact (no handle), sends to ADMIN_EMAIL.
//   - honors profiles.mail_enabled = false (rejects).
//   - sends via Resend (reply-to = visitor) from the verified domain.
//   - anti-spam: per-IP + per-recipient rate limit, fromEmail validation,
//     subject/body length caps, mail_log audit row. (hCaptcha hook left below.)
//   - the owner's email address is NEVER returned to the client.
//
// Secrets (set via `supabase secrets set ...`):
//   RESEND_API_KEY, MAIL_FROM (e.g. "ChemNet <noreply@ericchemwor.com>"),
//   ADMIN_EMAIL (flagship contact), [HCAPTCHA_SECRET optional]
// Deploy: supabase functions deploy send_mail --no-verify-jwt
// ════════════════════════════════════════════════════════════════════════
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_SUBJECT = 200
const MAX_BODY = 5000
const IP_LIMIT = 5          // sends per IP per hour
const RECIPIENT_LIMIT = 20  // sends to one owner per hour

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'

  let body: any = {}
  try { body = await req.json() } catch { return json({ error: 'bad_request' }, 400) }
  const handle = String(body.handle || '').trim().toLowerCase()
  const fromEmail = String(body.fromEmail || '').trim()
  const fromName = String(body.fromName || '').trim().slice(0, 100)
  const subject = String(body.subject || '').trim().slice(0, MAX_SUBJECT)
  const msg = String(body.body || '').trim().slice(0, MAX_BODY)

  if (!EMAIL_RE.test(fromEmail)) return json({ error: 'invalid_email' }, 400)
  if (!msg) return json({ error: 'empty_body' }, 400)

  // ── hCaptcha hook (enable by setting HCAPTCHA_SECRET + sending captchaToken) ──
  const hcaptchaSecret = Deno.env.get('HCAPTCHA_SECRET')
  if (hcaptchaSecret) {
    const token = String(body.captchaToken || '')
    const verify = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: hcaptchaSecret, response: token }),
    }).then(r => r.json()).catch(() => ({ success: false }))
    if (!verify.success) return json({ error: 'captcha_failed' }, 400)
  }

  // ── Resolve recipient SERVER-SIDE (never returned to the client) ──
  let recipientId: string | null = null
  let toEmail: string | null = null
  if (handle) {
    const { data: prof } = await admin.schema('platform').from('profiles')
      .select('id, mail_enabled').eq('handle', handle).maybeSingle()
    if (!prof) return json({ error: 'not_found' }, 404)
    if (prof.mail_enabled === false) return json({ error: 'mail_disabled' }, 403)
    recipientId = prof.id
    const { data: u } = await admin.auth.admin.getUserById(prof.id)
    toEmail = u?.user?.email || null
  } else {
    toEmail = Deno.env.get('ADMIN_EMAIL') || null  // flagship/admin contact
  }
  if (!toEmail) return json({ error: 'no_recipient' }, 404)

  // ── Rate limits (per IP + per recipient, rolling 1h) ──
  const since = new Date(Date.now() - 3600_000).toISOString()
  const ipCount = await admin.schema('members').from('mail_log')
    .select('*', { count: 'exact', head: true }).eq('ip', ip).gte('created_at', since)
  if ((ipCount.count || 0) >= IP_LIMIT) return json({ error: 'rate_limited' }, 429)
  if (recipientId) {
    const rCount = await admin.schema('members').from('mail_log')
      .select('*', { count: 'exact', head: true }).eq('recipient_id', recipientId).gte('created_at', since)
    if ((rCount.count || 0) >= RECIPIENT_LIMIT) return json({ error: 'rate_limited' }, 429)
  }

  // ── Send via Resend ──
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const MAIL_FROM = Deno.env.get('MAIL_FROM') || 'ChemNet <noreply@ericchemwor.com>'
  let status = 'sent'
  if (!RESEND_API_KEY) {
    status = 'no_provider'  // fail visible but logged
  } else {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [toEmail],
        reply_to: fromEmail,
        subject: subject || `New message via ChemNet${handle ? ` (@${handle})` : ''}`,
        text: `From: ${fromName || 'Anonymous'} <${fromEmail}>\n\n${msg}`,
      }),
    })
    if (!res.ok) status = 'send_failed'
  }

  // ── Audit (service role; never exposes the owner address) ──
  await admin.schema('members').from('mail_log').insert({
    recipient_id: recipientId, from_email: fromEmail, from_name: fromName, subject, status, ip,
  })

  if (status === 'sent') return json({ ok: true })
  if (status === 'no_provider') return json({ error: 'mail_unavailable' }, 503)
  return json({ error: 'send_failed' }, 502)
})
