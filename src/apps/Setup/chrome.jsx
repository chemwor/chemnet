// Two skins for the setup wizard, fed by ONE set of step definitions in
// Setup.jsx. DesktopWizard = a Windows-95 setup dialog (gray dialog, navy
// title bar, teal side banner, Back / Next > / Cancel). MobileWizard = a
// new-iPhone setup (large titles, page dots, pinned blue Continue + Skip).
// Both are full-screen and use deliberate retro/iOS palette tones.

// ── Windows 95 ─────────────────────────────────────────────────────────────

const WIN = { face: '#C0C0C0', light: '#FFFFFF', shadow: '#808080', dark: '#0A0A0A', navy: '#000080', teal: '#008080' }

function Win95Button({ children, onClick, disabled, primary, wide }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: wide ? 90 : 76, padding: '5px 12px', fontFamily: '"MS Sans Serif", Tahoma, sans-serif', fontSize: 12,
        color: disabled ? WIN.shadow : '#000', background: WIN.face, cursor: disabled ? 'default' : 'pointer',
        border: '2px solid', borderColor: `${WIN.light} ${WIN.dark} ${WIN.dark} ${WIN.light}`,
        boxShadow: primary ? `inset 0 0 0 1px ${WIN.dark}` : 'none', outline: primary ? '1px dotted #000' : 'none',
        outlineOffset: -4, fontWeight: primary ? 700 : 400,
      }}
    >
      {children}
    </button>
  )
}

export function DesktopWizard({ stepIndex, stepCount, title, subtitle, children, onBack, onNext, onSkip, onCancel, nextLabel = 'Next >', nextDisabled, canBack, canSkip, busy, bannerTag, hideNext }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-desktop-bg, #0a0a18)', fontFamily: '"MS Sans Serif", Tahoma, sans-serif' }}>
      <div style={{ width: 560, maxWidth: '94vw', background: WIN.face, border: '2px solid', borderColor: `${WIN.light} ${WIN.dark} ${WIN.dark} ${WIN.light}`, boxShadow: '4px 4px 0 rgba(0,0,0,0.5)' }}>
        {/* title bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: WIN.navy, color: '#fff', padding: '3px 4px 3px 6px' }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>ChemNet Setup</span>
          <button onClick={onCancel} title="Cancel" style={{ width: 18, height: 16, lineHeight: '12px', fontSize: 11, fontWeight: 700, background: WIN.face, color: '#000', border: '2px solid', borderColor: `${WIN.light} ${WIN.dark} ${WIN.dark} ${WIN.light}`, cursor: 'pointer' }}>✕</button>
        </div>

        {/* body: teal banner + content */}
        <div style={{ display: 'flex', minHeight: 320 }}>
          <div style={{ width: 150, background: `linear-gradient(160deg, ${WIN.teal}, #004f4f)`, color: '#fff', padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 30 }}>🛰️</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8, lineHeight: 1.2 }}>Welcome to ChemNet</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 6, lineHeight: 1.4 }}>{bannerTag || 'Your own retro-OS corner of the web.'}</div>
            </div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>{stepCount ? `Step ${stepIndex + 1} of ${stepCount}` : ''}</div>
          </div>

          <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', color: '#000', minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: '#333', marginBottom: 12 }}>{subtitle}</div>}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{children}</div>
          </div>
        </div>

        {/* footer */}
        <div style={{ borderTop: `1px solid ${WIN.shadow}`, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Win95Button onClick={onCancel}>Cancel</Win95Button>
          {canSkip && <Win95Button onClick={onSkip}>Skip</Win95Button>}
          {!hideNext && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Win95Button onClick={onBack} disabled={!canBack}>{'< Back'}</Win95Button>
              <Win95Button onClick={onNext} disabled={nextDisabled} primary wide>{busy ? 'Working…' : nextLabel}</Win95Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── iOS setup ────────────────────────────────────────────────────────────

function Dots({ index, count }) {
  return (
    <div style={{ display: 'flex', gap: 7, justifyContent: 'center', padding: '4px 0 14px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i === index ? 'var(--color-accent, #FF6B35)' : '#3a3a3c', transition: 'background 0.2s' }} />
      ))}
    </div>
  )
}

export function MobileWizard({ stepIndex, stepCount, title, subtitle, children, onNext, onSkip, nextLabel = 'Continue', nextDisabled, canSkip, busy, hideDots, hideNext }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#000', color: '#fff', fontFamily: '-apple-system, "Helvetica Neue", sans-serif' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '64px 24px 16px' }}>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 8 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 16, color: '#98989f', lineHeight: 1.4, marginBottom: 28 }}>{subtitle}</div>}
        {children}
      </div>

      <div style={{ padding: '8px 24px max(24px, env(safe-area-inset-bottom))' }}>
        {!hideDots && !hideNext && <Dots index={stepIndex} count={stepCount} />}
        {!hideNext && (
          <button
            onClick={onNext}
            disabled={nextDisabled}
            style={{ width: '100%', padding: '15px', borderRadius: 13, border: 'none', background: nextDisabled ? '#2a2a2c' : '#0A84FF', color: nextDisabled ? '#6a6a6e' : '#fff', fontSize: 17, fontWeight: 600, fontFamily: 'inherit', cursor: nextDisabled ? 'default' : 'pointer' }}
          >
            {busy ? 'Working…' : nextLabel}
          </button>
        )}
        <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {canSkip && !hideNext
            ? <button onClick={onSkip} style={{ background: 'none', border: 'none', color: '#0A84FF', fontSize: 16, fontFamily: 'inherit', cursor: 'pointer' }}>Skip</button>
            : <span />}
        </div>
      </div>
    </div>
  )
}
