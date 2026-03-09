import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { StatusBadge, PriorityBadge, CompanyAvatar, LevelBadge, EmptyState, ConfirmDialog } from '../components/UI'
import { STATUS_CONFIG, STATUS_GROUP_ORDER, MOTTOS, STATI, daysSince, formatDateTime, getGreeting } from '../lib/utils'


function GuestConvertModal({ onClose, onSuccess }) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const { migrateGuestToAccount } = useApp()

  const handle = async () => {
    if (!email || !password) return setError('Compila tutti i campi')
    if (password.length < 6) return setError('Password minimo 6 caratteri')
    setLoading(true); setError('')
    const result = await migrateGuestToAccount(email, password)
    setLoading(false)
    if (result?.error) setError(result.error.message)
    else onSuccess?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-t-3xl p-6 space-y-4" style={{ background: '#1A1A2E' }}>
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-2" />
        <div className="text-center">
          <p className="text-2xl mb-1">👻✨</p>
          <h3 className="font-bold text-txt text-lg">Salva i tuoi progressi</h3>
          <p className="text-muted text-sm mt-1">Crea un account gratuito e non perdi nulla — candidature, XP e badge.</p>
        </div>
        <input className="input-field" type="email" placeholder="La tua email"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input className="input-field" type="password" placeholder="Scegli una password (min. 6 caratteri)"
          value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="text-red text-xs text-center">{error}</p>}
        <button onClick={handle} disabled={loading}
          className="w-full py-3.5 rounded-2xl font-bold text-white transition-opacity"
          style={{ background: 'linear-gradient(135deg, #7B2FFF, #FF2D8B)', opacity: loading ? 0.6 : 1 }}>
          {loading ? '⏳ Salvataggio...' : '🚀 Crea account e salva tutto'}
        </button>
        <button onClick={onClose} className="w-full text-center text-muted text-sm py-2">
          Continua come ospite
        </button>
      </div>
    </div>
  )
}

