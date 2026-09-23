import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { useTranslation } from 'react-i18next'

const GENERI = [
  { value: 'f', it: 'Donna', en: 'Woman', emoji: '👩' },
  { value: 'm', it: 'Uomo', en: 'Man', emoji: '👨' },
  { value: 'nb', it: 'Non binario/a', en: 'Non-binary', emoji: '🧑' },
  { value: 'x', it: 'Preferisco non dirlo', en: 'Prefer not to say', emoji: '🤍' },
]

export default function Onboarding({ onDone }) {
  const { markOnboarded, updateProfile, requestNotificationPermission, triggerConfetti, profile } = useApp()
  const { i18n } = useTranslation()
  const isIt = i18n.language !== 'en'
  const [step, setStep] = useState(0)
  const [nome, setNome] = useState(profile?.nome || '')
  const [genere, setGenere] = useState(profile?.genere || 'x')
  const [loading, setLoading] = useState(false)

  const finish = async (enableNotifications = false) => {
    setLoading(true)
    if (enableNotifications) await requestNotificationPermission()
    await updateProfile({ nome: nome.trim(), genere, seen_onboarding: true })
    await markOnboarded()
    localStorage.setItem('lfs_onboarding_done', '1')
    localStorage.setItem('lfs_tutorial_done', '1')
    triggerConfetti()
    setLoading(false)
    onDone?.()
  }

  return (
    <div className="screen purple-glow-bg">
      <div className="flex gap-2 px-6 pt-safe pt-5">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-purple' : 'bg-border'}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="flex-1 flex flex-col px-6 py-8">
          <div className="text-center mb-7">
            <div className="text-6xl mb-4">📬</div>
            <h1 className="text-3xl font-black text-txt mb-2">Le faremo sapere.</h1>
            <p className="text-muted">{isIt ? 'E tu tieni il conto, in privato.' : 'And you keep track, privately.'}</p>
          </div>
          <div className="space-y-3 flex-1">
            {[
              ['📋', isIt ? 'Tutte le candidature organizzate' : 'Every application organized'],
              ['⏰', isIt ? 'Colloqui e promemoria sotto controllo' : 'Interviews and reminders under control'],
              ['🔒', isIt ? 'Nessun account: i dati restano qui' : 'No account: your data stays here'],
            ].map(([emoji, text]) => (
              <div key={text} className="card flex items-center gap-4">
                <span className="text-2xl">{emoji}</span>
                <span className="text-sm font-semibold text-txt">{text}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="btn-primary w-full py-4 text-base">
            {isIt ? 'Iniziamo' : "Let's start"} →
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col px-6 py-8">
          <div className="text-center mb-7">
            <div className="text-5xl mb-3">👋</div>
            <h2 className="text-2xl font-bold text-txt">{isIt ? 'Come ti chiami?' : "What's your name?"}</h2>
            <p className="text-sm text-muted mt-2">{isIt ? 'Solo per personalizzare la tua app.' : 'Only to personalize your app.'}</p>
          </div>
          <input
            className="input-field text-lg text-center font-semibold mb-5"
            placeholder={isIt ? 'Il tuo nome' : 'Your name'}
            value={nome}
            onChange={e => setNome(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-muted text-center mb-3">{isIt ? 'Come preferisci essere chiamatə?' : 'How would you like to be addressed?'}</p>
          <div className="grid grid-cols-2 gap-2 flex-1 content-start">
            {GENERI.map(g => (
              <button key={g.value} onClick={() => setGenere(g.value)}
                className={`py-3 rounded-2xl text-xs font-semibold border transition-all ${genere === g.value ? 'border-purple bg-purple/20 text-purple-soft' : 'border-border text-muted bg-surface'}`}>
                <span className="block text-xl mb-1">{g.emoji}</span>{isIt ? g.it : g.en}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)} disabled={!nome.trim()} className="btn-primary w-full py-4 text-base disabled:opacity-40">
            {isIt ? 'Avanti' : 'Next'} →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col items-center justify-center px-7 py-8 text-center">
          <div className="text-7xl mb-5">🔔</div>
          <h2 className="text-2xl font-bold text-txt mb-3">{isIt ? 'Vuoi i promemoria?' : 'Would you like reminders?'}</h2>
          <p className="text-muted leading-relaxed mb-10">
            {isIt ? 'Ti ricorderemo colloqui e scadenze. Puoi cambiare idea in qualsiasi momento.' : 'We will remind you about interviews and deadlines. You can change this anytime.'}
          </p>
          <button onClick={() => finish(true)} disabled={loading} className="btn-primary w-full py-4 text-base mb-3">
            {loading ? '...' : (isIt ? '🔔 Attiva promemoria' : '🔔 Enable reminders')}
          </button>
          <button onClick={() => finish(false)} disabled={loading} className="w-full py-3 text-sm text-muted">
            {isIt ? 'Non ora, entra nell’app' : 'Not now, open the app'}
          </button>
        </div>
      )}
    </div>
  )
}
