import { initialsFrom } from '../../lib/initials'

// Auto-monogram avatar — the stand-in identity until real avatar upload exists
// (Phase 3). Initials (from src/lib/initials) are derived from the display name
// or handle. The tile is colored from the node's theme accent
// (var(--color-accent)), so it matches whatever palette the owner picked.

// A circular (or `square`) avatar. Shows `avatar_url` when present, else a
// theme-accent initials tile. `profile` may carry { display_name, handle,
// avatar_url }.
export function Monogram({ profile, size = 44, square = false, fontScale = 0.42 }) {
  const radius = square ? Math.round(size * 0.18) : '50%'
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', display: 'block' }} />
  }
  return (
    <div
      aria-hidden
      style={{
        width: size, height: size, borderRadius: radius, background: 'var(--color-accent, #FF6B35)',
        color: '#1a1207', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: Math.round(size * fontScale), fontFamily: '"Courier Prime", monospace',
        letterSpacing: 0.5, userSelect: 'none',
      }}
    >
      {initialsFrom(profile?.display_name, profile?.handle)}
    </div>
  )
}
