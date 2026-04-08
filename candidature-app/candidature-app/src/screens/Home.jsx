import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { StatusBadge, PriorityBadge, CompanyAvatar, LevelBadge, EmptyState, ConfirmDialog } from '../components/UI'
import { STATUS_CONFIG, STATUS_GROUP_ORDER, STATI, daysSince, formatDateTime, getGreeting, getMotto } from '../lib/utils'
import { useTranslation } from 'react-i18next'

function GuestConvertModal({ onClose, onSuccess }) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const { migrateGuestToAccount } = useApp()
  const { t, i18n } = useTranslation()

  const handle = async () => {
    if (!email || !password) return setError(t('home.compilaCampi'))
    if (password.length < 6) return setError(t('home.passwordMinimo'))
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
          <h3 className="font-bold text-txt text-lg">{t('home.salvaProgressi')}</h3>
          <p className="text-muted text-sm mt-1">{t('home.salvaProgressiDesc')}</p>
        </div>
        <input className="input-field" type="email" placeholder={t('login.tuaEmail')}
          value={email} onChange={e => setEmail(e.target.value)} />
        <input className="input-field" type="password" placeholder={t('home.scegliPassword')}
          value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="text-red text-xs text-center">{error}</p>}
        <button onClick={handle} disabled={loading}
          className="w-full py-3.5 rounded-2xl font-bold text-white transition-opacity"
          style={{ background: 'linear-gradient(135deg, #7B2FFF, #FF2D8B)', opacity: loading ? 0.6 : 1 }}>
          {loading ? t('home.salvataggio') : t('home.creaAccountSalva')}
        </button>
        <button onClick={onClose} className="w-full text-center text-muted text-sm py-2">
          {t('home.continuaOspite')}
        </button>
      </div>
    </div>
  )
}

