import { useState } from 'react'
import { useProfile } from '../../context/ProfileContext'
import { useDesktopConfig } from '../../hooks/useDesktopConfig'

// Eric's flagship playlist links live here (no public.* schema change). Paste
// his SoundCloud "set" URL and Spotify playlist URL to light up the hub's
// Music app. Members set theirs in Customize → Music.
const FLAGSHIP_MUSIC = {
  soundcloud: 'https://soundcloud.com/paradoxxedm',
  spotify: 'https://open.spotify.com/playlist/3o3g3Y7v8bgwn72UwSP4AL',
}

// Local "My Productions" list (Eric's own tracks).
const PRODUCTIONS = [
  { name: 'Late Night Sessions - Beat 01.mp3', size: '4.2 MB', date: '2026-03-10', description: 'Late night piano loop. Chopped and looped until it felt right. Lo-fi vibes.' },
  { name: 'Nairobi Sunrise (Guitar).mp3', size: '3.8 MB', date: '2026-02-14', description: 'Fingerpicking piece inspired by early mornings in Nairobi. Clean tone, no effects.' },
  { name: 'Demo - Untitled 003.mp3', size: '5.1 MB', date: '2026-01-28', description: 'Work in progress. Piano, bass, and a beat that is almost there but not quite.' },
  { name: 'Guitar Loop - Am7 Progression.mp3', size: '2.1 MB', date: '2025-12-15', description: 'Simple chord loop I made for sampling. Am7, Dm9, G, Cmaj7.' },
  { name: 'First Piano Recording.mp3', size: '3.4 MB', date: '2025-10-20', description: 'First thing I recorded when I got the keyboard. Rough but honest.' },
]

// Fallback "Current Rotation" albums shown when no Spotify playlist is linked.
const ROTATION = [
  { artist: 'Kendrick Lamar', album: 'GNX', year: '2025' },
  { artist: 'J. Cole', album: 'The Fall Off', year: '2025' },
  { artist: 'Tyler, the Creator', album: 'CHROMAKOPIA', year: '2025' },
  { artist: 'Burna Boy', album: 'I Told Them', year: '2024' },
  { artist: 'Wizkid', album: 'Morayo', year: '2024' },
  { artist: 'Sauti Sol', album: 'Midnight Train', year: '2020' },
  { artist: 'Daniel Caesar', album: 'Never Enough', year: '2023' },
  { artist: 'Mac Miller', album: 'Circles', year: '2020' },
  { artist: 'Khruangbin', album: 'A La Sala', year: '2024' },
]

// ── Official embed URL builders (no API keys needed) ──
// SoundCloud HTML5 widget. Always pass a PLAYLIST/set URL so it auto-syncs.
function soundcloudWidget(url) {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}` +
    '&color=%233D2B1F&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true'
}
// Spotify embed. NOTE: there is no public embed for "recently played" — that
// needs the Spotify Web API + OAuth (deferred). Playlist embeds auto-sync.
function spotifyEmbed(url) {
  const m = (url || '').match(/(playlist|album|track)\/([A-Za-z0-9]+)/)
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator` : null
}

const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms'

function openCustomize() {
  window.dispatchEvent(new CustomEvent('ericOS:openApp', { detail: 'customize' }))
}

function EmptyState({ kind, isOwner }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-text-secondary)', fontFamily: '"Courier Prime", monospace', padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 30 }}>{kind === 'soundcloud' ? '☁️' : '🎧'}</div>
      {isOwner
        ? <>
            <div>No {kind === 'soundcloud' ? 'SoundCloud' : 'Spotify'} playlist linked yet.</div>
            <button onClick={openCustomize} style={{ padding: '5px 12px', border: 'none', cursor: 'pointer', background: 'var(--color-accent)', color: '#000', fontWeight: 'bold', fontFamily: 'inherit', fontSize: 12 }}>Add it in Customize</button>
          </>
        : <div style={{ fontSize: 12 }}>Nothing here yet.</div>}
    </div>
  )
}

// ── My Music → SoundCloud, wrapped in Napster (P2P client) chrome ──
function NapsterPlayer({ url, isOwner }) {
  if (!url) return <EmptyState kind="soundcloud" isOwner={isOwner} />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-surface)', fontFamily: 'Tahoma, "Courier Prime", monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: 'var(--color-titlebar-active)', color: 'var(--color-titlebar-text)', fontWeight: 'bold', fontSize: 12 }}>
        <span>🐱‍👤 Napster</span>
        <span style={{ opacity: 0.8, fontWeight: 'normal' }}>— My Music (shared via SoundCloud)</span>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '4px 10px', fontSize: 11, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-bevel-dark)' }}>
        <span>Library</span><span>Search</span><span>Hot List</span><span>Transfers</span>
      </div>
      <div style={{ flex: 1, padding: 8, overflow: 'auto', background: 'var(--color-desktop-bg)' }}>
        <iframe
          title="SoundCloud"
          width="100%" height="100%"
          style={{ border: '1px solid var(--color-bevel-dark)', minHeight: 320 }}
          allow="autoplay"
          sandbox={IFRAME_SANDBOX}
          src={soundcloudWidget(url)}
        />
      </div>
      <div style={{ padding: '3px 10px', fontSize: 10, color: 'var(--color-text-disabled)', borderTop: '1px solid var(--color-bevel-dark)' }}>
        Connected to ChemNet P2P · sharing my catalogue
      </div>
    </div>
  )
}

