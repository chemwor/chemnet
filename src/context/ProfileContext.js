import { createContext, useContext } from 'react'

// The node currently being viewed, plus whether the viewer owns it.
//   node = { kind: 'flagship' }
//        | { kind: 'member', userId, handle }
//   isOwner = Eric (admin) on the flagship hub, or the profile owner on /u/:handle
//
// Apps never receive this as props — they pull the resolved repo via useRepo(),
// and edit affordances read isOwner via useProfile(). The provider lives in
// ProfileProvider.jsx (kept separate so this module exports no component —
// keeps react-refresh happy).
const DEFAULT = { node: { kind: 'flagship' }, isOwner: false, currentUser: null, isAdmin: false, isAuthed: false, hasNode: false }

export const ProfileContext = createContext(DEFAULT)

export function useProfile() {
  return useContext(ProfileContext)
}
