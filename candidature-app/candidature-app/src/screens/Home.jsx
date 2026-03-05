import { useState, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { StatusBadge, PriorityBadge, CompanyAvatar, LevelBadge, EmptyState } from '../components/UI'
import {
  STATUS_CONFIG, STATUS_GROUP_ORDER, MOTTOS,
  daysSince, formatDate, formatDateTime, getGreeting
} from '../lib/utils'

export default function Home({ onAdd, onDetail }) {
  const { candidature, profile, refreshMotto } = useApp()
  const { user } = useAuth()
  const nome = profile?.nome || user?.user_metadata?.full_name?.split(' ')[0] || ''
  const motto = MOTTOS[profile?.motto_index ?? 0]

  // Stats
  const stats = useMemo(() => {
    const byStato = (s) => candidature.filter(c => c.stato === s).length
    return [
      { emoji: '📤', label: 'Inviate',  count: byStato('Inviata'),          color: '#60A5FA' },
      { emoji: '🎙️', label: 'Colloqui', count: byStato('Colloquio'),         color: '#34D399' },
      { emoji: '⏳', label: 'In attesa',count: byStato('In attesa'),         color: '#FBBF24' },
      { emoji: '👻', label: 'Ghostate', count: byStato('GHOSTED'),           color: '#F87171' },
      { emoji: '🎉', label: 'Offerte',  count: byStato('Offerta ricevuta'),  color: '#A78BFA' },
    ].filter(s => s.label !== 'Offerte' || s.count > 0)
  }, [candidature])

  // Group by stato
  const grouped = useMemo(() => {
    const groups = {}
    STATUS_GROUP_ORDER.forEach(s => {
      const items = candidature.filter(c => c.stato === s)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      if (items.length) groups[s] = items
    })
    return groups
  }, [candidature])

  const [collapsed, setCollapsed] = useState({ 'Ritirata': true })
  const toggleGroup = (s) => setCollapsed(c => ({ ...c, [s]: !c[s] }))

  const greet = getGreeting(nome)

  if (candidature.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <HomeHeader greet={greet} profile={profile} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <EmptyState
            emoji="📭"
            title="Nessuna candidatura ancora"
            subtitle="Aggiungi la prima — ci vogliono 30 secondi. Poi puoi dimenticarti di tutto. 😌"
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <HomeHeader greet={greet} profile={profile} />

      <div className="flex-1 scrollable px-4 pt-2 pb-4">
        {/* Motto banner */}
        <div className="card border-l-[3px] border-l-purple mb-4 flex items-center justify-between">
          <p className="text-sm italic text-purple-soft flex-1 leading-relaxed">{motto}</p>
          <button onClick={refreshMotto}
            className="text-muted text-base ml-3 active:scale-75 transition-transform">
            🔄
          </button>
        </div>

        {/* Stats strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollable" style={{ scrollbarWidth: 'none' }}>
          {stats.map(s => (
            <div key={s.label} className="flex-shrink-0 flex items-center gap-1.5
              bg-surface border border-border rounded-full px-3 py-1.5">
              <span>{s.emoji}</span>
              <span className="text-sm font-bold" style={{ color: s.color }}>{s.count}</span>
              <span className="text-xs text-muted">{s.label}</span>
            </div>
          ))}
          {(profile?.streak_giorni || 0) > 1 && (
            <div className="flex-shrink-0 flex items-center gap-1.5
              bg-surface border border-border rounded-full px-3 py-1.5">
              <span className="animate-streak text-sm">🔥</span>
              <span className="text-sm font-bold text-amber">{profile.streak_giorni}</span>
              <span className="text-xs text-muted">giorni</span>
            </div>
          )}
        </div>

        {/* Grouped list */}
        {STATUS_GROUP_ORDER.map(stato => {
          const items = grouped[stato]
          if (!items) return null
          const cfg = STATUS_CONFIG[stato]
          const isCollapsed = collapsed[stato]
          return (
            <div key={stato} className="mb-5">
              {/* Group header */}
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

              {/* Cards */}
              {!isCollapsed && items.map(c => (
                <CandidaturaCard key={c.id} c={c} onPress={() => onDetail(c)} />
              ))}
            </div>
          )
        })}
      </div>

      {/* FAB */}
      <button onClick={onAdd}
        className="fixed bottom-20 right-5 w-14 h-14 bg-purple text-white text-2xl
        rounded-full shadow-fab flex items-center justify-center
        active:scale-90 transition-transform z-30">
        +
      </button>
    </div>
  )
}

function HomeHeader({ greet, profile }) {
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
      <div className="text-2xl">🚀</div>
    </div>
  )
}

function CandidaturaCard({ c, onPress }) {
  const cfg = STATUS_CONFIG[c.stato]
  const days = daysSince(c.data_invio)
  const isStale = days >= 14 && ['Inviata', 'In attesa'].includes(c.stato)

  return (
    <div onClick={onPress}
      className="card mb-3 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden"
      style={{
        borderLeft: `3px solid ${cfg.color}`,
        borderColor: isStale ? '#FBBF24' : undefined,
        borderStyle: isStale ? 'dashed' : 'solid',
      }}>
      
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

          {c.data_colloquio && c.stato === 'Colloquio' && (
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
