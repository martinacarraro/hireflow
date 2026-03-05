import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/UI'

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [mode, setMode] = useState('main') // main | email
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEmail = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const fn = isSignUp ? signUpWithEmail : signInWithEmail
      const { error: err } = await fn(email, password)
      if (err) setError(err.message)
    } catch { setError('Errore di connessione.') }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setLoading(true)
    await signInWithGoogle()
    setLoading(false)
  }

  if (mode === 'email') {
    return (
      <div className="screen items-center justify-center purple-glow-bg relative px-6">
        <div className="relative z-10 w-full max-w-sm">
          <button onClick={() => setMode('main')} className="text-muted text-sm mb-6 flex items-center gap-1">
            ← Indietro
          </button>
          <h2 className="text-2xl font-bold text-txt mb-1">
            {isSignUp ? 'Crea account 🚀' : 'Bentornata! 👋'}
          </h2>
          <p className="text-sm text-muted mb-8">
            {isSignUp ? 'Gratis. Per sempre. I tuoi dati privati.' : 'Accedi al tuo tracker.'}
          </p>

          <form onSubmit={handleEmail} className="space-y-4">
            <input className="input-field" type="email" placeholder="La tua email"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="input-field" type="password" placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="text-red text-xs">{error}</p>}
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <Spinner size={18} /> : (isSignUp ? 'Crea account' : 'Accedi')}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            {isSignUp ? 'Hai già un account?' : 'Prima volta qui?'}{' '}
            <button onClick={() => setIsSignUp(v => !v)} className="text-purple-soft font-medium">
              {isSignUp ? 'Accedi' : 'Registrati'}
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen items-center justify-center purple-glow-bg relative px-6">
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div className="text-7xl mb-4">🚀</div>
        <h1 className="text-3xl font-bold text-txt tracking-tight mb-2 text-center">
          Le mie Candidature
        </h1>
        <p className="text-base text-muted italic text-center mb-8 leading-relaxed">
          Il job tracker che ti capisce davvero.
        </p>

        {/* Feature pills */}
        <div className="flex gap-2 flex-wrap justify-center mb-10">
          {['🎯 Traccia tutto', '🔔 Notifiche smart', '🏆 Gamificato'].map(f => (
            <span key={f} className="text-xs px-3 py-1.5 rounded-full bg-surface border border-border text-purple-soft">
              {f}
            </span>
          ))}
        </div>

        <div className="w-full space-y-3">
          <button onClick={handleGoogle} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-3 text-base">
            {loading ? <Spinner size={20} /> : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Accedi con Google
              </>
            )}
          </button>

          <button onClick={() => setMode('email')} className="btn-secondary w-full">
            Accedi con Email
          </button>
        </div>

        <p className="text-xs text-disabled text-center mt-8 leading-relaxed px-4">
          🔒 Account gratuito. I tuoi dati sono privati e visibili solo a te.
        </p>
      </div>
    </div>
  )
}
