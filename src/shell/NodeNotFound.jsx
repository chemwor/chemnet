// Friendly, desktop-flavored 404 for an unknown / private member node.
export function NodeNotFound({ handle }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-titlebar-active, #0a0a18)', fontFamily: '"Courier Prime", "Courier New", monospace',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 420, width: '100%', background: 'var(--color-surface, #2C2A35)',
        border: '2px solid var(--color-bevel-dark, #000)', boxShadow: '4px 4px 0 rgba(0,0,0,0.4)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
          background: 'var(--color-accent, #FF6B35)', color: '#000', fontWeight: 'bold', fontSize: 13,
        }}>
          <span>⚠</span><span>node_not_found.exe</span>
        </div>
        <div style={{ padding: 20, color: 'var(--color-text-primary, #F0EBE1)', fontSize: 13, lineHeight: 1.6 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🛰️</div>
          <div style={{ fontWeight: 'bold', marginBottom: 6 }}>This node is offline.</div>
          <div style={{ color: 'var(--color-text-secondary, #A09AB0)' }}>
            {handle ? <>No public desktop is registered at <code style={{ color: 'var(--color-accent, #FF6B35)' }}>/u/{handle}</code>.</> : 'That address points nowhere on the network.'}
            {' '}It may have never existed, or it's set to private.
          </div>
          <a href="/" style={{
            display: 'inline-block', marginTop: 16, padding: '6px 14px',
            background: 'var(--color-accent, #FF6B35)', color: '#000', textDecoration: 'none',
            fontWeight: 'bold', fontSize: 12,
          }}>← Back to the hub</a>
        </div>
      </div>
    </div>
  )
}
