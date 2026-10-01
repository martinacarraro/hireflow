import { useTranslation } from 'react-i18next'
import { getInterviews, newInterview, interviewLabel } from '../lib/applicationFlow'
import { downloadCalendar } from '../lib/calendarExport'

export default function InterviewFields({ form, onChange }) {
  const { i18n } = useTranslation()
  const en = i18n.language === 'en'
  const items = getInterviews(form)
  const update = (id, patch) => onChange('interviews', items.map(e => e.id === id ? {...e,...patch} : e))
  const nextOrder = Math.max(0,...items.map(e => Number(e.order) || 0)) + 1
  const currentOrder = {'Prima call':0,'Colloquio':1,'Secondo colloquio':2}[form.stato]
  const sorted = [...items].sort((a,b) => (a.order === currentOrder ? -1 : b.order === currentOrder ? 1 : a.order-b.order))
  return <div className="space-y-3">
    <p className="text-xs text-muted">{en ? 'Dates are optional. Keep past meetings and add the next one.' : 'Le date sono facoltative. Conserva gli incontri passati e aggiungi il prossimo.'}</p>
    {sorted.map(e => <details key={e.id} open={e.order === currentOrder || e.needsReview || !e.date} className="rounded-xl border border-border p-3">
      <summary className="font-semibold text-sm text-txt">
        {interviewLabel(e,en)}
        <span className="text-xs text-muted">{e.date ? ` · ${new Date(e.date+'T00:00:00').toLocaleDateString(en?'en-GB':'it-IT')}` : ''}</span>
      </summary>
      <div className="space-y-3 pt-3">
        {e.needsReview && <p className="text-sm text-amber">{en ? 'This date was saved by an older version. Choose the correct stage below; the date is preserved.' : 'Questa data proviene dalla versione precedente. Indica qui sotto a quale fase appartiene: la data resta conservata.'}</p>}
        <label className="block text-xs text-muted">{en?'Stage':'Fase'}
          <select className="input-field mt-1" value={e.needsReview ? '' : e.order} onChange={ev => update(e.id,{order:Number(ev.target.value),kind:Number(ev.target.value)===0?'call':'interview',needsReview:false})}>
            {e.needsReview && <option value="">{en?'Choose stage':'Scegli la fase'}</option>}
            <option value={0}>{en?'Initial call':'Prima chiamata'}</option>
            {Array.from({length:Math.max(3,nextOrder)},(_,i)=>i+1).map(n=><option key={n} value={n}>{en?`Interview ${n}`:`${n}° colloquio`}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted">{en?'Date':'Data'}<input aria-label={`${interviewLabel(e,en)} ${en?'date':'data'}`} className="input-field mt-1 min-w-0" type="date" value={e.date} onChange={ev=>update(e.id,{date:ev.target.value})}/></label>
          <label className="text-xs text-muted">{en?'Time':'Ora'}<input aria-label={`${interviewLabel(e,en)} ${en?'time':'ora'}`} className="input-field mt-1 min-w-0" type="time" value={e.time} onChange={ev=>update(e.id,{time:ev.target.value})}/></label>
        </div>
        <label className="block text-xs text-muted">{en?'Meeting status':'Stato dell’incontro'}
          <select className="input-field mt-1" value={e.status} onChange={ev=>update(e.id,{status:ev.target.value})}>
            <option value="scheduled">{en?'Scheduled / to arrange':'Programmato / da fissare'}</option>
            <option value="completed">{en?'Completed':'Svolto'}</option>
            <option value="cancelled">{en?'Cancelled':'Annullato'}</option>
          </select>
        </label>
        <details><summary className="text-purple-soft">{en?'Meeting details · optional':'Dettagli dell’incontro · facoltativi'}</summary>
          <div className="space-y-3 pt-2">
            <label className="block text-xs text-muted">{en?'Format':'Modalità'}<select className="input-field mt-1" value={e.mode || ''} onChange={ev=>update(e.id,{mode:ev.target.value})}>
              <option value="">{en?'Not specified':'Non specificata'}</option><option value="📞 Telefonico">{en?'Phone':'Telefonico'}</option><option value="💻 Video">Video</option><option value="🏢 In presenza">{en?'In person':'In presenza'}</option>
            </select></label>
            <label className="flex gap-2 text-sm"><input type="checkbox" checked={e.kind==='technical'} onChange={ev=>update(e.id,{kind:ev.target.checked?'technical':e.order===0?'call':'interview'})}/>{en?'Technical test':'Prova tecnica'}</label>
            <label className="block text-xs text-muted">{en?'Contact':'Referente'}<input className="input-field mt-1" value={e.contact || ''} onChange={ev=>update(e.id,{contact:ev.target.value})}/></label>
            <label className="block text-xs text-muted">{en?'Notes / video link / address':'Appunti / link video / indirizzo'}<textarea className="input-field mt-1" rows={2} value={e.notes || ''} onChange={ev=>update(e.id,{notes:ev.target.value})}/></label>
          </div>
        </details>
        {e.date && e.status === 'scheduled' && <button type="button" className="btn-secondary w-full" onClick={()=>downloadCalendar({id:`${form.id || 'draft'}-${e.id}`,title:`${form.azienda} · ${interviewLabel(e,en)}`,date:e.date,time:e.time,notes:[e.mode,e.contact,e.notes].filter(Boolean).join('\n')})}>{en?'Export to phone calendar':'Esporta nel calendario del telefono'}</button>}
        <button type="button" className="text-sm text-muted py-2" onClick={()=>{if(window.confirm(en?'Remove this meeting?':'Eliminare questo incontro?'))onChange('interviews',items.filter(x=>x.id!==e.id))}}>{en?'Remove meeting':'Elimina incontro'}</button>
      </div>
    </details>)}
    {form.stato === 'Secondo colloquio' && !items.some(e=>e.order===1) && <button type="button" className="btn-secondary w-full" onClick={()=>onChange('interviews',[...items,newInterview(1)])}>{en?'Add first interview · optional':'Aggiungi il primo colloquio · facoltativo'}</button>}
    <button type="button" className="btn-secondary w-full" onClick={()=>onChange('interviews',[...items,newInterview(nextOrder)])}>{en?'+ Add meeting':'+ Aggiungi un incontro'}</button>
    <p className="text-xs text-muted">{en?'For reminders with this app closed, import the event into your calendar and check its alerts. Re-export if you change the date.' : 'Per gli avvisi ad app chiusa, importa l’evento nel tuo calendario e controlla le notifiche. Se cambi data, esportalo di nuovo.'}</p>
  </div>
}
