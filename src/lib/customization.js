// Shared L2-customization constants: preset wallpapers + the editable theme
// fields. Member uploads are out of scope (Phase 3) — presets only.

// Editable CSS-variable theme fields, with the Warm Slate defaults shown in
// the Customize app as placeholders. `var` is the actual CSS custom property.
export const THEME_FIELDS = [
  { var: '--color-accent', label: 'Accent', def: '#FF6B35' },
  { var: '--color-desktop-bg', label: 'Desktop', def: '#1E1C28' },
  { var: '--color-surface', label: 'Window body', def: '#2C2A35' },
  { var: '--color-titlebar-active', label: 'Titlebar', def: '#3D2B1F' },
  { var: '--color-text-primary', label: 'Text', def: '#F0EBE1' },
  { var: '--color-taskbar-bg', label: 'Taskbar', def: '#221F2E' },
]

// Preset wallpapers — CSS background values (no uploads).
export const WALLPAPERS = [
  { key: 'warm-slate', label: 'Warm Slate', css: 'radial-gradient(circle at 30% 20%, #2a2535, #1E1C28)' },
  { key: 'midnight', label: 'Midnight', css: 'linear-gradient(160deg, #0b1026, #131a3a)' },
  { key: 'sunset', label: 'Sunset', css: 'linear-gradient(160deg, #3a1c1c, #5a2d1a)' },
  { key: 'forest', label: 'Forest', css: 'linear-gradient(160deg, #11241b, #0a160f)' },
  { key: 'orchid', label: 'Orchid', css: 'linear-gradient(160deg, #3a1f3a, #20122a)' },
  { key: 'mono', label: 'Mono', css: '#161616' },
]

export function wallpaperCss(key) {
  // A custom uploaded wallpaper is stored as a URL; render it as a cover image.
  if (key && /^https?:\/\//.test(key)) return `url("${key}") center / cover no-repeat`
  return (WALLPAPERS.find(w => w.key === key) || WALLPAPERS[0]).css
}

// Convert a saved theme object ({ '--color-accent': '#..' }) into an inline
// style object React can spread onto the desktop root.
export function themeStyle(theme) {
  if (!theme) return {}
  const out = {}
  for (const f of THEME_FIELDS) {
    if (theme[f.var]) out[f.var] = theme[f.var]
  }
  return out
}
