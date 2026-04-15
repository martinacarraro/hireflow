import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { supabase } from './lib/supabase'
import { useApp } from './contexts/AppContext'
import { TabBar, Toast, Confetti } from './components/UI'
import Splash from './screens/Splash'
import Login from './screens/Login'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
import AddCandidatura from './screens/AddCandidatura'
import DetailView from './screens/DetailView'
import Stats from './screens/Stats'
import Profile from './screens/Profile'
import Calendar from './screens/Calendar'
import Tutorial from './components/Tutorial'
import LanguageSelector from './components/LanguageSelector'
import { useTranslation } from 'react-i18next'

export default function App() {
  const { user, loading: authLoading, isGuest } = useAuth()
  const { profile, loading: dataLoading, toast, confetti, unreadCount } = useApp()
  const { t } = useTranslation() // Hook usato correttamente nel componente principale
  
  const [showSplash, setShowSplash] = useState(true)
  const [linguaScelta, setLinguaScelta] = useState(!!localStorage.getItem('lingua'))
  const [showFirstOnboarding, setShowFirstOnboarding] = useState(() => {
    const hasSeen = localStorage.getItem('lfs_seen_intro')
    const hadSession = localStorage.getItem('lfs_had_session')
    return !hasSeen && !hadSession
  })
  const [tab, setTab] = useState('home')
  const [view, setView] = useState(null)
  const [homeScrollPos, setHomeScrollPos] = useState(0)
  const [scrollToTopTrigger, setScrollToTopTrigger] = useState(0)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showReviewPopup, setShowReviewPopup] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const loading = authLoading || (user && dataLoading)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery') || hash.includes('type=signup')) {
      setShowResetPassword(true)
    }
  }, [])

  useEffect(() => {
    if (user) {
      localStorage.setItem('lfs_seen_intro', '1')
      localStorage.setItem('lfs_had_session', '1')
      setShowFirstOnboarding(false)
    }
  }, [user])

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = 'Vuoi davvero uscire?'
      return e.returnValue
    }
    window.history.pushState({ lfs: true }, '')
    const handlePopState = () => {
      const confirmed = window.confirm('Vuoi davvero uscire?')
      if (confirmed) {
        window.history.go(-1)
      } else {
        window.history.pushState({ lfs: true }, '')
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (!user && !isGuest) return
    if (loading || dataLoading) return
    if (user) {
      const key = `lfs_tutorial_done_${user.id}`
      if (!localStorage.getItem(key)) setShowTutorial(true)
    } else {
      if (!localStorage.getItem('lfs_tutorial_done')) setShowTutorial(true)
    }
  }, [user, isGuest, loading, dataLoading])

  useEffect(() => {
  if (!user) return
  const reviewKey = `lfs_review_shown_${user.id}`
  const lastShown = localStorage.getItem(reviewKey)
  const registered = new Date(user.created_at)
  const daysSinceRegistration = Math.floor((new Date() - registered) / 86400000)
  
  if (daysSinceRegistration < 3) return // troppo presto

  if (lastShown) {
    const daysSinceLastShown = Math.floor((new Date() - new Date(lastShown)) / 86400000)
    if (daysSinceLastShown < 30) return // già mostrato meno di 30 giorni fa
  }

  const timeout = setTimeout(() => setShowReviewPopup(true), 3000)
  return () => clearTimeout(timeout)
}, [user])

  if (showSplash || loading) return <Splash onDone={() => setShowSplash(false)} />
  if (!linguaScelta) return <LanguageSelector onSelect={() => setLinguaScelta(true)} />
  if (showFirstOnboarding) return <FirstTimeIntro onDone={() => setShowFirstOnboarding(false)} />

  if (showResetPassword) return (
    <div className="h-full flex flex-col items-center justify-center px-6" style={{ background: '#0E0E1A' }}>
      <div className="w-full max-w-sm text-center">
        {resetDone ? (
          <>
            <p className="text-5xl mb-4">✅</p>
            <h2 className="text-xl font-bold text-white mb-2">Password aggiornata!</h2>
            <p className="text-sm text-gray-400">Riapri l'app e accedi.</p>
          </>
        ) : (
          <>
            <p className="text-5xl mb-4">🔑</p>
            <h2 className="text-xl font-bold text-white mb-2">Nuova password</h2>
            <input type="password" placeholder="Min. 6 caratteri"
              className="input-field w-full mb-3"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} autoFocus />
            <button onClick={async () => {
              setResetLoading(true)
              const { error } = await supabase.auth.updateUser({ password: newPassword })
              setResetLoading(false)
              if (error) alert(error.message)
              else setResetDone(true)
            }} className="btn-primary w-full py-3">{resetLoading ? '⏳...' : '✅ Salva'}</button>
          </>
        )}
      </div>
    </div>
  )

  if (!user && !isGuest) return <Login />

  const onboardingKey = user ? `lfs_onboarding_done_${user.id}` : null
  const hasSeenOnboarding = (onboardingKey && !!localStorage.getItem(onboardingKey)) || profile?.seen_onboarding === true
  if (user && !dataLoading && profile && !hasSeenOnboarding) return (
    <Onboarding 
    t={t} 
    onDone={() => onboardingKey && localStorage.setItem(onboardingKey, '1')} />
  )

  if (view?.type === 'detail') return <DetailView candidatura={view.data} onBack={() => setView(null)} restoreScroll={true} />
  if (view?.type === 'add') return <AddCandidatura onBack={() => setView(null)} onDone={() => setView(null)} />

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col animate-fade-in">
        {tab === 'home' && <Home onAdd={() => setView({ type: 'add' })} onDetail={(c) => setView({ type: 'detail', data: c })} scrollPos={homeScrollPos} onScrollChange={setHomeScrollPos} scrollToTop={scrollToTopTrigger} />}
        {tab === 'calendar' && <Calendar onDetail={(c) => setView({ type: 'detail', data: c })} />}
        {tab === 'stats' && <Stats onOpenCandidatura={(cand) => setView({ type: 'detail', data: cand })} />}
        {tab === 'profile' && <Profile />}
      </div>
      <TabBar active={tab} onChange={(t) => t === 'add' ? setView({ type: 'add' }) : setTab(t)} unread={unreadCount} />
      {showTutorial && <Tutorial onDone={() => setShowTutorial(false)} />}
      <Toast toast={toast} />
      <Confetti active={confetti} />
      {showReviewPopup && (
        <ReviewPopup 
          user={user} 
          profile={profile} 
          t={t} 
          onClose={() => {
  localStorage.setItem(`lfs_review_shown_${user.id}`, new Date().toISOString())
  setShowReviewPopup(false)
}}
        />
      )}
    </div>
  )
}

