import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import * as XLSX from 'xlsx'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { XpBar, SectionLabel, Spinner } from '../components/UI'
import { BADGES } from '../lib/utils'
import { supabase } from '../lib/supabase'

// Ho accorciato la visualizzazione qui, ma tu assicurati che finisca con ' (apice singolo)
const TEMPLATE_B64 = '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'

const getBadgeName = (badge, genere, t) => t(`badges.${badge.id}`);

export default function Profile() {
  const { profile, updateProfile, notifications, markAllNotificationsRead,
    unreadCount, addBulkCandidature, recalcXP } = useApp()
  const { user, signOut } = useAuth()

  // Stati
  const [showNotifs, setShowNotifs] = useState(false)
  const [editNome, setEditNome] = useState(false)
  const [nomeEdit, setNomeEdit] = useState(profile?.nome || '')
  const [importing, setImporting] = useState(false)
  const fileRef = useRef()
  const { t, i18n } = useTranslation()

  // Dati calcolati
  const nome = profile?.nome || user?.email?.split('@')[0] || 'Utente'
  const foto = user?.user_metadata?.avatar_url
  const xp = profile?.xp_points || 0
  const earned = (profile?.badge_lista || '').split(',').filter(Boolean)
  const streak = profile?.streak_giorni || 0

  const downloadTemplate = () => {
    try {
      const bytes = atob(TEMPLATE_B64)
      const arr = new Uint8Array(bytes.length)
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
      const blob = new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'template.xlsx'
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch (e) { console.error("Errore download", e) }
  }

  // ... (tutto il resto del return che abbiamo visto prima)
  return (
    <div className="screen p-4">
       {/* UI del profilo qui */}
       <h2 className="text-xl font-bold mb-4">Profilo di {nome}</h2>
       <div className="card p-4 bg-surface rounded-2xl mb-4">
          <SectionLabel>Livello</SectionLabel>
          <XpBar xp={xp} />
          <p className="mt-2 text-sm text-muted">{xp} XP Totali • Streak: {streak} giorni</p>
       </div>
       
       <button 
          onClick={downloadTemplate}
          className="w-full py-3 bg-purple rounded-xl font-bold text-white mb-4"
       >
          Scarica Template Excel
       </button>

       <button 
          onClick={() => signOut()} 
          className="w-full py-3 text-red font-bold"
       >
          Logout
       </button>
    </div>
  )
}