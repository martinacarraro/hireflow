import { hiredLabel } from '../lib/utils'
import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { Field, Spinner } from '../components/UI'
import { STATI } from '../lib/utils'
import { useTranslation } from 'react-i18next'
import CompanyAutocomplete from '../components/CompanyAutocomplete'
import { RoleInput } from '../components/JobFields'
import EssentialDetails from '../components/EssentialDetails'
import InterviewFields from '../components/InterviewFields'
import { ensureStageInterview, getInterviews, validationIssues, validationMessage } from '../lib/applicationFlow'

const DRAFT_KEY = 'lfs_application_draft_v1'
const emptyForm = () => ({
  azienda: '', ruolo: '', stato: 'Inviata', spontanea: false, priorita: 'Media',
  sede: '', paese: '', link_annuncio: '', fonte: '',
  stipendio_min: '', stipendio_max: '', note: '', notifiche_push: true,
  data_invio: new Date().toLocaleDateString('sv-SE'), data_colloquio: '',
  tipo_candidatura: 'annuncio', interviews: [], attesa_dal: '', orario_lavoro: '', tipo_contratto: '', modalita_lavoro: '', livello_ruolo: '',
})
function readDraft() {
  const defaults = emptyForm()
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY))
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return defaults
    for (const key of Object.keys(defaults)) {
      if (key === 'interviews' ? Array.isArray(saved[key]) : typeof saved[key] === typeof defaults[key]) defaults[key] = saved[key]
    }
    if (!Array.isArray(saved.interviews)) {
      delete defaults.interviews
      defaults.interviews = getInterviews(defaults)
    }
    defaults.interviews = ensureStageInterview(defaults)
  } catch {}
  return defaults
}

