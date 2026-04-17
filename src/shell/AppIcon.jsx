import { iconUrl } from './icons'

export function AppIcon({ icon, size = 16 }) {
  const url = iconUrl(icon)
  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        style={{ imageRendering: 'pixelated', display: 'block' }}
        draggable={false}
      />
    )
  }
  // Fallback for unknown icons — render as emoji
  return <span style={{ fontSize: size * 0.8, lineHeight: 1, display: 'block', width: size, textAlign: 'center' }}>{icon}</span>
}
