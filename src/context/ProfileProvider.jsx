import { useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ProfileContext } from './ProfileContext'

// Wraps the shells for a given node, computing whether the viewer owns it.
export function ProfileProvider({ node, children }) {
  const { user, isAdmin, profile } = useAuth()

  const isOwner = node.kind === 'flagship'
    ? isAdmin
    : (!!user && user.id === node.userId)

  const isAuthed = !!user
  // The current user has a node: a claimed member profile, or the hub (admin).
  const hasNode = !!profile || isAdmin

  const value = useMemo(
    () => ({ node, isOwner, currentUser: user, isAdmin, isAuthed, hasNode }),
    [node, isOwner, user, isAdmin, isAuthed, hasNode],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
