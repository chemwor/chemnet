// Derive 1–2 uppercase initials from a display name, falling back to a handle,
// then to "?". Used by the auto-monogram avatar (src/apps/_shared/Monogram).
export function initialsFrom(displayName, handle) {
  const name = String(displayName || '').trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  const h = String(handle || '').replace(/[^a-z0-9]/gi, '')
  if (h) return h.slice(0, 2).toUpperCase()
  return '?'
}
