import { createContext, useContext, useEffect, useState, useRef } from 'react'
import i18n from '../i18n'
import { XP_EVENTS, BADGES, DEFAULT_CHECKLIST } from '../lib/utils'
import { migrateStoredLegacySession, recoverLegacyCloudData } from '../lib/legacyCloudMigration'
import { localDay, elapsedDays, getInterviews, normalizeTransition, validationIssues, validationMessage, flowStats, hasOffer, dueReminders, INTERVIEW_STATES } from '../lib/applicationFlow'

const AppContext = createContext(null)
const CANDIDATURE_KEY = 'lfs_candidature'
const PROFILE_KEY = 'lfs_profile'
const NOTIFICATIONS_KEY = 'lfs_notifications'
const MIGRATION_ERROR_DISMISSED_KEY = 'lfs_migration_error_dismissed_v1'
function readLocalJson(key, legacy, fallback) {
  try { const raw = localStorage.getItem(key) ?? (legacy ? localStorage.getItem(legacy) : null); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
function readSavedData(key,legacy,fallback) {
  const raw=localStorage.getItem(key) ?? localStorage.getItem(legacy)
  return raw === null ? fallback : JSON.parse(raw)
}
// Persist first. State changes and success messages only follow a successful write.
function writeValues(values) {
  const before = Object.fromEntries(Object.keys(values).map(k => [k, localStorage.getItem(k)]))
  try { Object.entries(values).forEach(([k,v]) => localStorage.setItem(k,JSON.stringify(v))) }
  catch (error) {
    Object.entries(before).forEach(([k,v]) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k,v) } catch {} })
    throw error
  }
}
export function AppProvider({ children }) {
  const [candidature, setCandidature] = useState(() => readLocalJson(CANDIDATURE_KEY,'lfs_guest_candidature',[]))
  const [profile,setProfile] = useState(() => readLocalJson(PROFILE_KEY,'lfs_guest_profile',null))
  const [notifications,setNotifications] = useState(() => readLocalJson(NOTIFICATIONS_KEY,null,[]))
  const [toast,setToast] = useState(null)
  const [confetti,setConfetti] = useState(false)
  const [loading,setLoading] = useState(true)
  const [loadError,setLoadError] = useState(false)
  const [migrationNotice,setMigrationNotice] = useState(null)
  const dataRef = useRef(candidature), profileRef = useRef(profile), notifRef = useRef(notifications)
  const en = () => i18n.language === 'en'
  const showToast = (message,type='success',action=null) => {
    const id = Date.now(); setToast({message,type,id,action})
    setTimeout(() => setToast(t => t?.id === id ? null : t),action ? 8000 : 3000)
  }
  const triggerConfetti = () => { setConfetti(true); setTimeout(()=>setConfetti(false),2000) }
  const commit = (list,prof,extra={}) => {
    try { writeValues({[CANDIDATURE_KEY]:list,[PROFILE_KEY]:prof,...extra}) }
    catch(error) { showToast(en()?'Could not save on this device. Your changes are still in the form.':'Impossibile salvare sul dispositivo. Le modifiche restano nel modulo.','error'); throw error }
    dataRef.current=list; profileRef.current=prof; setCandidature(list); setProfile(prof)
  }
  const withBadges = (list,prof) => {
    const stats = {...flowStats(list),referral:Number(prof?.referral_count || 0)}
    const earned = new Set((prof?.badge_lista || '').split(',').filter(Boolean))
    BADGES.forEach(b => { if(b.check(stats)) earned.add(b.id) })
    return {...prof,badge_lista:[...earned].join(',')}
  }
  useEffect(()=>{
    let active=true
    ;(async()=>{
      try {
        const language=localStorage.getItem('lfs_lang') || 'it'
        await i18n.changeLanguage(language)
        let list=readSavedData(CANDIDATURE_KEY,'lfs_guest_candidature',[])
        let prof=readSavedData(PROFILE_KEY,'lfs_guest_profile',null) || {id:'local',nome:'',xp_points:0,streak_giorni:0,seen_onboarding:false,badge_lista:''}
        if(!Array.isArray(list) || !prof || typeof prof !== 'object') throw Error('invalid-storage')
        try {
          const migrated=await migrateStoredLegacySession(list,prof)
          if(migrated){list=migrated.candidature;prof=migrated.profile;if(active)setMigrationNotice({type:'success',...migrated})}
        } catch { if(active && localStorage.getItem(MIGRATION_ERROR_DISMISSED_KEY)!=='1')setMigrationNotice({type:'error'}) }
        if(!active)return
        const observed = {...prof.hire_observed}
        list.filter(c=>c.stato==='Assunta').forEach(c=>{if(!observed[c.id])observed[c.id]=new Date().toISOString()})
        prof={...prof,hire_observed:observed}
        const today=localDay()
        if(prof.ultimo_accesso!==today) prof={...prof,ultimo_accesso:today,streak_giorni:elapsedDays(prof.ultimo_accesso)===1?(prof.streak_giorni || 0)+1:1}
        commit(list,withBadges(list,prof))
      } catch { if(active)setLoadError(true) }
      finally { if(active)setLoading(false) }
    })()
    return ()=>{active=false}
  },[])

  function rewards(row,previous) {
    // Old records have no ledger: preserve their XP, don't re-award inferred milestones.
    const awards={...(previous?.xp_awards || (previous ? {
      interview: INTERVIEW_STATES.includes(previous.stato) || getInterviews(previous).length>0,
      offer:hasOffer(previous),hired:previous.stato==='Assunta',feeling:!!previous.feeling,note:!!previous.note,
    } : {}))}
    let amount=0
    const grant=(key,condition,points)=>{if(condition&&!awards[key]){awards[key]=true;amount+=points}}
    grant('interview',INTERVIEW_STATES.includes(row.stato) || getInterviews(row).some(e=>e.status!=='cancelled'),XP_EVENTS.GOT_COLLOQUIO)
    grant('offer',hasOffer(row),XP_EVENTS.OFFERTA)
    grant('hired',row.stato==='Assunta',XP_EVENTS.OFFERTA)
    grant('feeling',!!row.feeling,XP_EVENTS.FEELING_ADDED)
    grant('note',row.note?.length>10,XP_EVENTS.NOTE_ADDED)
    return {row:{...row,xp_awards:awards},amount}
  }
  function validate(row,previous) {
    const oldIssues=previous?validationIssues(previous):[]
    const dataChanged = !previous || JSON.stringify(getInterviews(previous))!==JSON.stringify(getInterviews(row)) || previous.data_invio!==row.data_invio
    const issue=validationIssues(row).find(code=>!oldIssues.includes(code) || (dataChanged && ['date','sequence','beforeApplication','timeWithoutDate','futureCompleted'].includes(code)))
    if(issue)throw Error(validationMessage(issue,en()))
  }
  const addCandidatura=async(data)=>{
    let row=normalizeTransition(null,{...data,id:crypto.randomUUID(),user_id:'local',created_at:new Date().toISOString(),updated_at:new Date().toISOString()})
    validate(row)
    const reward=rewards(row,null);row=reward.row
    const points=(dataRef.current.length?XP_EVENTS.ADD_CANDIDATURA:XP_EVENTS.FIRST_CANDIDATURA)+reward.amount
    const list=[row,...dataRef.current]
    commit(list,withBadges(list,{...profileRef.current,xp_points:(profileRef.current?.xp_points || 0)+points}))
    showToast(en()?'Application saved':'Candidatura salvata')
    return row
  }
  const updateCandidatura=async(id,updates)=>{
    const prev=dataRef.current.find(c=>c.id===id)
    if(!prev)throw Error(en()?'Application not found':'Candidatura non trovata')
    let row=normalizeTransition(prev,{...updates,updated_at:new Date().toISOString()})
    validate(row,prev)
    const reward=rewards(row,prev);row=reward.row
    const list=dataRef.current.map(c=>c.id===id?row:c)
    commit(list,withBadges(list,{...profileRef.current,xp_points:(profileRef.current?.xp_points || 0)+reward.amount}))
    if (updates.archiviata === true && !prev.archiviata) {
      showToast(en()?'Application archived':'Candidatura archiviata','success',{
        label:en()?'Undo':'Annulla',
        run:async()=>{await updateCandidatura(id,{archiviata:false})}
      })
    } else showToast(en()?'Changes saved ✓':'Modifiche salvate ✓')
    return row
  }
  const deleteCandidatura=async(id)=>{
    const list=dataRef.current.filter(c=>c.id!==id)
    commit(list,profileRef.current)
    try{Object.keys(localStorage).filter(k=>k==='lfs_checklist_'+id || k.startsWith('lfs_checklist_'+id+':')).forEach(k=>localStorage.removeItem(k))}catch{}
    showToast(en()?'Application deleted':'Candidatura eliminata')
  }
  const resetSearch=async()=>{
    const extra = {[NOTIFICATIONS_KEY]:[], lfs_guest_candidature:[], lfs_application_draft_v1:null}
    Object.keys(localStorage).filter(k=>k.startsWith('lfs_checklist_')).forEach(k=>{extra[k]=[]})
    commit([], {...profileRef.current,hire_observed:{},new_search_asked:[]}, extra)
    notifRef.current=[];setNotifications([])
    showToast(en()?'Ready for a new search':'Tutto pronto per una nuova ricerca')
  }
  const addBulkCandidature=async(rows)=>{
    const now=new Date().toISOString()
    const added=rows.map(r=>normalizeTransition(null,{...r,id:crypto.randomUUID(),user_id:'local',created_at:now,updated_at:now}))
    added.forEach(r=>validate(r))
    const list=[...added,...dataRef.current];commit(list,withBadges(list,profileRef.current))
    showToast(en()?'Applications imported':'Candidature importate');return true
  }
  const updateProfile=async(updates)=>commit(dataRef.current,{...profileRef.current,...updates})
  const addXP=async(amount)=>updateProfile({xp_points:(profileRef.current?.xp_points || 0)+amount})
  const removeXP=async(amount)=>updateProfile({xp_points:Math.max(0,(profileRef.current?.xp_points || 0)-amount)})
  const computeStats=()=>({...flowStats(dataRef.current),referral:Number(profileRef.current?.referral_count || 0)})
  const checkBadges=async()=>commit(dataRef.current,withBadges(dataRef.current,profileRef.current))

  const getChecklist=async(cid,meetingId)=>{
    const key='lfs_checklist_'+cid+(meetingId?':'+meetingId:'')
    const saved=readLocalJson(key,null,null)
    if(Array.isArray(saved)&&saved.length)return saved
    const legacy = meetingId?.startsWith('legacy-') ? readLocalJson('lfs_checklist_'+cid,null,null) : null
    const items=Array.isArray(legacy) && legacy.length
      ? legacy.map((item,i)=>({...item,id:key+'-'+i,xp_awarded:item.xp_awarded || item.fatto}))
      : DEFAULT_CHECKLIST.map((task,i)=>({id:key+'-'+i,candidatura_id:cid,task,fatto:false,ordine:i}))
    writeValues({[key]:items});return items
  }
  const toggleChecklistItem=async(iid,fatto)=>{
    for(const key of Object.keys(localStorage).filter(k=>k.startsWith('lfs_checklist_'))){
      const items=readLocalJson(key,null,[])
      const item=items.find(i=>i.id===iid)
      if(!item)continue
      const rewarded=item.xp_awarded || item.fatto
      const amount=fatto&&!rewarded?XP_EVENTS.CHECKLIST_ITEM:0
      const updated=items.map(i=>i.id===iid?{...i,fatto,xp_awarded:rewarded || fatto}:i)
      commit(dataRef.current,{...profileRef.current,xp_points:(profileRef.current?.xp_points || 0)+amount},{[key]:updated})
      return updated
    }
    throw Error(en()?'Checklist item not found':'Voce della checklist non trovata')
  }

  const pushNotification=(title,body,cid=null,key=title+'::'+body)=>{
    if(profileRef.current?.reminders_enabled===false || profileRef.current?.notification_mode==='off' || notifRef.current.some(n=>n.key===key))return
    const next=[{id:crypto.randomUUID(),key,title,body,candidaturaId:cid,time:new Date().toISOString(),read:false},...notifRef.current].slice(0,100)
    writeValues({[NOTIFICATIONS_KEY]:next});notifRef.current=next;setNotifications(next)
    if(profileRef.current?.notification_mode==='on' && typeof Notification!=='undefined' && Notification.permission==='granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if(profileRef.current?.notification_mode==='on' && profileRef.current?.reminders_enabled!==false) return registration?.showNotification(title,{body,tag:key,icon:'/icon-192.png'})
      }).catch(()=>{})
    }
  }
  useEffect(()=>{
    if(loading || loadError)return
    const check=()=>{
      if(document.visibilityState==='hidden' || profileRef.current?.reminders_enabled===false)return
      for(const c of dataRef.current){
        for(const reminder of dueReminders(c)){
          try { pushNotification(reminder.kind==='interview'?(en()?'Interview today':'Colloquio oggi'):(en()?'Reminder':'Promemoria'),
            c.azienda+(reminder.time?' · '+reminder.time:'')+(reminder.note?' · '+reminder.note:''),c.id,reminder.key) } catch {}
        }
      }
    }
    check();const timer=setInterval(check,30000)
    document.addEventListener('visibilitychange',check)
    return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',check)}
  },[candidature,loading,loadError,profile?.reminders_enabled])
  const markAllNotificationsRead=()=>{
    const next=notifRef.current.map(n=>({...n,read:true}))
    try{writeValues({[NOTIFICATIONS_KEY]:next});notifRef.current=next;setNotifications(next)}catch{}
  }
  const markOnboarded=async()=>{await updateProfile({seen_onboarding:true});localStorage.setItem('lfs_onboarding_done','1')}
  const recoverLegacyData=async(email,password)=>{
    const migrated=await recoverLegacyCloudData(email,password,dataRef.current,profileRef.current)
    commit(migrated.candidature,withBadges(migrated.candidature,migrated.profile))
    setMigrationNotice({type:'success',...migrated});return migrated
  }
  const dismissMigrationNotice=()=>{
    if(migrationNotice?.type==='error') {
      try { localStorage.setItem(MIGRATION_ERROR_DISMISSED_KEY,'1') }
      catch { showToast(en()?'Could not remember this choice on this device.':'Impossibile memorizzare questa scelta sul dispositivo.','error') }
    }
    setMigrationNotice(null)
  }
  return <AppContext.Provider value={{
    candidature,profile,notifications,toast,confetti,loading,loadError,migrationNotice,unreadCount:notifications.filter(n=>!n.read).length,
    resetSearch,addCandidatura,updateCandidatura,deleteCandidatura,addBulkCandidature,getChecklist,toggleChecklistItem,
    addXP,removeXP,updateProfile,computeStats,checkBadges,triggerConfetti,showToast,markOnboarded,
    pushNotification,recoverLegacyData,markAllNotificationsRead,dismissMigrationNotice,
  }}>{children}</AppContext.Provider>
}
export const useApp=()=>useContext(AppContext)
