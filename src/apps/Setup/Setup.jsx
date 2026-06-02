import { useState, useEffect } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { memberRepo } from '../../lib/repo/memberRepo'
import { THEME_PRESETS, WALLPAPERS, wallpaperCss } from '../../lib/customization'
import { Monogram } from '../_shared/Monogram'
import { DesktopWizard, MobileWizard } from './chrome'

// ════════════════════════════════════════════════════════════════════════
// Setup — the guided first-run wizard at /me. ONE step definition, two skins
// (Win95 setup dialog on desktop, new-iPhone setup on mobile). Only the handle
// is required; everything else has a default + Skip. Nothing is provisioned
// until Finish, so claiming mid-flow can't bounce the user off the wizard.
//
// Writes the same platform.profiles + members.desktop_config that About /
// Customize edit later — via provision_user (handle) then the repo (profile +
// theme). Never touches public.*; no uploads (monogram + presets only).
// ════════════════════════════════════════════════════════════════════════

const HANDLE_RE = /^[a-z0-9_]{3,20}$/

// The 5 post-sign-in steps. Sign-in (welcome) is the gate before these.
const STEPS = [
  { id: 'handle',   title: 'Claim your handle', subtitle: 'This is your address on the network — /u/your_handle.', required: true,  banner: 'Pick the name your node lives at.' },
  { id: 'identity', title: 'Who are you?',       subtitle: 'A display name and a monogram. You can skip this.',     required: false, banner: 'Put a name to the node.' },
  { id: 'theme',    title: 'Make it yours',      subtitle: 'Pick a color and a backdrop. Change it anytime.',       required: false, banner: 'Choose a look.' },
  { id: 'about',    title: 'About starter',      subtitle: 'A few optional lines for your profile.',                required: false, banner: 'Say a little about yourself.' },
  { id: 'finish',   title: "You're all set",     subtitle: 'Create your node and jump straight in.',                required: false, banner: 'Ready to launch.' },
]

const ERR_TEXT = {
  handle_taken: 'That handle was just taken. Try another.',
  invalid_handle: 'Use 3–20 chars: lowercase letters, numbers, underscores.',
  provision_failed: 'Something went wrong creating your node. Try again.',
}

// ── small shared inputs (skin-neutral; chrome supplies the frame) ──────────

const fieldStyle = {
  width: '100%', padding: '9px 11px', background: 'rgba(127,127,127,0.12)', color: 'inherit',
  border: '1px solid rgba(127,127,127,0.5)', borderRadius: 8, outline: 'none', fontSize: 15, fontFamily: 'inherit',
}
function TextField({ value, onChange, placeholder, onEnter, autoFocus, maxLength }) {
  return (
    <input
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      autoFocus={autoFocus} maxLength={maxLength}
      onKeyDown={e => { if (e.key === 'Enter' && onEnter) onEnter() }}
      style={fieldStyle}
    />
  )
}

// ── step bodies (shared by both skins) ─────────────────────────────────────

function WelcomeBody({ auth }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const send = async () => {
    setErr('')
    const { error } = await auth.loginWithMagicLink(email)
    if (error) { setErr(error.message); return }
    setSent(true)
  }
  if (sent) {
    return <div style={{ fontSize: 15, color: 'var(--color-accent, #0A84FF)', lineHeight: 1.5 }}>Magic link sent to {email}. Open it on this device to keep going.</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340 }}>
      <button
        onClick={async () => { setErr(''); const { error } = await auth.loginWithGoogle(); if (error) setErr(error.message) }}
        style={{ ...fieldStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', background: '#fff', color: '#3c4043', fontWeight: 600 }}
      >
        <span style={{ color: '#4285F4', fontWeight: 800 }}>G</span> Continue with Google
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.6, fontSize: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'currentColor' }} /> or email <div style={{ flex: 1, height: 1, background: 'currentColor' }} />
      </div>
      <TextField value={email} onChange={setEmail} placeholder="you@email.com" onEnter={send} />
      <button onClick={send} style={{ ...fieldStyle, cursor: 'pointer', background: 'var(--color-accent, #0A84FF)', color: '#1a1207', fontWeight: 700, textAlign: 'center' }}>Send magic link</button>
      {err && <div style={{ fontSize: 12, color: '#FF5555' }}>{err}</div>}
    </div>
  )
}

