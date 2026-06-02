import { useMediaQuery } from '../../hooks/useMediaQuery'

// "About ChemNet" — the platform explainer opened from the Start Menu. It is
// about the SOFTWARE/network, identical on every node (flagship and member),
// and never anyone's personal bio. The per-person story lives in the desktop
// "About" app (AboutMe); a member's empty profile is handled there.
const VERSION = 'ChemNet OS v1.0'

const LINES = [
  'ChemNet is a personal retro-OS desktop for the web — a little world to explore, not a page to scroll.',
  'Everyone gets their own node at /u/your-handle: theme the desktop, choose which apps appear, and fill them with your own posts, photos, videos, reviews, music, and links.',
  'Sign someone\'s guestbook, follow other nodes, and send ChemMail. Your content shows up only on your node — nobody else\'s.',
]

function openSignup() {
  window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: 'signup' }))
}

export default function AboutChemNet() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontFamily: '"Courier Prime", "Courier New", monospace' }}>
      <div style={{ maxWidth: 460, margin: '0 auto', padding: isMobile ? '28px 22px' : '32px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>🛰️</div>
        <div style={{ fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>ChemNet</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{VERSION}</div>

        <div style={{ height: 1, background: 'var(--color-bevel-dark)', margin: '18px 0' }} />

        {LINES.map((l, i) => (
          <p key={i} style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.65, color: 'var(--color-text-secondary)', textAlign: 'left' }}>{l}</p>
        ))}

        <button
          onClick={openSignup}
          style={{ marginTop: 8, padding: '8px 16px', border: 'none', cursor: 'pointer', background: 'var(--color-accent)', color: '#1a1207', fontWeight: 'bold', fontSize: 13, fontFamily: 'inherit' }}
        >
          Make your own →
        </button>

        <div style={{ marginTop: 20, fontSize: 10, color: 'var(--color-text-disabled)' }}>
          Inspired by the desktops of the late ’90s. Built by Eric Chemwor.
        </div>
      </div>
    </div>
  )
}
