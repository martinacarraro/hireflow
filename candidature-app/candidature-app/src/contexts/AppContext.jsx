import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import {
  XP_EVENTS, BADGES, DEFAULT_CHECKLIST, getLevel, randomInt,
  isYesterday, isTomorrow, isToday, daysSince
} from '../lib/utils'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user, isGuest, convertGuestToAccount } = useAuth()
  const [candidature, setCandidature] = useState([])
  const [profile, setProfile] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [toast, setToast] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [loading, setLoading] = useState(true)
  const sentNotifs = useRef(new Set()) // dedup per sessione

  const loadProfile = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('user_profiles').select('*').eq('id', user.id).single()
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
    if (user) {
      Promise.all([loadProfile(), loadCandidature()]).then(() => {
        setLoading(false)
        checkScheduledNotifications()
        updateStreak()
        // Auto-salva subscription se il permesso è già granted
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          requestNotificationPermission()
        }
      })
    } else {
      setLoading(false)
    }
  }, [user])

  // ── CANDIDATURE CRUD ──────────────────────────────────────────

  const addCandidatura = async (data) => {
    const isFirst = candidature.length === 0
    if (isGuest) {
      const row = { ...data, id: Date.now().toString(), user_id: 'guest', created_at: new Date().toISOString() }
      setCandidature(prev => [row, ...prev])
      const xp = isFirst ? XP_EVENTS.FIRST_CANDIDATURA : XP_EVENTS.ADD_CANDIDATURA
      showToast(`Aggiunta! 🚀 +${xp} XP`, 'success')
      if (isFirst) triggerConfetti()
      return row
    }
    const { data: row, error } = await supabase
      .from('candidature')
      .insert({ ...data, user_id: user.id })
      .select().single()
    if (error) { showToast('❌ Qualcosa è andato storto — riprova!', 'error'); return null }
    setCandidature(prev => [row, ...prev])
    const xp = isFirst ? XP_EVENTS.FIRST_CANDIDATURA : XP_EVENTS.ADD_CANDIDATURA
    await addXP(xp)
    showToast(`🎉 Candidatura aggiunta! +${xp} XP`, 'success')
    if (isFirst) { triggerConfetti() } else { triggerConfetti() }
    await checkBadges()
    return row
  }

  const addBulkCandidature = async (rows) => {
    // Only send fields that exist in the DB schema
    const ALLOWED = ['azienda','ruolo','stato','data_invio','data_colloquio','sede','paese','fonte','priorita','stipendio_min','stipendio_max','note','link_annuncio','ora_colloquio','tipo_colloquio','feeling','telefono_azienda','data_scadenza_responso','azienda_domain','contatto_hr','email_hr','telefono_hr','linkedin_hr','data_secondo_colloquio','ora_secondo_colloquio','archiviata','welfare','welfare_note','reminder_date','reminder_time','reminder_note']
    const toInsert = rows.map(r => {
      const clean = { user_id: user.id }
      ALLOWED.forEach(k => { if (r[k] !== undefined && r[k] !== null && r[k] !== '') clean[k] = r[k] })
      return clean
    })
    const { data, error } = await supabase
      .from('candidature').insert(toInsert).select()
    if (error) {
      console.error('Bulk insert error:', error)
      showToast('❌ ' + (error.message || 'Errore importazione.'), 'error')
      return false
    }
    setCandidature(prev => [...(data || []), ...prev])
    showToast(`🎉 ${data.length} candidature importate!`, 'success')
    triggerConfetti()
    await checkBadges()
    return true
  }

  const migrateGuestToAccount = async (email, password) => {
    const guestData = [...candidature] // snapshot before auth change
    const { error } = await convertGuestToAccount(email, password)
    if (error) return { error }
    // Wait for auth state to update and get new user
    return new Promise((resolve) => {
      const unsub = supabase.auth.onAuthStateChange(async (_, session) => {
        if (session?.user) {
          unsub.data.subscription.unsubscribe()
          // Migrate all guest candidature to Supabase
          if (guestData.length > 0) {
            const rows = guestData.map(({ id, user_id, ...rest }) => ({
              ...rest,
              user_id: session.user.id,
            }))
            const { error: insertError } = await supabase
              .from('candidature').insert(rows)
            if (insertError) {
              showToast('⚠️ Account creato ma errore nel salvataggio dati.', 'error')
            } else {
              showToast(`✅ Account creato! ${guestData.length} candidature salvate 🎉`, 'success')
              triggerConfetti()
            }
          } else {
            showToast('✅ Account creato con successo!', 'success')
          }
          resolve({ success: true })
        }
      })
    })
  }

  const updateCandidatura = async (id, updates) => {
    const prev = candidature.find(c => c.id === id)
    // Preserve data_colloquio e ora_colloquio — non cancellarli MAI se già presenti nel DB
    if (prev?.data_colloquio && !updates.data_colloquio) {
      updates = { ...updates, data_colloquio: prev.data_colloquio }
    }
    if (prev?.ora_colloquio && !updates.ora_colloquio) {
      updates = { ...updates, ora_colloquio: prev.ora_colloquio }
    }
    if (prev?.data_secondo_colloquio && !updates.data_secondo_colloquio) {
      updates = { ...updates, data_secondo_colloquio: prev.data_secondo_colloquio }
    }
    // Filter to only DB fields
    const ALLOWED_UPDATE = ['azienda','ruolo','stato','data_invio','data_colloquio','sede','paese','fonte','priorita','stipendio_min','stipendio_max','note','link_annuncio','ora_colloquio','tipo_colloquio','feeling','telefono_azienda','data_scadenza_responso','azienda_domain','contatto_nome','contatto_email','contatto_hr','email_hr','telefono_hr','linkedin_hr','data_secondo_colloquio','ora_secondo_colloquio','archiviata','welfare','welfare_note','reminder_date','reminder_time','reminder_note']
    const clean = {}
    ALLOWED_UPDATE.forEach(k => { if (updates[k] !== undefined) clean[k] = updates[k] })
    const { data: row, error } = await supabase
      .from('candidature').update(clean).eq('id', id).select().single()
    if (error) { showToast('❌ Qualcosa è andato storto — riprova!', 'error'); return }
    setCandidature(cs => cs.map(c => c.id === id ? row : c))

    if (updates.stato && updates.stato !== prev?.stato) {
      if (updates.stato === 'Colloquio') {
        await addXP(XP_EVENTS.GOT_COLLOQUIO)
        showToast(profile?.genere === 'm' ? '🎙️ Colloquio ottenuto! +15 XP' : profile?.genere === 'nb' ? '🎙️ Colloquio ottenut*! +15 XP' : '🎙️ Colloquio ottenuto! +15 XP', 'success'); triggerConfetti()
        pushNotification('🎙️ Colloquio confermato!', `Tutto pronto per ${prev?.azienda}? Checklist attivata! 💜'`, id)
        await createChecklist(id)
      } else if (updates.stato === 'Offerta ricevuta') {
        await addXP(XP_EVENTS.OFFERTA)
        showToast(profile?.genere === 'm' ? '🏆 OFFERTA RICEVUTA! +50 XP 🎉' : '🏆 OFFERTA RICEVUTA! +50 XP 🎉', 'success')
        triggerConfetti()
        pushNotification('🏆 OFFERTA DA ' + prev?.azienda + '!!', profile?.genere === 'm' ? 'CE L\'HAI FATTA! 💜🚀' : 'CE L\'HAI FATTA! 💜🚀', id)
      } else if (updates.stato === 'Assunto') {
        await addXP(XP_EVENTS.OFFERTA)
        showToast(profile?.genere === 'm' ? '🏆 SEI STATO ASSUNTO! 🎉🎉' : profile?.genere === 'nb' ? '🏆 SEI STAT* ASSUNT*! 🎉🎉' : '🏆 SEI STATA ASSUNTA! 🎉🎉', 'success')
        triggerConfetti()
        pushNotification('🏆 ASSUNTA DA ' + prev?.azienda + '!!', 'CE L\'HAI FATTA! 💜🚀', id)
      } else if (updates.stato === 'GHOSTED') {
        showToast(`👻 ${prev?.azienda} → GHOSTED. Prossima!`, 'info')
        pushNotification('👻 GHOSTED', `${prev?.azienda} sparita nel nulla. Avanti! 💜`, id)
      } else {
        showToast('✅ Salvato!', 'success')
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
    const cand = candidature.find(c => c.id === id)
    await supabase.from('candidature').delete().eq('id', id)
    setCandidature(cs => {
      const updated = cs.filter(c => c.id !== id)
      setTimeout(() => recheckBadgesAfterDelete(updated), 100)
      return updated
    })
    // Sottrai XP guadagnati con questa candidatura
    if (cand) {
      const lost = xpForCandidatura(cand)
      await removeXP(lost)
      showToast(`🗑️ Eliminata. -${lost} XP`, 'info')
    } else {
      showToast('🗑️ Eliminata.', 'info')
    }
  }

  const recheckBadgesAfterDelete = async (remaining) => {
    if (!profile) return
    const stats = computeStatsFrom(remaining)
    const stillEarned = BADGES.filter(b => b.check(stats)).map(b => b.id)
    const updated = stillEarned.join(',')
    if (updated !== (profile.badge_lista || '')) {
      await updateProfile({ badge_lista: updated })
    }
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
    if (!data || data.length === 0) {
      // Auto-create if missing
      await createChecklist(candidaturaId)
      const { data: data2 } = await supabase
        .from('checklist_items').select('*')
        .eq('candidatura_id', candidaturaId)
        .order('ordine')
      return data2 || []
    }
    return data
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

  const removeXP = async (amount) => {
    if (!profile) return
    const newXP = Math.max(0, (profile.xp_points || 0) - amount)
    await supabase.from('user_profiles').update({ xp_points: newXP }).eq('id', user.id)
    setProfile(p => ({ ...p, xp_points: newXP }))
  }

  // Calcola quanti XP ha generato una candidatura
  const xpForCandidatura = (cand) => {
    let xp = XP_EVENTS.ADD_CANDIDATURA // 5 base
    if (['Colloquio','Prima call','Secondo colloquio','In attesa risposta','Offerta ricevuta','Assunta'].includes(cand.stato)) {
      xp += XP_EVENTS.GOT_COLLOQUIO // +15
    }
    if (cand.stato === 'Offerta ricevuta' || cand.stato === 'Assunta') {
      xp += XP_EVENTS.OFFERTA // +20
    }
    if (cand.feeling) xp += XP_EVENTS.FEELING_ADDED // +3
    if (cand.note && cand.note.length > 10) xp += XP_EVENTS.NOTE_ADDED // +3
    return xp
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
        showToast(`🎉 Badge sbloccato: ${badge.name}!`, 'success')
        triggerConfetti()
        pushNotification(`🏅 Badge: ${badge.name}!`, badge.desc)
      }
    }
    if (newBadges.length) {
      const updated = [...earned, ...newBadges].join(',')
      await updateProfile({ badge_lista: updated })
    }
  }

  const computeStatsFrom = (list) => {
    const total = list.length
    const colloqui = list.filter(c => ['Prima call','Colloquio','Secondo colloquio','In attesa risposta','Non mi piace','Rifiutata','GHOSTED'].includes(c.stato) || c.data_colloquio).length
    const ghosted = list.filter(c => c.stato === 'GHOSTED').length
    const offerte = list.filter(c => c.stato === 'Offerta ricevuta').length
    const withNotes = list.filter(c => c.note?.length > 5).length
    const withDates = list.filter(c => c.data_colloquio).length
    const countries = new Set(list.map(c => c.paese).filter(Boolean)).size
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const colloquiThisMonth = list.filter(c =>
      c.data_colloquio && new Date(c.data_colloquio) >= thisMonth
    ).length
    const withLink = list.filter(c => c.link_annuncio).length
    const secondi = list.filter(c => c.data_secondo_colloquio || c.stato === 'Secondo colloquio').length
    const spontanee = list.filter(c => c.stato === 'Spontanea' || c.fonte === 'Spontanea').length
    const todayStr = new Date().toISOString().split('T')[0]
    const todayCount = list.filter(c => c.data_invio === todayStr).length
    // week streak: count consecutive weeks with >= 1 candidatura
    const byWeek = {}
    list.forEach(c => {
      const d = new Date(c.data_invio || c.created_at)
      const week = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000))
      byWeek[week] = true
    })
    const weeks = Object.keys(byWeek).map(Number).sort((a,b) => b-a)
    let weekStreak = 0
    const nowWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
    for (let i = 0; i < weeks.length; i++) {
      if (weeks[i] === nowWeek - i) weekStreak++
      else break
    }
    return { total, colloqui, ghosted, offerte, withNotes, withDates, countries, colloquiThisMonth, checklistComplete: 0, smartParsed: withLink, secondi, spontanee, todayCount, weekStreak }
  }

  const computeStats = () => computeStatsFrom(candidature)

  // ── PUSH NOTIFICATIONS (con dedup) ────────────────────────────

  const pushNotification = (title, body, candidaturaId = null) => {
    const key = `${title}::${body}`
    if (sentNotifs.current.has(key)) return // dedup
    sentNotifs.current.add(key)
    const notif = { id: Date.now(), title, body, read: false, time: new Date().toISOString(), candidaturaId }
    setNotifications(prev => [notif, ...prev.slice(0, 49)])
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png' })
    }
  }

  const checkScheduledNotifications = useCallback(() => {
    if (!candidature.length) return
    candidature.forEach(c => {
      if (!c.notifiche_push) return
      const days = daysSince(c.data_invio)

      // Giorno prima del colloquio
      if (c.data_colloquio && isTomorrow(c.data_colloquio) && ['Colloquio','Secondo colloquio','Call conoscitiva'].includes(c.stato)) {
        pushNotification(`⏰ Domani: ${c.azienda}!`, `Tutto pronto? Controlla la checklist. 🐺✨`, c.id)
      }
      // Giorno del colloquio
      if (c.data_colloquio && isToday(c.data_colloquio) && ['Colloquio','Secondo colloquio','Call conoscitiva'].includes(c.stato)) {
        pushNotification(`🌅 Oggi: ${c.azienda} ${c.ora_colloquio || ''}`, `Forza! Respira e mostrati al meglio. 💜`, c.id)
      }
      // Giorno dopo (feeling non aggiornato)
      if (c.data_colloquio && isYesterday(c.data_colloquio) && !c.feeling_aggiornato) {
        pushNotification(`☕ Com'è andato con ${c.azienda}?`, `Aggiorna lo stato e scrivi le impressioni! 📝`, c.id)
      }
      // 7 giorni in attesa
      if (c.stato === 'In attesa' && days >= 7 && days < 14 && !c.notifica_7gg_inviata) {
        pushNotification(`⏳ Notizie da ${c.azienda}?`, `Passata una settimana. Controlla la mail! 👀`, c.id)
        supabase.from('candidature').update({ notifica_7gg_inviata: true }).eq('id', c.id)
      }
      // 14 giorni in attesa
      if (c.stato === 'In attesa' && days >= 14 && !c.notifica_14gg_inviata) {
        pushNotification(`📧 2 settimane senza risposta da ${c.azienda}`, `Considera un follow-up. 💪`, c.id)
        supabase.from('candidature').update({ notifica_14gg_inviata: true }).eq('id', c.id)
      }
      // Auto-GHOSTED a 60 giorni (2 mesi)
      if (['Inviata','Spontanea','In attesa risposta'].includes(c.stato) && days >= 60) {
        updateCandidatura(c.id, { stato: 'GHOSTED' })
        pushNotification(`👻 ${c.azienda} → GHOSTED`, `2 mesi di silenzio. Archiviata automaticamente. Avanti! 💜`, c.id)
      }
      // Promemoria personalizzato
      if (c.reminder_date) {
        const today = new Date(); today.setHours(0,0,0,0)
        const remDay = new Date(c.reminder_date); remDay.setHours(0,0,0,0)
        const key = `reminder_done_${c.id}_${c.reminder_date}`
        if (remDay.getTime() === today.getTime() && !localStorage.getItem(key)) {
          pushNotification(`⏰ Promemoria: ${c.azienda}`, c.reminder_note || 'Hai un promemoria per oggi!', c.id)
          localStorage.setItem(key, '1')
        }
      }
    })
  }, [candidature])

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false
    const result = await Notification.requestPermission()
    if (result !== 'granted') return false

    // Subscribe to Web Push and save subscription
    try {
      const reg = await navigator.serviceWorker.ready
      const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!VAPID_PUBLIC) return true // no VAPID key yet, skip

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        })
      }
      // Save to Supabase via API
      if (user) {
        await fetch('/api/save-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, subscription: sub.toJSON() }),
        })
      }
    } catch (err) {
      console.warn('Push subscription failed:', err)
    }
    return true
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
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
      addCandidatura, addBulkCandidature, updateCandidatura, migrateGuestToAccount, deleteCandidatura,
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
