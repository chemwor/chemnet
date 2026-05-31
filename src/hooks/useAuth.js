import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profile, setProfile] = useState(null)   // platform.profiles row for this user (member node)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      hydrate(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrate(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function hydrate(u) {
    setUser(u)
    if (!u) { setIsAdmin(false); setProfile(null); setLoading(false); return }
    await Promise.all([checkAdmin(u.email), loadProfile(u.id)])
    setLoading(false)
  }

  async function checkAdmin(email) {
    const { data } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email)
      .single()
    setIsAdmin(!!data)
  }

  async function loadProfile(uid) {
    const { data } = await supabase
      .schema('platform')
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()
    setProfile(data || null)
    return data || null
  }

  // After auth we land on /me, which routes to the user's node (or handle-claim).
  const authRedirect = () => `${window.location.origin}/me`

  async function loginWithMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: authRedirect() },
    })
    return { error }
  }

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirect() },
    })
    return { error }
  }

  // Claim a handle → provision a member node via the Edge Function.
  // Returns { handle } on success or { error: { message } } with a code
  // ('handle_taken' | 'invalid_handle' | 'provision_failed' | …).
  async function claimHandle(handle) {
    const { data, error } = await supabase.functions.invoke('provision_user', {
      body: { handle: String(handle || '').trim().toLowerCase() },
    })
    if (error) {
      let code = 'provision_failed'
      try { const b = await error.context.json(); code = b?.error || code } catch { /* ignore */ }
      return { error: { message: code } }
    }
    if (data?.error) return { error: { message: data.error } }
    if (user) await loadProfile(user.id)
    return { handle: data?.handle }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setProfile(null)
  }

  // Logged in but hasn't claimed a node yet → drives the handle-claim screen.
  const needsHandle = !loading && !!user && !profile

  return { user, isAdmin, profile, needsHandle, loading, loginWithMagicLink, loginWithGoogle, claimHandle, logout }
}
