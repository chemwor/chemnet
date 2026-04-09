export function DesktopIcon({ app, onOpen }) {
  return (
    <button
      className="flex flex-col items-center gap-1 p-2 rounded cursor-pointer
                 hover:bg-black/5 transition-colors w-20 border-none bg-transparent"
      onDoubleClick={() => onOpen(app.id)}
      title={app.label}
    >
      <span className="text-3xl select-none">{app.icon}</span>
      <span
        className="text-xs text-center leading-tight break-words w-full"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {app.label}
      </span>
    </button>
  )
}
