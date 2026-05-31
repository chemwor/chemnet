import { useState, useEffect, useCallback } from 'react'
import { useRepo } from '../lib/repo/useRepo'
import { useProfile } from '../context/ProfileContext'

// Taskbar tray bell with an unread-count badge. Polls on mount + lightly on an
// interval, and refreshes when an app marks notifications read. (Realtime is a
// deferred enhancement.)
export function NotificationBell({ onOpen }) {
  const repo = useRepo()
  const { currentUser } = useProfile()
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!currentUser) { setCount(0); return }
    setCount(await repo.social.notifications.unreadCount())
  }, [repo, currentUser])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
    const id = setInterval(refresh, 45000)
    const onRead = () => refresh()
    window.addEventListener('chemnet:notifications-read', onRead)
    return () => { clearInterval(id); window.removeEventListener('chemnet:notifications-read', onRead) }
  }, [refresh])

  if (!currentUser) return null

  return (
    <button
      onClick={onOpen}
      title="Notifications"
      className="px-2 py-1 border-l cursor-pointer"
      style={{ background: 'transparent', borderColor: 'var(--color-taskbar-border)', position: 'relative', fontSize: 14 }}
    >
      🔔
      {count > 0 && (
        <span style={{
          position: 'absolute', top: 0, right: 0, minWidth: 14, height: 14, padding: '0 3px',
          borderRadius: 7, background: 'var(--color-accent)', color: '#000', fontSize: 9, fontWeight: 'bold',
          display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
        }}>{count > 9 ? '9+' : count}</span>
      )}
    </button>
  )
}
