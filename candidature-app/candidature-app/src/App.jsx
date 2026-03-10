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

export default function App() {
  const { user, loading: authLoading, isGuest } = useAuth()
  const { profile, loading: dataLoading, toast, confetti, unreadCount } = useApp()
  const [showSplash, setShowSplash] = useState(true)
  const [showFirstOnboarding, setShowFirstOnboarding] = useState(() => {
    // Only show if never seen AND not already logged in (user in localStorage = had session before)
    const hasSeen = localStorage.getItem('lfs_seen_intro')
    const hadSession = localStorage.getItem('lfs_had_session')
    return !hasSeen && !hadSession
  })
  const [tab, setTab] = useState('home')
  const [view, setView] = useState(null)
  const [homeScrollPos, setHomeScrollPos] = useState(0)
  const [showResetPassword, setShowResetPassword] = useState(false)
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
    // Detect password reset link from Supabase
    const hash = window.location.hash
    if (hash.includes('type=recovery') || hash.includes('type=signup')) {
      setShowResetPassword(true)
    }
  }, [])

  // Once user is logged in, mark so intro never shows again
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
      e.returnValue = 'Vuoi davvero uscire da Hireflow?'
      return e.returnValue
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  if (showSplash || loading) {
    return <Splash onDone={() => setShowSplash(false)} />
  }

  if (showFirstOnboarding) {
    return (
      <FirstTimeIntro onDone={() => {
        localStorage.setItem('lfs_seen_intro', '1')
        setShowFirstOnboarding(false)
      }} onSkip={() => {
        localStorage.setItem('lfs_seen_intro', '1')
        setShowFirstOnboarding(false)
      }} />
    )
  }

  if (showResetPassword) return (
    <div className="h-full flex flex-col items-center justify-center px-6" style={{ background: '#0E0E1A' }}>
      <div className="w-full max-w-sm">
        {resetDone ? (
          <div className="text-center">
            <p className="text-5xl mb-4">✅</p>
            <h2 className="text-xl font-bold text-white mb-2">Password aggiornata!</h2>
            <p className="text-sm text-gray-400 mb-6">Riapri l'app e accedi con la tua nuova password.</p>
            <p className="text-xs text-gray-500">Puoi chiudere questa pagina 👻</p>
          </div>
        ) : (
          <>
            <p className="text-5xl mb-4 text-center">🔑</p>
            <h2 className="text-xl font-bold text-white mb-2 text-center">Nuova password</h2>
            <p className="text-sm text-gray-400 mb-6 text-center">Inserisci la tua nuova password.</p>
            <input type="password" placeholder="Nuova password (min. 6 caratteri)"
              className="input-field w-full mb-3"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} autoFocus />
            <button onClick={async () => {
              if (newPassword.length < 6) return
              setResetLoading(true)
              const { error } = await supabase.auth.updateUser({ password: newPassword })
              setResetLoading(false)
              if (error) {
                alert('Errore: ' + error.message)
              } else {
                setResetDone(true)
              }
            }} disabled={resetLoading || newPassword.length < 6}
              className="btn-primary w-full py-3"
              style={{ opacity: newPassword.length >= 6 ? 1 : 0.4 }}>
              {resetLoading ? '⏳ Salvataggio...' : '✅ Salva nuova password'}
            </button>
          </>
        )}
      </div>
    </div>
  )

  if (!user && !isGuest) return <Login />

  if (user && profile && !profile.seen_onboarding) return <Onboarding />

  if (view?.type === 'detail') {
    return (
      <div className="h-full flex flex-col">
        <DetailView candidatura={view.data} onBack={() => setView(null)} onUpdate={() => {}} restoreScroll={true} />
        <Toast toast={toast} />
        <Confetti active={confetti} />
      </div>
    )
  }

  if (view?.type === 'add') {
    return (
      <div className="h-full flex flex-col">
        <AddCandidatura onBack={() => setView(null)} onDone={() => setView(null)} />
        <Toast toast={toast} />
        <Confetti active={confetti} />
      </div>
    )
  }

  const handleTabChange = (t) => {
    if (t === 'add') { setView({ type: 'add' }); return }
    setTab(t)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col animate-fade-in">
        {tab === 'home'     && <Home onAdd={() => setView({ type: 'add' })} onDetail={(c) => setView({ type: 'detail', data: c })} scrollPos={homeScrollPos} onScrollChange={setHomeScrollPos} />}
        {tab === 'calendar' && <Calendar onDetail={(c) => setView({ type: 'detail', data: c })} />}
        {tab === 'stats'    && <Stats />}
        {tab === 'profile'  && <Profile />}
      </div>
      <TabBar active={tab} onChange={handleTabChange} unread={unreadCount} />
      <Toast toast={toast} />
      <Confetti active={confetti} />
    </div>
  )
}

