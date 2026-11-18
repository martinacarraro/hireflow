import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getInterviews, ensureStageInterview, interviewLabel, newInterview, INTERVIEW_STATES, upcomingInterviews } from '../lib/applicationFlow'

export default function InterviewFields({ form, onChange, historyOnly = false }) {
  const { i18n } = useTranslation()
  const en = i18n.language === 'en'
  const [editingDateId, setEditingDateId] = useState(null)
  const [editingTimeId, setEditingTimeId] = useState(null)
  const items = getInterviews(form)
  const order = {'Prima call':0,'Colloquio':1,'Secondo colloquio':2}[form.stato]
  const current = items.find(e=>!e.needsReview && e.order===order && e.status==='scheduled') || upcomingInterviews(form)[0] || items.find(e=>!e.needsReview && e.order===order && e.status!=='cancelled')
  const update = (id,patch) => onChange('interviews',items.map(e=>{
    if(e.id!==id)return e
    const next={...e,...patch}
    if(patch.date!==undefined || patch.time!==undefined){
      const hasDate=/^\\d{4}-\\d{2}-\\d{2}$/.test(next.date || '')
      const hasTime=/^([01]\\d|2[0-3]):[0-5]\\d$/.test(next.time || '')
      const elapsed=hasDate && hasTime && new Date(`${next.date}T${next.time}:00`).getTime()<Date.now()
      next.status=elapsed?'completed':'scheduled'
    }
    return next
  }))
  const editButton = (label, onClick) => <button type="button" className="ml-1 inline-flex items-center text-xs text-purple-soft align-middle" aria-label={label} title={label} onClick={onClick}>✎</button>
  const inputs = e => <div className="grid grid-cols-2 gap-3">
    <div className="text-xs text-muted min-w-0">
      <p>{en?'Date':'Data'}</p>
      {editingDateId===e.id || !e.date
        ? <input autoFocus={editingDateId===e.id} aria-label={interviewLabel(e,en)+' '+(en?'date':'data')} className="input-field mt-1 min-w-0 w-full" type="date" value={e.date || ''} onChange={ev=>update(e.id,{date:ev.target.value})} onBlur={()=>setEditingDateId(null)}/>
        : <div className="mt-1 text-sm text-txt">{e.date}{editButton(en?'Edit date':'Modifica data',()=>setEditingDateId(e.id))}</div>}
    </div>
    <div className="text-xs text-muted min-w-0">
      <p>{en?'Time':'Ora'}</p>
      {editingTimeId===e.id || !e.time
        ? <input autoFocus={editingTimeId===e.id} aria-label={interviewLabel(e,en)+' '+(en?'time':'ora')} className="input-field mt-1 min-w-0 w-full" type="time" value={e.time || ''} onChange={ev=>update(e.id,{time:ev.target.value})} onBlur={()=>setEditingTimeId(null)}/>
        : <div className="mt-1 text-sm text-txt">{e.time}{editButton(en?'Edit time':'Modifica ora',()=>setEditingTimeId(e.id))}</div>}
    </div>
  </div>
  if(historyOnly) {
    const history = items.filter(e=>e.status!=='cancelled').slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'') || (b.time||'').localeCompare(a.time||''))
    if(!history.length && !form.data_invio)return null
    return <details open className="rounded-xl border border-border bg-surface/30 p-3">
      <summary className="cursor-pointer text-xs font-medium text-muted">{en?'Show / hide meeting details':'Mostra / nascondi dettagli degli incontri'}</summary>
      <div className="relative mt-4 space-y-0">
        <div className="absolute left-[5px] top-2 bottom-3 w-px bg-border" aria-hidden="true" />
        {form.data_invio && <div className="relative flex gap-3 pb-4">
          <span className="relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-purple-soft bg-surface" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-txt">{en?'Application sent':'Candidatura inviata'}</p>
            <p className="text-xs text-muted mt-1">{form.data_invio}</p>
          </div>
        </div>}
        {history.map(e=><div key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
          <span className={`relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 ${e.status==='completed'?'border-purple-soft bg-purple-soft':'border-purple-soft bg-surface'}`} aria-hidden="true" />
          <div className="min-w-0 flex-1 rounded-xl border border-border/70 bg-surface/50 p-3 space-y-3">
            <div>
              <p className="text-sm font-semibold text-txt">{interviewLabel(e,en)}</p>
              {e.status==='completed' && <p className="text-[11px] text-muted mt-1">{en?'Completed':'Svolto'}</p>}
            </div>
            {e.needsReview && <label className="block text-xs text-amber">{en?'Which interview was this? The saved date is unchanged.':'A quale colloquio si riferisce? La data salvata resta qui.'}
              <select className="input-field mt-1" value="" onChange={ev=>update(e.id,{order:Number(ev.target.value),needsReview:false})}><option value="">{en?'Choose':'Scegli'}</option><option value="1">{en?'First interview':'Primo colloquio'}</option><option value="2">{en?'Second interview':'Secondo colloquio'}</option></select>
            </label>}
            {inputs(e)}
            {[e.mode,e.contact,e.notes].filter(Boolean).length>0 && <p className="text-xs text-muted whitespace-pre-wrap">{[e.mode,e.contact,e.notes].filter(Boolean).join(' · ')}</p>}
          </div>
        </div>)}
        {form.stato==='Secondo colloquio' && !items.some(e=>e.order===1 || e.needsReview) && <button className="text-sm text-purple-soft py-2 ml-6" type="button" onClick={()=>onChange('interviews',[...items,newInterview(1)])}>{en?'+ Add first interview date':'+ Aggiungi la data del primo colloquio'}</button>}
      </div>
    </details>
  }
  if(!INTERVIEW_STATES.includes(form.stato))return null
  if(!current) {
    if(items.some(e=>e.needsReview))return <p className="text-sm text-amber">{en?'Check the saved date under previous meetings in details.':'Controlla la data salvata in “Incontri precedenti”, nei dettagli.'}</p>
    return <button className="text-sm text-purple-soft py-2" type="button" onClick={()=>onChange('interviews',ensureStageInterview(form))}>{en?'+ Add appointment':'+ Aggiungi appuntamento'}</button>
  }
  return <div className="space-y-2">
    <p className="text-sm font-semibold">{interviewLabel(current,en)}</p>
    {inputs(current)}
  </div>
}
