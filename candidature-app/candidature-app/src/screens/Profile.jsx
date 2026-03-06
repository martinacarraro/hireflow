import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { XpBar, LevelBadge, SectionLabel, ConfirmDialog, Spinner } from '../components/UI'
import { BADGES, MOTTOS } from '../lib/utils'
import { supabase } from '../lib/supabase'

const STATI_VALIDI = ['Spontanea','Inviata','Vista','Prima call','Colloquio','In attesa risposta','Secondo colloquio','Non mi piace','Rifiutata','GHOSTED']
const STATO_ALIAS = {
  'inviata': 'Inviata', 'inviata!': 'Inviata', 'spontanea': 'Spontanea', 'vista': 'Vista',
  'call conoscitiva': 'Prima call', 'prima call': 'Prima call', 'call': 'Prima call',
  'colloquio': 'Colloquio', 'colloquio :)': 'Colloquio',
  'in attesa': 'In attesa risposta', 'in attesa risposta': 'In attesa risposta', 'in attesa responso': 'In attesa risposta',
  'secondo colloquio': 'Secondo colloquio', 'secondo colloquio :))': 'Secondo colloquio',
  'non mi piace': 'Non mi piace', 'rifiutato': 'Rifiutata', 'rifiutata': 'Rifiutata',
  'ghosted': 'GHOSTED', 'assunto': 'Inviata', 'offerta ricevuta': 'Inviata', 'ritirata': 'Non mi piace',
}
const TEMPLATE_B64 = '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'

