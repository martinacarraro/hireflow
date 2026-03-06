import { useState, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { StatusBadge, PriorityBadge, CompanyAvatar, LevelBadge, EmptyState } from '../components/UI'
import { STATUS_CONFIG, STATUS_GROUP_ORDER, MOTTOS, daysSince, formatDateTime, getGreeting } from '../lib/utils'

export default function Home({ onAdd, onDetail }) {
  const { candidature, profile, refreshMotto, unreadCount, notifications, markAllNotificationsRead } = useApp()
  const { user } = useAuth()
  const nome = profile?.nome || user?.user_metadata?.full_name?.split(' ')[0] || ''
  const motto = MOTTOS[profile?.motto_index ?? 0]
  const [filtroStato, setFiltroStato] = useState(null)
  const [showNotifs, setShowNotifs] = useState(false)
  const [collapsed, setCollapsed] = useState({ 'Ritirata': true })

  // Solo stati con almeno 1 candidatura
  const stats = useMemo(() => [
    { emoji: '💡', label: 'Spontanea',  stato: 'Spontanea',          color: '#D1D5DB' },
    { emoji: '📤', label: 'Inviata',    stato: 'Inviata',            color: '#60A5FA' },
    { emoji: '👀', label: 'Vista',      stato: 'Vista',              color: '#F97316' },
    { emoji: '📞', label: 'Prima call', stato: 'Prima call',         color: '#C084FC' },
    { emoji: '🎙️', label: 'Colloquio', stato: 'Colloquio',          color: '#34D399' },
    { emoji: '⏳', label: 'Attesa',     stato: 'In attesa risposta', color: '#FBBF24' },
    { emoji: '🎙️🎙️', label: '2° Col.', stato: 'Secondo colloquio',  color: '#10B981' },
    { emoji: '😕', label: 'Non piace',  stato: 'Non mi piace',       color: '#8B5CF6' },
    { emoji: '❌', label: 'Rifiutata',  stato: 'Rifiutata',          color: '#F87171' },
    { emoji: '👻', label: 'Ghostate',   stato: 'GHOSTED',            color: '#9CA3AF' },
  ]
    .map(s => ({ ...s, count: candidature.filter(c => c.stato === s.stato).length }))
    .filter(s => s.count > 0),
  [candidature])

  const candidatureFiltrate = useMemo(() =>
    filtroStato ? candidature.filter(c => c.stato === filtroStato) : candidature,
  [candidature, filtroStato])

  const grouped = useMemo(() => {
    const groups = {}
    STATUS_GROUP_ORDER.forEach(s => {
      const items = candidatureFiltrate.filter(c => c.stato === s)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      if (items.length) groups[s] = items
    })
    return groups
  }, [candidatureFiltrate])

  const toggleGroup = (s) => setCollapsed(c => ({ ...c, [s]: !c[s] }))
  const greet = getGreeting(nome)

  // ── NOTIFICATION PANEL ────────────────────────────────────────
  if (showNotifs) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
          <button onClick={() => { setShowNotifs(false); markAllNotificationsRead() }} className="text-muted text-lg">←</button>
          <h2 className="font-bold text-txt">Notifiche 🔔</h2>
        </div>
        <div className="flex-1 scrollable px-4 py-4">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-2">🔕</p>
              <p className="text-muted text-sm">Nessuna notifica ancora</p>
            </div>
          ) : notifications.map(n => (
            <div key={n.id} className={`card mb-2 flex items-start gap-3 ${!n.read ? 'border-purple/30' : ''}`}>
              {!n.read && <div className="w-2 h-2 rounded-full bg-purple mt-1.5 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.read ? 'text-muted' : 'text-txt'}`}>{n.title}</p>
                <p className="text-xs text-muted mt-0.5">{n.body}</p>
                <p className="text-[10px] text-disabled mt-1">
                  {new Date(n.time).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── EMPTY STATE ───────────────────────────────────────────────
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
              <button onClick={onAdd} className="btn-primary mt-2 px-8">
                + Aggiungi la prima candidatura
              </button>
            }
          />
        </div>
      </div>
    )
  }

  // ── MAIN VIEW ─────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <HomeHeader greet={greet} profile={profile} unread={unreadCount} onBell={() => setShowNotifs(true)} />

      <div className="flex-1 scrollable px-4 pt-2 pb-20">

        {/* Motto */}
        <div className="card border-l-[3px] border-l-purple mb-4 flex items-center justify-between">
          <p className="text-sm italic text-purple-soft flex-1 leading-relaxed">{motto}</p>
          <button onClick={refreshMotto} className="text-muted text-base ml-3 active:scale-75 transition-transform">🔄</button>
        </div>

        {/* Filtri — solo stati con count > 0 */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => setFiltroStato(null)}
            className={`flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 border text-xs font-semibold transition-all
              ${!filtroStato ? 'bg-purple border-purple text-white' : 'bg-surface border-border text-muted'}`}>
            Tutti
          </button>
          {stats.map(s => (
            <button key={s.stato}
              onClick={() => setFiltroStato(filtroStato === s.stato ? null : s.stato)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-semibold transition-all
                ${filtroStato === s.stato ? 'border-transparent text-white' : 'bg-surface border-border'}`}
              style={filtroStato === s.stato ? { background: s.color } : {}}>
              <span>{s.emoji}</span>
              <span style={{ color: filtroStato === s.stato ? 'white' : s.color }}>{s.count}</span>
              <span style={{ color: filtroStato === s.stato ? 'white' : '#9CA3AF' }}>{s.label}</span>
            </button>
          ))}
        </div>

        {filtroStato && (
          <p className="text-xs text-muted mb-3">
            Filtro attivo: <span className="text-purple-soft font-semibold">{filtroStato}</span> — {candidatureFiltrate.length} candidature
          </p>
        )}

        {/* Lista raggruppata */}
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
                  <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: cfg.color }}>
                    {cfg.emoji} {stato}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ color: cfg.color, background: cfg.bg }}>
                    {items.length}
                  </span>
                </div>
                <span className="text-muted text-sm" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
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
        {profile && <div className="mt-0.5"><LevelBadge xp={profile.xp_points || 0} /></div>}
      </div>
      <button onClick={onBell} className="relative p-2 active:scale-90 transition-transform">
        <span className="text-2xl">🔔</span>
        {unread > 0 && (
          <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red text-white text-[9px] rounded-full flex items-center justify-center font-bold px-1">
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
      className="card mb-3 cursor-pointer active:scale-[0.98] transition-transform"
      style={{ borderLeft: `3px solid ${isStale ? '#FBBF24' : cfg.color}` }}>
      {isStale && (
        <div className="flex items-center gap-1 mb-2 text-amber text-xs">
          <span>⚠️</span><span>Nessuna risposta da {days} giorni</span>
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
            <p className="text-xs text-amber mt-1.5">📅 {formatDateTime(c.data_colloquio, c.ora_colloquio)}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-disabled truncate">{[c.sede, c.paese].filter(Boolean).join(', ') || '—'}</p>
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
