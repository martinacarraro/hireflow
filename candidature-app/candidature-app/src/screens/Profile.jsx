import { useState, useRef } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { XpBar, LevelBadge, SectionLabel, ConfirmDialog, Spinner } from '../components/UI'
import { BADGES, MOTTOS } from '../lib/utils'
import { supabase } from '../lib/supabase'

const STATI_VALIDI = ['Inviata','Call conoscitiva','Colloquio','Secondo colloquio','In attesa','Offerta ricevuta','Assunto','Rifiutato','GHOSTED','Ritirata']

export default function Profile() {
  const { profile, updateProfile, notifications, markAllNotificationsRead,
    unreadCount, refreshMotto, requestNotificationPermission, addBulkCandidature } = useApp()
  const { user, signOut } = useAuth()
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [editBio, setEditBio] = useState(false)
  const [editNome, setEditNome] = useState(false)
  const [bio, setBio] = useState(profile?.bio_lavoro || '')
  const [nomeEdit, setNomeEdit] = useState(profile?.nome || '')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const fileRef = useRef()

  const nome = profile?.nome || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utente'
  const foto = user?.user_metadata?.avatar_url
  const xp = profile?.xp_points || 0
  const earned = (profile?.badge_lista || '').split(',').filter(Boolean)
  const streak = profile?.streak_giorni || 0
  const motto = MOTTOS[profile?.motto_index ?? 0]

  const handleSignOut = async () => { await signOut() }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      await supabase.from('candidature').delete().eq('user_id', user.id)
      await supabase.from('user_profiles').delete().eq('id', user.id)
      await supabase.auth.admin?.deleteUser(user.id)
      await signOut()
    } catch {
      await signOut()
    }
    setDeletingAccount(false)
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true); setImportError('')
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      const today = new Date().toISOString().split('T')[0]
      const parsed = rows.filter(r => r['Azienda'] && r['Ruolo']).map(r => ({
        azienda: String(r['Azienda'] || '').trim(),
        ruolo: String(r['Ruolo'] || '').trim(),
        stato: STATI_VALIDI.includes(r['Stato']) ? r['Stato'] : 'Inviata',
        data_invio: r['Data Invio (YYYY-MM-DD)'] ? String(r['Data Invio (YYYY-MM-DD)']).slice(0,10) : today,
        data_colloquio: r['Data Colloquio (YYYY-MM-DD)'] ? String(r['Data Colloquio (YYYY-MM-DD)']).slice(0,10) : null,
        sede: String(r['Sede'] || '').trim() || null,
        paese: String(r['Paese'] || '').trim() || 'Italia',
        fonte: String(r['Fonte'] || '').trim() || 'Altro',
        stipendio_min: r['Stipendio Min (k€)'] ? parseInt(r['Stipendio Min (k€)']) : null,
        stipendio_max: r['Stipendio Max (k€)'] ? parseInt(r['Stipendio Max (k€)']) : null,
        note: String(r['Note'] || '').trim() || null,
        notifiche_push: true,
      }))
      if (parsed.length === 0) { setImportError('Nessuna riga valida trovata.'); setImporting(false); return }
      await addBulkCandidature(parsed)
    } catch { setImportError('Errore durante l\'importazione. Usa il template fornito.') }
    setImporting(false); e.target.value = ''
  }

  const handleShare = () => {
    const text = '🚀 Stai cercando lavoro? Prova Hireflow — traccia tutte le candidature, colloqui e notifiche in un posto solo. Gratis!\n\nhttps://hireflow-mocha.vercel.app'
    if (navigator.share) {
      navigator.share({ title: 'Hireflow', text, url: 'https://hireflow-mocha.vercel.app' })
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Link copiato! Condividilo con chi cerca lavoro 💜'))
    }
  }

  const Toggle = ({ value, onChange, label, sub }) => (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium text-txt">{label}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all duration-200 relative flex-shrink-0 ${value ? 'bg-purple' : 'bg-border'}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${value ? 'left-[26px]' : 'left-0.5'}`} />
      </button>
    </div>
  )

  if (showNotifs) {
    return (
      <div className="screen">
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
          <button onClick={() => { setShowNotifs(false); markAllNotificationsRead() }} className="text-muted text-lg">←</button>
          <h2 className="font-bold text-txt">Notifiche 🔔</h2>
          {unreadCount > 0 && (
            <button onClick={markAllNotificationsRead} className="ml-auto text-xs text-purple-soft">
              Segna tutto letto
            </button>
          )}
        </div>
        <div className="flex-1 scrollable px-4 py-4">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔕</div>
              <p className="text-muted text-sm">Nessuna notifica ancora.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n.id} className={`card flex items-start gap-3 ${!n.read ? 'border-purple/30' : ''}`}>
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
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      {/* Header con campanellino */}
      <div className="px-5 pt-safe pt-4 pb-2 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl font-bold text-txt">Profilo 👤</h2>
        <button onClick={() => setShowNotifs(true)} className="relative p-2">
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 scrollable px-4 pb-8 space-y-4">

        {/* User header */}
        <div className="card flex items-center gap-4">
          {foto ? (
            <img src={foto} alt={nome} className="w-16 h-16 rounded-full ring-2 ring-purple object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple ring-2 ring-purple/50 flex items-center justify-center text-white text-2xl font-bold">
              {nome.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {editNome ? (
              <div className="flex gap-2 mb-1">
                <input className="input-field text-sm py-1 flex-1"
                  value={nomeEdit} onChange={e => setNomeEdit(e.target.value)}
                  placeholder="Il tuo nome" />
                <button onClick={() => { updateProfile({ nome: nomeEdit }); setEditNome(false) }}
                  className="text-purple-soft text-sm font-medium">✓</button>
              </div>
            ) : (
              <button onClick={() => { setEditNome(true); setNomeEdit(nome) }} className="text-left w-full">
                <p className="font-bold text-txt text-lg">{nome} <span className="text-xs text-muted">✏️</span></p>
              </button>
            )}
            <p className="text-xs text-muted truncate">{user?.email}</p>
            {editBio ? (
              <div className="mt-1 flex gap-2">
                <input className="input-field text-xs py-1 flex-1"
                  value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Es: UX Designer a Milano 🎨" />
                <button onClick={() => { updateProfile({ bio_lavoro: bio }); setEditBio(false) }}
                  className="text-purple-soft text-xs font-medium">✓</button>
              </div>
            ) : (
              <button onClick={() => setEditBio(true)} className="text-left">
                <p className="text-sm text-purple-soft italic mt-0.5">
                  {profile?.bio_lavoro || 'Aggiungi una bio... ✏️'}
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Level & XP */}
        <div className="card">
          <SectionLabel>IL TUO LIVELLO ⭐</SectionLabel>
          <XpBar xp={xp} />
          <div className="flex items-center gap-4 mt-3">
            {streak > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-lg animate-streak">🔥</span>
                <div>
                  <p className="text-sm font-bold text-amber">{streak}</p>
                  <p className="text-[10px] text-muted">giorni di fila</p>
                </div>
              </div>
            )}
            <div className="text-right ml-auto">
              <p className="text-lg font-bold text-gold">{xp}</p>
              <p className="text-[10px] text-muted">XP totali</p>
            </div>
          </div>
        </div>

        {/* Badges - cliccabili */}
        <div className="card">
          <SectionLabel>I TUOI BADGE 🏅</SectionLabel>
          <p className="text-xs text-muted mb-3">{earned.length}/{BADGES.length} sbloccati — tocca un badge per info</p>
          <div className="grid grid-cols-4 gap-2">
            {BADGES.map(badge => {
              const isEarned = earned.includes(badge.id)
              return (
                <button key={badge.id}
                  onClick={() => isEarned && setSelectedBadge(badge)}
                  className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all
                    ${isEarned ? 'bg-purple/10 border-purple/30 active:scale-95' : 'bg-surface border-border opacity-40'}`}>
                  <span className="text-2xl mb-1">{isEarned ? badge.emoji : '🔒'}</span>
                  <p className="text-[9px] text-muted leading-tight">{isEarned ? badge.name : '???'}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Motto */}
        <div className="card border-l-[3px] border-l-purple">
          <SectionLabel>IL TUO MOTTO 💜</SectionLabel>
          <p className="text-sm italic text-purple-soft mb-3 leading-relaxed">"{motto}"</p>
          <button onClick={refreshMotto} className="text-xs text-muted border border-border rounded-full px-3 py-1.5 active:scale-95">
            🔄 Cambia frase
          </button>
        </div>

        {/* Condividi */}
        <div className="card">
          <SectionLabel>CONDIVIDI CON CHI CERCA LAVORO 💌</SectionLabel>
          <p className="text-xs text-muted mb-3">Conosci qualcuno che sta mandando candidature? Mandagli Hireflow!</p>
          <button onClick={handleShare}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
            📤 Condividi Hireflow
          </button>
        </div>

        {/* Importa */}
        <div className="card">
          <SectionLabel>📥 IMPORTA CANDIDATURE</SectionLabel>
          <p className="text-xs text-muted mb-3">Hai già un foglio Excel? Scarica il template, compilalo e caricalo.</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
            {importing ? <><Spinner size={16} /> Importazione...</> : '📤 Carica file Excel'}
          </button>
          {importError && <p className="text-xs text-red mt-2">{importError}</p>}
          <p className="text-[10px] text-disabled mt-2 text-center">Supporta .xlsx, .xls — usa il template Hireflow</p>
        </div>

        {/* Preferenze notifiche */}
        <div className="card">
          <SectionLabel>PREFERENZE 🔔</SectionLabel>
          <Toggle
            value={profile?.notifiche_push_globali ?? true}
            onChange={v => { if (v) requestNotificationPermission(); updateProfile({ notifiche_push_globali: v }) }}
            label="🔔 Notifiche push"
            sub="Promemoria colloqui, ghosting, streak"
          />
          <div className="border-t border-border pt-2.5 mt-1">
            <p className="text-xs text-muted mb-2">📅 Riepilogo settimanale</p>
            <div className="flex gap-2">
              {['Lunedì','Venerdì','Entrambi'].map(g => (
                <button key={g} onClick={() => updateProfile({ recap_giorno: g })}
                  className={`pill-btn text-xs flex-1 ${profile?.recap_giorno === g ? 'bg-purple border-purple text-white' : 'border-border text-muted'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-disabled mt-3 leading-relaxed">
            ⚠️ Le notifiche push su mobile richiedono che l'app sia installata come PWA e che il browser supporti le notifiche in background.
          </p>
        </div>

        {/* Supporto */}
        <div className="card space-y-2">
          <SectionLabel>SUPPORTO</SectionLabel>
          <a href="mailto:feedback@hireflow.app" className="flex items-center gap-2 py-2 text-sm text-txt active:text-muted">
            💬 Dai il tuo feedback
          </a>
          <div className="border-t border-border" />
          <p className="text-xs text-disabled text-center pt-1">Hireflow v1.0 — Fatto con 💜</p>
        </div>

        {/* Azioni account */}
        {user && (
          <div className="space-y-3">
            <button onClick={() => setConfirmSignOut(true)}
              className="w-full py-3 rounded-2xl border font-semibold text-sm active:scale-95 transition-all"
              style={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
              🚪 Esci dall'account
            </button>
            <button onClick={() => setConfirmDelete(true)}
              className="btn-danger w-full py-3">
              🗑️ Elimina account
            </button>
          </div>
        )}

      </div>

      {/* Badge detail modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/60"
          onClick={() => setSelectedBadge(null)}>
          <div className="card max-w-xs w-full text-center" onClick={e => e.stopPropagation()}>
            <span className="text-5xl block mb-3">{selectedBadge.emoji}</span>
            <h3 className="font-bold text-txt text-lg mb-1">{selectedBadge.name}</h3>
            <p className="text-sm text-muted leading-relaxed">{selectedBadge.desc}</p>
            <button onClick={() => setSelectedBadge(null)} className="mt-4 text-xs text-purple-soft">Chiudi</button>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmSignOut} title="Esci dall'account"
        message="Sicuro/a? I tuoi dati saranno al sicuro."
        onConfirm={handleSignOut} onCancel={() => setConfirmSignOut(false)} />

      <ConfirmDialog isOpen={confirmDelete} title="Elimina account"
        message="Attenzione! Tutti i tuoi dati e candidature verranno eliminati definitivamente. Questa azione è irreversibile."
        onConfirm={handleDeleteAccount} onCancel={() => setConfirmDelete(false)} danger />
    </div>
  )
}
