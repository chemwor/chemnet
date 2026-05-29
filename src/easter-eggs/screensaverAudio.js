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
