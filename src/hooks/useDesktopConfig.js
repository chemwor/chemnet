import { useState, useEffect } from 'react'
import { useProfile } from '../context/ProfileContext'
import { useRepo } from '../lib/repo/useRepo'

// Loads members.desktop_config for the viewed node (member nodes only).
// Flagship returns null → shells fall back to their default look/layout.
// Re-fetches when the Customize app dispatches `chemnet:config-changed`.
export function useDesktopConfig() {
  const { node } = useProfile()
  const repo = useRepo()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(node.kind === 'member')

  useEffect(() => {
    // node is stable per mount (routes remount when the node changes), so the
    // flagship case needs no synchronous setState — initial state already fits.
    if (node.kind !== 'member') return
    let cancelled = false
    const load = async () => {
      const c = await repo.desktopConfig.get()
      if (!cancelled) { setConfig(c); setLoading(false) }
    }
    load()
    const onChange = () => load()
    window.addEventListener('chemnet:config-changed', onChange)
    return () => { cancelled = true; window.removeEventListener('chemnet:config-changed', onChange) }
  }, [node, repo])

  return { config, loading }
}
