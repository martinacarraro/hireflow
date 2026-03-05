import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import {
  XP_EVENTS, BADGES, DEFAULT_CHECKLIST, getLevel, randomInt,
  isYesterday, isTomorrow, isToday, daysSince
} from '../lib/utils'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user } = useAuth()
  const [candidature, setCandidature] = useState([])
  const [profile, setProfile] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [toast, setToast] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── LOAD DATA ─────────────────────────────────────────────────

  const loadProfile = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('user_profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
    } else {
      // Create profile on first login
      const nome = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utente'
      const { data: newProfile } = await supabase
        .from('user_profiles')
        .insert({ id: user.id, nome, motto_index: randomInt(0, 9) })
        .select().single()
      setProfile(newProfile)
    }
  }, [user])

  const loadCandidature = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('candidature').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setCandidature(data || [])
  }, [user])

  useEffect(() => {
    if (user) {
      Promise.all([loadProfile(), loadCandidature()]).then(() => {
        setLoading(false)
        checkScheduledNotifications()
        updateStreak()
      })
    } else {
      setLoading(false)
    }
  }, [user])

  // ── CANDIDATURE CRUD ──────────────────────────────────────────

  const addCandidatura = async (data) => {
    const isFirst = candidature.length === 0
    const { data: row, error } = await supabase
      .from('candidature')
      .insert({ ...data, user_id: user.id })
      .select().single()
    if (error) { showToast('❌ Errore — riprova.', 'error'); return null }
    setCandidature(prev => [row, ...prev])
    const xp = isFirst ? XP_EVENTS.FIRST_CANDIDATURA : XP_EVENTS.ADD_CANDIDATURA
    await addXP(xp)
    showToast(`Aggiunta! 🚀 +${xp} XP`, 'success')
    if (isFirst) triggerConfetti()
    await checkBadges()
    return row
  }

  const updateCandidatura = async (id, updates) => {
    const prev = candidature.find(c => c.id === id)
    const { data: row, error } = await supabase
      .from('candidature').update(updates).eq('id', id).select().single()
    if (error) { showToast('❌ Errore — riprova.', 'error'); return }
    setCandidature(cs => cs.map(c => c.id === id ? row : c))

    // XP & events on stato change
    if (updates.stato && updates.stato !== prev?.stato) {
      if (updates.stato === 'Colloquio') {
        await addXP(XP_EVENTS.GOT_COLLOQUIO)
        showToast('🎙️ Colloquio! +15 XP 🎉', 'success')
        pushNotification('🎙️ Colloquio confermato!', `Preparati per ${prev?.azienda}. Checklist pronta! 💜`)
        await createChecklist(id)
      } else if (updates.stato === 'Offerta ricevuta') {
        await addXP(XP_EVENTS.OFFERTA)
        showToast('🏆 OFFERTA RICEVUTA! +20 XP 🎉🎉', 'success')
        triggerConfetti()
        pushNotification('🏆 OFFERTA DA ' + prev?.azienda + '!!', 'CE L\'HAI FATTA! 💜🚀')
      } else if (updates.stato === 'GHOSTED') {
        showToast(`👻 ${prev?.azienda} archiviata come GHOSTED.`, 'info')
        pushNotification('👻 GHOSTED', `${prev?.azienda} sparita nel nulla. Classici. Avanti! 💜`)
      } else {
        showToast('✅ Stato aggiornato!', 'success')
      }
      await checkBadges()
    }
    if (updates.feeling && !prev?.feeling_aggiornato) {
      await addXP(XP_EVENTS.FEELING_ADDED)
    }
    if (updates.note && updates.note.length > 10 && !prev?.note) {
      await addXP(XP_EVENTS.NOTE_ADDED)
    }
  }

  const deleteCandidatura = async (id) => {
    await supabase.from('candidature').delete().eq('id', id)
    setCandidature(cs => cs.filter(c => c.id !== id))
    showToast('🗑️ Candidatura eliminata.', 'info')
  }

  // ── CHECKLIST ─────────────────────────────────────────────────

  const createChecklist = async (candidaturaId) => {
    const items = DEFAULT_CHECKLIST.map((task, i) => ({
      user_id: user.id, candidatura_id: candidaturaId,
      task, fatto: false, ordine: i
    }))
    await supabase.from('checklist_items').insert(items)
  }

  const getChecklist = async (candidaturaId) => {
    const { data } = await supabase
      .from('checklist_items').select('*')
      .eq('candidatura_id', candidaturaId)
      .order('ordine')
    return data || []
  }

  const toggleChecklistItem = async (itemId, fatto) => {
    await supabase.from('checklist_items').update({ fatto }).eq('id', itemId)
    if (fatto) await addXP(XP_EVENTS.CHECKLIST_ITEM)
  }

  // ── XP & PROFILE ─────────────────────────────────────────────

  const addXP = async (amount) => {
    if (!profile) return
    const newXP = (profile.xp_points || 0) + amount
    await supabase.from('user_profiles').update({ xp_points: newXP }).eq('id', user.id)
    setProfile(p => ({ ...p, xp_points: newXP }))
  }

  const updateProfile = async (updates) => {
    await supabase.from('user_profiles').update(updates).eq('id', user.id)
    setProfile(p => ({ ...p, ...updates }))
  }

  const markOnboarded = () => updateProfile({ seen_onboarding: true })

  const updateStreak = async () => {
    if (!profile) return
    const today = new Date().toISOString().split('T')[0]
    const last = profile.ultimo_accesso
    let streak = profile.streak_giorni || 0
    if (last && isYesterday(last)) streak++
    else if (last !== today) streak = 1
    if (last !== today) {
      await supabase.from('user_profiles')
        .update({ streak_giorni: streak, ultimo_accesso: today })
        .eq('id', user.id)
      setProfile(p => ({ ...p, streak_giorni: streak, ultimo_accesso: today }))
    }
  }

  const refreshMotto = () => {
    const idx = randomInt(0, 9)
    updateProfile({ motto_index: idx })
  }

  // ── BADGES ───────────────────────────────────────────────────

  const checkBadges = async () => {
    if (!profile) return
    const earned = (profile.badge_lista || '').split(',').filter(Boolean)
    const stats = computeStats()
    const newBadges = []
    for (const badge of BADGES) {
      if (!earned.includes(badge.id) && badge.check(stats)) {
        newBadges.push(badge.id)
        showToast(`🏅 Badge sbloccato: ${badge.name}!`, 'badge')
        triggerConfetti()
        pushNotification(`🏅 Badge: ${badge.name}!`, badge.desc)
      }
    }
    if (newBadges.length) {
      const updated = [...earned, ...newBadges].join(',')
      await updateProfile({ badge_lista: updated })
    }
  }

  const computeStats = () => {
    const total = candidature.length
    const colloqui = candidature.filter(c => ['Colloquio','In attesa','Offerta ricevuta'].includes(c.stato)).length
    const ghosted = candidature.filter(c => c.stato === 'GHOSTED').length
    const offerte = candidature.filter(c => c.stato === 'Offerta ricevuta').length
    const withNotes = candidature.filter(c => c.note?.length > 5).length
    const withDates = candidature.filter(c => c.data_colloquio).length
    const countries = new Set(candidature.map(c => c.paese).filter(Boolean)).size
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const colloquiThisMonth = candidature.filter(c =>
      c.stato === 'Colloquio' && new Date(c.created_at) >= thisMonth
    ).length
    return { total, colloqui, ghosted, offerte, withNotes, withDates, countries, colloquiThisMonth, checklistComplete: 0, smartParsed: 0 }
  }

  // ── PUSH NOTIFICATIONS ────────────────────────────────────────

  const pushNotification = (title, body) => {
    const notif = { id: Date.now(), title, body, read: false, time: new Date().toISOString() }
    setNotifications(prev => [notif, ...prev.slice(0, 49)])
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png' })
    }
  }

  const checkScheduledNotifications = useCallback(() => {
    if (!candidature.length) return
    candidature.forEach(c => {
      if (!c.notifiche_push) return
      // Day before interview
      if (c.data_colloquio && isTomorrow(c.data_colloquio) && c.stato === 'Colloquio') {
        pushNotification(`⏰ Domani: ${c.azienda}!`, `Sei pronta? Controlla la checklist. 🐺✨`)
      }
      // Day of interview
      if (c.data_colloquio && isToday(c.data_colloquio) && c.stato === 'Colloquio') {
        pushNotification(`🌅 Oggi: ${c.azienda} ${c.ora_colloquio || ''}`, `Forza! Respira e mostragli chi sei. 💜`)
      }
      // Post-interview (day after, feeling not updated)
      if (c.data_colloquio && isYesterday(c.data_colloquio) && !c.feeling_aggiornato) {
        pushNotification(`☕ Com'è andato con ${c.azienda}?`, `Aggiorna lo stato e scrivi le impressioni! 📝`)
      }
      // 7 days waiting
      const days = daysSince(c.data_invio)
      if (c.stato === 'In attesa' && days >= 7 && days < 14 && !c.notifica_7gg_inviata) {
        pushNotification(`⏳ Notizie da ${c.azienda}?`, `Passata una settimana. Controlla la mail! 👀`)
        supabase.from('candidature').update({ notifica_7gg_inviata: true }).eq('id', c.id)
      }
      // 14 days waiting
      if (c.stato === 'In attesa' && days >= 14 && !c.notifica_14gg_inviata) {
        pushNotification(`📧 2 settimane senza risposta da ${c.azienda}`, `Considera un follow-up. Hai niente da perdere! 💪`)
        supabase.from('candidature').update({ notifica_14gg_inviata: true }).eq('id', c.id)
      }
      // Auto-GHOSTED at 30 days
      if (c.stato === 'Inviata' && days >= 30) {
        updateCandidatura(c.id, { stato: 'GHOSTED' })
        pushNotification(`👻 ${c.azienda} archiviata come GHOSTED`, `30 giorni di silenzio. Classici. Avanti! 💜`)
      }
    })
  }, [candidature])

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      return result === 'granted'
    }
    return false
  }

  const markAllNotificationsRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  const unreadCount = notifications.filter(n => !n.read).length

  // ── TOAST ─────────────────────────────────────────────────────

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 3000)
  }

  // ── CONFETTI ─────────────────────────────────────────────────

  const triggerConfetti = () => {
    setConfetti(true)
    setTimeout(() => setConfetti(false), 2000)
  }

  return (
    <AppContext.Provider value={{
      candidature, profile, notifications, toast, confetti,
      loading, unreadCount, computeStats,
      addCandidatura, updateCandidatura, deleteCandidatura,
      getChecklist, toggleChecklistItem,
      addXP, updateProfile, markOnboarded, refreshMotto,
      pushNotification, requestNotificationPermission,
      markAllNotificationsRead,
      showToast, triggerConfetti,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
