import { useTranslation } from 'react-i18next'
import { getInterviews, ensureStageInterview, interviewLabel, newInterview, INTERVIEW_STATES, upcomingInterviews } from '../lib/applicationFlow'
import { downloadCalendar } from '../lib/calendarExport'

export default function InterviewFields({ form, onChange, historyOnly = false }) {
  const { i18n } = useTranslation()
  const en = i18n.language === 'en'
  const items = getInterviews(form)
  const order = {'Prima call':0,'Colloquio':1,'Secondo colloquio':2}[form.stato]
  const current = items.find(e=>!e.needsReview && e.order===order && e.status==='scheduled') || upcomingInterviews(form)[0] || items.find(e=>!e.needsReview && e.order===order && e.status!=='cancelled')
  const update = (id,patch) => onChange('interviews',items.map(e=>e.id===id?{...e,...patch}:e))
  const inputs = e => <div className="grid grid-cols-2 gap-3">
    <label className="text-xs text-muted">{en?'Date · optional':'Data · facoltativa'}<input aria-label={interviewLabel(e,en)+' '+(en?'date':'data')} className="input-field mt-1 min-w-0" type="date" value={e.date || ''} onChange={ev=>update(e.id,{date:ev.target.value})}/></label>
    <label className="text-xs text-muted">{en?'Time · optional':'Ora · facoltativa'}<input aria-label={interviewLabel(e,en)+' '+(en?'time':'ora')} className="input-field mt-1 min-w-0" type="time" value={e.time || ''} onChange={ev=>update(e.id,{time:ev.target.value})}/></label>
  </div>
  if(historyOnly) {
    const previous = items.filter(e=>e.id!==current?.id)
    if(!previous.length && form.stato!=='Secondo colloquio')return null
    return <details>
      <summary>{en?'Previous meetings · optional':'Incontri precedenti · facoltativi'}</summary>
      <div className="space-y-4 pt-3">
        {previous.map(e=><div key={e.id}>
          <p className="text-sm font-medium mb-2">{interviewLabel(e,en)}</p>
          {e.needsReview && <label className="block text-xs text-amber mb-2">{en?'Which interview was this? The saved date is unchanged.':'A quale colloquio si riferisce? La data salvata resta qui.'}
            <select className="input-field mt-1" value="" onChange={ev=>update(e.id,{order:Number(ev.target.value),needsReview:false})}><option value="">{en?'Choose':'Scegli'}</option><option value="1">{en?'First interview':'Primo colloquio'}</option><option value="2">{en?'Second interview':'Secondo colloquio'}</option></select>
          </label>}
          {inputs(e)}
          {[e.mode,e.contact,e.notes].filter(Boolean).length>0 && <p className="text-sm text-muted mt-2 whitespace-pre-wrap">{[e.mode,e.contact,e.notes].filter(Boolean).join(' · ')}</p>}
        </div>)}
        {form.stato==='Secondo colloquio' && !items.some(e=>e.order===1 || e.needsReview) && <button className="text-sm text-purple-soft py-2" type="button" onClick={()=>onChange('interviews',[...items,newInterview(1)])}>{en?'+ Add first interview date':'+ Aggiungi la data del primo colloquio'}</button>}
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
    {current.date && <button className="text-xs text-purple-soft py-2" type="button" onClick={()=>downloadCalendar({id:(form.id||'draft')+'-'+current.id,title:form.azienda+' · '+interviewLabel(current,en),date:current.date,time:current.time,notes:current.notes})}>{en?'Add to phone calendar':'Aggiungi al calendario del telefono'}</button>}
  </div>
}
