import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
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

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: dataLoading, toast, confetti, unreadCount } = useApp()
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('home')
  const [view, setView] = useState(null) // { type: 'detail'|'add', data? }

  const loading = authLoading || (user && dataLoading)

  // Register service worker for push
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  if (showSplash || loading) {
    return <Splash onDone={() => !loading && setShowSplash(false)} />
  }

  if (!user) return <Login />

  if (user && profile && !profile.seen_onboarding) return <Onboarding />

  // Detail or Add views
  if (view?.type === 'detail') {
    return (
      <div className="h-full flex flex-col">
        <DetailView
          candidatura={view.data}
          onBack={() => setView(null)}
          onUpdate={() => {}}
        />
        <Toast toast={toast} />
        <Confetti active={confetti} />
      </div>
    )
  }

  if (view?.type === 'add') {
    return (
      <div className="h-full flex flex-col">
        <AddCandidatura
          onBack={() => setView(null)}
          onDone={() => setView(null)}
        />
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
      {/* Screen */}
      <div className="flex-1 overflow-hidden flex flex-col animate-fade-in">
        {tab === 'home' && (
          <Home
            onAdd={() => setView({ type: 'add' })}
            onDetail={(c) => setView({ type: 'detail', data: c })}
          />
        )}
        {tab === 'stats'   && <Stats />}
        {tab === 'profile' && <Profile />}
      </div>

      {/* Tab bar */}
      <TabBar active={tab} onChange={handleTabChange} unread={unreadCount} />

      {/* Global overlays */}
      <Toast toast={toast} />
      <Confetti active={confetti} />
    </div>
  )
}
