// parseVideoUrl(url) — provider-agnostic video link parsing for the Videos app.
// The owner can paste ANY video URL; this detects the provider and returns how
// to render it. Shared by the Videos app (render) and memberRepo.videos (so the
// detected provider/thumbnail get stored on write).
//
// Returns: { provider, kind, embedUrl, thumbnail, note }
//   provider : 'youtube' | 'vimeo' | 'drive' | 'file' | 'unknown'
//   kind     : 'iframe'  (embed in an <iframe>)
//            | 'video'   (play in an HTML5 <video>)
//            | 'unknown' (couldn't read the link)
//   embedUrl : the URL to feed the iframe/video (null when unknown)
//   thumbnail: a poster image URL when we can derive one (YouTube only), else null
//   note     : optional short caveat to surface in the UI (e.g. Drive sharing)

export function parseVideoUrl(url) {
  const u = String(url || '').trim()
  if (!u) return { provider: 'unknown', kind: 'unknown', embedUrl: null, thumbnail: null }

  // YouTube — watch?v= / youtu.be / shorts / embed / v
  if (/(?:youtube\.com|youtu\.be)/i.test(u)) {
    const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/|live\/))([\w-]{6,})/)
    if (m) {
      return { provider: 'youtube', kind: 'iframe', embedUrl: `https://www.youtube.com/embed/${m[1]}`, thumbnail: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` }
    }
  }

  // Vimeo — vimeo.com/123456789 (optionally /video/)
  if (/vimeo\.com/i.test(u)) {
    const m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    if (m) return { provider: 'vimeo', kind: 'iframe', embedUrl: `https://player.vimeo.com/video/${m[1]}`, thumbnail: null }
  }

  // Google Drive — /file/d/ID/..., open?id=ID, or ?id=ID
  if (/drive\.google\.com/i.test(u)) {
    const m = u.match(/\/file\/d\/([\w-]+)/) || u.match(/[?&]id=([\w-]+)/)
    if (m) {
      return {
        provider: 'drive', kind: 'iframe', embedUrl: `https://drive.google.com/file/d/${m[1]}/preview`, thumbnail: null,
        note: 'Set the Drive file to “Anyone with the link.” Google enforces per-day view quotas.',
      }
    }
  }

  // Direct file / Supabase Storage object
  if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(u) || /\/storage\/v1\/object\//i.test(u)) {
    return { provider: 'file', kind: 'video', embedUrl: u, thumbnail: null }
  }

  return { provider: 'unknown', kind: 'unknown', embedUrl: null, thumbnail: null }
}
