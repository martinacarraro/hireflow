import { useTranslation } from 'react-i18next'
import JobFields from './JobFields'
import InterviewFields from './InterviewFields'

export default function EssentialDetails({ form, onChange, includeNotes = false }) {
  const { i18n } = useTranslation()
  const en = i18n.language === 'en'
  return <div className="space-y-4 pt-3">
    <label className="block text-xs text-muted">{en?'Application date':'Data candidatura'}<input className="input-field mt-1" type="date" value={form.data_invio || ''} onChange={e=>onChange('data_invio',e.target.value)}/></label>
    <label className="block text-xs text-muted">{en?'Job posting link':'Link annuncio'}<input className="input-field mt-1" type="url" placeholder="https://…" value={form.link_annuncio || ''} onChange={e=>onChange('link_annuncio',e.target.value)}/></label>
    <label className="block text-xs text-muted">{en?'Location':'Luogo di lavoro'}<input className="input-field mt-1" value={form.sede || ''} onChange={e=>onChange('sede',e.target.value)}/></label>
    <JobFields form={form} onChange={onChange} compact/>
    <fieldset><legend className="text-xs text-muted mb-1">{en?'Gross annual salary · euros':'RAL annua lorda · euro'}</legend><div className="grid grid-cols-2 gap-3">
      <input aria-label={en?'Minimum salary':'RAL minima'} className="input-field" type="number" placeholder={en?'From':'Da'} value={form.stipendio_min ?? ''} onChange={e=>onChange('stipendio_min',e.target.value)}/>
      <input aria-label={en?'Maximum salary':'RAL massima'} className="input-field" type="number" placeholder={en?'To':'A'} value={form.stipendio_max ?? ''} onChange={e=>onChange('stipendio_max',e.target.value)}/>
    </div></fieldset>
    {includeNotes && <label className="block text-xs text-muted">{en?'Notes':'Note'}<textarea className="input-field mt-1" rows={3} value={form.note || ''} onChange={e=>onChange('note',e.target.value)}/></label>}
    <InterviewFields form={form} onChange={onChange} historyOnly/>
  </div>
}