export default function AddCandidatura({ onBack, onDone }) {
  const { addCandidatura, showToast, profile } = useApp()
  const { t, i18n } = useTranslation()
  const isIt = i18n.language !== 'en'
  const [form, setForm] = useState(readDraft)
  const [draftStatus, setDraftStatus] = useState(() => {
    try { return localStorage.getItem(DRAFT_KEY) ? 'saved' : '' } catch { return '' }
  })
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [detailsOpen, setDetailsOpen] = useState(false)
  const statiConColloquio = ['Prima call','Colloquio','Secondo colloquio']
  const set = (k, v) => {
    const next = { ...form, [k]: v, ...(k === 'sede' ? {paese:''} : {}) }
    if(k === 'stato') next.interviews = ensureStageInterview(next,v)
    setFormError('')
    setForm(next)
    setErrors(e => ({ ...e, [k]: '' }))
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
      setDraftStatus('saved')
    } catch { setDraftStatus('error') }
  }
  const setLocation = ({ name, country }) => {
    const next = { ...form, sede: name, paese: country }
    setFormError('')
    setForm(next)
    setErrors(e => ({ ...e, sede: '' }))
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
      setDraftStatus('saved')
    } catch { setDraftStatus('error') }
  }
  const clearDraft = () => {
    if (!window.confirm(isIt ? 'Vuoi cancellare la bozza e ricominciare?' : 'Discard this draft and start again?')) return
    try { localStorage.removeItem(DRAFT_KEY) } catch {
      showToast(isIt ? 'Impossibile cancellare la bozza. Riprova.' : 'Could not discard the draft. Try again.', 'error')
      return
    }
    setForm(emptyForm())
    setFormError('')
    setErrors({})
    setDraftStatus('')
  }

  const validate = () => {
    const e = {}
    if (!form.azienda.trim()) e.azienda = t('add.campoObbligatorio')
    if (!form.ruolo.trim()) e.ruolo = t('add.campoObbligatorio')
    const issue = validationIssues(form)[0]
    setFormError(issue ? validationMessage(issue,!isIt) : '')
    setErrors(e)
    return !issue
  }

  const handleSubmit = async () => {
    if (loading) return
    if (!validate()) {
      document.querySelector('[data-application-fields]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    setLoading(true)
    try {
    const payload = {
      ...form,
      azienda: form.azienda.trim(),
      ruolo: form.ruolo.trim(),
      stipendio_min: form.stipendio_min ? parseInt(form.stipendio_min) : null,
      stipendio_max: form.stipendio_max ? parseInt(form.stipendio_max) : null,
      data_colloquio: form.data_colloquio || null,
    }
    const result = await addCandidatura(payload)
    if (result) {
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
      setForm(emptyForm())
      setDraftStatus('')
      onDone?.(result)
    }
    } catch (error) {
      setFormError(error.message || (isIt ? 'Salvataggio non riuscito.' : 'Could not save.'))
      showToast(isIt ? 'Salvataggio non riuscito. Riprova: i campi sono ancora qui.' : 'Could not save. Try again: your entries are still here.', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="screen add-screen">
      <header className="add-header flex items-center gap-3 px-5 pt-safe pt-4 pb-4">
        <button onClick={onBack} className="nav-arrow" aria-label={t('common.indietro', 'Indietro / Back')}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="add-eyebrow">{isIt ? 'NUOVA OPPORTUNITÀ' : 'NEW OPPORTUNITY'}</p>
          <h2 className="font-bold text-txt text-xl leading-tight">{t('add.titolo')}</h2>
          <p className="text-xs text-muted mt-1">{isIt ? 'Bastano due informazioni per iniziare.' : 'Just two details to get started.'}</p>
        </div>
        <span className="add-time-chip">{isIt ? '1 min' : '1 min'}</span>
      </header>

      <div className="add-scroll-area flex-1 scrollable px-5 pt-5 pb-6 flex flex-col gap-5" data-application-fields>
        {draftStatus && (
          <div className="add-draft-note" role="status">
            <span className="add-draft-dot" />
            <span className="flex-1">{draftStatus === 'saved'
              ? (isIt ? 'Bozza salvata automaticamente' : 'Draft saved automatically')
              : (isIt ? 'Bozza non salvata: tieni aperta questa schermata.' : 'Draft not saved: keep this screen open.')}</span>
            <button type="button" disabled={loading} onClick={clearDraft} className="text-xs text-purple-soft font-semibold">
              {isIt ? 'Azzera' : 'Reset'}
            </button>
          </div>
        )}

        <section className="add-section">
          <div className="add-section-heading">
            <span className="add-step">01</span>
            <div>
              <h3>{isIt ? 'Le informazioni principali' : 'The essentials'}</h3>
              <p>{isIt ? 'Inizia da azienda e posizione.' : 'Start with company and role.'}</p>
            </div>
          </div>

          <div className="add-fields">
            <Field className="add-field" label={<>{isIt ? 'Azienda' : 'Company'} <span className="add-required">*</span></>}>
              <CompanyAutocomplete
                className={`input-field add-input ${errors.azienda ? 'border-red' : ''}`}
                placeholder={isIt ? 'Es. Spotify, Google, Apple' : 'e.g. Spotify, Google, Apple'}
                value={form.azienda}
                onChange={value => set('azienda', value)}
                onSelect={company => set('azienda', company.name)}
              />
              {errors.azienda && <p className="text-red text-xs mt-1">{errors.azienda}</p>}
            </Field>

            <Field className="add-field" label={<>{isIt ? 'Ruolo' : 'Role'} <span className="add-required">*</span></>}>
              <RoleInput
                className={`input-field add-input ${errors.ruolo ? 'border-red' : ''}`}
                placeholder={isIt ? 'Es. Digital Marketing Specialist' : 'e.g. Product Designer'}
                value={form.ruolo}
                onChange={value => set('ruolo', value)}
              />
              {errors.ruolo && <p className="text-red text-xs mt-1">{errors.ruolo}</p>}
            </Field>

            <div className="add-field flex items-end gap-2">
              <label className="block flex-1 min-w-0 text-xs text-muted">{isIt ? 'A che punto sei?' : 'Application status'}
                <select aria-label={t('add.stato')} className="input-field add-input add-select mt-1" value={form.stato} onChange={e => set('stato', e.target.value)}>
                  {STATI.filter(s => s !== 'Archiviate').map(s => <option key={s} value={s}>{s==='Assunta' ? hiredLabel(t,profile?.genere) : t(`add.stati.${s}`, s)}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-1.5 pb-2 text-xs font-semibold whitespace-nowrap text-txt">
                <input type="checkbox" checked={!!form.spontanea} onChange={e => set('spontanea', e.target.checked)} />
                <span>💡 {isIt ? 'Spontanea' : 'Unsolicited'}</span>
              </label>
            </div>
          </div>
        </section>

        {statiConColloquio.includes(form.stato) && <section className="add-extra-panel"><InterviewFields form={form} onChange={set}/></section>}

        <details className="add-details" open={detailsOpen}>
          <summary onClick={event => { event.preventDefault(); setDetailsOpen(open => !open) }} aria-expanded={detailsOpen} aria-controls="add-details-content">
            <span className="add-details-icon">＋</span>
            <span className="flex-1 min-w-0">
              <strong>{isIt ? 'Aggiungi altri dettagli' : 'Add more details'}</strong>
              <small>{isIt ? 'Sede, link, stipendio, note… anche più tardi' : 'Location, link, salary, notes… you can do it later'}</small>
            </span>
            <span className="add-details-chevron" aria-hidden="true">⌄</span>
          </summary>
          <div className="add-details-content" id="add-details-content">
            <EssentialDetails form={form} onChange={set} onLocationSelect={setLocation} includeNotes/>
          </div>
        </details>
      </div>

      <footer className="add-footer px-5 pt-3 pb-4 flex-shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        {formError && <p role="alert" className="text-sm text-red mb-3">{formError}</p>}
        <button onClick={handleSubmit} disabled={loading} className="btn-primary add-submit w-full flex items-center justify-center gap-2">
          {loading ? <Spinner size={20} /> : <>{isIt ? 'Crea candidatura' : 'Create application'} <span aria-hidden="true">→</span></>}
        </button>
        <p className="add-footer-hint">{isIt ? 'Potrai modificare tutto in qualsiasi momento.' : 'You can edit everything at any time.'}</p>
      </footer>
    </div>
  )
}
