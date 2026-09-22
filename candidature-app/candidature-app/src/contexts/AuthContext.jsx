import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isGuest, setIsGuest] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem('lfs_guest_mode', '1')
  }, [])

  const enterAsGuest = async () => {
    localStorage.setItem('lfs_guest_mode', '1')
    setIsGuest(true)
  }

  const signOut = async () => {
    // Modalità solo locale: non esiste un account da disconnettere.
  }

  return (
    <AuthContext.Provider value={{
      user: null,
      loading,
      isGuest,
      signOut,
      enterAsGuest,
      signInWithEmail: async () => ({ error: new Error('Account disabilitati') }),
      signUpWithEmail: async () => ({ error: new Error('Account disabilitati') }),
      resetPassword: async () => ({ error: new Error('Account disabilitati') }),
      convertGuestToAccount: async () => ({ error: new Error('Account disabilitati') }),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
