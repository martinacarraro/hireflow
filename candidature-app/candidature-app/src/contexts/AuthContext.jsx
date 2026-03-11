import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(() => !!localStorage.getItem('lfs_guest_mode'))

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Se siamo in modalità guest, ignoriamo la sessione Supabase
      if (localStorage.getItem('lfs_guest_mode')) {
        setUser(null)
        setLoading(false)
        return
      }
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (localStorage.getItem('lfs_guest_mode')) return // ignora se siamo guest
      setUser(session?.user ?? null)
      if (session?.user) {
        setIsGuest(false)
        localStorage.removeItem('lfs_guest_mode')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUpWithEmail = (email, password) =>
    supabase.auth.signUp({ email, password })

  const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })

  const convertGuestToAccount = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }
    return { data }
  }

  const signOut = async () => {
    setIsGuest(false)
    localStorage.removeItem('lfs_guest_mode')
    await supabase.auth.signOut()
    setUser(null)
  }

  const enterAsGuest = async () => {
    // Fai signOut da Supabase prima, così non ci sono dati residui
    await supabase.auth.signOut()
    setUser(null)
    localStorage.setItem('lfs_guest_mode', '1')
    setIsGuest(true)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, signInWithEmail, signUpWithEmail, signOut, enterAsGuest, convertGuestToAccount, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)