import { useContext, useMemo } from 'react'
import { ProfileContext } from '../../context/ProfileContext'
import { flagshipRepo } from './flagshipRepo'
import { memberRepo } from './memberRepo'
import type { Repo } from './types'

// Resolve the data source for the node currently being viewed.
//   flagship → Eric's public.* tables (flagshipRepo)
//   member   → members.* filtered by user_id (memberRepo)
export function useRepo(): Repo {
  const { node } = useContext(ProfileContext)
  return useMemo(
    () => (node.kind === 'member' ? memberRepo(node.userId) : flagshipRepo),
    [node.kind, node.userId],
  )
}
