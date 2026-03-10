import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) setIsGuest(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithEmail = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUpWithEmail = (email, password) =>
    supabase.auth.signUp({ email, password })

  const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })

  const convertGuestToAccount = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }
    // onAuthStateChange will set user and isGuest=false automatically
    return { data }
  }

  const signOut = async () => {
    setIsGuest(false)
    await supabase.auth.signOut()
  }

  const enterAsGuest = () => {
    setIsGuest(true)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, signInWithEmail, signUpWithEmail, signOut, enterAsGuest, convertGuestToAccount, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)