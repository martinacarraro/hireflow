import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import * as XLSX from 'xlsx'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { XpBar, SectionLabel } from '../components/UI'
import { BADGES } from '../lib/utils'

// Stringa template corretta e chiusa
const TEMPLATE_B64 = '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'

export default function Profile() {
  const { profile, updateProfile, notifications, markAllNotificationsRead, unreadCount, addBulkCandidature } = useApp()
  const { user, signOut } = useAuth()
  const { t, i18n } = useTranslation()

  const [showNotifs, setShowNotifs] = useState(false)
  const [editNome, setEditNome] = useState(false)
  const [nomeEdit, setNomeEdit] = useState(profile?.nome || '')
  const fileRef = useRef()

  const nome = profile?.nome || user?.email?.split('@')[0] || 'Utente'
  const foto = user?.user_metadata?.avatar_url
  const xp = profile?.xp_points || 0
  const earned = (profile?.badge_lista || '').split(',').filter(Boolean)
  const streak = profile?.streak_giorni || 0

  const downloadTemplate = () => {
    const bytes = atob(TEMPLATE_B64)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    const blob = new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'template.xlsx'
    document.body.appendChild(a); a.click()
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(ws)
    await addBulkCandidature(data)
  }

  if (showNotifs) return (
    <div className="screen">
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-white/5 flex-shrink-0">
        <button onClick={() => { setShowNotifs(false); markAllNotificationsRead() }} className="text-muted text-lg">←</button>
        <h2 className="font-bold text-txt">Notifiche</h2>
      </div>
      <div className="flex-1 scrollable px-4 py-4">
        {notifications.length === 0 ? <p className="text-center text-muted mt-10">Tutto tace...</p> : 
          notifications.map(n => <div key={n.id} className="card mb-2 text-sm">{n.title}</div>)}
      </div>
    </div>
  )

  return (
    <div className="screen">
      <div className="px-5 pt-safe pt-4 pb-2 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl font-bold text-txt">Il tuo Profilo</h2>
        <button onClick={() => setShowNotifs(true)} className="relative p-2 text-2xl">🔔
          {unreadCount > 0 && <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red text-white text-[9px] rounded-full flex items-center justify-center font-bold px-1">{unreadCount}</span>}
        </button>
      </div>

      <div className="flex-1 scrollable px-4 pb-8 space-y-4">
        {/* Avatar Card */}
        <div className="card flex items-center gap-4">
          {foto ? <img src={foto} className="w-16 h-16 rounded-full ring-2 ring-purple object-cover" /> : <div className="w-16 h-16 rounded-full bg-purple flex items-center justify-center text-white text-2xl font-bold">{nome.charAt(0).toUpperCase()}</div>}
          <div className="flex-1 min-w-0">
            {editNome ? (
              <div className="flex gap-2">
                <input className="input-field text-sm py-1" value={nomeEdit} onChange={e => setNomeEdit(e.target.value)} />
                <button onClick={() => { updateProfile({ nome: nomeEdit }); setEditNome(false) }} className="text-purple-soft font-medium">✓</button>
              </div>
            ) : (
              <button onClick={() => { setEditNome(true); setNomeEdit(nome) }}><p className="font-bold text-txt text-lg">{nome} <span className="text-xs text-muted">✏️</span></p></button>
            )}
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
        </div>

        {/* Livello e XP */}
        <div className="card">
          <SectionLabel>LIVELLO</SectionLabel>
          <XpBar xp={xp} genere={profile?.genere} />
          <div className="flex items-center mt-3">
            {streak > 1 && <p className="text-sm font-bold text-amber">🔥 {streak} giorni di fila</p>}
            <div className="ml-auto text-right">
              <p className="text-lg font-bold text-gold">{xp}</p>
              <p className="text-[10px] text-muted">XP TOTALI</p>
            </div>
          </div>
        </div>

        {/* Badge Section */}
        <div className="card">
          <SectionLabel>I TUOI BADGE</SectionLabel>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {BADGES.map(badge => (
              <div key={badge.id} className={`p-2 rounded-xl text-center flex flex-col items-center ${earned.includes(badge.id) ? 'bg-purple/20' : 'opacity-20 grayscale'}`}>
                <div className="w-8 h-8 mb-1" dangerouslySetInnerHTML={{ __html: badge.svg }} />
                <p className="text-[7px] uppercase font-bold leading-tight">{t(`badges.${badge.id}`)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strumenti Excel */}
        <div className="card space-y-3">
          <SectionLabel>STRUMENTI</SectionLabel>
          <button onClick={downloadTemplate} className="w-full py-3 bg-white/5 rounded-xl text-sm font-semibold border border-white/10 active:scale-95 transition-transform">Scarica Template Excel</button>
          <button onClick={() => fileRef.current?.click()} className="w-full py-3 bg-purple rounded-xl text-sm font-bold text-white active:scale-95 transition-transform">Carica Dati (.xlsx)</button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleImport} accept=".xlsx" />
        </div>

        {/* Lingua */}
        <div className="card">
          <SectionLabel>LINGUA 🌍</SectionLabel>
          <div className="flex gap-2 mt-2">
            <button onClick={() => i18n.changeLanguage('it')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${i18n.language === 'it' ? 'bg-purple text-white' : 'bg-white/5 border border-white/10'}`}>ITALIANO</button>
            <button onClick={() => i18n.changeLanguage('en')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${i18n.language === 'en' ? 'bg-purple text-white' : 'bg-white/5 border border-white/10'}`}>ENGLISH</button>
          </div>
        </div>

        <button onClick={() => signOut()} className="w-full py-4 text-red font-bold text-sm tracking-widest active:opacity-50">LOGOUT</button>
      </div>
    </div>
  )
}