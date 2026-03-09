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
            <svg width="64" height="64" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lgbg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#7B2FFF"/>
                  <stop offset="100%" stop-color="#FF2D8B"/>
                </linearGradient>
                <linearGradient id="lgg" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#f0d9ff"/>
                  <stop offset="100%" stop-color="#ffffff"/>
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="112" fill="url(#lgbg)"/>
              <path d="M 152 392 L 152 228 Q 152 100 256 100 Q 360 100 360 228 L 360 392 Q 334 365 318 384 Q 298 360 280 384 Q 262 360 256 384 Q 250 360 232 384 Q 214 360 194 384 Q 178 365 152 392 Z" fill="url(#lgg)"/>
              <ellipse cx="210" cy="240" rx="30" ry="33" fill="#7B2FFF"/>
              <ellipse cx="302" cy="240" rx="30" ry="33" fill="#7B2FFF"/>
              <circle cx="219" cy="231" r="11" fill="white"/>
              <circle cx="311" cy="231" r="11" fill="white"/>
              <circle cx="217" cy="229" r="5" fill="#3d0099"/>
              <circle cx="309" cy="229" r="5" fill="#3d0099"/>
              <path d="M 220 294 Q 238 314 256 294 Q 274 314 292 294" fill="none" stroke="#7B2FFF" stroke-width="5" stroke-linecap="round"/>
              <rect x="150" y="412" width="212" height="50" rx="25" fill="rgba(255,255,255,0.2)"/>
              <circle cx="206" cy="437" r="11" fill="white"/>
              <circle cx="256" cy="437" r="11" fill="white"/>
              <circle cx="306" cy="437" r="11" fill="white"/>
            </svg>
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
