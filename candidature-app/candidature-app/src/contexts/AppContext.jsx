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

  // Guest data persisted in localStorage
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
  const sentNotifs = useRef(new Set()) // dedup per sessione

  // Lingua corrente — usa i18n.language direttamente (mai stale)
  const getLang = () => (i18n.language === 'en' ? 'en' : 'it')

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

  // Persist guest data to localStorage whenever it changes
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
        // Auto-salva subscription se il permesso è già granted
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          requestNotificationPermission()
        }
      })
    } else if (isGuest) {
      // Guest mode: init profile if first time
      if (!localStorage.getItem('lfs_guest_profile')) {
        const guestProfile = { id: 'guest', nome: 'Ospite', xp: 0, streak: 0, seen_onboarding: false, genere: null, motto_index: 0 }
        setProfile(guestProfile)
        localStorage.setItem('lfs_guest_profile', JSON.stringify(guestProfile))
      }
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [user, isGuest])

  // ── CANDIDATURE CRUD ──────────────────────────────────────────

  const addCandidatura = async (data) => {
    const isFirst = candidature.length === 0
    const _l = getLang() // <-- Recupera la lingua

    if (isGuest) {
      const row = { ...data, id: Date.now().toString(), user_id: 'guest', created_at: new Date().toISOString() }
      setCandidature(prev => [row, ...prev])
      const xp = isFirst ? XP_EVENTS.FIRST_CANDIDATURA : XP_EVENTS.ADD_CANDIDATURA
      
      // Messaggio tradotto per Guest
      const guestMsg = _l === 'en' ? `Added! 🚀 +${xp} XP` : `Aggiunta! 🚀 +${xp} XP`
      showToast(guestMsg, 'success')
      
      if (isFirst) triggerConfetti()
      return row
    }

    const { data: row, error } = await supabase
      .from('candidature')
      .insert({ ...data, user_id: user.id })
      .select().single()

    if (error) { 
      const errMsg = _l === 'en' ? '❌ Something went wrong — try again!' : '❌ Qualcosa è andato storto — riprova!'
      showToast(errMsg, 'error')
      return null 
    }

    setCandidature(prev => [row, ...prev])
    const xp = isFirst ? XP_EVENTS.FIRST_CANDIDATURA : XP_EVENTS.ADD_CANDIDATURA
    try { await addXP(xp) } catch(e) { console.error('addXP error:', e) }
    
    // Messaggio tradotto per Utente registrato
    const successMsg = _l === 'en' ? `🎉 Application added! +${xp} XP` : `🎉 Candidatura aggiunta! +${xp} XP`
    showToast(successMsg, 'success')
    
    triggerConfetti()
    try { await checkBadges() } catch(e) { console.error('checkBadges error:', e) }
    return row
  }

  const addBulkCandidature = async (rows) => {
    const _l = getLang() // <-- Recupera la lingua
    const ALLOWED = ['azienda','ruolo','stato','data_invio','data_colloquio','sede','paese','fonte','priorita','stipendio_min','stipendio_max','note','link_annuncio','ora_colloquio','tipo_colloquio','feeling','telefono_azienda','data_scadenza_responso','azienda_domain','contatto_hr','email_hr','telefono_hr','linkedin_hr','data_secondo_colloquio','ora_secondo_colloquio','archiviata','welfare','welfare_note','reminder_date','reminder_time','reminder_note','offerta_ral','offerta_scadenza','offerta_note','offerta_risposta','domande_fatte','domande_mie','feeling_aggiornato','contatto_hr','data_inizio']
    
    const toInsert = rows.map(r => {
      const clean = { user_id: user.id }
      ALLOWED.forEach(k => { if (r[k] !== undefined && r[k] !== null && r[k] !== '') clean[k] = r[k] })
      return clean
    })

    const { data, error } = await supabase
      .from('candidature').insert(toInsert).select()

    if (error) {
      console.error('Bulk insert error:', error)
      const bulkErrMsg = _l === 'en' ? '❌ Import error.' : '❌ Errore importazione.'
      showToast(bulkErrMsg, 'error')
      return false
    }

    setCandidature(prev => [...(data || []), ...prev])
    
    // Messaggio tradotto per Bulk Import
    const bulkSuccessMsg = _l === 'en' 
      ? `🎉 ${data.length} applications imported!` 
      : `🎉 ${data.length} candidature importate!`
    showToast(bulkSuccessMsg, 'success')
    
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
              // Clean up guest localStorage
              localStorage.removeItem('lfs_guest_mode')
              localStorage.removeItem('lfs_guest_candidature')
              localStorage.removeItem('lfs_guest_profile')
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
    const _l = getLang()

    if (prev?.data_colloquio && !updates.data_colloquio) {
      updates = { ...updates, data_colloquio: prev.data_colloquio }
    }
    if (prev?.ora_colloquio && !updates.ora_colloquio) {
      updates = { ...updates, ora_colloquio: prev.ora_colloquio }
    }
    if (prev?.data_secondo_colloquio && !updates.data_secondo_colloquio) {
      updates = { ...updates, data_secondo_colloquio: prev.data_secondo_colloquio }
    }

    const ALLOWED_UPDATE = ['azienda','ruolo','stato','data_invio','data_colloquio','sede','paese','fonte','priorita','stipendio_min','stipendio_max','note','link_annuncio','ora_colloquio','tipo_colloquio','feeling','telefono_azienda','data_scadenza_responso','azienda_domain','contatto_nome','contatto_email','contatto_hr','email_hr','telefono_hr','linkedin_hr','data_secondo_colloquio','ora_secondo_colloquio','archiviata','welfare','welfare_note','reminder_date','reminder_time','reminder_note','offerta_ral','offerta_scadenza','offerta_note','offerta_risposta','offerta_feeling','domande_fatte','domande_mie','feeling_aggiornato','contatto_hr','data_inizio']
    const clean = {}
    ALLOWED_UPDATE.forEach(k => { if (updates[k] !== undefined) clean[k] = updates[k] })
    
    if ('welfare' in clean && !Array.isArray(clean.welfare)) clean.welfare = []

    const { data: row, error } = await supabase
      .from('candidature').update(clean).eq('id', id).select().single()

    if (error) { 
      showToast(_l === 'en' ? '❌ Update failed' : '❌ Errore aggiornamento', 'error')
      return 
    }

    setCandidature(cs => cs.map(c => c.id === id ? row : c))

    if (updates.stato && updates.stato !== prev?.stato) {
      if (updates.stato === 'Colloquio') {
        await addXP(XP_EVENTS.GOT_COLLOQUIO)
        showToast(_l === 'en' ? '🎙️ Interview obtained! +15 XP' : '🎙️ Colloquio ottenuto! +15 XP', 'success')
        triggerConfetti()
        
        const pTitle = _l === 'en' ? '🎙️ Interview confirmed!' : '🎙️ Colloquio confermato!'
        const pBody = _l === 'en' ? `All set for ${prev?.azienda}? Checklist activated! 💜` : `Tutto pronto per ${prev?.azienda}? Checklist attivata! 💜`
        
        pushNotification(pTitle, pBody, id)
        sendPushNow(pTitle, pBody)
        
        const { data: existingCl } = await supabase.from('checklist_items').select('id').eq('candidatura_id', id).limit(1)
        if (!existingCl || existingCl.length === 0) await createChecklist(id)

      } else if (updates.stato === 'Offerta ricevuta') {
        await addXP(XP_EVENTS.OFFERTA)
        showToast(_l === 'en' ? '🏆 OFFER RECEIVED! +50 XP' : '🏆 OFFERTA RICEVUTA! +50 XP', 'success')
        triggerConfetti()
        
        const oTitle = _l === 'en' ? `🏆 OFFER FROM ${(prev?.azienda||'').toUpperCase()}!!` : '🏆 OFFERTA DA ' + prev?.azienda + '!!'
        const oBody = _l === 'en' ? "YOU MADE IT! 💜" : "CE L'HAI FATTA! 💜"
        
        pushNotification(oTitle, oBody, id)
        sendPushNow(oTitle, oBody)

      } else if (updates.stato === 'Assunta') {
        await addXP(XP_EVENTS.OFFERTA)
        const toastAssunta = _l === 'en' ? '🏆 YOU GOT THE JOB! 🎉🎉' : (profile?.genere === 'f' ? '🏆 SEI STATA ASSUNTA! 🎉🎉' : '🏆 SEI STATO ASSUNTO! 🎉🎉')
        showToast(toastAssunta, 'success')
        triggerConfetti()
        
        const aTitle = _l === 'en' ? `🏆 HIRED BY ${(prev?.azienda||'').toUpperCase()}!!` : '🏆 ASSUNT*!!'
        const aBody = _l === 'en' ? "YOU REALLY MADE IT! 💜" : "CE L'HAI FATTA! 💜"
        
        pushNotification(aTitle, aBody, id)
        sendPushNow(aTitle, aBody)

      } else if (updates.stato === 'GHOSTED') {
        showToast(_l === 'en' ? `👻 ${prev?.azienda} → GHOSTED. Next!` : `👻 ${prev?.azienda} → GHOSTED. Prossima!`, 'info')
        pushNotification('👻 GHOSTED', _l === 'en' ? 'Keep going! 💜' : 'Avanti! 💜', id)
        sendPushNow('👻 GHOSTED', _l === 'en' ? 'Keep going! 💜' : 'Avanti! 💜')
        
      } else {
        showToast(_l === 'en' ? '✅ Saved!' : '✅ Salvato!', 'success')
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
    const _l = getLang()
    const cand = candidature.find(c => c.id === id)
    await supabase.from('candidature').delete().eq('id', id)
    setCandidature(cs => {
      const updated = cs.filter(c => c.id !== id)
      setTimeout(() => recheckBadgesAfterDelete(updated), 100)
      return updated
    })
    if (cand) {
      const lost = xpForCandidatura(cand)
      await removeXP(lost)
      showToast(_l === 'en' ? `🗑️ Deleted. -${lost} XP` : `🗑️ Eliminata. -${lost} XP`, 'info')
    } else {
      showToast(_l === 'en' ? '🗑️ Deleted.' : '🗑️ Eliminata.', 'info')
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
    // Non auto-creare qui — lo fa updateCandidatura (evita duplicati)
    return data || []
  }

  const toggleChecklistItem = async (itemId, fatto) => {
    await supabase.from('checklist_items').update({ fatto }).eq('id', itemId)
    if (fatto) await addXP(XP_EVENTS.CHECKLIST_ITEM)
  }

  // ── XP & PROFILE ─────────────────────────────────────────────

  const addXP = async (amount) => {
    if (!profile || !user) return
    // Read fresh from DB to avoid stale state
    const { data: fresh } = await supabase.from('user_profiles').select('xp_points').eq('id', user.id).single()
    const newXP = ((fresh?.xp_points) || 0) + amount
    await supabase.from('user_profiles').update({ xp_points: newXP }).eq('id', user.id)
    setProfile(p => ({ ...p, xp_points: newXP }))
  }

  const removeXP = async (amount) => {
    if (!profile) return
    const newXP = Math.max(0, (profile.xp_points || 0) - amount)
    await supabase.from('user_profiles').update({ xp_points: newXP }).eq('id', user.id)
    setProfile(p => ({ ...p, xp_points: newXP }))
  }

  // Ricalcola XP totali da tutte le candidature (usato per fix account vecchi)
  const recalcXP = async () => {
    if (!user) return
    const { data: cands } = await supabase.from('candidature').select('*').eq('user_id', user.id)
    if (!cands) return
    let total = 0
    cands.forEach(cand => { total += xpForCandidatura(cand) })
    await supabase.from('user_profiles').update({ xp_points: total }).eq('id', user.id)
    setProfile(p => ({ ...p, xp_points: total }))
    return total
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
    
    // Recuperiamo la lingua corrente per le notifiche
    const _l = getLang()

    for (const badge of BADGES) {
      if (!earned.includes(badge.id) && badge.check(stats)) {
        newBadges.push(badge.id)
        
        // --- MODIFICA QUI: Usiamo i18n per tradurre nome e descrizione ---
        const bName = i18n.t(`badges.${badge.id}`) 
        // Se non hai una descrizione specifica nel JSON per ogni badge, 
        // puoi continuare a usare badge.desc o aggiungere chiavi nel JSON
        const bDesc = badge.desc 
        
        showToast(_l === 'en' ? `🎉 Badge unlocked: ${bName}!` : `🎉 Badge sbloccato: ${bName}!`, 'success')
        triggerConfetti()
        
        // Notifica in-app e Push
        pushNotification(`🏅 Badge: ${bName}!`, bDesc)
        sendPushNow(`🏅 Badge: ${bName}!`, bDesc)
      }
    }
    if (newBadges.length) {
      const updated = [...earned, ...newBadges].join(',')
      await updateProfile({ badge_lista: updated })
    }
  }

// --- CONTEGGIO COLLOQUI BLINDATO ---
    const colloqui = list.filter(c => {
      // 1. Deve esserci una data valida
      const haData = c.data_colloquio && c.data_colloquio !== '';
      
      // 2. Lo stato deve essere uno di quelli "positivi" o "attivi"
      // Escludiamo categoricamente chi è stato scartato, chi ha ghostato o chi è solo all'inizio
      const statiValidi = [
        'Colloquio', 
        'Secondo colloquio', 
        'In attesa risposta', 
        'Offerta ricevuta', 
        'Assunta'
      ];
      
      const statoOk = statiValidi.includes(c.stato);

      // 3. Escludiamo le archiviate (se hai il campo archiviata)
      const nonArchiviata = !c.archiviata;

      return haData && statoOk && nonArchiviata;
    }).length;

  const computeStats = () => computeStatsFrom(candidature)

  // ── PUSH NOTIFICATIONS (con dedup) ────────────────────────────

  // pushNotification = SOLO campanellino in-app, zero push server
  // (checkScheduledNotifications gira ad ogni apertura app — non deve mandare push reali)
  const pushNotification = (title, body, candidaturaId = null) => {
    const key = `${title}::${body}`
    if (sentNotifs.current.has(key)) return
    sentNotifs.current.add(key)
    const notif = { id: Date.now(), title, body, read: false, time: new Date().toISOString(), candidaturaId }
    setNotifications(prev => [notif, ...prev.slice(0, 49)])
  }

  // sendPushNow = notifica push immediata via server
  // usata SOLO per eventi importanti: colloquio confermato, offerta, assunta, badge
  const sendPushNow = (title, body) => {
    if (!user) return
    supabase.from('user_profiles').select('push_subscription').eq('id', user.id).single()
      .then(({ data }) => {
        if (!data?.push_subscription) return
        fetch('/api/send-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: data.push_subscription, title, body, url: '/' })
        }).catch(() => {})
      }).catch(() => {})
  }

  const checkScheduledNotifications = useCallback(() => {
    if (!candidature.length) return
    candidature.forEach(c => {
      if (!c.notifiche_push) return
      const days = daysSince(c.data_invio)

      // Giorno prima del colloquio
      const _lang = getLang()
      if (c.data_colloquio && isTomorrow(c.data_colloquio) && ['Colloquio','Secondo colloquio','Call conoscitiva'].includes(c.stato)) {
        pushNotification(
          _lang === 'en' ? `Tomorrow: ${c.azienda}!` : `Domani: ${c.azienda}!`,
          _lang === 'en' ? `All set? Check the checklist.` : `Tutto pronto? Controlla la checklist.`,
          c.id
        )
      }
      // Giorno del colloquio
      if (c.data_colloquio && isToday(c.data_colloquio) && ['Colloquio','Secondo colloquio','Call conoscitiva'].includes(c.stato)) {
        pushNotification(
          _lang === 'en' ? `Today: ${c.azienda} ${c.ora_colloquio || ''}` : `Oggi: ${c.azienda} ${c.ora_colloquio || ''}`,
          _lang === 'en' ? `Go! Breathe and show your best self. 💜` : `Forza! Respira e mostrati al meglio. 💜`,
          c.id
        )
      }
      // Giorno dopo (feeling non aggiornato)
      if (c.data_colloquio && isYesterday(c.data_colloquio) && !c.feeling_aggiornato) {
        pushNotification(
          _lang === 'en' ? `How did it go with ${c.azienda}?` : `Com'è andato con ${c.azienda}?`,
          _lang === 'en' ? `Update the status while it's fresh! 📝` : `Aggiorna lo stato e scrivi le impressioni! 📝`,
          c.id
        )
      }
      // 7 giorni in attesa
      if (c.stato === 'In attesa' && days >= 7 && days < 14 && !c.notifica_7gg_inviata) {
        pushNotification(
          _lang === 'en' ? `Any news from ${c.azienda}?` : `Notizie da ${c.azienda}?`,
          _lang === 'en' ? `A week has passed. Check your inbox! 👀` : `Passata una settimana. Controlla la mail! 👀`,
          c.id
        )
        supabase.from('candidature').update({ notifica_7gg_inviata: true }).eq('id', c.id)
      }
      // 14 giorni in attesa
      if (c.stato === 'In attesa' && days >= 14 && !c.notifica_14gg_inviata) {
        pushNotification(
          _lang === 'en' ? `2 weeks with no reply from ${c.azienda}` : `2 settimane senza risposta da ${c.azienda}`,
          _lang === 'en' ? `Consider a polite follow-up. 💪` : `Considera un follow-up. 💪`,
          c.id
        )
        supabase.from('candidature').update({ notifica_14gg_inviata: true }).eq('id', c.id)
      }
      // Auto-GHOSTED a 60 giorni (2 mesi)
      if (['Inviata','Spontanea','In attesa risposta'].includes(c.stato) && days >= 60) {
        updateCandidatura(c.id, { stato: 'GHOSTED' })
        pushNotification(
          `👻 ${c.azienda} → GHOSTED`,
          _lang === 'en' ? `2 months of silence. Auto-archived. Keep going! 💜` : `2 mesi di silenzio. Archiviata automaticamente. Avanti! 💜`,
          c.id
        )
      }
      // Promemoria personalizzato
      if (c.reminder_date) {
        const today = new Date(); today.setHours(0,0,0,0)
        const remDay = new Date(c.reminder_date); remDay.setHours(0,0,0,0)
        const key = `reminder_done_${c.id}_${c.reminder_date}`
        if (remDay.getTime() === today.getTime() && !localStorage.getItem(key)) {
          pushNotification(
            _lang === 'en' ? `Reminder: ${c.azienda}` : `Promemoria: ${c.azienda}`,
            c.reminder_note || (_lang === 'en' ? 'You have a reminder for today!' : 'Hai un promemoria per oggi!'),
            c.id
          )
          localStorage.setItem(key, '1')
        }
      }
    })

    // Utente inattivo da 7+ giorni
    if (profile?.ultimo_accesso) {
      const lastActive = new Date(profile.ultimo_accesso)
      const diffDays = Math.floor((new Date() - lastActive) / (1000 * 60 * 60 * 24))
      const inactiveKey = `inactivity_notif_${profile.ultimo_accesso}`
      const _lang = getLang()
      if (diffDays >= 7 && !localStorage.getItem(inactiveKey)) {
        const activeCount = candidature.filter(c => ['Colloquio','Prima call','In attesa risposta'].includes(c.stato)).length
        pushNotification(
          _lang === 'en' ? '👋 Welcome back to the hunt!' : '👋 Bentornat* nella ricerca!',
          _lang === 'en'
            ? (activeCount > 0 ? `You have ${activeCount} active applications waiting for updates. 💪` : "Time to add new applications. Don't give up! 💜")
            : (activeCount > 0 ? `Hai ${activeCount} candidature attive che aspettano aggiornamenti. 💪` : 'È ora di aggiungere nuove candidature. Non mollare! 💜')
        )
        localStorage.setItem(inactiveKey, '1')
      }
    }
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
      addXP, removeXP, recalcXP, updateProfile, markOnboarded, refreshMotto,
      pushNotification, sendPushNow, requestNotificationPermission,
      markAllNotificationsRead,
      showToast, triggerConfetti, checkBadges,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)