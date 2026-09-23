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

export default function App() {
  const { profile, loading: dataLoading, toast, confetti, unreadCount } = useApp()
  const { t } = useTranslation() // Hook usato correttamente nel componente principale
  
  const [showSplash, setShowSplash] = useState(true)
  const [linguaScelta, setLinguaScelta] = useState(!!localStorage.getItem('lfs_lang'))
  const [tab, setTab] = useState('home')
  const [view, setView] = useState(null)
  const [homeScrollPos, setHomeScrollPos] = useState(0)
  const [scrollToTopTrigger, setScrollToTopTrigger] = useState(0)
  const [showReviewPopup, setShowReviewPopup] = useState(false)

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
    const firstUse = localStorage.getItem('lfs_first_use_at')
    const now = new Date()
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
      {showReviewPopup && (
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
