import { useMemo } from 'react'
import { APP_REGISTRY } from '../apps/registry'
import { useProfile } from '../context/ProfileContext'
import { useDesktopConfig } from '../hooks/useDesktopConfig'
import { themeStyle, wallpaperCss } from '../lib/customization'

// Node-kind scoping (orthogonal to visibility):
//   flagshipOnly → only on `/`        (Directory)
//   memberOnly   → only on /u/:handle (Profile, Customize)
function nodeKindOk(app, node) {
  if (app.flagshipOnly && node.kind !== 'flagship') return false
  if (app.memberOnly && node.kind !== 'member') return false
  return true
}

// Owner-aware icon visibility (Phase 4). Apps default to 'public' when no
// `visibility` is set.
//   public → any visitor
//   authed → viewer is logged in (content stays RLS-scoped)
//   owner  → viewer owns this node (member owner, or Eric on the flagship)
//   guest  → viewer is logged out OR has no node yet; hidden on your own node
//   hidden → never in menus (admin)
function visibilityOk(app, { isOwner, isAuthed, hasNode }) {
  switch (app.visibility || 'public') {
    case 'public': return true
    case 'authed': return isAuthed
    case 'owner': return isOwner
    case 'guest': return !isAuthed || !hasNode
    case 'hidden': return false
    default: return true
  }
}

// Comms/identity apps that should always be present regardless of a member's
// saved `enabled_apps` (which only ever curated the content apps).
const ALWAYS_ON = new Set(['about', 'terminal', 'guestbook', 'email', 'messageboard', 'profile'])

// The node-scoped app list: node-kind + visibility filtered, then (on member
// nodes with a saved desktop_config) the *content* apps are restricted to
// `enabled_apps` and ordered by `app_order`. Platform/comms apps always show.
function resolveApps(node, ctx, config) {
  let apps = APP_REGISTRY.filter(a => nodeKindOk(a, node) && visibilityOk(a, ctx))

  if (node.kind === 'member' && config?.enabled_apps?.length) {
    const enabled = new Set(config.enabled_apps)
    apps = apps.filter(a =>
      (a.visibility && a.visibility !== 'public') ||  // authed/owner/guest always show
      ALWAYS_ON.has(a.id) || a.openOnBoot || enabled.has(a.id),
    )
    const order = config.app_order?.length ? config.app_order : config.enabled_apps
    apps = [...apps].sort((a, b) => {
      const ia = order.indexOf(a.id), ib = order.indexOf(b.id)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
  }
  return apps
}

// One hook the shells use instead of importing APP_REGISTRY directly. Gives
// the node-scoped apps, per-node relabeling, and the theme/wallpaper to apply.
export function useNodeView() {
  const { node, isOwner, isAuthed, hasNode } = useProfile()
  const { config } = useDesktopConfig()

  const ctx = { isOwner, isAuthed, hasNode }
  const apps = useMemo(
    () => resolveApps(node, ctx, config),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node, isOwner, isAuthed, hasNode, config],
  )

  const labelFor = (app) =>
    (node.kind === 'member' && config?.app_labels?.[app.id]) || app.label

  const isMember = node.kind === 'member'
  const themeVars = isMember ? themeStyle(config?.theme) : {}
  const wallpaper = isMember ? wallpaperCss(config?.wallpaper || 'warm-slate') : null

  return { node, isOwner, config, apps, labelFor, themeVars, wallpaper }
}
