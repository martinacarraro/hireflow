import { useState, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { StatusBadge, PriorityBadge, CompanyAvatar, LevelBadge, EmptyState } from '../components/UI'
import {
  STATUS_CONFIG, STATUS_GROUP_ORDER, MOTTOS,
  daysSince, formatDate, formatDateTime, getGreeting
} from '../lib/utils'

export default function Home({ onAdd, onDetail }) {
  const { candidature, profile, refreshMotto, unreadCount, notifications, markAllNotificationsRead } = useApp()
  const [showNotifs, setShowNotifs] = useState(false)
  const { user } = useAuth()
  const nome = profile?.nome || user?.user_metadata?.full_name?.split(' ')[0] || ''
  const motto = MOTTOS[profile?.motto_index ?? 0]
  const [filtroStato, setFiltroStato] = useState(null)

  const stats = useMemo(() => {
    return [
      { emoji: '📤', label: 'Inviate',   stato: 'Inviata',           count: candidature.filter(c => c.stato === 'Inviata').length,           color: '#60A5FA' },
      { emoji: '📞', label: 'Call',      stato: 'Call conoscitiva',  count: candidature.filter(c => c.stato === 'Call conoscitiva').length,  color: '#38BDF8' },
      { emoji: '🎙️', label: 'Colloqui', stato: 'Colloquio',          count: candidature.filter(c => c.stato === 'Colloquio').length,          color: '#34D399' },
      { emoji: '🎙️🎙️', label: '2° Col.', stato: 'Secondo colloquio', count: candidature.filter(c => c.stato === 'Secondo colloquio').length, color: '#10B981' },
      { emoji: '⏳', label: 'Attesa',    stato: 'In attesa',         count: candidature.filter(c => c.stato === 'In attesa').length,         color: '#FBBF24' },
      { emoji: '🎉', label: 'Offerte',   stato: 'Offerta ricevuta',  count: candidature.filter(c => c.stato === 'Offerta ricevuta').length,  color: '#A78BFA' },
      { emoji: '🏆', label: 'Assunto',   stato: 'Assunto',           count: candidature.filter(c => c.stato === 'Assunto').length,           color: '#F59E0B' },
      { emoji: '👻', label: 'Ghostate',  stato: 'GHOSTED',           count: candidature.filter(c => c.stato === 'GHOSTED').length,           color: '#9CA3AF' },
    ]
  }, [candidature])

  const candidatureFiltrate = useMemo(() => {
    if (!filtroStato) return candidature
    return candidature.filter(c => c.stato === filtroStato)
  }, [candidature, filtroStato])

  const grouped = useMemo(() => {
    const groups = {}
    STATUS_GROUP_ORDER.forEach(s => {
      const items = candidatureFiltrate.filter(c => c.stato === s)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      if (items.length) groups[s] = items
    })
    return groups
  }, [candidatureFiltrate])

  const [collapsed, setCollapsed] = useState({ 'Ritirata': true })
  const toggleGroup = (s) => setCollapsed(c => ({ ...c, [s]: !c[s] }))
  const greet = getGreeting(nome)

  if (candidature.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <HomeHeader greet={greet} profile={profile} unread={unreadCount} onBell={() => setShowNotifs(true)} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <EmptyState
            emoji="📭"
            title="Nessuna candidatura ancora"
            subtitle="Aggiungi la prima — ci vogliono 30 secondi. 😌"
            action={
              {/* Notification panel */}
      {showNotifs && (
        <div className="absolute inset-0 z-40 bg-bg flex flex-col">
          <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
            <button onClick={() => { setShowNotifs(false); markAllNotificationsRead() }} className="text-muted text-lg">←</button>
            <h2 className="font-bold text-txt">Notifiche 🔔</h2>
          </div>
          <div className="flex-1 scrollable px-4 py-4">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-muted text-sm">Nessuna notifica ancora 🔕</div>
            ) : notifications.map(n => (
              <div key={n.id} className={`card mb-2 flex items-start gap-3 ${!n.read ? 'border-purple/30' : ''}`}>
                {!n.read && <div className="w-2 h-2 rounded-full bg-purple mt-1.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${n.read ? 'text-muted' : 'text-txt'}`}>{n.title}</p>
                  <p className="text-xs text-muted mt-0.5">{n.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onAdd} className="btn-primary mt-2 px-8">
                + Aggiungi la prima candidatura
              </button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <HomeHeader greet={greet} profile={profile} unread={unreadCount} onBell={() => setShowNotifs(true)} />

      <div className="flex-1 scrollable px-4 pt-2 pb-4">
        {/* Motto banner */}
        <div className="card border-l-[3px] border-l-purple mb-4 flex items-center justify-between">
          <p className="text-sm italic text-purple-soft flex-1 leading-relaxed">{motto}</p>
          <button onClick={refreshMotto}
            className="text-muted text-base ml-3 active:scale-75 transition-transform">
            🔄
          </button>
        </div>

        {/* Stats strip — cliccabili per filtrare */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-2 scrollable" style={{ scrollbarWidth: 'none' }}>
          {filtroStato && (
            <button onClick={() => setFiltroStato(null)}
              className="flex-shrink-0 flex items-center gap-1.5 bg-purple text-white rounded-full px-3 py-1.5 text-xs font-semibold">
              ✕ Tutti
            </button>
          )}
          {stats.map(s => (
            <button key={s.label}
              onClick={() => setFiltroStato(filtroStato === s.stato ? null : s.stato)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 border transition-all
                ${filtroStato === s.stato ? 'border-transparent text-white' : 'bg-surface border-border'}`}
              style={filtroStato === s.stato ? { background: s.color } : {}}>
              <span className="text-sm">{s.emoji}</span>
              <span className="text-sm font-bold" style={{ color: filtroStato === s.stato ? 'white' : s.color }}>{s.count}</span>
              <span className="text-xs" style={{ color: filtroStato === s.stato ? 'white' : undefined, opacity: filtroStato === s.stato ? 1 : 0.7 }}>{s.label}</span>
            </button>
          ))}
          {(profile?.streak_giorni || 0) > 1 && (
            <div className="flex-shrink-0 flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1.5">
              <span className="animate-streak text-sm">🔥</span>
              <span className="text-sm font-bold text-amber">{profile.streak_giorni}</span>
              <span className="text-xs text-muted">giorni</span>
            </div>
          )}
        </div>

        {filtroStato && (
          <p className="text-xs text-muted mb-3">
            Filtro: <span className="text-purple-soft font-semibold">{filtroStato}</span> — {candidatureFiltrate.length} candidature
          </p>
        )}

        {/* Grouped list */}
        {STATUS_GROUP_ORDER.map(stato => {
          const items = grouped[stato]
          if (!items) return null
          const cfg = STATUS_CONFIG[stato]
          const isCollapsed = collapsed[stato]
          return (
            <div key={stato} className="mb-5">
              <button onClick={() => toggleGroup(stato)}
                className="w-full flex items-center justify-between mb-2 active:opacity-70">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-widest font-semibold"
                    style={{ color: cfg.color }}>
                    {cfg.emoji} {stato}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ color: cfg.color, background: cfg.bg }}>
                    {items.length}
                  </span>
                </div>
                <span className="text-muted text-sm transition-transform duration-200"
                  style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                  ▾
                </span>
              </button>
              {!isCollapsed && items.map(c => (
                <CandidaturaCard key={c.id} c={c} onPress={() => onDetail(c)} />
              ))}
            </div>
          )
        })}
      </div>

    </div>
  )
}

function HomeHeader({ greet, profile, unread, onBell }) {
  return (
    <div className="px-5 pt-safe pt-4 pb-3 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-lg font-bold text-txt">{greet}</h1>
        {profile && (
          <div className="mt-0.5">
            <LevelBadge xp={profile.xp_points || 0} />
          </div>
        )}
      </div>
      <button onClick={onBell} className="relative p-2">
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red text-white text-[9px] rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  )
}

function CandidaturaCard({ c, onPress }) {
  const cfg = STATUS_CONFIG[c.stato] || STATUS_CONFIG['Inviata']
  const days = daysSince(c.data_invio)
  const isStale = days >= 14 && ['Inviata', 'In attesa'].includes(c.stato)

  return (
    <div onClick={onPress}
      className="card mb-3 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden"
      style={{ borderLeft: `3px solid ${isStale ? '#FBBF24' : cfg.color}` }}>

      {isStale && (
        <div className="flex items-center gap-1 mb-2 text-amber text-xs">
          <span>⚠️</span>
          <span>Nessuna risposta da {days} giorni</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <CompanyAvatar name={c.azienda} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-txt text-sm truncate">{c.azienda}</p>
              <p className="text-muted text-xs truncate">{c.ruolo}</p>
            </div>
            <StatusBadge stato={c.stato} />
          </div>

          {c.data_colloquio && ['Colloquio','Secondo colloquio','Call conoscitiva'].includes(c.stato) && (
            <p className="text-xs text-amber mt-1.5">
              📅 {formatDateTime(c.data_colloquio, c.ora_colloquio)}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-disabled truncate">
              {[c.sede, c.paese].filter(Boolean).join(', ') || '—'}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {c.priorita && <PriorityBadge priorita={c.priorita} />}
              <span className="text-xs text-disabled">{days}gg fa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
