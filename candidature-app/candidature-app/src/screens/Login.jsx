import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/UI'

export default function Login() {
  const { signInWithEmail, signUpWithEmail, enterAsGuest } = useAuth()
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

  return (
    <div className="screen purple-glow-bg relative overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-6 py-8">
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <div className="mb-3 mt-2">
            <svg width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="14" fill="#1A1A2E"/>
              <polygon points="38,6 18,36 30,36 26,58 46,28 34,28" fill="#34D399"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-txt tracking-tight mb-1 text-center">Hireflow</h1>
          <p className="text-sm text-muted italic text-center mb-6 leading-relaxed">
            Il job tracker che ti capisce davvero.
          </p>

          <div className="flex gap-2 flex-wrap justify-center mb-6">
            {['🎯 Traccia tutto', '🔔 Notifiche smart', '🏆 Gamificato'].map(f => (
              <span key={f} className="text-xs px-3 py-1.5 rounded-full bg-surface border border-border text-purple-soft">
                {f}
              </span>
            ))}
          </div>

          <h2 className="text-xl font-bold text-txt mb-1 w-full">
            {isSignUp ? 'Crea account 🚀' : 'Ciao! 👋'}
          </h2>
          <p className="text-sm text-muted mb-4 w-full">
            {isSignUp ? 'Gratis. Per sempre. I tuoi dati privati.' : 'Accedi al tuo tracker.'}
          </p>

          <form onSubmit={handleEmail} className="space-y-3 w-full">
            <input className="input-field" type="email" placeholder="La tua email"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="input-field" type="password" placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="text-red text-xs">{error}</p>}
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <Spinner size={18} /> : (isSignUp ? 'Crea account' : 'Accedi')}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-3">
            {isSignUp ? 'Hai già un account?' : 'Prima volta qui?'}{' '}
            <button onClick={() => setIsSignUp(v => !v)} className="text-purple-soft font-medium">
              {isSignUp ? 'Accedi' : 'Registrati'}
            </button>
          </p>

          <div className="flex items-center gap-3 w-full my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-disabled">oppure</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button onClick={enterAsGuest}
            className="w-full border border-border text-muted rounded-2xl py-3 text-sm font-medium active:scale-95 transition-all">
            👀 Entra come ospite
          </button>
          <p className="text-[11px] text-disabled text-center mt-2 leading-relaxed px-2">
            ⚠️ In modalità ospite i dati non vengono salvati.
          </p>

          <p className="text-xs text-disabled text-center mt-4 leading-relaxed px-4 pb-4">
            🔒 Account gratuito. I tuoi dati sono privati e visibili solo a te.
          </p>
        </div>
      </div>
    </div>
  )
}