// ── Current Rotation → Spotify, wrapped in iTunes chrome (falls back to the
// curated album list when no playlist is linked) ──
function ItunesPlayer({ url, isOwner }) {
  const embed = spotifyEmbed(url)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-surface)', fontFamily: 'Tahoma, "Courier Prime", monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: 'var(--color-titlebar-active)', color: 'var(--color-titlebar-text)', fontWeight: 'bold', fontSize: 12 }}>
        <span>🎵 iTunes</span>
        <span style={{ opacity: 0.8, fontWeight: 'normal' }}>— Current Rotation</span>
      </div>
      {/* Column header */}
      <div style={{ display: 'flex', padding: '3px 10px', fontSize: 11, fontWeight: 'bold', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-bevel-dark)', background: 'var(--color-titlebar-inactive)' }}>
        <span style={{ flex: 2 }}>Name</span><span style={{ flex: 1 }}>Artist</span><span style={{ flex: 1 }}>Album</span><span style={{ width: 44, textAlign: 'right' }}>Time</span>
      </div>
      {embed ? (
        <div style={{ flex: 1, padding: 8, overflow: 'auto', background: 'var(--color-desktop-bg)' }}>
          <iframe
            title="Spotify"
            src={embed}
            width="100%" height="100%"
            style={{ border: 'none', borderRadius: 8, minHeight: 360 }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            sandbox={IFRAME_SANDBOX}
            loading="lazy"
          />
        </div>
      ) : isOwner ? (
        <EmptyState kind="spotify" isOwner />
      ) : (
        // Visitor fallback: the curated album list in an iTunes row style.
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--color-desktop-bg)' }}>
          {ROTATION.map((a, i) => (
            <div key={i} style={{ display: 'flex', padding: '5px 10px', fontSize: 12, color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-bevel-dark)', background: i % 2 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
              <span style={{ flex: 2 }}>♫ {a.album}</span><span style={{ flex: 1 }}>{a.artist}</span><span style={{ flex: 1 }}>{a.year}</span><span style={{ width: 44, textAlign: 'right', color: 'var(--color-text-disabled)' }}>--:--</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '4px 10px', fontSize: 10, color: 'var(--color-text-disabled)', borderTop: '1px solid var(--color-bevel-dark)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{embed ? 'Now playing from Spotify' : `${ROTATION.length} albums`}</span>
        <span>{embed ? 'Premium for full tracks · previews for everyone' : ''}</span>
      </div>
    </div>
  )
}

// ── My Productions (local tracks) ──
function Productions() {
  const [selected, setSelected] = useState(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-desktop-bg)', fontFamily: '"Courier Prime", monospace' }}>
      <div style={{ display: 'flex', padding: '3px 10px', fontSize: 11, fontWeight: 'bold', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-bevel-dark)', background: 'var(--color-titlebar-inactive)' }}>
        <span style={{ flex: 1 }}>Name</span><span style={{ width: 70, textAlign: 'right' }}>Size</span><span style={{ width: 90, textAlign: 'right' }}>Date</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {PRODUCTIONS.map((t, i) => (
          <div key={i} onClick={() => setSelected(selected === i ? null : i)} style={{ padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid var(--color-bevel-dark)', background: selected === i ? 'var(--color-accent)' : 'transparent', color: selected === i ? '#000' : 'var(--color-text-primary)' }}>
            <div style={{ display: 'flex', fontSize: 12 }}>
              <span style={{ flex: 1 }}>🎵 {t.name.replace('.mp3', '')}</span>
              <span style={{ width: 70, textAlign: 'right', opacity: 0.8 }}>{t.size}</span>
              <span style={{ width: 90, textAlign: 'right', opacity: 0.8 }}>{t.date}</span>
            </div>
            {selected === i && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.85, lineHeight: 1.5 }}>{t.description}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

const SEGMENTS = [
  { id: 'productions', label: 'My Productions' },
  { id: 'soundcloud', label: 'My Music' },
  { id: 'spotify', label: 'Current Rotation' },
]

function MusicShell({ scUrl, spUrl, isOwner }) {
  const [seg, setSeg] = useState('productions')
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', color: 'var(--color-text-primary)', fontFamily: '"Courier Prime", "Courier New", monospace' }}>
      <div style={{ display: 'flex', gap: 2, padding: '5px 8px', borderBottom: '1px solid var(--color-bevel-dark)' }}>
        {SEGMENTS.map(s => (
          <button key={s.id} onClick={() => setSeg(s.id)} style={{ padding: '5px 12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, background: seg === s.id ? 'var(--color-accent)' : 'transparent', color: seg === s.id ? '#000' : 'var(--color-text-secondary)' }}>{s.label}</button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {seg === 'productions' && <Productions />}
        {seg === 'soundcloud' && <NapsterPlayer url={scUrl} isOwner={isOwner} />}
        {seg === 'spotify' && <ItunesPlayer url={spUrl} isOwner={isOwner} />}
      </div>
    </div>
  )
}

export default function Music() {
  const { node, isOwner } = useProfile()
  const { config } = useDesktopConfig()
  const scUrl = (node.kind === 'member' ? config?.soundcloud_url : FLAGSHIP_MUSIC.soundcloud) || ''
  const spUrl = (node.kind === 'member' ? config?.spotify_url : FLAGSHIP_MUSIC.spotify) || ''
  return <MusicShell scUrl={scUrl} spUrl={spUrl} isOwner={isOwner} />
}
