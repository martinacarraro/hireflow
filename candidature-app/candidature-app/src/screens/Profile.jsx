import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import * as XLSX from 'xlsx'
import { useApp } from '../contexts/AppContext'
import { XpBar, SectionLabel } from '../components/UI'
import { BADGES } from '../lib/utils'

const TEMPLATE_B64 = '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'

export default function Profile() {
  const {
    profile,
    updateProfile,
    notifications,
    markAllNotificationsRead,
    unreadCount,
    addBulkCandidature,
    candidature,
  } = useApp()

  const { t, i18n } = useTranslation()

  const changeLanguage = (lang) => {
    localStorage.setItem('lfs_lang', lang)
    localStorage.setItem('lingua', lang)
    i18n.changeLanguage(lang)
  }

  const [showNotifs, setShowNotifs] = useState(false)
  const [editNome, setEditNome] = useState(false)
  const [nomeEdit, setNomeEdit] = useState(profile?.nome || '')
  const fileRef = useRef(null)

  const isIt = i18n.language === 'it'
  const nome = profile?.nome || (isIt ? 'Utente' : 'User')
  const foto = null
  const xp = profile?.xp_points || 0
  const earned = (profile?.badge_lista || '').split(',').filter(Boolean)
  const streak = profile?.streak_giorni || 0

  const exportBackup = () => {
    const backup = {
      version: 1,
      exported_at: new Date().toISOString(),
      profile,
      candidature,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `le-faremo-sapere-backup-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadTemplate = () => {
    if (!TEMPLATE_B64) return

    const bytes = atob(TEMPLATE_B64)
    const arr = new Uint8Array(bytes.length)

    for (let i = 0; i < bytes.length; i += 1) {
      arr[i] = bytes.charCodeAt(i)
    }

    const blob = new Blob([arr], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_candidature.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(ws)

    await addBulkCandidature(data)

    if (fileRef.current) {
      fileRef.current.value = ''
    }
  }

  const deleteLocalData = () => {
    const confirmMessage = isIt
      ? 'Vuoi eliminare tutti i dati salvati su questo dispositivo? L’azione è irreversibile.'
      : 'Delete all data stored on this device? This cannot be undone.'
    if (!window.confirm(confirmMessage)) return

    Object.keys(localStorage)
      .filter(k => k.startsWith('lfs_'))
      .forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  if (showNotifs) {
    return (
      <div className="screen">
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-white/5 flex-shrink-0">
          <button
            onClick={() => {
              setShowNotifs(false)
              markAllNotificationsRead()
            }}
            className="text-muted text-lg"
          >
            ←
          </button>

          <h2 className="font-bold text-txt">
            {isIt ? 'Notifiche' : 'Notifications'}
          </h2>
        </div>

        <div className="flex-1 scrollable px-4 py-4">
          {notifications.length === 0 ? (
            <p className="text-center text-muted mt-10">Zzz...</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="card mb-2 text-sm">
                {n.title}
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="px-5 pt-safe pt-4 pb-2 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl font-bold text-txt">
          {isIt ? 'Profilo' : 'Profile'}
        </h2>

        <button
          onClick={() => {
            setShowNotifs(true)
            markAllNotificationsRead()
          }}
          className="relative p-2 text-2xl"
        >
          🔔
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red text-white text-[9px] rounded-full flex items-center justify-center font-bold px-1">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 scrollable px-4 pb-8 space-y-4">
        <div className="card flex items-center gap-4">
          {foto ? (
            <img
              src={foto}
              alt="Avatar"
              className="w-16 h-16 rounded-full ring-2 ring-purple object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple flex items-center justify-center text-white text-2xl font-bold">
              {nome.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {editNome ? (
              <div className="flex gap-2">
                <input
                  className="input-field text-sm py-1"
                  value={nomeEdit}
                  onChange={(e) => setNomeEdit(e.target.value)}
                />
                <button
                  onClick={() => {
                    updateProfile({ nome: nomeEdit })
                    setEditNome(false)
                  }}
                  className="text-purple-soft font-medium"
                >
                  ✓
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditNome(true)
                  setNomeEdit(nome)
                }}
              >
                <p className="font-bold text-txt text-lg">
                  {nome} <span className="text-xs text-muted">✏️</span>
                </p>
              </button>
            )}

            <p className="text-xs text-muted truncate">{isIt ? 'Dati salvati sul dispositivo' : 'Data stored on this device'}</p>
          </div>
        </div>

        <div className="card">
          <SectionLabel>{isIt ? 'LIVELLO' : 'LEVEL'}</SectionLabel>

          <XpBar xp={xp} genere={profile?.genere} />

          <div className="flex items-center mt-3">
            {streak > 1 && (
              <p className="text-sm font-bold text-amber">
                🔥 {streak} {isIt ? 'giorni di fila' : 'day streak'}
              </p>
            )}

            <div className="ml-auto text-right">
              <p className="text-lg font-bold text-gold">{xp}</p>
              <p className="text-[10px] text-muted">XP TOTALI</p>
            </div>
          </div>
        </div>

        <div className="card flex items-center justify-between bg-gradient-to-r from-purple/10 to-transparent border-l-4 border-purple/50">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-purple-soft uppercase tracking-widest mb-0.5">
              {isIt ? "Ti piace l'app?" : 'Enjoying the app?'}
            </p>
            <p className="text-sm font-bold text-txt">
              {isIt ? 'Offrimi un caffè' : 'Buy me a coffee'}
            </p>
          </div>

          <a
            href="https://ko-fi.com/lefaremosapere"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-lg shadow-purple/20"
          >
            ☕ {isIt ? 'Sostieni' : 'Support'}
          </a>
        </div>

        <div className="card">
          <SectionLabel>{isIt ? 'I TUOI BADGE' : 'YOUR BADGES'}</SectionLabel>

          <div className="grid grid-cols-4 gap-2 mt-3">
            {BADGES.map((badge) => {
              const isEarned = earned.includes(badge.id)

              return (
                <div
                  key={badge.id}
                  className={`p-2 rounded-xl text-center flex flex-col items-center ${
                    isEarned ? 'bg-purple/20' : 'opacity-20'
                  }`}
                >
                  {isEarned ? (
                    <div
                      className="w-8 h-8 mb-1"
                      dangerouslySetInnerHTML={{ __html: badge.svg }}
                    />
                  ) : (
                    <div className="w-8 h-8 mb-1 flex items-center justify-center text-xl font-bold text-muted">
                      ?
                    </div>
                  )}

                  <p className="text-[7px] uppercase font-bold leading-tight">
                    {isEarned ? t(`badges.${badge.id}`) : '???'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <SectionLabel>📁 {t('profile.import_title')}</SectionLabel>

          <p className="text-[11px] text-muted mb-3 leading-relaxed">
            {t('profile.import_description')}
          </p>

          <div className="space-y-2">
            <button
              onClick={downloadTemplate}
              className="w-full py-2 bg-white/5 rounded-xl text-xs font-semibold border border-white/10"
            >
              1. {isIt ? 'Scarica template Excel' : 'Download Excel template'}
            </button>

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-2 bg-purple rounded-xl text-xs font-bold text-white"
            >
              2. {isIt ? 'Carica il tuo file Excel' : 'Upload your Excel file'}
            </button>

            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleImport}
              accept=".xlsx"
            />
          </div>
        </div>

        <div className="card">
          <SectionLabel>LANGUAGE / LINGUA</SectionLabel>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => changeLanguage('it')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                i18n.language === 'it'
                  ? 'bg-purple text-white'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              ITALIANO
            </button>

            <button
              onClick={() => changeLanguage('en')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                i18n.language === 'en'
                  ? 'bg-purple text-white'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              ENGLISH
            </button>
          </div>
        </div>

        <div className="card">
          <SectionLabel>🔒 {isIt ? 'Privacy e dati' : 'Privacy & data'}</SectionLabel>
          <p className="text-[11px] text-muted leading-relaxed mb-3">
            {isIt
              ? 'Candidature, profilo, XP e checklist vengono salvati solo su questo dispositivo. Nessun account e nessuna sincronizzazione cloud.'
              : 'Applications, profile, XP and checklists are stored only on this device. No account and no cloud sync.'}
          </p>
          <button
            onClick={exportBackup}
            className="w-full py-2.5 rounded-xl text-xs font-semibold border border-white/10 bg-white/5 mb-2">
            {isIt ? '💾 Esporta backup locale' : '💾 Export local backup'}
          </button>
          <button
            onClick={deleteLocalData}
            className="w-full py-2.5 rounded-xl text-xs font-semibold border"
            style={{ borderColor:'rgba(248,113,113,0.35)', color:'#F87171', background:'rgba(248,113,113,0.06)' }}>
            {isIt ? '🗑️ Elimina tutti i dati locali' : '🗑️ Delete all local data'}
          </button>
        </div>

        <div className="pt-4 space-y-2">
          <div className="flex justify-center gap-4 mt-3 flex-wrap">
            <a
              href="https://lefaremosapere.vercel.app/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-white/50 hover:text-white/80"
            >
              {isIt ? 'Privacy' : 'Privacy Policy'}
            </a>

            <a
              href="https://lefaremosapere.vercel.app/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-white/50 hover:text-white/80"
            >
              {isIt ? 'Termini' : 'Terms'}
            </a>

            <a
              href="mailto:lefaremosapereapp@gmail.com?subject=Supporto%20Le%20faremo%20sapere"
              className="text-[11px] text-white/50 hover:text-white/80"
            >
              {isIt ? 'Supporto' : 'Support'}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}