import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Spinner } from '../components/UI'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { signInWithEmail, signUpWithEmail, enterAsGuest, resetPassword } = useAuth()
  const { t } = useTranslation()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotPw, setForgotPw] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleEmail = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true); setError('')
    try {
      const fn = isSignUp ? signUpWithEmail : signInWithEmail
      const { error: err } = await fn(email, password)
      if (err) {
        const msg = err.message
        if (msg.includes('Invalid login')) setError(t('login.erroreCredenziali'))
        else if (msg.includes('already registered')) setError(t('login.erroreGiaRegistrato'))
        else if (msg.includes('Password should')) setError(t('login.errorePassword'))
        else setError(msg)
      }
    } catch { setError(t('login.erroreConnessione')) }
    setLoading(false)
  }

  if (forgotPw) return (
    <div className="screen purple-glow-bg relative overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm flex flex-col items-center text-center">
          {resetSent ? (
            <>
              <div className="text-6xl mb-4">📬</div>
              <h2 className="text-xl font-bold text-txt mb-2">{t('login.emailInviata')}</h2>
              <p className="text-sm text-muted mb-6">{t('login.emailInviataDesc')}</p>
              <button onClick={() => { setForgotPw(false); setResetSent(false) }}
                className="btn-primary w-full py-3">{t('login.tornaLogin')}</button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🔑</div>
              <h2 className="text-xl font-bold text-txt mb-2">{t('login.passwordDimenticata')}</h2>
              <p className="text-sm text-muted mb-6">{t('login.passwordDimenticataDesc')}</p>
              <input className="input-field w-full mb-3" type="email" placeholder={t('login.tuaEmail')}
                value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              {error && <p className="text-red text-xs mb-3">{error}</p>}
              <button onClick={async () => {
                if (!email) { setError(t('login.inserisciEmail')); return }
                setLoading(true); setError('')
                const { error: err } = await resetPassword(email)
                if (err) setError(err.message)
                else setResetSent(true)
                setLoading(false)
              }} disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                {loading ? <Spinner size={18} /> : t('login.inviaReset')}
              </button>
              <button onClick={() => { setForgotPw(false); setError('') }}
                className="text-xs text-muted mt-3 active:text-txt">{t('login.tornaLogin')}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="screen purple-glow-bg relative overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-6 py-8">
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <div className="mb-3 mt-8">
            <img src="/icon-512.png" alt="Le faremo sapere" className="w-16 h-16 rounded-2xl"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
            <div className="w-16 h-16 rounded-2xl hidden items-center justify-center text-3xl"
              style={{ background: 'linear-gradient(135deg, #7B2FFF, #FF2D8B)' }}>👻</div>
          </div>

          <h1 className="text-3xl font-bold text-txt tracking-tight mb-1 text-center">Le faremo sapere</h1>
          <p className="text-sm text-muted italic text-center mb-6 leading-relaxed">{t('login.tagline')}</p>

          <div className="flex gap-2 flex-wrap justify-center mb-6">
            {[t('login.badge1'), t('login.badge2'), t('login.badge3')].map(f => (
              <span key={f} className="text-xs px-3 py-1.5 rounded-full bg-surface border border-border text-purple-soft">{f}</span>
            ))}
          </div>

          <h2 className="text-xl font-bold text-txt mb-1 w-full">
            {isSignUp ? t('login.creaAccount') : t('login.ciao')}
          </h2>
          <p className="text-sm text-muted mb-4 w-full">
            {isSignUp ? t('login.creaAccountDesc') : t('login.accediDesc')}
          </p>

          <form onSubmit={handleEmail} className="space-y-3 w-full">
            <input className="input-field" type="email" placeholder={t('login.tuaEmail')}
              value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <input className="input-field" type="password" placeholder={t('login.password')}
              value={password} onChange={e => setPassword(e.target.value)} required autoComplete={isSignUp ? 'new-password' : 'current-password'} />
            {error && <p className="text-red text-xs bg-red/10 px-3 py-2 rounded-xl">{error}</p>}
            {!isSignUp && (
              <button type="button" onClick={() => { setForgotPw(true); setError('') }}
                className="text-xs text-muted text-right w-full active:text-purple-soft">
                {t('login.passwordDimenticata')}
              </button>
            )}
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
              {loading
                ? <><Spinner size={18} /> {isSignUp ? t('login.creazione') : t('login.accesso')}</>
                : (isSignUp ? t('login.creaAccountBtn') : t('login.accediBtn'))}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-3">
            {isSignUp ? t('login.haiGiaAccount') : t('login.primaVolta')}{' '}
            <button onClick={() => { setIsSignUp(v => !v); setError('') }} className="text-purple-soft font-medium">
              {isSignUp ? t('login.accediLink') : t('login.registrati')}
            </button>
          </p>

          <div className="flex items-center gap-3 w-full my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-disabled">{t('login.oppure')}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button onClick={enterAsGuest}
            className="w-full border border-border text-muted rounded-2xl py-3 text-sm font-medium active:scale-95 transition-all">
            {t('login.entraOspite')}
          </button>
          <p className="text-[11px] text-disabled text-center mt-2 leading-relaxed px-2">
            {t('login.avvisoOspite')}
          </p>
          <p className="text-xs text-disabled text-center mt-4 leading-relaxed px-4 pb-4">
            {t('login.avvisoPrivacy')}
          </p>
        </div>
      </div>
    </div>
  )
}