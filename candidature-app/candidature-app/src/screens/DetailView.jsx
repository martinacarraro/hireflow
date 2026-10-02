import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../contexts/AppContext'
import { CompanyAvatar, Spinner, ConfirmDialog } from '../components/UI'
import { RoleInput } from '../components/JobFields'
import CompanyAutocomplete from '../components/CompanyAutocomplete'
import EssentialDetails from '../components/EssentialDetails'
import InterviewFields from '../components/InterviewFields'
import { STATI } from '../lib/utils'
import { ensureStageInterview, getInterviews, INTERVIEW_STATES, localDay } from '../lib/applicationFlow'

export default function DetailView({ candidatura:c, onBack, onUpdate, celebrateOnOpen=false }) {
  const { updateCandidatura, deleteCandidatura, profile } = useApp()
  const { t,i18n } = useTranslation()
  const en=i18n.language==='en'
  const [form,setForm]=useState(()=>({...c,stato:c.stato==='Spontanea'?'Inviata':c.stato,interviews:ensureStageInterview(c)}))
  const [dirty,setDirty]=useState(false)
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  const [error,setError]=useState('')
  const [confirmDelete,setConfirmDelete]=useState(false)
  const [showAssuntaCelebration,setShowAssuntaCelebration]=useState(celebrateOnOpen)
  const [showCoffeePrompt,setShowCoffeePrompt]=useState(false)
  const lock=useRef(false),persisted=useRef(c)
  const set=(key,value)=>{setForm(f=>({...f,[key]:value}));setDirty(true);setSaved(false);setError('')}
  useEffect(()=>{
    if(!showAssuntaCelebration)return
    const timer=setTimeout(()=>{setShowAssuntaCelebration(false);setShowCoffeePrompt(true);try{localStorage.setItem('lfs_support_shown_at',new Date().toISOString())}catch{}},2500)
    return()=>clearTimeout(timer)
  },[showAssuntaCelebration])
  const closeCoffeePrompt=()=>setShowCoffeePrompt(false)
  const save=async(patch={})=>{
    if(lock.current)return null
    lock.current=true;setSaving(true);setError('')
    try{
      const draft={...form,...patch}
      draft.interviews=ensureStageInterview(draft)
      // A past appointment becomes history when the user moves on; no extra
      // meeting-status form is needed and future appointments are not guessed.
      if(patch.stato && patch.stato!==form.stato && INTERVIEW_STATES.includes(form.stato)){
        const order={'Prima call':0,'Colloquio':1,'Secondo colloquio':2}[form.stato]
        if(['In attesa risposta','Secondo colloquio','Offerta ricevuta','Assunta'].includes(patch.stato)){
          draft.interviews=draft.interviews.map(e=>e.order===order && e.date && e.date<=localDay() && e.status==='scheduled'?{...e,status:'completed'}:e)
        }
      }
      const result=await updateCandidatura(c.id,draft)
      const celebrate=result.stato==='Assunta' && persisted.current.stato!=='Assunta' && !persisted.current.hire_celebrated
      persisted.current=result;setForm(result);setDirty(false);setSaved(true);onUpdate?.()
      if(celebrate)setShowAssuntaCelebration(true)
      return result
    }catch(e){setError(e.message || (en?'Could not save. Try again.':'Salvataggio non riuscito. Riprova.'));return null}
    finally{setSaving(false);lock.current=false}
  }
  const back=async()=>{
    if(saving)return
    if(dirty && window.confirm(en?'Save changes before leaving? Cancel leaves without saving.':'Salvare prima di uscire? Annulla esce senza salvare.')){if(!await save())return}
    onBack()
  }
  const legacy = [
    [en?'Priority':'Priorità',form.priorita],
    [en?'Source':'Fonte',form.fonte],
    [en?'Seniority':'Livello',form.livello_ruolo],
    [en?'Benefits':'Benefit',[...(Array.isArray(form.welfare)?form.welfare:[]),form.welfare_note].filter(Boolean).join(', ')],
    [en?'Impressions':'Impressioni',form.feeling],
    [en?'Questions':'Domande',[form.domande_mie,form.domande_fatte].filter(Boolean).join('\n')],
  ].filter(([,value])=>value)
  const CelebrationOverlay = showAssuntaCelebration ? (() => {
    const pieces = Array.from({ length: 60 }, (_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 1.5,
      dur: 1.8 + Math.random() * 1.2,
      color: ['#7B2FFF','#FF2D8B','#10B981','#FBBF24','#60A5FA','#F87171','#C4B5FD','#34D399'][i % 8],
      size: 7 + Math.random() * 8, rot: Math.random() * 360,
      shape: i % 3 === 0 ? 'circle' : 'rect',
    }))
    return (
      <div className="fixed inset-0 z-[9999] overflow-hidden" style={{ pointerEvents: 'auto', background: 'rgba(10,10,26,0.96)' }}>
        <style>{`
          @keyframes confettiFall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 80%{opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
          @keyframes celebPop { 0%{transform:scale(0.5) translateY(30px);opacity:0} 60%{transform:scale(1.08) translateY(0);opacity:1} 100%{transform:scale(1) translateY(0);opacity:1} }
        `}</style>
        {pieces.map(p => (
          <div key={p.id} style={{
            position:'absolute', left:p.left+'vw', top:-20,
            width:p.size, height:p.shape==='circle'?p.size:p.size*0.4,
            borderRadius:p.shape==='circle'?'50%':'2px',
            background:p.color, transform:`rotate(${p.rot}deg)`,
            animation:`confettiFall ${p.dur}s ${p.delay}s ease-in both`,
          }} />
        ))}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          style={{ animation:'celebPop 0.6s 0.2s ease-out both' }}>
          <div style={{ fontSize:72, lineHeight:1, marginBottom:16 }}>🏆</div>
          <h1 style={{ fontSize:32, fontWeight:900, color:'white', lineHeight:1.1, textShadow:'0 0 40px rgba(123,47,255,0.9), 0 2px 8px rgba(0,0,0,0.8)', marginBottom:8 }}>
            {profile?.genere === 'f' ? t('detail.assuntaF') : profile?.genere === 'm' ? t('detail.assuntoM') : t('detail.assuntoNB')}
          </h1>
          <p style={{ fontSize:22, fontWeight:800, marginBottom:8, background:'linear-gradient(135deg,#10B981,#7B2FFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            {form.azienda} 🌟
          </p>
          <p style={{ color:'rgba(255,255,255,0.75)', fontSize:15, maxWidth:280, lineHeight:1.5 }}>
            {profile?.nome ? profile.nome + ', ' : ''}{t('detail.celebrazioneMsg')}
          </p>
          <div style={{ marginTop:16, fontSize:36 }}>🎉🥂✨</div>
        </div>
      </div>
    )
  })() : null

  const CoffeePrompt = showCoffeePrompt ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
      style={{ background:'rgba(0,0,0,0.88)', backdropFilter:'blur(6px)' }}>
      <div className="card w-full max-w-sm space-y-5 text-center" style={{ borderColor:'rgba(123,47,255,0.4)', background:'linear-gradient(135deg, rgba(123,47,255,0.12), rgba(255,45,139,0.07))' }}>
        <div className="text-5xl">☕</div>
        <div>
          <h3 className="text-xl font-bold text-txt">
            {i18n.language === 'en' ? 'Shall we celebrate with a coffee?' : 'Festeggiamo con un caffè?'}
          </h3>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            {i18n.language === 'en'
              ? 'If Le faremo sapere helped you reach this milestone, you can support the project by buying me a coffee. 💜'
              : 'Se Le faremo sapere ti ha aiutato a raggiungere questo traguardo, puoi sostenere il progetto offrendomi un caffè. 💜'}
          </p>
        </div>
        <a
          href="https://ko-fi.com/lefaremosapere"
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeCoffeePrompt}
          className="btn-primary block w-full py-3 text-sm font-bold"
        >
          ☕ {i18n.language === 'en' ? 'Buy me a coffee' : 'Offrimi un caffè'}
        </a>
        <button onClick={closeCoffeePrompt} className="w-full py-2 text-xs text-muted">
          {i18n.language === 'en' ? 'Not now' : 'Non ora'}
        </button>
      </div>
    </div>
  ) : null


  return <div className="screen">
    <header className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
      <button className="nav-arrow" onClick={back} aria-label={en?'Back':'Indietro'}>←</button>
      <CompanyAvatar name={form.azienda} size={40}/>
      <div className="min-w-0"><h1 className="font-bold text-base truncate">{form.azienda}</h1><p className="text-sm text-muted truncate">{form.ruolo}</p></div>
    </header>
    <div className="flex-1 scrollable px-5 py-4 space-y-4">
      {form.stato==='Assunta' && <p className="text-green font-semibold">🎉 {en?'You got the job!':'Hai ottenuto il lavoro!'}</p>}
      <label className="block text-sm font-semibold">{en?'Where are you now? *':'A che punto sei? *'}
        <select aria-label={en?'Application status':'Stato candidatura'} className="input-field mt-2" value={form.stato} disabled={saving} onChange={e=>save({stato:e.target.value})}>
          {STATI.map(state=><option key={state} value={state}>{t('add.stati.'+state,state)}</option>)}
        </select>
      </label>
      {INTERVIEW_STATES.includes(form.stato) && <InterviewFields form={form} onChange={set}/>}
      {form.stato==='Offerta ricevuta' && <div className="flex gap-3">
        <button className="btn-primary flex-1" disabled={saving} onClick={()=>save({stato:'Assunta',offerta_risposta:'si'})}>{en?'Accept offer':'Accetta offerta'}</button>
        <button className="btn-secondary flex-1" disabled={saving} onClick={()=>save({stato:'Offerta rifiutata',offerta_risposta:'no'})}>{en?'Decline':'Rifiuta'}</button>
      </div>}
      <label className="block text-sm font-semibold">{en?'Notes':'Note'}
        <textarea className="input-field mt-2 resize-y" rows={3} placeholder={en?'Anything worth remembering…':'Cosa vuoi ricordarti?'} value={form.note || ''} onChange={e=>set('note',e.target.value)}/>
      </label>
      <details className="card">
        <summary>{en?'Edit details':'Modifica dettagli'}</summary>
        <div className="pt-3 space-y-4">
          <label className="block text-xs text-muted">{en?'Company *':'Azienda *'}<CompanyAutocomplete className="input-field mt-1" value={form.azienda} onChange={v=>set('azienda',v)} onSelect={company=>set('azienda',company.name)}/></label>
          <label className="block text-xs text-muted">{en?'Role *':'Ruolo *'}<RoleInput className="input-field mt-1" value={form.ruolo} onChange={v=>set('ruolo',v)}/></label>
          <EssentialDetails form={form} onChange={set}/>
          {form.data_scadenza_responso && <label className="block text-xs text-muted">{en?'Expected reply date':'Risposta prevista entro'}<input className="input-field mt-1" type="date" value={form.data_scadenza_responso} onChange={e=>set('data_scadenza_responso',e.target.value)}/></label>}
          {form.reminder_date && <details><summary>{en?'Saved reminder':'Promemoria salvato'}</summary><div className="pt-2 space-y-3">
            <input aria-label={en?'Reminder date':'Data promemoria'} className="input-field" type="date" value={form.reminder_date} onChange={e=>set('reminder_date',e.target.value)}/>
            <input aria-label={en?'Reminder time':'Ora promemoria'} className="input-field" type="time" value={form.reminder_time || ''} onChange={e=>set('reminder_time',e.target.value)}/>
            <p className="text-sm text-muted">{form.reminder_note}</p>
            <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={!!form.reminder_done} onChange={e=>set('reminder_done',e.target.checked)}/>{en?'Done':'Fatto'}</label>
          </div></details>}
          {['Offerta ricevuta','Offerta rifiutata','Assunta'].includes(form.stato) && <div className="space-y-3">
            <label className="block text-xs text-muted">{en?'Offered gross annual salary · euros':'RAL offerta · euro'}<input className="input-field mt-1" type="number" value={form.offerta_ral ?? ''} onChange={e=>set('offerta_ral',e.target.value)}/></label>
            {form.stato==='Offerta ricevuta' && <label className="block text-xs text-muted">{en?'Reply by':'Rispondi entro'}<input className="input-field mt-1" type="date" value={form.offerta_scadenza || ''} onChange={e=>set('offerta_scadenza',e.target.value)}/></label>}
            <label className="block text-xs text-muted">{en?'Start date':'Data inizio'}<input className="input-field mt-1" type="date" value={form.data_inizio || ''} onChange={e=>set('data_inizio',e.target.value)}/></label>
            {form.offerta_note && <p className="text-sm text-muted whitespace-pre-wrap">{form.offerta_note}</p>}
          </div>}
          {legacy.length>0 && <details><summary>{en?'Previously saved information':'Informazioni già salvate'}</summary><dl className="pt-2 space-y-2">{legacy.map(([label,value])=><div key={label}><dt className="text-xs text-muted">{label}</dt><dd className="text-sm whitespace-pre-wrap">{value}</dd></div>)}</dl></details>}
          <button className="text-sm text-muted py-2" disabled={saving} onClick={async()=>{if(await save({archiviata:!form.archiviata}))onBack()}}>{form.archiviata?(en?'Remove from archive':'Rimuovi dall’archivio'):(en?'Archive application':'Archivia candidatura')}</button>
          <button className="block text-sm text-red py-2" onClick={()=>setConfirmDelete(true)}>{en?'Delete application':'Elimina candidatura'}</button>
        </div>
      </details>
    </div>
    <footer className="px-5 pt-3 pb-4 border-t border-border bg-surface flex-shrink-0" style={{paddingBottom:'max(16px, env(safe-area-inset-bottom))'}}>
      {error && <p role="alert" className="text-sm text-red mb-3">{error}</p>}
      <button className="btn-primary w-full py-3 flex items-center justify-center gap-2" disabled={saving} onClick={()=>save()}>{saving?<Spinner size={20}/>:saved?(en?'Saved':'Salvato'):(en?'Save':'Salva')}</button>
    </footer>
    <ConfirmDialog isOpen={confirmDelete} title={t('detail.eliminaTitolo')} message={t('detail.eliminaMessaggio',{azienda:form.azienda})} danger onCancel={()=>setConfirmDelete(false)} onConfirm={async()=>{try{await deleteCandidatura(c.id);onBack()}catch(e){setConfirmDelete(false);setError(e.message)}}}/>
    {CelebrationOverlay}
    {CoffeePrompt}
  </div>
}
