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
    if (loading) return
    setLoading(true); setError('')
    try {
      const fn = isSignUp ? signUpWithEmail : signInWithEmail
      const { error: err, data } = await fn(email, password)
      if (err) {
        // Traduci errori comuni in italiano
        const msg = err.message
        if (msg.includes('Invalid login')) setError('Email o password errati.')
        else if (msg.includes('already registered')) setError('Email già registrata — prova ad accedere.')
        else if (msg.includes('Password should')) setError('La password deve essere di almeno 6 caratteri.')
        else setError(msg)
      } else if (isSignUp) {
        // Signup ok — passa direttamente al login
        setIsSignUp(false)
        setError('')
      }
    } catch { setError('Errore di connessione — riprova.') }
    setLoading(false)
  }

  // ── SCHERMATA CONFERMA EMAIL ────────────────────────────────
  if (emailSent) return (
    <div className="screen purple-glow-bg relative overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm flex flex-col items-center text-center">
          <div className="text-7xl mb-6">📬</div>
          <h2 className="text-2xl font-bold text-txt mb-3">Controlla la tua email!</h2>
          <p className="text-muted text-sm leading-relaxed mb-2">
            Ti abbiamo inviato un link di conferma a
          </p>
          <p className="text-purple-soft font-semibold text-sm mb-4">{email}</p>
          <div className="card w-full text-left space-y-2 mb-6">
            <p className="text-xs text-muted">1️⃣ Apri la tua casella email</p>
            <p className="text-xs text-muted">2️⃣ Clicca il link <span className="text-purple-soft font-medium">"Confirm your email"</span></p>
            <p className="text-xs text-muted">3️⃣ Torna qui e accedi con le tue credenziali</p>
          </div>
          <p className="text-xs text-disabled mb-6">Non trovi l'email? Controlla nello spam 🗂️</p>
          <button
            onClick={() => { setEmailSent(false); setIsSignUp(false) }}
            className="btn-primary w-full py-3">
            ✅ Ho confermato — Accedi
          </button>
          <button onClick={() => setEmailSent(false)} className="text-xs text-muted mt-3 active:text-txt">
            ← Torna indietro
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="screen purple-glow-bg relative overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-6 py-8">
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">

          {/* Logo corretto */}
          <div className="mb-3 mt-2">
            <img src="/logo.svg" alt="Le faremo sapere" className="w-16 h-16 rounded-2xl" 
              onError={e => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }} />
            <div className="w-16 h-16 rounded-2xl hidden items-center justify-center text-3xl"
              style={{ background: 'linear-gradient(135deg, #7B2FFF, #FF2D8B)' }}>
              👻
            </div>
          </div>

          <h1 className="text-3xl font-bold text-txt tracking-tight mb-1 text-center">Le faremo sapere</h1>
          <p className="text-sm text-muted italic text-center mb-6 leading-relaxed">
            "Le faremo sapere." — E tu tieni il conto.
          </p>

          <div className="flex gap-2 flex-wrap justify-center mb-6">
            {['📬 Zero ghosting', '🔔 Scadenze chiare', '🏆 Gamificato'].map(f => (
              <span key={f} className="text-xs px-3 py-1.5 rounded-full bg-surface border border-border text-purple-soft">
                {f}
              </span>
            ))}
          </div>

          <h2 className="text-xl font-bold text-txt mb-1 w-full">
            {isSignUp ? 'Crea account 🚀' : 'Ciao! 👋'}
          </h2>
          <p className="text-sm text-muted mb-4 w-full">
            {isSignUp ? 'Gratis. Per sempre. I tuoi dati sono privati.' : 'Accedi al tuo tracker.'}
          </p>

          <form onSubmit={handleEmail} className="space-y-3 w-full">
            <input className="input-field" type="email" placeholder="La tua email"
              value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <input className="input-field" type="password" placeholder="Password (min. 6 caratteri)"
              value={password} onChange={e => setPassword(e.target.value)} required autoComplete={isSignUp ? 'new-password' : 'current-password'} />
            {error && <p className="text-red text-xs bg-red/10 px-3 py-2 rounded-xl">{error}</p>}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
              {loading ? <><Spinner size={18} /> {isSignUp ? 'Creazione account...' : 'Accesso...'}</> : (isSignUp ? '🚀 Crea account' : '→ Accedi')}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-3">
            {isSignUp ? 'Hai già un account?' : 'Prima volta qui?'}{' '}
            <button onClick={() => { setIsSignUp(v => !v); setError('') }} className="text-purple-soft font-medium">
              {isSignUp ? 'Accedi' : 'Registrati gratis'}
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