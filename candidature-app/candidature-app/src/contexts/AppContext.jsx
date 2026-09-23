import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import i18n from '../i18n'
import {
  XP_EVENTS, BADGES, DEFAULT_CHECKLIST, isYesterday, isToday
} from '../lib/utils'
import { migrateStoredLegacySession, recoverLegacyCloudData } from '../lib/legacyCloudMigration'

const AppContext = createContext(null)

const CANDIDATURE_KEY = 'lfs_candidature'
const PROFILE_KEY = 'lfs_profile'

function readLocalJson(primaryKey, legacyKey, fallback) {
  const raw = localStorage.getItem(primaryKey) ?? localStorage.getItem(legacyKey)
  if (!raw) return fallback
  try { return JSON.parse(raw) } catch { return fallback }
}

export function AppProvider({ children }) {
  const [candidature, setCandidature] = useState(() =>
    readLocalJson(CANDIDATURE_KEY, 'lfs_guest_candidature', [])
  )
  const [profile, setProfile] = useState(() =>
    readLocalJson(PROFILE_KEY, 'lfs_guest_profile', null)
  )
  const [notifications, setNotifications] = useState([])
  const [toast, setToast] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [loading, setLoading] = useState(true)
  const [migrationNotice, setMigrationNotice] = useState(null)
  const sentNotifs = useRef(new Set())

  const getLang = () => (i18n.language === 'en' ? 'en' : 'it')

  // --- Caricamento locale ---
  useEffect(() => {
    let active = true
    const loadData = async () => {
      const savedLang = localStorage.getItem('lfs_lang') || 'it'
      if (i18n.language !== savedLang) i18n.changeLanguage(savedLang)

      const localCand = readLocalJson(CANDIDATURE_KEY, 'lfs_guest_candidature', [])
      const localProf = readLocalJson(PROFILE_KEY, 'lfs_guest_profile', null)
      const defaultProfile = {
        id: 'local',
        nome: '',
        xp_points: 0,
        streak_giorni: 0,
        seen_onboarding: false,
        badge_lista: ''
      }

      let finalCand = localCand
      let finalProf = localProf || defaultProfile

      try {
        const migrated = await migrateStoredLegacySession(localCand, finalProf)
        if (migrated) {
          finalCand = migrated.candidature
          finalProf = migrated.profile
          setMigrationNotice({ type: 'success', ...migrated })
        }
      } catch {
        // La sessione resta sul dispositivo: il recupero potrà essere ritentato.
        setMigrationNotice({ type: 'error' })
      }

      if (!active) return
      setCandidature(finalCand)
      setProfile(finalProf)
      localStorage.setItem(CANDIDATURE_KEY, JSON.stringify(finalCand))
      localStorage.setItem(PROFILE_KEY, JSON.stringify(finalProf))
      localStorage.removeItem('lfs_guest_mode')
      setLoading(false)
    }

    loadData()
    return () => { active = false }
  }, [])

  // --- Salvataggio automatico locale ---
  useEffect(() => {
    localStorage.setItem(CANDIDATURE_KEY, JSON.stringify(candidature))
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  }, [candidature, profile])

  useEffect(() => {
    if (!loading && profile) updateStreak()
  }, [loading])

  // --- CRUD CANDIDATURE ---

  const addCandidatura = async (data) => {
    const isFirst = candidature.length === 0
    const _l = getLang()

    const row = { ...data, id: crypto.randomUUID?.() || Date.now().toString(), user_id: 'local', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    setCandidature(prev => [row, ...prev])
    const xp = isFirst ? XP_EVENTS.FIRST_CANDIDATURA : XP_EVENTS.ADD_CANDIDATURA
    await addXP(xp)
    showToast(_l === 'en' ? `🎉 Added! +${xp} XP` : `🎉 Aggiunta! +${xp} XP`, 'success')
    if (isFirst) triggerConfetti()
    await checkBadges()
    return row
  }

  const updateCandidatura = async (id, updates) => {
    const _l = getLang()
    const prev = candidature.find(c => c.id === id)

    try {
      setCandidature(prevList => prevList.map(c => 
        c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      ))

      if (updates.stato && updates.stato !== prev?.stato) {
        if (updates.stato === 'Colloquio') {
          await addXP(XP_EVENTS.GOT_COLLOQUIO)
          showToast(_l === 'en' ? '🎙️ Interview obtained! +15 XP' : '🎙️ Colloquio ottenuto! +15 XP', 'success')
          triggerConfetti()
          
          const pTitle = _l === 'en' ? '🎙️ Interview confirmed!' : '🎙️ Colloquio confermato!'
          const pBody = _l === 'en' ? `Ready for ${prev?.azienda}?` : `Pronto per ${prev?.azienda}?`
          pushNotification(pTitle, pBody, id)
          sendPushNow(pTitle, pBody)
          
          await createChecklist(id)
        } else if (updates.stato === 'Offerta ricevuta') {
          await addXP(XP_EVENTS.OFFERTA)
          showToast(_l === 'en' ? '🏆 OFFER! +50 XP' : '🏆 OFFERTA! +50 XP', 'success')
          triggerConfetti()
        } else if (updates.stato === 'Assunta') {
          await addXP(XP_EVENTS.OFFERTA)
          showToast(_l === 'en' ? '🏆 HIRED! 🎉' : '🏆 ASSUNTO/A! 🎉', 'success')
          triggerConfetti()
        } else if (updates.stato === 'GHOSTED') {
          showToast(_l === 'en' ? `👻 Ghosted by ${prev?.azienda}` : `👻 Ghosted da ${prev?.azienda}`, 'info')
        } else {
          showToast(_l === 'en' ? '✅ Saved!' : '✅ Salvato!', 'success')
        }
        await checkBadges()
      }
      if (updates.feeling && !prev?.feeling_aggiornato) await addXP(XP_EVENTS.FEELING_ADDED)
      if (updates.note && updates.note.length > 10 && !prev?.note) await addXP(XP_EVENTS.NOTE_ADDED)
    } catch (err) {
      console.error(err)
      showToast('Error', 'error')
    }
  }

  const deleteCandidatura = async (id) => {
    const _l = getLang()
    const cand = candidature.find(c => c.id === id)
    setCandidature(cs => {
      const updated = cs.filter(c => c.id !== id)
      setTimeout(() => recheckBadgesAfterDelete(updated), 100)
      return updated
    })

    if (cand) {
      const lost = xpForCandidatura(cand)
      await removeXP(lost)
      showToast(_l === 'en' ? `🗑️ Deleted. -${lost} XP` : `🗑️ Eliminata. -${lost} XP`, 'info')
    }
  }

  const addBulkCandidature = async (rows) => {
    const _l = getLang()
    const now = new Date().toISOString()
    const data = rows.map((r, i) => ({ ...r, id: crypto.randomUUID?.() || `${Date.now()}-${i}`, user_id: 'local', created_at: now, updated_at: now }))
    setCandidature(prev => [...data, ...prev])
    showToast(_l === 'en' ? '🎉 Imported!' : '🎉 Importate!', 'success')
    triggerConfetti()
    await checkBadges()
    return true
  }

  // --- LOGICA XP / PROFILE / STREAK ---

  const addXP = async (amount) => {
    setProfile(p => p ? ({ ...p, xp_points: (p.xp_points || 0) + amount }) : p)
  }

  const removeXP = async (amount) => {
    setProfile(p => p ? ({ ...p, xp_points: Math.max(0, (p.xp_points || 0) - amount) }) : p)
  }

  const xpForCandidatura = (cand) => {
    let xp = XP_EVENTS.ADD_CANDIDATURA
    if (['Colloquio','Secondo colloquio','Offerta ricevuta','Assunta'].includes(cand.stato)) xp += XP_EVENTS.GOT_COLLOQUIO
    if (cand.feeling) xp += XP_EVENTS.FEELING_ADDED
    return xp
  }

  const updateProfile = async (updates) => {
    setProfile(p => ({ ...p, ...updates }))
  }

  const updateStreak = async () => {
    if (!profile) return
    const today = new Date().toISOString().split('T')[0]
    const last = profile.ultimo_accesso
    let streak = profile.streak_giorni || 0
    if (last && isYesterday(last)) streak++
    else if (last !== today) streak = 1
    if (last !== today) {
      await updateProfile({ streak_giorni: streak, ultimo_accesso: today })
    }
  }

  // --- BADGES ---

 const computeStatsFrom = (list) => {
    if (!list || list.length === 0) return { total: 0, colloqui: 0, ghosted: 0, offerte: 0, referral: profile?.referral_count || 0 };

    return {
      total: list.length,
      // Conta i colloqui fatti (anche se poi archiviati)
      colloqui: list.filter(c => c.data_colloquio && c.data_colloquio !== '').length,
      // Conta i ghosted totali
      ghosted: list.filter(c => c.stato === 'GHOSTED').length,
      // Conta le offerte (indipendentemente se la card è in vista o in archivio)
      offerte: list.filter(c => c.stato === 'Offerta ricevuta' || c.stato === 'Assunta').length,
      referral: Number(profile?.referral_count || 0)
    };
  }

  const computeStats = () => computeStatsFrom(candidature)

  const checkBadges = async () => {
    if (!profile) return
    const earned = (profile.badge_lista || '').split(',').filter(Boolean)
    const stats = computeStats()
    const newBadges = []
    const _l = getLang()

    for (const badge of BADGES) {
      if (!earned.includes(badge.id) && badge.check(stats)) {
        newBadges.push(badge.id)
        showToast(_l === 'en' ? `🎉 Badge: ${badge.id}!` : `🎉 Badge sbloccato!`, 'success')
        pushNotification(`🏅 Badge!`, badge.id)
      }
    }
    if (newBadges.length) {
      await updateProfile({ badge_lista: [...earned, ...newBadges].join(',') })
      triggerConfetti()
    }
  }

  const recheckBadgesAfterDelete = async (remaining) => {
    if (!profile) return
    const stats = computeStatsFrom(remaining)
    const stillEarned = BADGES.filter(b => b.check(stats)).map(b => b.id).join(',')
    if (stillEarned !== (profile.badge_lista || '')) await updateProfile({ badge_lista: stillEarned })
  }

  // --- CHECKLIST ---

  const checklistKey = (cid) => `lfs_checklist_${cid}`

  const createChecklist = async (cid) => {
    if (localStorage.getItem(checklistKey(cid))) return
    const items = DEFAULT_CHECKLIST.map((task, i) => ({ id: `${cid}-${i}`, candidatura_id: cid, task, fatto: false, ordine: i }))
    localStorage.setItem(checklistKey(cid), JSON.stringify(items))
  }

  const getChecklist = async (cid) => {
    try { return JSON.parse(localStorage.getItem(checklistKey(cid)) || '[]') } catch { return [] }
  }

  const toggleChecklistItem = async (iid, fatto) => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('lfs_checklist_'))
    for (const key of keys) {
      let items = []
      try { items = JSON.parse(localStorage.getItem(key) || '[]') } catch {}
      if (items.some(i => i.id === iid)) {
        items = items.map(i => i.id === iid ? { ...i, fatto } : i)
        localStorage.setItem(key, JSON.stringify(items))
        break
      }
    }
    if (fatto) await addXP(XP_EVENTS.CHECKLIST_ITEM)
  }

  // --- NOTIFICHE & TOAST ---

  const pushNotification = (title, body, cid = null) => {
    const key = `${title}::${body}`
    if (sentNotifs.current.has(key)) return
    sentNotifs.current.add(key)
    const notif = { id: Date.now(), title, body, read: false, time: new Date().toISOString(), candidaturaId: cid }
    setNotifications(prev => [notif, ...prev.slice(0, 49)])
  }

  const sendPushNow = () => {}

  const checkScheduledNotifications = useCallback(() => {
    if (!candidature.length) return
    const _l = getLang()
    candidature.forEach(c => {
      if (c.data_colloquio && isToday(c.data_colloquio) && !sentNotifs.current.has(`today-${c.id}`)) {
        pushNotification(_l === 'en' ? 'Interview Today!' : 'Colloquio oggi!', c.azienda, c.id)
        sentNotifs.current.add(`today-${c.id}`)
      }
    })
  }, [candidature])

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return false
    const res = await Notification.requestPermission()
    return res === 'granted'
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), 3000)
  }

  const markOnboarded = async () => {
    await updateProfile({ seen_onboarding: true })
    localStorage.setItem('lfs_onboarding_done', '1')
  }

  const triggerConfetti = () => {
    setConfetti(true)
    setTimeout(() => setConfetti(false), 2000)
  }

  const recoverLegacyData = async (email, password) => {
    const migrated = await recoverLegacyCloudData(email, password, candidature, profile)
    setCandidature(migrated.candidature)
    setProfile(migrated.profile)
    setMigrationNotice({ type: 'success', ...migrated })
    return migrated
  }


  return (
    <AppContext.Provider value={{
      candidature, profile, notifications, toast, confetti, loading, migrationNotice, unreadCount: notifications.filter(n => !n.read).length,
      addCandidatura, updateCandidatura, deleteCandidatura, addBulkCandidature, getChecklist, toggleChecklistItem,
      addXP, removeXP, updateProfile, computeStats, checkBadges, triggerConfetti, showToast, markOnboarded,
      pushNotification, sendPushNow, requestNotificationPermission, recoverLegacyData,
      dismissMigrationNotice: () => setMigrationNotice(null),
      markAllNotificationsRead: () => setNotifications(n => n.map(x => ({...x, read: true})))
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
