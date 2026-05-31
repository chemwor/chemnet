import { useState, useEffect } from 'react'
import { APP_REGISTRY } from '../registry'
import { useRepo } from '../../lib/repo/useRepo'
import { THEME_FIELDS, WALLPAPERS } from '../../lib/customization'
import { UploadButton } from '../_shared/UploadButton'

// Apps a member can toggle/reorder/rename. Excludes admin (auth), the signup
// CTA (flagship-only), owner tools (Customize itself), and boot-only apps.
const MANAGEABLE = APP_REGISTRY.filter(
  a => !a.auth && !a.flagshipOnly && !a.ownerOnly && !a.hideFromDesktop,
)

const label = { color: 'var(--color-text-secondary)', fontSize: 11 }
const field = {
  background: 'var(--color-desktop-bg)', color: 'var(--color-text-primary)',
  border: '1px solid var(--color-bevel-dark)', outline: 'none', fontFamily: 'inherit', fontSize: 12,
  padding: '4px 6px',
}
const tabBtn = (active) => ({
  padding: '4px 10px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
  background: active ? 'var(--color-accent)' : 'transparent', color: active ? '#000' : 'var(--color-text-secondary)',
})

export default function Customize() {
  const repo = useRepo()
  const [tab, setTab] = useState('theme')
  const [theme, setTheme] = useState({})
  const [wallpaper, setWallpaper] = useState('warm-slate')
  const [enabled, setEnabled] = useState([])      // ordered list of app ids
  const [labels, setLabels] = useState({})
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    repo.desktopConfig.get().then(c => {
      if (cancelled) return
      setTheme(c?.theme || {})
      setWallpaper(c?.wallpaper || 'warm-slate')
      const order = c?.app_order?.length ? c.app_order : (c?.enabled_apps || [])
      setEnabled(order.filter(id => MANAGEABLE.some(a => a.id === id)))
      setLabels(c?.app_labels || {})
      setLoading(false)
    })
  }, [repo])

  const isEnabled = (id) => enabled.includes(id)
  const toggle = (id) => setEnabled(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const move = (id, dir) => setEnabled(prev => {
    const i = prev.indexOf(id); const j = i + dir
    if (i < 0 || j < 0 || j >= prev.length) return prev
    const next = [...prev]; [next[i], next[j]] = [next[j], next[i]]; return next
  })

  async function save() {
    setMsg('')
    const config = {
      theme,
      wallpaper,
      enabled_apps: enabled,
      app_order: enabled,
      app_labels: labels,
    }
    const res = await repo.desktopConfig.upsert(config)
    if (!res) { setMsg('Error saving — are you the owner of this node?'); return }
    setMsg('Saved! Your desktop updated.')
    // Tell the shells (and this node's other windows) to re-read the config.
    window.dispatchEvent(new CustomEvent('chemnet:config-changed'))
  }

  if (loading) {
    return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>Loading…</div>
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)', fontFamily: '"Courier Prime", "Courier New", monospace', color: 'var(--color-text-primary)' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--color-bevel-dark)' }}>
        <button style={tabBtn(tab === 'theme')} onClick={() => setTab('theme')}>🎨 Theme</button>
        <button style={tabBtn(tab === 'wallpaper')} onClick={() => setTab('wallpaper')}>🖼 Wallpaper</button>
        <button style={tabBtn(tab === 'apps')} onClick={() => setTab('apps')}>📱 Apps</button>
        <button onClick={save} style={{ ...tabBtn(false), marginLeft: 'auto', background: '#4ADE80', color: '#000', fontWeight: 'bold' }}>Save</button>
      </div>

      {msg && <div style={{ padding: '4px 10px', fontSize: 11, color: msg.startsWith('Error') ? '#FF5555' : '#4ADE80' }}>{msg}</div>}

      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {tab === 'theme' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8, borderBottom: '1px solid var(--color-bevel-dark)' }}>
              <span style={{ ...label, width: 110 }}>Avatar</span>
              <UploadButton bucket="avatars" label="Upload avatar" onUploaded={async (url) => { await repo.social.updateMyProfile({ avatar_url: url }); setMsg('Avatar updated.') }} />
            </div>
            <div style={{ ...label, marginBottom: 2 }}>Pick colors for your desktop. Leave blank to keep the Warm Slate default.</div>
            {THEME_FIELDS.map(f => (
              <div key={f.var} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ ...label, width: 110 }}>{f.label}</span>
                <input
                  type="color"
                  value={theme[f.var] || f.def}
                  onChange={e => setTheme({ ...theme, [f.var]: e.target.value })}
                  style={{ width: 40, height: 26, padding: 0, border: '1px solid var(--color-bevel-dark)', background: 'none', cursor: 'pointer' }}
                />
                <input
                  value={theme[f.var] || ''}
                  onChange={e => setTheme({ ...theme, [f.var]: e.target.value })}
                  placeholder={f.def}
                  style={{ ...field, width: 100 }}
                />
                {theme[f.var] && (
                  <button onClick={() => { const t = { ...theme }; delete t[f.var]; setTheme(t) }} style={{ ...label, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>reset</button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'wallpaper' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <UploadButton bucket="wallpapers" label="Upload custom" onUploaded={(url) => setWallpaper(url)} />
              {/^https?:\/\//.test(wallpaper) && <span style={{ ...label, color: 'var(--color-accent)' }}>Custom wallpaper selected — Save to apply.</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
            {WALLPAPERS.map(w => (
              <div
                key={w.key}
                onClick={() => setWallpaper(w.key)}
                style={{ cursor: 'pointer', border: wallpaper === w.key ? '2px solid var(--color-accent)' : '2px solid var(--color-bevel-dark)', padding: 3 }}
              >
                <div style={{ height: 64, background: w.css }} />
                <div style={{ ...label, textAlign: 'center', marginTop: 4 }}>{w.label}</div>
              </div>
            ))}
            </div>
          </div>
        )}

        {tab === 'apps' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ ...label, marginBottom: 4 }}>Toggle which apps appear, reorder them, and rename them.</div>
            {/* Enabled (ordered) first */}
            {enabled.map(id => {
              const app = MANAGEABLE.find(a => a.id === id)
              if (!app) return null
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', background: 'var(--color-titlebar-inactive)' }}>
                  <input type="checkbox" checked readOnly onChange={() => toggle(id)} style={{ cursor: 'pointer' }} onClick={() => toggle(id)} />
                  <input
                    value={labels[id] ?? ''}
                    onChange={e => setLabels({ ...labels, [id]: e.target.value })}
                    placeholder={app.label}
                    style={{ ...field, flex: 1 }}
                  />
                  <button onClick={() => move(id, -1)} style={{ ...label, background: 'none', border: 'none', cursor: 'pointer' }}>▲</button>
                  <button onClick={() => move(id, 1)} style={{ ...label, background: 'none', border: 'none', cursor: 'pointer' }}>▼</button>
                </div>
              )
            })}
            {/* Disabled apps */}
            {MANAGEABLE.filter(a => !isEnabled(a.id)).length > 0 && (
              <div style={{ ...label, marginTop: 8, marginBottom: 2 }}>Disabled</div>
            )}
            {MANAGEABLE.filter(a => !isEnabled(a.id)).map(app => (
              <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', opacity: 0.6 }}>
                <input type="checkbox" checked={false} onChange={() => toggle(app.id)} style={{ cursor: 'pointer' }} />
                <span style={{ flex: 1, fontSize: 12 }}>{app.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
