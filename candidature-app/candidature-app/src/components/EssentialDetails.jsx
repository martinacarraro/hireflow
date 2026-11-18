import { locationText } from '../lib/location'
import LocationAutocomplete from './LocationAutocomplete'
import { useTranslation } from 'react-i18next'
import JobFields from './JobFields'
import InterviewFields from './InterviewFields'
import { localDay } from '../lib/applicationFlow'

function SectionHeading({ icon, children }) {
  const paths = {
    document: <><path d="M8 3h6l4 4v14H6V3h2Z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></>,
    note: <><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 17h2"/></>,
  }
  return <h3 className="text-sm font-semibold text-txt flex items-center gap-2">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-purple-soft">{paths[icon]}</svg>
    <span>{children}</span>
  </h3>
}

export default function EssentialDetails({ form, onChange, onLocationSelect, includeNotes = false }) {
  const { i18n } = useTranslation()
  const en = i18n.language === 'en'
  const fieldClass = 'block text-xs text-muted'

  return <div className="space-y-5 pt-3">
    <section className="space-y-4 border-b border-border/60 pb-5">
      <div>
        <SectionHeading icon="document">{en ? 'Job information' : 'Informazioni dell’annuncio'}</SectionHeading>
        <p className="text-xs text-muted mt-1">{en ? 'When and where you applied.' : 'Quando e dove hai inviato la candidatura.'}</p>
      </div>
      <label className={fieldClass}>{en ? 'Application date' : 'Data candidatura'}
        <input className="input-field mt-1" type="date" max={localDay()} value={form.data_invio || ''} onChange={e=>{const today=localDay();if(!e.target.value || e.target.value<=today)onChange('data_invio',e.target.value)}}/>
      </label>
      <label className={fieldClass}>{en ? 'Job posting link (optional)' : 'Link annuncio (facoltativo)'}
        <input className="input-field mt-1" type="url" placeholder="https://…" value={form.link_annuncio || ''} onChange={e=>onChange('link_annuncio',e.target.value)}/>
      </label>
      <label className={fieldClass}>{en ? 'Location' : 'Località'}
        <LocationAutocomplete className="input-field mt-1" value={locationText(form)} language={en?'en':'it'} onChange={value=>onChange('sede',value)} onSelect={onLocationSelect}/>
      </label>
    </section>

    <section className="rounded-2xl border border-border bg-surface/50 p-4 space-y-4">
      <div>
        <SectionHeading icon="briefcase">{en ? 'Job conditions' : 'Condizioni di lavoro'}</SectionHeading>
        <p className="text-xs text-muted mt-1">{en ? 'Details about the role and compensation.' : 'Dettagli su orario, contratto e retribuzione.'}</p>
      </div>
      <JobFields form={form} onChange={onChange} compact/>
      <fieldset>
        <legend className="text-xs text-muted mb-2">{en ? 'Gross annual salary · euros' : 'RAL annua lorda · euro'}</legend>
        <div className="grid grid-cols-2 gap-3">
          <input aria-label={en?'Minimum salary':'RAL minima'} className="input-field min-w-0" type="number" placeholder={en?'From':'Da'} value={form.stipendio_min ?? ''} onChange={e=>onChange('stipendio_min',e.target.value)}/>
          <input aria-label={en?'Maximum salary':'RAL massima'} className="input-field min-w-0" type="number" placeholder={en?'To':'A'} value={form.stipendio_max ?? ''} onChange={e=>onChange('stipendio_max',e.target.value)}/>
        </div>
      </fieldset>
    </section>

    {includeNotes && <section className="space-y-3 border-b border-border/60 pb-5">
      <SectionHeading icon="note">{en ? 'Personal notes' : 'Note personali'}</SectionHeading>
      <textarea aria-label={en?'Personal notes':'Note personali'} className="input-field resize-y" rows={3} placeholder={en?'Add a note about this application…':'Aggiungi una nota su questa candidatura…'} value={form.note || ''} onChange={e=>onChange('note',e.target.value)}/>
    </section>}

    <section className="space-y-2">
      <SectionHeading icon="calendar">{en ? 'Application timeline' : 'Percorso della candidatura'}</SectionHeading>
      <InterviewFields form={form} onChange={onChange} historyOnly/>
    </section>
  </div>
}