function FirstTimeIntro({ onDone }) {
  const [slide, setSlide] = useState(0)
  const SLIDES = [
    { title: '"Le faremo sapere."', subtitle: 'E tu tieni il conto.', body: 'Tieni traccia di ogni candidatura e colloquio.' },
    { title: 'Tutto sotto controllo', subtitle: 'Gratis per sempre.', body: 'Inviata, Colloquio, Ghostata. Niente si perde.' },
    { title: 'Guadagna badge', subtitle: 'La ricerca è una gara.', body: 'Sblocca badge e mantieni lo streak. 🏆' }
  ]
  const isLast = slide === SLIDES.length - 1
  return (
    <div className="screen flex flex-col p-10 text-center justify-center bg-slate-900 text-white">
      <h1 className="text-3xl font-black mb-2">{SLIDES[slide].title}</h1>
      <p className="mb-4 opacity-70">{SLIDES[slide].subtitle}</p>
      <p className="text-sm opacity-50 mb-10">{SLIDES[slide].body}</p>
      <button onClick={isLast ? onDone : () => setSlide(s => s + 1)} className="btn-primary py-4 rounded-2xl">
        {isLast ? '🚀 Inizia' : 'Avanti'}
      </button>
    </div>
  )
}

function ReviewPopup({ user, profile, onClose, t }) {
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
          testo: text,
          utente: user?.id,
          nome: profile?.nome || '—'
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