export default function Profile() {
  const { profile, updateProfile, notifications, markAllNotificationsRead,
    unreadCount, refreshMotto, requestNotificationPermission, addBulkCandidature } = useApp()
  const { user, signOut } = useAuth()

  const [confirmSignOut, setConfirmSignOut]   = useState(false)
  const [confirmDelete, setConfirmDelete]     = useState(false)
  const [showNotifs, setShowNotifs]           = useState(false)
  const [editBio, setEditBio]                 = useState(false)
  const [editNome, setEditNome]               = useState(false)
  const [bio, setBio]                         = useState(profile?.bio_lavoro || '')
  const [nomeEdit, setNomeEdit]               = useState(profile?.nome || '')
  const [importing, setImporting]             = useState(false)
  const [importError, setImportError]         = useState('')
  const [selectedBadge, setSelectedBadge]     = useState(null)
  const fileRef = useRef()

  const nome   = profile?.nome || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utente'
  const foto   = user?.user_metadata?.avatar_url
  const xp     = profile?.xp_points || 0
  const earned = (profile?.badge_lista || '').split(',').filter(Boolean)
  const streak = profile?.streak_giorni || 0
  const motto  = MOTTOS[profile?.motto_index ?? 0]

  const downloadTemplate = () => {
    const bytes = atob(TEMPLATE_B64)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    const blob = new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'template_candidature_hireflow.xlsx'
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true); setImportError('')
    try {
      const buf  = await file.arrayBuffer()
      const wb   = XLSX.read(buf, { type: 'array', cellDates: true })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      const today = new Date().toISOString().split('T')[0]

      const fmtDate = (v) => {
        if (!v) return null
        if (v instanceof Date) return v.toISOString().slice(0,10)
        const s = String(v).trim()
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
        const m = s.match(/^(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})$/)
        if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
        const n = parseFloat(s)
        if (!isNaN(n) && n > 40000) return new Date(Math.round((n - 25569) * 86400 * 1000)).toISOString().slice(0,10)
        return null
      }

      const col = (row, ...keys) => {
        const rk = Object.keys(row)
        for (const k of keys) {
          const f = rk.find(h => h && h.toLowerCase().includes(k.toLowerCase()))
          if (f !== undefined && row[f] !== '' && row[f] !== null && row[f] !== undefined) return row[f]
        }
        return ''
      }

      const resolveStato = (raw) => {
        if (!raw) return 'Inviata'
        const key = String(raw).toLowerCase().trim()
        return STATO_ALIAS[key] || (STATI_VALIDI.includes(String(raw)) ? String(raw) : 'Inviata')
      }

      const parsed = rows
        .filter(r => {
          const az = String(col(r, 'aziend', 'company') || '').trim()
          return az && !az.startsWith('⚠') && az.toLowerCase() !== 'azienda'
        })
        .map(r => ({
          azienda: String(col(r, 'aziend', 'company') || '?').trim(),
          ruolo: String(col(r, 'ruol', 'role', 'posiz', 'job', 'titolo') || '—').trim(),
          stato: resolveStato(col(r, 'stato', 'status')),
          data_invio: (() => {
            const dataBase = fmtDate(col(r, 'data cand', 'data invio', 'invio', 'data')) || today
            const dataColl = fmtDate(col(r, 'data coll', 'colloquio'))
            // Se c'è una data colloquio, usala come ultima data di contatto
            return dataColl && dataColl > dataBase ? dataColl : dataBase
          })(),
          data_colloquio: fmtDate(col(r, 'data coll', 'colloquio')) || null,
          notifiche_push: true,
        }))

      if (parsed.length === 0) {
        setImportError('Nessuna riga valida trovata — assicurati che ci sia la colonna "Azienda".')
        setImporting(false); return
      }
      await addBulkCandidature(parsed)
    } catch (err) {
      setImportError('Errore: ' + (err.message || 'controlla il file e riprova.'))
      console.error('Import error:', err)
    }
    setImporting(false); e.target.value = ''
  }

  const handleDeleteAccount = async () => {
    try {
      await supabase.from('candidature').delete().eq('user_id', user.id)
      await supabase.from('user_profiles').delete().eq('id', user.id)
    } catch {}
    await signOut()
  }

  const handleShare = () => {
    const url = 'https://hireflow-mocha.vercel.app'
    const text = '🚀 Stai cercando lavoro? Ti presento Hireflow — il job tracker gratuito per tenere tutto sotto controllo: candidature, colloqui, notifiche e molto altro. Provalo!'
    if (navigator.share) navigator.share({ title: 'Hireflow', text, url })
    else navigator.clipboard.writeText(url).then(() => alert('Link copiato! 💜'))
  }

  // Notification panel
  if (showNotifs) return (
    <div className="screen">
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
        <button onClick={() => { setShowNotifs(false); markAllNotificationsRead() }} className="text-muted text-lg">←</button>
        <h2 className="font-bold text-txt">Notifiche 🔔</h2>
        {unreadCount > 0 && <button onClick={markAllNotificationsRead} className="ml-auto text-xs text-purple-soft">Segna lette</button>}
      </div>
      <div className="flex-1 scrollable px-4 py-4">
        {notifications.length === 0
          ? <div className="text-center py-16"><p className="text-4xl mb-2">🔕</p><p className="text-muted text-sm">Nessuna notifica ancora</p></div>
          : notifications.map(n => (
            <div key={n.id} className={`card mb-2 flex items-start gap-3 ${!n.read ? 'border-purple/30' : ''}`}>
              {!n.read && <div className="w-2 h-2 rounded-full bg-purple mt-1.5 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.read ? 'text-muted' : 'text-txt'}`}>{n.title}</p>
                <p className="text-xs text-muted mt-0.5">{n.body}</p>
                <p className="text-[10px] text-disabled mt-1">{new Date(n.time).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )

  return (
    <div className="screen">
      <div className="px-5 pt-safe pt-4 pb-2 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl font-bold text-txt">Profilo 👤</h2>
        <button onClick={() => setShowNotifs(true)} className="relative p-2">
          <span className="text-2xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red text-white text-[9px] rounded-full flex items-center justify-center font-bold px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 scrollable px-4 pb-8 space-y-4">

        {/* Avatar + nome */}
        <div className="card flex items-center gap-4">
          {foto
            ? <img src={foto} alt={nome} className="w-16 h-16 rounded-full ring-2 ring-purple object-cover" />
            : <div className="w-16 h-16 rounded-full bg-purple flex items-center justify-center text-white text-2xl font-bold">{nome.charAt(0).toUpperCase()}</div>
          }
          <div className="flex-1 min-w-0">
            {editNome ? (
              <div className="flex gap-2 mb-1">
                <input className="input-field text-sm py-1 flex-1" value={nomeEdit} onChange={e => setNomeEdit(e.target.value)} placeholder="Il tuo nome" />
                <button onClick={() => { updateProfile({ nome: nomeEdit }); setEditNome(false) }} className="text-purple-soft text-sm font-medium">✓</button>
              </div>
            ) : (
              <button onClick={() => { setEditNome(true); setNomeEdit(nome) }} className="text-left w-full">
                <p className="font-bold text-txt text-lg">{nome} <span className="text-xs text-muted">✏️</span></p>
              </button>
            )}
            <p className="text-xs text-muted truncate">{user?.email}</p>
            {editBio ? (
              <div className="mt-1 flex gap-2">
                <input className="input-field text-xs py-1 flex-1" value={bio} onChange={e => setBio(e.target.value)} placeholder="Es: UX Designer a Milano" />
                <button onClick={() => { updateProfile({ bio_lavoro: bio }); setEditBio(false) }} className="text-purple-soft text-xs font-medium">✓</button>
              </div>
            ) : (
              <button onClick={() => setEditBio(true)} className="text-left">
                <p className="text-sm text-purple-soft italic mt-0.5">{profile?.bio_lavoro || 'Aggiungi una bio... ✏️'}</p>
              </button>
            )}
          </div>
        </div>

        {/* XP */}
        <div className="card">
          <SectionLabel>IL TUO LIVELLO ⭐</SectionLabel>
          <XpBar xp={xp} />
          <div className="flex items-center mt-3">
            {streak > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🔥</span>
                <p className="text-sm font-bold text-amber">{streak} giorni di fila</p>
              </div>
            )}
            <div className="ml-auto text-right">
              <p className="text-lg font-bold text-gold">{xp}</p>
              <p className="text-[10px] text-muted">XP totali</p>
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="card">
          <SectionLabel>I TUOI BADGE 🏅</SectionLabel>
          <p className="text-xs text-muted mb-3">{earned.length}/{BADGES.length} sbloccati — tocca per info</p>
          <div className="grid grid-cols-4 gap-2">
            {BADGES.map(badge => {
              const isEarned = earned.includes(badge.id)
              return (
                <button key={badge.id} onClick={() => isEarned && setSelectedBadge(badge)}
                  className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all ${isEarned ? 'bg-purple/10 border-purple/30 active:scale-95' : 'bg-surface border-border opacity-40'}`}>
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
          <button onClick={refreshMotto} className="text-xs text-muted border border-border rounded-full px-3 py-1.5 active:scale-95">🔄 Cambia frase</button>
        </div>

        {/* Condividi */}
        <div className="card">
          <SectionLabel>CONDIVIDI CON CHI CERCA LAVORO 💌</SectionLabel>
          <p className="text-xs text-muted mb-3">Conosci qualcuno che sta mandando candidature? Mandagli Hireflow!</p>
          <button onClick={handleShare} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
            📤 Condividi Hireflow
          </button>
        </div>

        {/* Importa */}
        <div className="card">
          <SectionLabel>📥 IMPORTA CANDIDATURE</SectionLabel>
          <p className="text-xs text-muted mb-3 leading-relaxed">Scarica il template, compilalo e ricaricalo. Oppure usa un tuo Excel — rileva le colonne in automatico.</p>
          <button onClick={downloadTemplate} className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-sm mb-3">
            📄 Scarica template Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
            {importing ? <><Spinner size={16} /> Importazione...</> : '📤 Carica il tuo file Excel'}
          </button>
          {importError && <p className="text-xs text-red mt-2">{importError}</p>}
          <p className="text-[10px] text-disabled mt-2 text-center">Supporta .xlsx, .xls, .csv</p>
        </div>

        {/* Preferenze */}
        <div className="card">
          <SectionLabel>PREFERENZE 🔔</SectionLabel>
          <div className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm font-medium text-txt">🔔 Notifiche push</p>
              <p className="text-xs text-muted">Colloqui, ghosting, streak</p>
            </div>
            <button
              onClick={() => { const v = !(profile?.notifiche_push_globali ?? true); if (v) requestNotificationPermission(); updateProfile({ notifiche_push_globali: v }) }}
              className={`w-12 h-6 rounded-full transition-all duration-200 relative flex-shrink-0 ${(profile?.notifiche_push_globali ?? true) ? 'bg-purple' : 'bg-border'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${(profile?.notifiche_push_globali ?? true) ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
          </div>
          <p className="text-[10px] text-disabled mt-1 leading-relaxed">⚠️ Le notifiche su mobile richiedono che l'app sia installata come PWA.</p>
        </div>

        {/* Supporto */}
        <div className="card space-y-2">
          <SectionLabel>SUPPORTO</SectionLabel>
          <a href="mailto:feedback@hireflow.app" className="flex items-center gap-2 py-2 text-sm text-txt">💬 Dai il tuo feedback</a>
          <div className="border-t border-border" />
          <p className="text-xs text-disabled text-center pt-1">Hireflow v1.0 — Fatto con 💜</p>
        </div>

        {/* Account */}
        {user && (
          <div className="space-y-3 pb-4">
            <button onClick={() => setConfirmSignOut(true)}
              className="w-full py-3 rounded-2xl border font-semibold text-sm active:scale-95 transition-all"
              style={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
              🚪 Esci dall'account
            </button>
            <button onClick={() => setConfirmDelete(true)} className="btn-danger w-full py-3">
              🗑️ Elimina account
            </button>
          </div>
        )}
      </div>

      {/* Badge modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/60" onClick={() => setSelectedBadge(null)}>
          <div className="card max-w-xs w-full text-center" onClick={e => e.stopPropagation()}>
            <span className="text-5xl block mb-3">{selectedBadge.emoji}</span>
            <h3 className="font-bold text-txt text-lg mb-1">{selectedBadge.name}</h3>
            <p className="text-sm text-muted leading-relaxed">{selectedBadge.desc}</p>
            <button onClick={() => setSelectedBadge(null)} className="mt-4 text-xs text-purple-soft">Chiudi</button>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmSignOut} title="Esci dall'account"
        message="Sicuro/a? I tuoi dati rimarranno al sicuro."
        onConfirm={() => signOut()} onCancel={() => setConfirmSignOut(false)} />

      <ConfirmDialog isOpen={confirmDelete} title="Elimina account"
        message="Tutti i tuoi dati verranno eliminati definitivamente. Azione irreversibile."
        onConfirm={handleDeleteAccount} onCancel={() => setConfirmDelete(false)} danger />
    </div>
  )
}