function HandleBody({ handle, setHandle, state, onEnter }) {
  return (
    <div style={{ maxWidth: 360 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ opacity: 0.6, fontSize: 15 }}>/u/</span>
        <TextField value={handle} onChange={v => setHandle(v.toLowerCase())} placeholder="your_handle" onEnter={onEnter} autoFocus maxLength={20} />
      </div>
      <div style={{ minHeight: 20, marginTop: 8, fontSize: 13 }}>
        {state.checking && <span style={{ opacity: 0.6 }}>Checking…</span>}
        {!state.checking && state.available === true && <span style={{ color: '#3FBF6A' }}>✓ /u/{handle} is available</span>}
        {!state.checking && state.available === false && <span style={{ color: '#FF6B6B' }}>{state.reason}</span>}
      </div>
    </div>
  )
}

function IdentityBody({ data, set, handle }) {
  const preview = { display_name: data.displayName, handle }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <Monogram profile={preview} size={64} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <TextField value={data.displayName} onChange={v => set({ displayName: v })} placeholder="Display name" autoFocus maxLength={40} />
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>Your monogram is auto-drawn from this (or your handle). Real avatar upload comes later.</div>
      </div>
    </div>
  )
}

function Swatch({ selected, onClick, children, color, label }) {
  return (
    <button onClick={onClick} title={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      <span style={{ width: 46, height: 46, borderRadius: 10, background: color, backgroundSize: 'cover', border: selected ? '3px solid var(--color-accent, #0A84FF)' : '3px solid transparent', boxShadow: '0 0 0 1px rgba(127,127,127,0.5)' }}>{children}</span>
      <span style={{ fontSize: 11, opacity: selected ? 1 : 0.65 }}>{label}</span>
    </button>
  )
}

function ThemeBody({ data, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>Theme color</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {THEME_PRESETS.map(p => (
            <Swatch key={p.key} label={p.label} color={p.theme['--color-accent']} selected={data.themeKey === p.key} onClick={() => set({ themeKey: p.key })} />
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>Wallpaper</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {WALLPAPERS.map(w => (
            <Swatch key={w.key} label={w.label} color={wallpaperCss(w.key)} selected={data.wallpaperKey === w.key} onClick={() => set({ wallpaperKey: w.key })} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AboutBody({ data, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 380 }}>
      <TextField value={data.tagline} onChange={v => set({ tagline: v })} placeholder="What's this node about? (one line)" maxLength={80} />
      <TextField value={data.location} onChange={v => set({ location: v })} placeholder="Location (optional)" maxLength={60} />
      <textarea
        value={data.bio} onChange={e => set({ bio: e.target.value })} placeholder="A short bio (optional)" rows={3}
        style={{ ...fieldStyle, resize: 'vertical' }}
      />
    </div>
  )
}

function FinishBody({ data, handle }) {
  const theme = THEME_PRESETS.find(p => p.key === data.themeKey)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Monogram profile={{ display_name: data.displayName, handle }} size={64} />
      <div style={{ fontSize: 14, lineHeight: 1.7 }}>
        <div><strong>{data.displayName || handle}</strong></div>
        <div style={{ opacity: 0.7 }}>/u/{handle}</div>
        {theme && <div style={{ opacity: 0.7 }}>Theme: {theme.label}</div>}
        {data.tagline && <div style={{ opacity: 0.7 }}>“{data.tagline}”</div>}
      </div>
    </div>
  )
}

// ── orchestrator ────────────────────────────────────────────────────────────

export default function Setup() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const auth = useAuth()
  const { user, loading } = auth

  const [stepIdx, setStepIdx] = useState(0)
  const [handle, setHandle] = useState('')
  const [data, setData] = useState({ displayName: '', themeKey: '', wallpaperKey: '', bio: '', location: '', tagline: '' })
  const [hstate, setHstate] = useState({ checking: false, available: null, reason: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (patch) => setData(d => ({ ...d, ...patch }))

  // Live handle availability (debounced). All state writes happen inside the
  // timeout callback (never synchronously in the effect body). Format is
  // validated locally; uniqueness is a read against public profiles —
  // provision_user is the final arbiter, so a hidden private collision still
  // surfaces at Finish.
  useEffect(() => {
    const h = handle.trim().toLowerCase()
    let cancelled = false
    const t = setTimeout(async () => {
      if (cancelled) return
      if (!h) { setHstate({ checking: false, available: null, reason: '' }); return }
      if (!HANDLE_RE.test(h)) { setHstate({ checking: false, available: false, reason: '3–20 chars: a–z, 0–9, _' }); return }
      setHstate({ checking: true, available: null, reason: '' })
      const { data: row } = await supabase.schema('platform').from('profiles').select('handle').eq('handle', h).maybeSingle()
      if (cancelled) return
      setHstate(row ? { checking: false, available: false, reason: 'That handle is taken.' } : { checking: false, available: true, reason: '' })
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [handle])

  if (loading) {
    return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-desktop-bg, #0a0a18)', color: 'var(--color-text-secondary, #A09AB0)', fontFamily: '"Courier Prime", monospace' }}>Loading…</div>
  }

  const step = STEPS[stepIdx]

  const clearStep = (id) => {
    if (id === 'identity') set({ displayName: '' })
    if (id === 'theme') set({ themeKey: '', wallpaperKey: '' })
    if (id === 'about') set({ bio: '', location: '', tagline: '' })
  }

  const provision = async () => {
    setError('')
    setBusy(true)
    const h = handle.trim().toLowerCase()
    // 1) Claim the handle via the Edge Function (creates profile + config rows).
    //    Call invoke directly (not auth.claimHandle) so useAuth.profile stays
    //    null and the /me router doesn't navigate away mid-write.
    let code = null
    const { data: pres, error: perr } = await supabase.functions.invoke('provision_user', { body: { handle: h } })
    if (perr) { try { const b = await perr.context.json(); code = b?.error } catch { code = 'provision_failed' } }
    else if (pres?.error) code = pres.error
    if (code) { setBusy(false); setError(ERR_TEXT[code] || code); setStepIdx(0); return }
    const finalHandle = pres?.handle || h

    // 2) Persist optional profile + theme via the repo (member rows now exist).
    try {
      const repo = memberRepo(user.id)
      const patch = {}
      if (data.displayName.trim()) patch.display_name = data.displayName.trim()
      if (data.tagline.trim()) patch.tagline = data.tagline.trim()
      if (data.bio.trim()) patch.bio = data.bio.trim()
      if (data.location.trim()) patch.location = data.location.trim()
      if (Object.keys(patch).length) await repo.social.updateMyProfile(patch)

      if (data.themeKey || data.wallpaperKey) {
        const current = (await repo.desktopConfig.get()) || {}
        const next = { ...current }
        if (data.themeKey) { const p = THEME_PRESETS.find(x => x.key === data.themeKey); if (p) next.theme = p.theme }
        if (data.wallpaperKey) next.wallpaper = data.wallpaperKey
        await repo.desktopConfig.upsert(next)
      }
    } catch { /* node works with defaults; never block entry on polish */ }

    // 3) Hard-navigate into the new node in edit mode.
    window.location.href = `/u/${finalHandle}?edit=1`
  }

  const isLast = stepIdx === STEPS.length - 1
  const onNext = () => { if (isLast) provision(); else setStepIdx(i => Math.min(STEPS.length - 1, i + 1)) }
  const onBack = () => setStepIdx(i => Math.max(0, i - 1))
  const onSkip = () => { clearStep(step.id); setStepIdx(i => Math.min(STEPS.length - 1, i + 1)) }
  const onCancel = () => { window.location.href = '/' }

  // Body + nav state depend on whether we're signed in yet.
  const signedOut = !user
  let body, title, subtitle, banner, nextDisabled, canSkip, hideNext
  if (signedOut) {
    title = 'Make your own ChemNet'
    subtitle = 'Your own retro-OS desktop at /u/your_handle. Sign in to begin.'
    banner = 'Sign in to begin.'
    body = <WelcomeBody auth={auth} />
    hideNext = true
    canSkip = false
  } else {
    title = step.title
    subtitle = step.subtitle
    banner = step.banner
    nextDisabled = busy || (step.id === 'handle' && hstate.available !== true)
    canSkip = !step.required && !isLast
    if (step.id === 'handle') body = <HandleBody handle={handle} setHandle={setHandle} state={hstate} onEnter={() => { if (hstate.available === true) onNext() }} />
    else if (step.id === 'identity') body = <IdentityBody data={data} set={set} handle={handle} />
    else if (step.id === 'theme') body = <ThemeBody data={data} set={set} />
    else if (step.id === 'about') body = <AboutBody data={data} set={set} />
    else body = <FinishBody data={data} handle={handle} />
  }

  const content = error
    ? <><div style={{ marginBottom: 10, padding: '8px 10px', background: 'rgba(255,80,80,0.15)', border: '1px solid #FF5555', borderRadius: 6, fontSize: 13, color: '#FF8888' }}>{error}</div>{body}</>
    : body

  const common = {
    stepIndex: stepIdx, stepCount: signedOut ? 0 : STEPS.length, title, subtitle,
    onNext, onSkip, onCancel, nextDisabled, canSkip, busy, hideNext,
    nextLabel: isLast ? 'Finish' : undefined,
    children: content,
  }

  return isMobile
    ? <MobileWizard {...common} hideDots={signedOut} />
    : <DesktopWizard {...common} onBack={onBack} bannerTag={banner} canBack={!signedOut && stepIdx > 0} />
}