export default function Home({ onAdd, onDetail, scrollPos = 0, onScrollChange }) {
  const { candidature, profile, refreshMotto, unreadCount, notifications, markAllNotificationsRead, deleteCandidatura, updateCandidatura, addCandidatura } = useApp()
  const { user, isGuest } = useAuth()
  const nome = profile?.nome || user?.user_metadata?.full_name?.split(' ')[0] || ''
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current && scrollPos > 0) {
      scrollRef.current.scrollTop = scrollPos
    }
  }, [])

  const handleScroll = useCallback((e) => {
    onScrollChange?.(e.target.scrollTop)
  }, [onScrollChange])

  const motto = MOTTOS[profile?.motto_index ?? 0]
  const [filtroStato, setFiltroStato] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [collapsed, setCollapsed] = useState({ 'Ritirata': true })
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [confirmBulkArchive, setConfirmBulkArchive] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)

  const stats = useMemo(() => [
    { emoji: '📞', label: 'Prima call', stato: 'Prima call',         color: '#A855F7' },
    { emoji: '🎙️', label: 'Colloquio', stato: 'Colloquio',          color: '#22C55E' },
    { emoji: '🎙️🎙️', label: '2° Col.',  stato: 'Secondo colloquio',  color: '#16A34A' },
    { emoji: '⏳', label: 'Attesa',     stato: 'In attesa risposta', color: '#EAB308' },
    { emoji: '📤', label: 'Inviata',    stato: 'Inviata',            color: '#3B82F6' },
    { emoji: '👀', label: 'Vista',      stato: 'Vista',              color: '#F97316' },
    { emoji: '❌', label: 'Rifiutata',  stato: 'Rifiutata',          color: '#EF4444' },
    { emoji: '😕', label: 'Non piace',  stato: 'Non mi piace',       color: '#6D28D9' },
    { emoji: '👻', label: 'Ghostate',   stato: 'GHOSTED',            color: '#6B7280' },
    { emoji: '💡', label: 'Spontanea',  stato: 'Spontanea',          color: '#9CA3AF' },
  ]
    .map(s => ({ ...s, count: candidature.filter(c => c.stato === s.stato).length }))
    .filter(s => s.count > 0),
  [candidature])

  const candidatureFiltrate = useMemo(() => {
    let list = candidature.filter(c => !c.archiviata)
    if (filtroStato) list = list.filter(c => c.stato === filtroStato)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(c =>
        c.azienda?.toLowerCase().includes(q) ||
        c.ruolo?.toLowerCase().includes(q) ||
        c.sede?.toLowerCase().includes(q) ||
        c.note?.toLowerCase().includes(q)
      )
    }
    return list
  }, [candidature, filtroStato, searchQuery])

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

  const handleDuplicate = async (cand) => {
    const { id, created_at, updated_at, user_id, ...rest } = cand
    await addCandidatura({ ...rest, stato: 'Inviata', data_invio: new Date().toISOString().split('T')[0], note: (rest.note ? rest.note + '\n' : '') + '[Duplicata]' })
  }

  const greet = getGreeting(nome)

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(candidatureFiltrate.map(c => c.id)))

  const handleBulkDelete = async () => {
    for (const id of selected) await deleteCandidatura(id)
    setSelected(new Set())
    setSelectMode(false)
    setConfirmBulkDelete(false)
  }

  const handleBulkArchive = async () => {
    for (const id of selected) await updateCandidatura(id, { archiviata: true })
    setSelected(new Set())
    setSelectMode(false)
    setConfirmBulkArchive(false)
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelected(new Set())
  }

  // ── NOTIFICATION PANEL ──────────────────────────────────────
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

  // ── EMPTY STATE ──────────────────────────────────────────────
  if (candidature.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <HomeHeader
          greet={greet} profile={profile}
          unread={unreadCount} onBell={() => setShowNotifs(true)}
          showSearch={showSearch}
          onToggleSearch={() => { setShowSearch(s => !s); setSearchQuery('') }}
        />
        {isGuest && (
          <div className="mx-4 mt-2 rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer active:opacity-80"
            style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.25), rgba(255,45,139,0.25))', border: '1px solid rgba(123,47,255,0.4)' }}
            onClick={() => setShowGuestModal(true)}>
            <span className="text-xl">👻</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-txt">Modalità ospite — i dati non sono salvati</p>
              <p className="text-xs text-muted">Tocca qui per creare un account gratuito →</p>
            </div>
          </div>
        )}
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
        {showGuestModal && (
          <GuestConvertModal
            onClose={() => setShowGuestModal(false)}
            onSuccess={() => setShowGuestModal(false)}
          />
        )}
      </div>
    )
  }

  // ── MAIN ────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <HomeHeader
        greet={greet} profile={profile}
        unread={unreadCount} onBell={() => setShowNotifs(true)}
        selectMode={selectMode}
        onSelectMode={() => setSelectMode(true)}
        onExitSelect={exitSelectMode}
        onSelectAll={selectAll}
        selectedCount={selected.size}
        totalCount={candidatureFiltrate.length}
        onDeleteSelected={() => selected.size > 0 && setConfirmBulkDelete(true)}
        onArchiveSelected={() => selected.size > 0 && setConfirmBulkArchive(true)}
        showSearch={showSearch}
        onToggleSearch={() => { setShowSearch(s => !s); setSearchQuery('') }}
      />

      {showSearch && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
            <input
              autoFocus
              className="input-field pl-9 pr-9 text-sm w-full"
              placeholder="Cerca azienda, ruolo, sede..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs active:scale-90">✕</button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 scrollable px-4 pt-2 pb-20" ref={scrollRef} onScroll={handleScroll}>

        {!selectMode && (
          <div className="card border-l-[3px] border-l-purple mb-4 flex items-center justify-between">
            <p className="text-sm italic text-purple-soft flex-1 leading-relaxed">{motto}</p>
            <button onClick={refreshMotto} className="text-muted text-base ml-3 active:scale-75 transition-transform">🔄</button>
          </div>
        )}

        {isGuest && (
          <div className="mx-1 mb-3 rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer active:opacity-80"
            style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.25), rgba(255,45,139,0.25))', border: '1px solid rgba(123,47,255,0.4)' }}
            onClick={() => setShowGuestModal(true)}>
            <span className="text-xl">👻</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-txt">Modalità ospite — i dati non sono salvati</p>
              <p className="text-xs text-muted">Tocca qui per creare un account gratuito →</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setFiltroStato(null)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 border text-xs font-semibold transition-all
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
            Filtro: <span className="text-purple-soft font-semibold">{filtroStato}</span> — {candidatureFiltrate.length} candidature
          </p>
        )}

        {STATUS_GROUP_ORDER.map(stato => {
          const items = grouped[stato]
          if (!items) return null
          const cfg = STATUS_CONFIG[stato]
          const isCollapsed = collapsed[stato]
          return (
            <div key={stato} className="mb-5">
              <button onClick={() => !selectMode && toggleGroup(stato)}
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
                {!selectMode && (
                  <span className="text-muted text-sm" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
                )}
              </button>
              {(!isCollapsed || selectMode) && items.map(c => (
                <CandidaturaCard
                  key={c.id} c={c}
                  onPress={() => selectMode ? toggleSelect(c.id) : onDetail(c)}
                  onLongPress={() => { setSelectMode(true); setSelected(new Set([c.id])) }}
                  selectMode={selectMode}
                  isSelected={selected.has(c.id)}
                />
              ))}
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        isOpen={confirmBulkDelete}
        title={`Elimina ${selected.size} candidature`}
        message={`Stai per eliminare ${selected.size} candidature. Questa azione è irreversibile.`}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
        danger
      />
      <ConfirmDialog
        isOpen={confirmBulkArchive}
        title={`Archivia ${selected.size} candidature`}
        message={`Le candidature archiviate spariscono dalla home ma restano salvate. Puoi vederle nel Profilo.`}
        onConfirm={handleBulkArchive}
        onCancel={() => setConfirmBulkArchive(false)}
      />

      {showGuestModal && (
        <GuestConvertModal
          onClose={() => setShowGuestModal(false)}
          onSuccess={() => setShowGuestModal(false)}
        />
      )}
    </div>
  )
}

function HomeHeader({ greet, profile, unread, onBell, selectMode, onExitSelect, onSelectAll, selectedCount, onDeleteSelected, onArchiveSelected, showSearch, onToggleSearch }) {
  return (
    <div className="px-5 pt-safe pt-4 pb-3 flex items-center justify-between flex-shrink-0">
      {selectMode ? (
        <>
          <div className="flex items-center gap-3">
            <button onClick={onExitSelect} className="text-muted text-sm active:scale-90">✕ Annulla</button>
            <span className="text-sm font-semibold text-txt">{selectedCount} selezionate</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onSelectAll} className="text-xs text-purple-soft font-medium">Tutte</button>
            <button onClick={onArchiveSelected}
              disabled={selectedCount === 0}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all
                ${selectedCount > 0 ? 'bg-surface border border-border text-muted active:scale-95' : 'bg-border text-disabled'}`}>
              📦 Archivia ({selectedCount})
            </button>
            <button onClick={onDeleteSelected}
              disabled={selectedCount === 0}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all
                ${selectedCount > 0 ? 'bg-red text-white active:scale-95' : 'bg-border text-disabled'}`}>
              🗑️ ({selectedCount})
            </button>
          </div>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-lg font-bold text-txt">{greet}</h1>
            {profile && <div className="mt-0.5"><LevelBadge xp={profile.xp_points || 0} /></div>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onToggleSearch}
              className={`p-2 active:scale-90 transition-transform rounded-xl ${showSearch ? 'bg-purple/20' : ''}`}>
              <span className="text-xl">🔍</span>
            </button>
            <button onClick={onBell} className="relative p-2 active:scale-90 transition-transform rounded-xl">
              <span className="text-xl">🔔</span>
              {unread > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red text-white text-[8px] rounded-full flex items-center justify-center font-bold px-1">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function DeadlineRow({ scadenza }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const deadline = new Date(scadenza); deadline.setHours(0,0,0,0)
  const diff = Math.round((deadline - today) / (1000 * 60 * 60 * 24))

  if (diff > 0) {
    return (
      <p className="text-xs font-semibold mt-1" style={{ color: '#34D399' }}>
        ⏰ Responso entro {diff} {diff === 1 ? 'giorno' : 'giorni'}
      </p>
    )
  } else if (diff === 0) {
    return (
      <p className="text-xs font-semibold mt-1" style={{ color: '#FBBF24' }}>
        ⏰ Responso atteso oggi!
      </p>
    )
  } else {
    const giorni = Math.abs(diff)
    return (
      <div className="mt-1">
        <p className="text-xs font-semibold" style={{ color: giorni <= 3 ? '#FBBF24' : '#F87171' }}>
          {giorni <= 3 ? '⚠️' : '🚨'} Dovevano rispondere {giorni} {giorni === 1 ? 'giorno' : 'giorni'} fa
        </p>
        {giorni > 3 && (
          <p className="text-[10px] font-medium mt-0.5" style={{ color: '#F87171' }}>
            💬 Considera di ricontattare il recruiter!
          </p>
        )}
      </div>
    )
  }
}

function CandidaturaCard({ c, onPress, onLongPress, selectMode, isSelected }) {
  const cfg = STATUS_CONFIG[c.stato] || STATUS_CONFIG['Inviata']
  const days = daysSince(c.data_invio)
  const isStale = days >= 14 && ['Inviata', 'In attesa risposta'].includes(c.stato)
  const lastUpdate = new Date(c.updated_at || c.created_at)
  const isRecent = (new Date() - lastUpdate) / (1000 * 60 * 60 * 24) <= 7

  const pressTimer = React.useRef(null)
  const startPos = React.useRef({ x: 0, y: 0 })
  const didScroll = React.useRef(false)

  const handleTouchStart = (e) => {
    didScroll.current = false
    startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    pressTimer.current = setTimeout(() => {
      if (!didScroll.current) onLongPress?.()
    }, 900)
  }
  const handleTouchMove = (e) => {
    const dx = Math.abs(e.touches[0].clientX - startPos.current.x)
    const dy = Math.abs(e.touches[0].clientY - startPos.current.y)
    if (dx > 8 || dy > 8) { didScroll.current = true; clearTimeout(pressTimer.current) }
  }
  const handleTouchEnd = () => { clearTimeout(pressTimer.current) }

  return (
    <div
      onClick={onPress}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={() => { pressTimer.current = setTimeout(() => onLongPress?.(), 900) }}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      className={`card mb-3 cursor-pointer active:scale-[0.98] transition-all ${isSelected ? 'ring-2 ring-purple' : ''}`}
      style={{
        borderLeft: `5px solid ${isStale ? '#FBBF24' : (['Inviata','Spontanea','Rifiutata','Non mi piace','GHOSTED'].includes(c.stato) ? 'rgba(255,255,255,0.1)' : cfg.color)}`,
      }}>
      {isStale && (
        <div className="flex items-center gap-1 mb-2 text-amber text-xs">
          <span>⚠️</span><span>Nessuna risposta da {days} giorni</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        {selectMode && (
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all
            ${isSelected ? 'bg-purple border-purple' : 'border-border'}`}>
            {isSelected && <span className="text-white text-xs font-bold">✓</span>}
          </div>
        )}
        <CompanyAvatar name={c.azienda} size={40} domain={c.azienda_domain} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-txt text-sm truncate">{c.azienda}</p>
              <p className="text-muted text-xs truncate">{c.ruolo}</p>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge stato={c.stato} />
            </div>
          </div>
          {(c.data_colloquio || c.data_secondo_colloquio) && (
            <div className="mt-1.5 space-y-0.5">
              {c.data_colloquio && (
                <p className="text-xs text-amber">📅 {c.data_secondo_colloquio ? '1° ' : ''}{formatDateTime(c.data_colloquio, c.ora_colloquio)}</p>
              )}
              {c.data_secondo_colloquio && (
                <p className="text-xs" style={{color:'#34D399'}}>📅 2° {formatDateTime(c.data_secondo_colloquio, c.ora_secondo_colloquio)}</p>
              )}
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted truncate">{[c.sede, c.paese].filter(Boolean).join(', ') || '—'}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {c.priorita && isRecent && <PriorityBadge priorita={c.priorita} />}
              <span className="text-xs text-muted font-medium">{days}gg fa</span>
            </div>
          </div>
          {c.data_scadenza_responso && <DeadlineRow scadenza={c.data_scadenza_responso} />}
        </div>
      </div>
    </div>
  )
}
