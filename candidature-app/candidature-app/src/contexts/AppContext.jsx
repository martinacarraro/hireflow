import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import i18n from '../i18n'
import { useAuth } from './AuthContext'
import {
  XP_EVENTS, BADGES, DEFAULT_CHECKLIST, getLevel, randomInt,
  isYesterday, isTomorrow, isToday, daysSince
} from '../lib/utils'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user, isGuest, convertGuestToAccount } = useAuth()

  const [candidature, setCandidature] = useState(() => {
    if (localStorage.getItem('lfs_guest_mode')) {
      try { return JSON.parse(localStorage.getItem('lfs_guest_candidature') || '[]') } catch { return [] }
    }
    return []
  })
  const [profile, setProfile] = useState(() => {
    if (localStorage.getItem('lfs_guest_mode')) {
      try { return JSON.parse(localStorage.getItem('lfs_guest_profile') || 'null') } catch { return null }
    }
    return null
  })
  const [notifications, setNotifications] = useState([])
  const [toast, setToast] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [loading, setLoading] = useState(true)
  const sentNotifs = useRef(new Set())

  const getLang = () => (i18n.language === 'en' ? 'en' : 'it')

  const loadProfile = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
    } else {
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
  if (!user && !isGuest) {
    // Se non c'è né un utente né un ospite (es. post-logout), resetta tutto
    setCandidature([]);
    setProfile(null);
    setNotifications([]);
  }
}, [user, isGuest]);
  useEffect(() => {
    if (isGuest) {
      localStorage.setItem('lfs_guest_candidature', JSON.stringify(candidature))
    }
  }, [candidature, isGuest])

  useEffect(() => {
    if (isGuest && profile) {
      localStorage.setItem('lfs_guest_profile', JSON.stringify(profile))
    }
  }, [profile, isGuest])

  useEffect(() => {
    if (user) {
      Promise.all([loadProfile(), loadCandidature()]).then(() => {
        setLoading(false)
        checkScheduledNotifications()
        updateStreak()
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          requestNotificationPermission()
        }
      })
    } else if (isGuest) {
      if (!localStorage.getItem('lfs_guest_profile')) {
        const guestProfile = { id: 'guest', nome: 'Ospite', xp: 0, streak: 0, seen_onboarding: false, genere: null, motto_index: 0 }
        setProfile(guestProfile)
        localStorage.setItem('lfs_guest_profile', JSON.stringify(guestProfile))
      }
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [user, isGuest, loadProfile, loadCandidature])
  useEffect(() => {
  if (!user && isGuest) {
    // Quando entri come ospite, assicurati che i dati vecchi siano spariti
    // prima di caricare quelli (eventuali) dal localStorage del guest
    const guestCand = localStorage.getItem('lfs_guest_candidature');
    const guestProf = localStorage.getItem('lfs_guest_profile');

    setCandidature(guestCand ? JSON.parse(guestCand) : []);
    setProfile(guestProf ? JSON.parse(guestProf) : { 
      id: 'guest', nome: 'Ospite', xp: 0, streak: 0, seen_onboarding: false 
    });
  }
}, [user, isGuest]);

  // --- CRUD CANDIDATURE ---

  const addCandidatura = async (data) => {
    const isFirst = candidature.length === 0
    const _l = getLang()

    if (isGuest) {
      const row = { ...data, id: Date.now().toString(), user_id: 'guest', created_at: new Date().toISOString() }
      setCandidature(prev => [row, ...prev])
      const xp = isFirst ? XP_EVENTS.FIRST_CANDIDATURA : XP_EVENTS.ADD_CANDIDATURA
      showToast(_l === 'en' ? `Added! 🚀 +${xp} XP` : `Aggiunta! 🚀 +${xp} XP`, 'success')
      if (isFirst) triggerConfetti()
      return row
    }

    const { data: row, error } = await supabase
      .from('candidature')
      .insert({ ...data, user_id: user.id })
      .select().single()

    if (error) {
      showToast(_l === 'en' ? '❌ Error!' : '❌ Errore!', 'error')
      return null
    }

    setCandidature(prev => [row, ...prev])
    const xp = isFirst ? XP_EVENTS.FIRST_CANDIDATURA : XP_EVENTS.ADD_CANDIDATURA
    await addXP(xp)
    showToast(_l === 'en' ? `🎉 Added! +${xp} XP` : `🎉 Aggiunta! +${xp} XP`, 'success')
    triggerConfetti()
    await checkBadges()
    return row
  }

  const updateCandidatura = async (id, updates) => {
    const _l = getLang()
    const prev = candidature.find(c => c.id === id)

    try {
      if (!isGuest) {
        const { error } = await supabase.from('candidature').update(updates).eq('id', id)
        if (error) throw error
      }

      setCandidature(prevList => prevList.map(c => 
        c.id === id ? { ...c, ...updates } : c
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
          
          if (!isGuest) {
            const { data: exCl } = await supabase.from('checklist_items').select('id').eq('candidatura_id', id).limit(1)
            if (!exCl || exCl.length === 0) await createChecklist(id)
          }
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
    if (!isGuest) await supabase.from('candidature').delete().eq('id', id)
    
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
    const toInsert = rows.map(r => ({ ...r, user_id: user.id }))
    const { data, error } = await supabase.from('candidature').insert(toInsert).select()
    if (error) return false
    setCandidature(prev => [...(data || []), ...prev])
    showToast(_l === 'en' ? '🎉 Imported!' : '🎉 Importate!', 'success')
    triggerConfetti()
    await checkBadges()
    return true
  }

  // --- LOGICA XP / PROFILE / STREAK ---

  const addXP = async (amount) => {
    if (!profile || isGuest) return
    const { data: fresh } = await supabase.from('user_profiles').select('xp_points').eq('id', user.id).single()
    const newXP = (fresh?.xp_points || 0) + amount
    await supabase.from('user_profiles').update({ xp_points: newXP }).eq('id', user.id)
    setProfile(p => ({ ...p, xp_points: newXP }))
  }

  const removeXP = async (amount) => {
    if (!profile || isGuest) return
    const newXP = Math.max(0, (profile.xp_points || 0) - amount)
    await supabase.from('user_profiles').update({ xp_points: newXP }).eq('id', user.id)
    setProfile(p => ({ ...p, xp_points: newXP }))
  }

  const xpForCandidatura = (cand) => {
    let xp = XP_EVENTS.ADD_CANDIDATURA
    if (['Colloquio','Secondo colloquio','Offerta ricevuta','Assunta'].includes(cand.stato)) xp += XP_EVENTS.GOT_COLLOQUIO
    if (cand.feeling) xp += XP_EVENTS.FEELING_ADDED
    return xp
  }

  const updateProfile = async (updates) => {
    if (!isGuest) await supabase.from('user_profiles').update(updates).eq('id', user.id)
    setProfile(p => ({ ...p, ...updates }))
  }

  const updateStreak = async () => {
    if (!profile || isGuest) return
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

  const createChecklist = async (cid) => {
    if (isGuest) return
    const items = DEFAULT_CHECKLIST.map((task, i) => ({ user_id: user.id, candidatura_id: cid, task, fatto: false, ordine: i }))
    await supabase.from('checklist_items').insert(items)
  }

  const getChecklist = async (cid) => {
    if (isGuest) return []
    const { data } = await supabase.from('checklist_items').select('*').eq('candidatura_id', cid).order('ordine')
    return data || []
  }

  const toggleChecklistItem = async (iid, fatto) => {
    if (!isGuest) await supabase.from('checklist_items').update({ fatto }).eq('id', iid)
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

  const sendPushNow = (title, body) => {
    if (!user || isGuest) return
    supabase.from('user_profiles').select('push_subscription').eq('id', user.id).single()
      .then(({ data }) => {
        if (!data?.push_subscription) return
        fetch('/api/send-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: data.push_subscription, title, body })
        }).catch(() => {})
      })
  }

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

  const triggerConfetti = () => {
    setConfetti(true)
    setTimeout(() => setConfetti(false), 2000)
  }

  const migrateGuestToAccount = async (e, p) => {
    const data = [...candidature]; const { error } = await convertGuestToAccount(e, p)
    if (error) return { error }
    showToast('Migrating...', 'info'); return { success: true }
  }

  return (
    <AppContext.Provider value={{
      candidature, profile, notifications, toast, confetti, loading, unreadCount: notifications.filter(n => !n.read).length,
      addCandidatura, updateCandidatura, deleteCandidatura, addBulkCandidature, getChecklist, toggleChecklistItem,
      addXP, removeXP, updateProfile, computeStats, checkBadges, triggerConfetti, showToast, migrateGuestToAccount,
      pushNotification, sendPushNow, requestNotificationPermission, markAllNotificationsRead: () => setNotifications(n => n.map(x => ({...x, read: true})))
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)