export default function Home({ onAdd, onDetail, scrollPos = 0, onScrollChange, scrollToTop = 0 }) {
  const { candidature, profile, unreadCount, notifications, markAllNotificationsRead, deleteCandidatura, updateCandidatura, addCandidatura, migrateGuestToAccount } = useApp()
  const { user, isGuest } = useAuth()
  const { t, i18n } = useTranslation()

  // --- AGGIUNGI QUESTA RIGA ---
  // Filtriamo le candidature: mostriamo solo quelle NON archiviate
  const candidatureAttive = candidature.filter(c => !c.archiviata)
  // ----------------------------

  const nome = profile?.nome || user?.user_metadata?.full_name?.split(' ')[0] || ''
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current && scrollPos > 0) {
      scrollRef.current.scrollTop = scrollPos
    }
  }, [])

  useEffect(() => {
    if (scrollToTop > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [scrollToTop])

  const handleScroll = useCallback((e) => {
    onScrollChange?.(e.target.scrollTop)
  }, [onScrollChange])

  const motto = getMotto(i18n.language)
  const [filtroStato, setFiltroStato] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [collapsed, setCollapsed] = useState({ 'Ritirata': true })
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)

 const stats = useMemo(() => [
  { emoji: '📞', label: t('home.primaCall'),   stato: 'Prima call',         color: '#A855F7' },
  { emoji: '🎙️', label: t('home.colloquio'),   stato: 'Colloquio',           color: '#22C55E' },
  { emoji: '🎙️🎙️', label: t('home.secondoCol'), stato: 'Secondo colloquio', color: '#16A34A' },
  { emoji: '⏳', label: t('home.attesa'),      stato: 'In attesa risposta', color: '#EAB308' },
  { emoji: '📤', label: t('home.inviata'),     stato: 'Inviata',            color: '#3B82F6' },
  { emoji: '👀', label: t('home.vista'),       stato: 'Vista',              color: '#F97316' },
  { emoji: '❌', label: t('home.rifiutata'),   stato: 'Rifiutata',          color: '#EF4444' },
  { emoji: '😕', label: t('home.nonPiace'),    stato: 'Non mi piace',       color: '#6D28D9' },
  { emoji: '👻', label: t('home.ghostate'),    stato: 'GHOSTED',            color: '#6B7280' },
  { emoji: '💡', label: t('home.spontanea'),   stato: 'Spontanea',          color: '#9CA3AF' },
  { emoji: '🏆', label: t('home.offerta'),     stato: 'Offerta ricevuta',   color: '#FFD700' },
  { emoji: '📁', label: t('home.Archiviate'),  stato: 'Archiviate',         color: '#6B7280' },
]
.map(s => {
  // Usiamo 'c' come variabile per il filtro, 'row' non esiste qui
  const count = s.stato === 'Archiviate' 
    ? candidature.filter(c => c.archiviata === true).length
    : candidature.filter(c => c.stato === s.stato && !c.archiviata).length;
  
  return { ...s, count };
})
.filter(s => s.count > 0), [candidature, t]);

const candidatureFiltrate = useMemo(() => {
    let list = [...candidature];

    if (filtroStato === 'Archiviate') {
      // Mostra solo le archiviate (indipendentemente dallo stato originale)
      list = list.filter(c => c.archiviata === true);
    } 
    else if (filtroStato) {
      // Filtra per lo stato scelto, escludendo le archiviate
      list = list.filter(c => c.stato === filtroStato && !c.archiviata);
    } 
    else {
      // Default: nasconde sempre le archiviate dalla vista principale
      list = list.filter(c => !c.archiviata);
    }

    // Filtro per la barra di ricerca
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.azienda?.toLowerCase().includes(q) ||
        c.ruolo?.toLowerCase().includes(q) ||
        c.sede?.toLowerCase().includes(q)
      );
    }

    // Ordina per data (le più recenti sopra)
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [candidature, filtroStato, searchQuery]);

 const grouped = useMemo(() => {
    const groups = {};
    
    // Se stiamo visualizzando le archiviate, creiamo un gruppo unico dedicato
    if (filtroStato === 'Archiviate') {
      if (candidatureFiltrate.length > 0) {
        groups['Archiviate'] = candidatureFiltrate;
      }
      return groups;
    }

    // Altrimenti raggruppiamo normalmente usando l'ordine definito in utils.js
    STATUS_GROUP_ORDER.forEach(s => {
      const items = candidatureFiltrate.filter(c => c.stato === s);
      if (items.length > 0) {
        groups[s] = items;
      }
    });

    return groups;
  }, [candidatureFiltrate, filtroStato]);
  const toggleGroup = (s) => setCollapsed(c => ({ ...c, [s]: !c[s] }))

  const handleDuplicate = async (cand) => {
    const { id, created_at, updated_at, user_id, ...rest } = cand
    await addCandidatura({ ...rest, stato: 'Inviata', data_invio: new Date().toISOString().split('T')[0], note: (rest.note ? rest.note + '\n' : '') + '[Duplicata]' })
  }

  const greet = getGreeting(nome, i18n.language)

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(candidatureFiltrate.map(c => c.id)))

  const handleBulkDelete = async () => {
  for (const id of selected) {
    await deleteCandidatura(id)
  }
  setSelected(new Set())
  setSelectMode(false)
  setConfirmBulkDelete(false)
}

  const [confirmBulkArchive, setConfirmBulkArchive] = useState(false)

  const handleBulkArchive = async () => {
  for (const id of selected) {
    await updateCandidatura(id, { archiviata: true }); // CAMBIA SOLO IL BOOLEAN
  }
  setSelected(new Set());
  setSelectMode(false);
  setConfirmBulkArchive(false);
}

  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()) }

  if (showNotifs) {
    return (
      <div className="screen">
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
          <button onClick={() => { setShowNotifs(false); markAllNotificationsRead() }} className="text-muted text-lg">←</button>
          <h2 className="font-bold text-txt">{t('home.notifiche')}</h2>
        </div>
        <div className="flex-1 scrollable px-4 py-4">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-2">🔕</p>
              <p className="text-muted text-sm">{t('home.nessunaNotifica')}</p>
            </div>
          ) : notifications.map(n => (
            <div key={n.id}
              onClick={() => {
                if (n.candidaturaId) {
                  const cand = candidature.find(c => c.id === n.candidaturaId)
                  if (cand) { setShowNotifs(false); markAllNotificationsRead(); onDetail(cand) }
                }
              }}
              className={`card mb-2 flex items-start gap-3 ${!n.read ? 'border-purple/30' : ''} ${n.candidaturaId ? 'cursor-pointer active:scale-[0.98] transition-all' : ''}`}>
              {!n.read && <div className="w-2 h-2 rounded-full bg-purple mt-1.5 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.read ? 'text-muted' : 'text-txt'}`}>{n.title}</p>
                <p className="text-xs text-muted mt-0.5">{n.body}</p>
                <p className="text-[10px] text-disabled mt-1">
                  {new Date(n.time).toLocaleString(i18n.language === 'en' ? 'en-GB' : 'it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {n.candidaturaId && <span className="text-muted text-xs flex-shrink-0 mt-0.5">→</span>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (candidature.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <HomeHeader greet={greet} profile={profile} unread={unreadCount} onBell={() => setShowNotifs(true)} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <EmptyState
            emoji="📭"
            title={t('home.nessunaCandidatura')}
            subtitle={t('home.nessunaCandidaturaDesc')}
            action={
              <button onClick={onAdd} className="btn-primary mt-2 px-8">
                {t('home.aggiungiPrima')}
              </button>
            }
          />
        </div>
      </div>
    )
  }

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
              placeholder={t('home.cercaPlaceholder')}
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

      <div data-tutorial="card-list" className="flex-1 scrollable px-4 pt-2 pb-20" ref={scrollRef} onScroll={handleScroll}>
        {!selectMode && (
          <div className="card border-l-[3px] border-l-purple mb-4 flex items-center justify-between">
            <p className="text-sm italic text-purple-soft flex-1 leading-relaxed">{motto}</p>
          </div>
        )}

        {isGuest && (
          <div className="mx-1 mb-3 rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer active:opacity-80"
            style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.25), rgba(255,45,139,0.25))', border: '1px solid rgba(123,47,255,0.4)' }}
            onClick={() => setShowGuestModal(true)}>
            <span className="text-xl">👻</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-txt">{t('home.modalitaOspite')}</p>
              <p className="text-xs text-muted">{t('home.modalitaOspiteDesc')}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setFiltroStato(null)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 border text-xs font-semibold transition-all
              ${!filtroStato ? 'bg-purple border-purple text-white' : 'bg-surface border-border text-muted'}`}>
            {t('home.tutti')}
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
                   {cfg.emoji} {stato === 'Assunta'
  ? t(`home.statiLabel.${profile?.genere === 'm' ? 'Assunto' : profile?.genere === 'nb' ? 'Assunt*' : 'Assunta'}`)
  : t(`home.statiLabel.${stato}`, stato)}
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
                  genere={profile?.genere}
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
        title={t('home.eliminaTitle', { count: selected.size })}
        message={t('home.eliminaMsg', { count: selected.size })}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
        danger
      />
      <ConfirmDialog
        isOpen={confirmBulkArchive}
        title={t('home.archiviaTitle', { count: selected.size })}
        message={t('home.archiviaMsg')}
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

function HomeHeader({ greet, profile, unread, onBell, selectMode, onSelectMode, onExitSelect, onSelectAll, selectedCount, totalCount, onDeleteSelected, onArchiveSelected, showSearch, onToggleSearch }) {
  const { t, i18n } = useTranslation()
  return (
    <div className="px-5 pt-safe pt-4 pb-3 flex items-center justify-between flex-shrink-0">
      {selectMode ? (
        <>
          <div className="flex items-center gap-3">
            <button onClick={onExitSelect} className="text-muted text-sm active:scale-90">✕ {t('home.annulla')}</button>
            <span className="text-sm font-semibold text-txt">{selectedCount} {t('home.selezionate')}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onSelectAll} className="text-xs text-purple-soft font-medium">{t('home.tutte')}</button>
            <button onClick={onArchiveSelected}
              disabled={selectedCount === 0}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all
                ${selectedCount > 0 ? 'bg-surface border border-border text-muted active:scale-95' : 'bg-border text-disabled'}`}>
              📦 {t('home.archivia')} ({selectedCount})
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
            {profile && <div className="mt-0.5"><LevelBadge xp={profile.xp_points || 0} genere={profile.genere} /></div>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onToggleSearch}
              className={`p-2 active:scale-90 transition-transform rounded-xl ${showSearch ? 'bg-purple/20' : ''}`}>
              <span className="text-xl">🔍</span>
            </button>
            <button onClick={onBell} className="relative p-2 active:scale-90 transition-transform">
              <span className="text-2xl">🔔</span>
              {unread > 0 && (
                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red text-white text-[9px] rounded-full flex items-center justify-center font-bold px-1">
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
  const { t, i18n } = useTranslation()
  const today = new Date(); today.setHours(0,0,0,0)
  const deadline = new Date(scadenza); deadline.setHours(0,0,0,0)
  const diff = Math.round((deadline - today) / (1000 * 60 * 60 * 24))

  if (diff > 0) {
    return (
      <p className="text-xs font-semibold mt-1" style={{ color: '#34D399' }}>
        ⏰ {t('home.responsoEntro', { giorni: diff, label: diff === 1 ? t('home.giorno') : t('home.giorni') })}
      </p>
    )
  } else if (diff === 0) {
    return (
      <p className="text-xs font-semibold mt-1" style={{ color: '#FBBF24' }}>
        ⏰ {t('home.responsoOggi')}
      </p>
    )
  } else {
    const giorni = Math.abs(diff)
    return (
      <div className="mt-1">
        <p className="text-xs font-semibold" style={{ color: giorni <= 3 ? '#FBBF24' : '#F87171' }}>
          {giorni <= 3 ? '⚠️' : '🚨'} {t('home.dovevanoRispondere', { giorni, label: giorni === 1 ? t('home.giorno') : t('home.giorni') })}
        </p>
        {giorni > 3 && (
          <p className="text-[10px] font-medium mt-0.5" style={{ color: '#F87171' }}>
            💬 {t('home.consideraRicontattare')}
          </p>
        )}
      </div>
    )
  }
}

function CandidaturaCard({ c, onPress, onLongPress, selectMode, isSelected, genere }) {
  const cfg = STATUS_CONFIG[c.stato] || STATUS_CONFIG['Inviata']
  const days = daysSince(c.data_invio)
  const isStale = days >= 14 && ['Inviata', 'In attesa risposta'].includes(c.stato)
  const lastUpdate = new Date(c.updated_at || c.created_at)
  const isRecent = (new Date() - lastUpdate) / (1000 * 60 * 60 * 24) <= 7
  const STATI_ATTIVI = ['Inviata','Vista','Prima call','Colloquio','In attesa risposta','Secondo colloquio','Offerta ricevuta']
  const isActive = STATI_ATTIVI.includes(c.stato)
  const { t, i18n } = useTranslation()

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
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}>
      {isStale && (
        <div className="flex items-center gap-1 mb-2 text-amber text-xs">
          <span>⚠️</span><span>{t('home.nessunaRisposta', { giorni: days })}</span>
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
              <StatusBadge stato={c.stato} genere={genere} />
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
              {c.priorita && isRecent && isActive && <PriorityBadge priorita={c.priorita} />}
              <span className="text-xs text-muted font-medium">{days}{t('home.ggFa')}</span>
            </div>
          </div>
          {c.data_scadenza_responso && <DeadlineRow scadenza={c.data_scadenza_responso} />}
        </div>
      </div>
    </div>
  )
}