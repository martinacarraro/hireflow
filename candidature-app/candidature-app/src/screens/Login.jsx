import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/UI'

export default function Login() {
  const { signInWithEmail, signUpWithEmail } = useAuth()
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
    <div className="screen items-center justify-center purple-glow-bg relative px-6">
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

        <div className="flex gap-2 flex-wrap justify-center mb-10">
          {['🎯 Traccia tutto', '🔔 Notifiche smart', '🏆 Gamificato'].map(f => (
            <span key={f} className="text-xs px-3 py-1.5 rounded-full bg-surface border border-border text-purple-soft">
              {f}
            </span>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-txt mb-1 w-full">
          {isSignUp ? 'Crea account 🚀' : 'Bentornata! 👋'}
        </h2>
        <p className="text-sm text-muted mb-6 w-full">
          {isSignUp ? 'Gratis. Per sempre. I tuoi dati privati.' : 'Accedi al tuo tracker.'}
        </p>

        <form onSubmit={handleEmail} className="space-y-4 w-full">
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

        <p className="text-xs text-disabled text-center mt-8 leading-relaxed px-4">
          🔒 Account gratuito. I tuoi dati sono privati e visibili solo a te.
        </p>
      </div>
    </div>
  )
}
