export function DesktopIcon({ app, onOpen }) {
  return (
    <button
      className="flex flex-col items-center gap-1 p-2 rounded cursor-pointer
                 hover:bg-white/10 transition-colors w-20 border-none bg-transparent"
      onDoubleClick={() => onOpen(app.id)}
      title={app.label}
    >
      <span className="text-3xl select-none">{app.icon}</span>
      <span
        className="text-xs text-center leading-tight break-words w-full"
        style={{ color: 'var(--color-text-primary)', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
      >
        {app.label}
      </span>
    </button>
  )
}
