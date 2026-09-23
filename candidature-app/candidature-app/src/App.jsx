import { lazy, Suspense, useState, useEffect } from 'react'
import { useApp } from './contexts/AppContext'
import { TabBar, Toast, Confetti } from './components/UI'
import Splash from './screens/Splash'
import Home from './screens/Home'
import LanguageSelector from './components/LanguageSelector'
import { useTranslation } from 'react-i18next'

const Onboarding = lazy(() => import('./screens/Onboarding'))
const AddCandidatura = lazy(() => import('./screens/AddCandidatura'))
const DetailView = lazy(() => import('./screens/DetailView'))
const Stats = lazy(() => import('./screens/Stats'))
const Profile = lazy(() => import('./screens/Profile'))
const Calendar = lazy(() => import('./screens/Calendar'))

const SUPPORT_OPEN_DAYS_KEY = 'lfs_support_open_days'
const SUPPORT_LAST_SHOWN_KEY = 'lfs_support_shown_at'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function registerOpenAndShouldAskForSupport(now = new Date()) {
  const today = now.toISOString().slice(0, 10)
  const oldestAllowed = new Date(now)
  oldestAllowed.setUTCDate(oldestAllowed.getUTCDate() - 6)
  const cutoff = oldestAllowed.toISOString().slice(0, 10)

  let savedDays = []
  try {
    const parsed = JSON.parse(localStorage.getItem(SUPPORT_OPEN_DAYS_KEY) || '[]')
    if (Array.isArray(parsed)) savedDays = parsed.filter(day => typeof day === 'string')
  } catch {}

  const recentDays = [...new Set([...savedDays.filter(day => day >= cutoff), today])].sort()
  localStorage.setItem(SUPPORT_OPEN_DAYS_KEY, JSON.stringify(recentDays))

  const lastShown = localStorage.getItem(SUPPORT_LAST_SHOWN_KEY)
  const shownRecently = lastShown && now - new Date(lastShown) < THIRTY_DAYS_MS
  return recentDays.length >= 2 && !shownRecently
}

export default function App() {
  const { profile, loading: dataLoading, toast, confetti, unreadCount, migrationNotice, dismissMigrationNotice } = useApp()
  const { t, i18n } = useTranslation()
  
  const [showSplash, setShowSplash] = useState(true)
  const [linguaScelta, setLinguaScelta] = useState(!!localStorage.getItem('lfs_lang'))
  const [tab, setTab] = useState('home')
  const [view, setView] = useState(null)
  const [homeScrollPos, setHomeScrollPos] = useState(0)
  const [scrollToTopTrigger, setScrollToTopTrigger] = useState(0)
  const [showReviewPopup, setShowReviewPopup] = useState(false)
  const [showSupportPopup, setShowSupportPopup] = useState(false)

  const loading = dataLoading

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Prepara silenziosamente le schermate durante lo splash:
    // i cambi di sezione restano immediati, senza loader visibili.
    Promise.all([
      import('./screens/Onboarding'),
      import('./screens/AddCandidatura'),
      import('./screens/DetailView'),
      import('./screens/Stats'),
      import('./screens/Profile'),
      import('./screens/Calendar'),
    ]).catch(() => {})
  }, [])

  useEffect(() => {
    const now = new Date()
    if (registerOpenAndShouldAskForSupport(now)) {
      const timeout = setTimeout(() => {
        localStorage.setItem(SUPPORT_LAST_SHOWN_KEY, new Date().toISOString())
        setShowSupportPopup(true)
      }, 8000)
      return () => clearTimeout(timeout)
    }

    const firstUse = localStorage.getItem('lfs_first_use_at')
    if (!firstUse) {
      localStorage.setItem('lfs_first_use_at', now.toISOString())
      return
    }
    const daysSinceFirstUse = Math.floor((now - new Date(firstUse)) / 86400000)
    if (daysSinceFirstUse < 3) return
    const lastShown = localStorage.getItem('lfs_review_shown_local')
    if (lastShown && Math.floor((now - new Date(lastShown)) / 86400000) < 30) return
    const timeout = setTimeout(() => setShowReviewPopup(true), 3000)
    return () => clearTimeout(timeout)
  }, [])

  if (showSplash || loading) return <Splash onDone={() => setShowSplash(false)} />
  if (!linguaScelta) return <LanguageSelector onSelect={() => setLinguaScelta(true)} />
  const hasSeenOnboarding = !!localStorage.getItem('lfs_onboarding_done') || profile?.seen_onboarding === true
  if (!dataLoading && profile && !hasSeenOnboarding) return (
    <Suspense fallback={null}>
      <Onboarding onDone={() => localStorage.setItem('lfs_onboarding_done', '1')} />
    </Suspense>
  )

  if (view?.type === 'detail') return <Suspense fallback={null}><DetailView candidatura={view.data} onBack={() => setView(null)} restoreScroll={true} /></Suspense>
  if (view?.type === 'add') return <Suspense fallback={null}><AddCandidatura onBack={() => setView(null)} onDone={() => setView(null)} /></Suspense>

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col animate-fade-in">
        {tab === 'home' && <Home onAdd={() => setView({ type: 'add' })} onDetail={(c) => setView({ type: 'detail', data: c })} scrollPos={homeScrollPos} onScrollChange={setHomeScrollPos} scrollToTop={scrollToTopTrigger} />}
        <Suspense fallback={null}>
          {tab === 'calendar' && <Calendar onDetail={(c) => setView({ type: 'detail', data: c })} />}
          {tab === 'stats' && <Stats onOpenCandidatura={(cand) => setView({ type: 'detail', data: cand })} />}
          {tab === 'profile' && <Profile />}
        </Suspense>
      </div>
      <TabBar active={tab} onChange={(t) => t === 'add' ? setView({ type: 'add' }) : setTab(t)} unread={unreadCount} />
      <Toast toast={toast} />
      <Confetti active={confetti} />
      {migrationNotice && (
        <MigrationNotice
          notice={migrationNotice}
          isIt={i18n.language !== 'en'}
          onClose={dismissMigrationNotice}
        />
      )}
      {showSupportPopup && !migrationNotice && (
        <SupportPopup
          isIt={i18n.language !== 'en'}
          onClose={() => setShowSupportPopup(false)}
        />
      )}
      {showReviewPopup && !showSupportPopup && !migrationNotice && (
        <ReviewPopup
          profile={profile} 
          t={t} 
          onClose={() => {
  localStorage.setItem('lfs_review_shown_local', new Date().toISOString())
  setShowReviewPopup(false)
}}
        />
      )}
    </div>
  )
}

