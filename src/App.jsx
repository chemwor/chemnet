import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useWindowManager } from './hooks/useWindowManager'
import { DesktopShell } from './shell/DesktopShell'
import { MobileShell } from './shell/MobileShell'
import { NodeNotFound } from './shell/NodeNotFound'
import { ProfileProvider } from './context/ProfileProvider'
import { useAuth } from './hooks/useAuth'
import Signup from './apps/Signup/Signup'
import { supabase } from './lib/supabase'
import './App.css'

// The shells are unchanged structurally — they read node/repo from context.
// A fresh window manager per node means navigating between nodes starts clean.
function Shells() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const windowManager = useWindowManager()
  return isMobile
    ? <MobileShell windowManager={windowManager} />
    : <DesktopShell windowManager={windowManager} />
}

// `/` — Eric's flagship hub node. Renders the current site, unchanged.
function FlagshipNode() {
  return (
    <ProfileProvider node={{ kind: 'flagship' }}>
      <Shells />
    </ProfileProvider>
  )
}

function NodeLoading() {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-titlebar-active, #0a0a18)', color: 'var(--color-text-secondary, #A09AB0)',
      fontFamily: '"Courier Prime", "Courier New", monospace', fontSize: 13,
    }}>
      Connecting to node…
    </div>
  )
}

// `/u/:handle` — resolve the handle to a member node, or show a friendly 404.
function MemberNode() {
  const { handle } = useParams()
  const [state, setState] = useState({ status: 'loading', node: null })

  useEffect(() => {
    let cancelled = false
    async function resolve() {
      setState({ status: 'loading', node: null })
      // RLS only returns a profile that is public OR owned by the viewer,
      // so a private profile naturally resolves to "not found" for others.
      const { data } = await supabase
        .schema('platform')
        .from('profiles')
        .select('id, handle, is_public')
        .eq('handle', handle)
        .maybeSingle()

      if (cancelled) return
      if (!data) { setState({ status: 'notfound', node: null }); return }

      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!data.is_public && data.id !== user?.id) {
        setState({ status: 'notfound', node: null })
        return
      }
      setState({ status: 'ok', node: { kind: 'member', userId: data.id, handle: data.handle } })
    }
    resolve()
    return () => { cancelled = true }
  }, [handle])

  if (state.status === 'loading') return <NodeLoading />
  if (state.status === 'notfound') return <NodeNotFound handle={handle} />

  return (
    <ProfileProvider node={state.node}>
      <Shells />
    </ProfileProvider>
  )
}

// `/me` — redirect to the signed-in user's node, else the hub.
function MeRedirect() {
  const { user, profile, loading } = useAuth()

  if (loading) return <NodeLoading />
  if (!user) return <Navigate to="/" replace />
  if (profile?.handle) return <Navigate to={`/u/${profile.handle}`} replace />
  // Signed in but no node yet → claim a handle (the Signup app's claim screen).
  return <Signup />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FlagshipNode />} />
        <Route path="/u/:handle" element={<MemberNode />} />
        <Route path="/me" element={<MeRedirect />} />
        <Route path="*" element={<NodeNotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
