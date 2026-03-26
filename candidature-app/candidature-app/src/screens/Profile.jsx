import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import * as XLSX from 'xlsx'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { XpBar, SectionLabel, Spinner } from '../components/UI'
import { BADGES } from '../lib/utils'
import { supabase } from '../lib/supabase'

const TEMPLATE_B64 = '...' // Mantieni la tua stringa base64 qui

const getBadgeName = (badge, genere, t) => t(`badges.${badge.id}`);

export default function Profile() {
  const { profile, updateProfile, notifications, markAllNotificationsRead,
    unreadCount, addBulkCandidature, recalcXP } = useApp()
  const { user, signOut } = useAuth()

  const [showNotifs, setShowNotifs] = useState(false)
  const [editBio, setEditBio] = useState(false)
  const [editNome, setEditNome] = useState(false)
  const [bio, setBio] = useState(profile?.bio_lavoro || '')
  const [nomeEdit, setNomeEdit] = useState(profile?.nome || '')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [recalcLoading, setRecalcLoading] = useState(false)
  
  const fileRef = useRef()
  const { t, i18n } = useTranslation()

  const nome = profile?.nome || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utente'
  const foto = user?.user_metadata?.avatar_url
  const xp = profile?.xp_points || 0
  const earned = (profile?.badge_lista || '').split(',').filter(Boolean)
  const streak = profile?.streak_giorni || 0

  // ... (mantieni qui le funzioni downloadTemplate, handleImport, handleShare, handleDeleteAccount)

  if (showNotifs) return (
    <div className="screen">
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
        <button onClick={() => { setShowNotifs(false); markAllNotificationsRead() }} className="text-muted text-lg">←</button>
        <h2 className="font-bold text-txt">{t('profile.notifiche')}</h2>
      </div>
      <div className="flex-1 scrollable px-4 py-4">
        {/* Lista notifiche... */}
      </div>
    </div>
  )

  return (
    <div className="screen">
      <div className="px-5 pt-safe pt-4 pb-2 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl font-bold text-txt">{t('profile.titolo')}</h2>
        <button onClick={() => setShowNotifs(true)} className="relative p-2 text-2xl">🔔
          {unreadCount > 0 && <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red text-white text-[9px] rounded-full flex items-center justify-center font-bold px-1">{unreadCount}</span>}
        </button>
      </div>

      <div className="flex-1 scrollable px-4 pb-8 space-y-4">
        {/* Banner caffè */}
        <a href="https://ko-fi.com/lefaremosapere" target="_blank" rel="noopener noreferrer" className="block w-full rounded-2xl px-4 py-3 text-center active:opacity-80 transition-all bg-purple/10 border border-purple/30">
          <p className="text-sm font-semibold text-txt">{t('profile.caffe')}</p>
        </a>

        {/* Avatar + nome */}
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

        {/* IL TUO LIVELLO */}
        <div className="card">
          <SectionLabel>{t('profile.tuoLivello')}</SectionLabel>
          <XpBar xp={xp} genere={profile?.genere} />
          <div className="flex items-center mt-3">
            {streak > 1 && <p className="text-sm font-bold text-amber">🔥 {streak} {t('profile.giorniDiFila')}</p>}
            <div className="ml-auto text-right">
              <p className="text-lg font-bold text-gold">{xp}</p>
              <p className="text-[10px] text-muted">{t('profile.xpTotali')}</p>
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="card">
          <SectionLabel>{t('profile.tuoiBadge')}</SectionLabel>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {/* ... Ciclo BADGES.map come prima */}
          </div>
        </div>

        {/* Importa */}
        <div className="card">
          <SectionLabel>{t('profile.importa')}</SectionLabel>
          <button onClick={downloadTemplate} className="btn-secondary w-full py-2.5 text-sm mb-3">{t('profile.scaricaTemplate')}</button>
          <button onClick={() => fileRef.current?.click()} className="btn-primary w-full py-2.5 text-sm">{t('profile.caricaExcel')}</button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleImport} />
        </div>

        {/* Preferenze Lingua */}
        <div className="card">
          <SectionLabel>{t('profile.linguaLabel')} 🌍</SectionLabel>
          <div className="flex gap-2 mt-2">
            <button onClick={() => i18n.changeLanguage('it')} className={`px-4 py-2 rounded-xl text-xs font-bold ${i18n.language === 'it' ? 'bg-purple text-white' : 'bg-white/5 border border-white/10'}`}>🇮🇹 IT</button>
            <button onClick={() => i18n.changeLanguage('en')} className={`px-4 py-2 rounded-xl text-xs font-bold ${i18n.language === 'en' ? 'bg-purple text-white' : 'bg-white/5 border border-white/10'}`}>🇬🇧 EN</button>
          </div>
        </div>

        {/* Logout */}
        <button onClick={() => signOut()} className="w-full py-4 text-red font-bold text-sm active:opacity-50 transition-opacity">
          {t('profile.logout')}
        </button>
      </div>
    </div>
  )
}