function SupportPopup({ isIt, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/80 px-4 pb-6" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl border border-purple-500/30 bg-gray-900 p-6 text-center" onClick={event => event.stopPropagation()}>
        <div className="mb-3 text-5xl">💜</div>
        <h2 className="mb-2 text-xl font-bold text-white">
          {isIt ? 'Le faremo sapere ti sta aiutando?' : 'Is Le faremo sapere helping you?'}
        </h2>
        <p className="mb-5 text-sm leading-relaxed text-gray-400">
          {isIt
            ? 'L’app è gratuita e senza pubblicità. Se ti va, puoi sostenere il progetto anche con solo 1 €.'
            : 'The app is free and ad-free. If you like it, you can support the project with as little as €1.'}
        </p>
        <a
          href="https://ko-fi.com/lefaremosapere"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="btn-primary mb-2 block w-full py-3"
        >
          {isIt ? 'Sostieni con 1 €' : 'Support with €1'}
        </a>
        <button onClick={onClose} className="w-full py-3 text-sm text-gray-400">
          {isIt ? 'Non ora' : 'Not now'}
        </button>
      </div>
    </div>
  )
}

function MigrationNotice({ notice, isIt, onClose }) {
  const success = notice.type === 'success'
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-5">
      <div className="card w-full max-w-sm text-center p-6">
        <div className="text-5xl mb-3">{success ? '✅' : '⚠️'}</div>
        <h2 className="text-xl font-bold text-txt mb-2">
          {success
            ? (isIt ? 'Dati recuperati' : 'Data recovered')
            : (isIt ? 'Recupero non completato' : 'Recovery not completed')}
        </h2>
        <p className="text-sm text-muted leading-relaxed mb-5">
          {success
            ? (isIt
                ? `Abbiamo copiato sul telefono ${notice.importedCount} candidature e ${notice.checklistCount} elementi delle checklist. Da ora restano disponibili solo sul dispositivo.`
                : `We copied ${notice.importedCount} applications and ${notice.checklistCount} checklist items to this device. They are now stored locally.`)
            : (isIt
                ? 'La vecchia sessione non è più valida. Puoi recuperare i dati manualmente dalla sezione Profilo.'
                : 'The old session is no longer valid. You can recover your data manually from Profile.')}
        </p>
        <button onClick={onClose} className="btn-primary w-full">
          {isIt ? 'Ho capito' : 'Got it'}
        </button>
      </div>
    </div>
  )
}

function ReviewPopup({ profile, onClose, t }) {
  const [step, setStep] = useState(0)
  const [rating, setRating] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const stars = [1, 2, 3, 4, 5]

  const handleSubmit = async () => {
    if (!rating) return
    setSending(true)
    try {
      await fetch('https://formspree.io/f/xpqydppa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'recensione_5gg',
          stelle: rating,
          testo: text
        })
      })
    } catch(e) {}
    setSending(false)
    setStep(1)
    setTimeout(onClose, 2500)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center px-4 pb-6 bg-black/80" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl p-6 bg-gray-900 border border-purple-500/30" onClick={e => e.stopPropagation()}>
        {step === 0 ? (
          <div className="space-y-5 text-center">
            <div className="text-4xl">👻</div>
            <h2 className="text-lg font-bold text-white">{t('rating.domanda')}, {profile?.nome || 'Ospite'}?</h2>
            <p className="text-xs text-gray-400">{t('rating.sottotitolo')}</p>
            <div className="flex justify-center gap-2">
              {stars.map(s => (
                <button key={s} onClick={() => setRating(s)} className="text-3xl">
                  {s <= (rating || 0) ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            {rating && <textarea className="input-field w-full text-sm" rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="..." />}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 text-gray-400">Dopo</button>
              <button onClick={handleSubmit} disabled={!rating || sending} className="flex-1 py-3 btn-primary rounded-xl">
                {sending ? '...' : t('rating.invia')}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <div className="text-5xl">💜</div>
            <h3 className="text-lg font-bold text-white">{t('rating.grazie')}</h3>
          </div>
        )}
      </div>
    </div>
  )
}
