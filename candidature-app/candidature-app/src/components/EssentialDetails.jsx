import { locationText } from '../lib/location'
import LocationAutocomplete from './LocationAutocomplete'
import { useTranslation } from 'react-i18next'
import JobFields from './JobFields'
import InterviewFields from './InterviewFields'
import { localDay } from '../lib/applicationFlow'

export default function EssentialDetails({ form, onChange, onLocationSelect, includeNotes = false }) {
  const { i18n } = useTranslation()
  const en = i18n.language === 'en'
  const sectionTitle = 'text-sm font-semibold text-txt'
  const fieldClass = 'block text-xs text-muted'

  return <div className="space-y-4 pt-3">
    <section className="rounded-2xl border border-border bg-surface/50 p-4 space-y-4">
      <div>
        <h3 className={sectionTitle}>{en ? 'Job information' : 'Informazioni dell’annuncio'}</h3>
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
        <h3 className={sectionTitle}>{en ? 'Job conditions' : 'Condizioni di lavoro'}</h3>
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

    {includeNotes && <section className="rounded-2xl border border-border bg-surface/50 p-4 space-y-3">
      <h3 className={sectionTitle}>{en ? 'Personal notes' : 'Note personali'}</h3>
      <textarea aria-label={en?'Personal notes':'Note personali'} className="input-field resize-y" rows={3} placeholder={en?'Add a note about this application…':'Aggiungi una nota su questa candidatura…'} value={form.note || ''} onChange={e=>onChange('note',e.target.value)}/>
    </section>}

    <section className="space-y-2">
      <h3 className={sectionTitle}>{en ? 'Interview history' : 'Storico incontri'}</h3>
      <InterviewFields form={form} onChange={onChange} historyOnly/>
    </section>
  </div>
}
