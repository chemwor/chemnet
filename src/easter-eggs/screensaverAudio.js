// Shared screensaver audio with autoplay "unlock".
//
// Browsers block audio with sound unless the page has received a real
// activation gesture (click/keydown/pointerdown/touchstart). The screensaver
// fires after 60s of idle — i.e. with no recent gesture — so a naive
// `audio.play()` is silently rejected. To work around this we prime the
// element (play muted, then pause) on the FIRST user gesture, which blesses
// it so later programmatic play() is allowed (required by Safari per-element;
// Chrome's sticky activation covers the rest).

const AUDIO_SRC = '/loose-cannon.m4a'

let audio = null
let unlocked = false

export function getScreensaverAudio() {
  if (!audio) {
    audio = new Audio(AUDIO_SRC)
    audio.loop = true
    audio.volume = 0.6
    audio.preload = 'auto'
  }
  return audio
}

// True if the page already has audio going, so the screensaver theme should
// stay quiet and not talk over it. Covers same-page <audio>/<video> that are
// actually playing, plus the presence of a Spotify / SoundCloud / YouTube embed
// (cross-origin iframes — we can't read their play state, so we yield to them).
// The screensaver's own theme uses a detached `new Audio()`, so it is never
// matched by the element scan below.
export function pageAudioActive() {
  if (typeof document === 'undefined') return false
  for (const el of document.querySelectorAll('audio, video')) {
    if (!el.paused && !el.ended && el.currentTime > 0 && !el.muted && el.volume > 0) return true
  }
  return !!document.querySelector(
    'iframe[src*="spotify.com"], iframe[src*="soundcloud.com"], iframe[src*="youtube.com"], iframe[src*="youtube-nocookie.com"]',
  )
}

// Play the theme for as long as the screensaver is up AND this tab is the
// selected one. A background tab keeps running, so without the visibility gate
// the theme would keep playing into a tab nobody is looking at. Pausing (not
// stopping) keeps our place, so switching back picks up where it left off.
// `pageAudioActive` is re-checked on every resume, not just at start, so we
// still yield if the user started a Spotify/SoundCloud embed in the meantime.
// Returns a stop function.
export function playThemeWhileVisible() {
  const audio = getScreensaverAudio()
  let stopped = false

  const sync = () => {
    if (stopped) return
    if (document.visibilityState === 'hidden') audio.pause()
    else if (!pageAudioActive()) audio.play().catch(() => {})
  }

  audio.currentTime = 0
  sync()
  document.addEventListener('visibilitychange', sync)

  return () => {
    stopped = true
    document.removeEventListener('visibilitychange', sync)
    audio.pause()
    audio.currentTime = 0
  }
}

function unlock() {
  if (unlocked) return
  const a = getScreensaverAudio()
  a.muted = true
  const p = a.play()
  if (p && typeof p.then === 'function') {
    p.then(() => {
      a.pause()
      a.currentTime = 0
      a.muted = false
      unlocked = true
    }).catch(() => {
      a.muted = false // let a later gesture try again
    })
  }
}

if (typeof window !== 'undefined') {
  const events = ['pointerdown', 'keydown', 'touchstart', 'click']
  const handler = () => {
    unlock()
    if (unlocked) events.forEach(e => window.removeEventListener(e, handler))
  }
  events.forEach(e => window.addEventListener(e, handler, { passive: true }))
}