// ─── FIRST-TIME INTRO (shown before login, once ever) ────────────────────────
function FirstTimeIntro({ onDone, onSkip }) {
  const [slide, setSlide] = useState(0)

  const SLIDES = [
    {
      bg: 'linear-gradient(160deg, #7B2FFF 0%, #FF2D8B 100%)',
      icon: (
        <svg viewBox="0 0 120 120" fill="none" className="w-32 h-32 mx-auto mb-6">
          <circle cx="60" cy="60" r="60" fill="rgba(255,255,255,0.12)"/>
          <path d="M60 20C60 20 40 42 40 58a20 20 0 0040 0C80 42 60 20 60 20z" fill="white" opacity="0.9"/>
          <circle cx="60" cy="58" r="7" fill="#7B2FFF"/>
          <path d="M48 80l-6 10M72 80l6 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="42" cy="34" r="4" fill="white" opacity="0.5"/>
          <circle cx="80" cy="28" r="6" fill="white" opacity="0.3"/>
        </svg>
      ),
      title: '"Le faremo sapere."',
      subtitle: 'E tu tieni il conto.',
      body: 'Quante volte hai mandato un CV e non hai più sentito nulla? Questa app esiste per questo — tenere traccia di ogni candidatura, ogni colloquio, ogni silenzio.',
    },
    {
      bg: 'linear-gradient(160deg, #1a0a3a 0%, #2d1060 100%)',
      icon: (
        <svg viewBox="0 0 120 120" fill="none" className="w-32 h-32 mx-auto mb-6">
          <circle cx="60" cy="60" r="60" fill="rgba(123,47,255,0.2)"/>
          <rect x="20" y="30" width="80" height="60" rx="8" fill="white" opacity="0.1" stroke="white" strokeWidth="1.5"/>
          <rect x="20" y="30" width="80" height="18" rx="8" fill="#7B2FFF" opacity="0.8"/>
          <circle cx="38" cy="72" r="8" fill="#22C55E" opacity="0.9"/>
          <circle cx="60" cy="72" r="8" fill="#FBBF24" opacity="0.9"/>
          <circle cx="82" cy="72" r="8" fill="#EF4444" opacity="0.9"/>
          <path d="M34 72l3 3 6-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Tutto sotto controllo',
      subtitle: 'Calendario, stati, scadenze.',
      body: 'Ogni candidatura ha il suo stato — Inviata, Colloquio, In attesa, Ghostata. Il calendario ti mostra tutti i tuoi colloqui. Niente si perde.',
    },
    {
      bg: 'linear-gradient(160deg, #0a1a2a 0%, #0a2a1a 100%)',
      icon: (
        <svg viewBox="0 0 120 120" fill="none" className="w-32 h-32 mx-auto mb-6">
          <circle cx="60" cy="60" r="60" fill="rgba(34,197,94,0.15)"/>
          <polygon points="60,25 70,50 97,50 75,66 83,91 60,75 37,91 45,66 23,50 50,50" fill="#FBBF24" opacity="0.9"/>
          <circle cx="60" cy="60" r="12" fill="white" opacity="0.2"/>
        </svg>
      ),
      title: 'Guadagna badge, scala livelli',
      subtitle: 'La ricerca è una gara — vincila.',
      body: 'Ogni candidatura vale XP. Sblocchi badge reali da condividere su LinkedIn. Mantieni lo streak settimanale. Il ghosting fa meno male se hai punti. 🏆',
    },
  ]

  const s = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  return (
    <div className="screen flex flex-col" style={{ background: s.bg, transition: 'background 0.4s ease' }}>
      {/* Skip */}
      <div className="flex justify-end px-5 pt-safe pt-4">
        <button onClick={onSkip || onDone} className="text-white/50 text-sm active:scale-95 transition-transform">
          Salta →
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {s.icon}
        <h1 className="text-3xl font-black text-white mb-2 leading-tight">{s.title}</h1>
        <p className="text-lg font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.subtitle}</p>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.body}</p>
      </div>

      {/* Dots + CTA */}
      <div className="px-8 pb-safe pb-10">
        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{ width: i === slide ? 24 : 8, height: 8, background: i === slide ? 'white' : 'rgba(255,255,255,0.3)' }} />
          ))}
        </div>
        <button
          onClick={isLast ? onDone : () => setSlide(s => s + 1)}
          className="w-full py-4 rounded-2xl font-bold text-base active:scale-95 transition-all"
          style={{ background: 'white', color: '#7B2FFF' }}>
          {isLast ? '🚀 Inizia a tracciare' : 'Avanti →'}
        </button>
      </div>
    </div>
  )
}