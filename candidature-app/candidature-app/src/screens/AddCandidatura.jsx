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
  const [step, setStep] = useState(1)
  const [showDetails, setShowDetails] = useState(false)
  const statiConColloquio = ['Prima call','Colloquio','Secondo colloquio']

  const persist = next => {
    setForm(next)
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next))
      setDraftStatus('saved')
    } catch { setDraftStatus('error') }
  }
  const set = (k, v) => {
    const next = { ...form, [k]: v, ...(k === 'sede' ? {paese:''} : {}) }
    if(k === 'stato') next.interviews = ensureStageInterview(next,v)
    setFormError('')
    persist(next)
    setErrors(e => ({ ...e, [k]: '' }))
  }
  const setLocation = ({ name, country }) => {
    const next = { ...form, sede: name, paese: country }
    setFormError('')
    persist(next)
    setErrors(e => ({ ...e, sede: '' }))
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
    setStep(1)
    setShowDetails(false)
    setDraftStatus('')
  }

  const validateStep = current => {
    const nextErrors = {}
    if (current === 1 && !form.azienda.trim()) nextErrors.azienda = t('add.campoObbligatorio')
    if (current === 2 && !form.ruolo.trim()) nextErrors.ruolo = t('add.campoObbligatorio')
    if (current === 3) {
      const issue = validationIssues(form)[0]
      if (issue) {
        setFormError(validationMessage(issue,!isIt))
        setErrors(nextErrors)
        return false
      }
    }
    setErrors(nextErrors)
    setFormError('')
    return Object.keys(nextErrors).length === 0
  }
  const goNext = () => {
    if (!validateStep(step)) return
    setStep(value => Math.min(4, value + 1))
  }
  const goBack = () => {
    if (showDetails) { setShowDetails(false); return }
    if (step > 1) { setStep(value => value - 1); setFormError(''); return }
    onBack?.()
  }

  const handleSubmit = async () => {
    if (loading) return
    if (!form.azienda.trim() || !form.ruolo.trim()) {
      setStep(!form.azienda.trim() ? 1 : 2)
      setFormError(t('add.campoObbligatorio'))
      return
    }
    const issue = validationIssues(form)[0]
    if (issue) {
      setStep(3)
      setShowDetails(false)
      setFormError(validationMessage(issue,!isIt))
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

  const title = showDetails
    ? (isIt ? 'Altri dettagli' : 'More details')
    : step === 4
      ? (isIt ? 'Pronta da salvare?' : 'Ready to save?')
      : (isIt ? ['Azienda','Ruolo','Stato'][step-1] : ['Company','Role','Status'][step-1])

  return (
    <div className="screen add-screen">
      <header className="add-header flex items-center gap-3 px-5 pt-safe pt-4 pb-4">
        <button onClick={goBack} className="nav-arrow" aria-label={t('common.indietro', 'Indietro / Back')}>
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="add-eyebrow">{isIt ? 'NUOVA OPPORTUNITÀ' : 'NEW OPPORTUNITY'}</p>
          <h2 className="font-bold text-txt text-xl leading-tight">{title}</h2>
          <p className="text-xs text-muted mt-1">{showDetails ? (isIt ? 'Sono facoltativi: puoi completarli anche dopo.' : 'Optional: you can complete them later.') : step < 4 ? (isIt ? 'Un passaggio alla volta, ci vuole pochissimo.' : 'One step at a time, this will be quick.') : (isIt ? 'Controlla i dati e scegli come procedere.' : 'Review the details and choose how to proceed.')}</p>
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

        {!showDetails && step < 4 && (
          <>
            <div className="flex items-center gap-2" aria-label={isIt ? `Passaggio ${step} di 3` : `Step ${step} of 3`}>
              {[1,2,3].map(n => <span key={n} className="h-1.5 flex-1 rounded-full" style={{background:n<=step?'#A78BFA':'rgba(167,139,250,.18)'}} />)}
            </div>
            {step === 1 && <section className="add-section">
              <div className="add-section-heading"><span className="add-step">01</span><div><h3>{isIt ? 'Dove ti sei candidata?' : 'Where did you apply?'}</h3><p>{isIt ? 'Inserisci il nome dell’azienda.' : 'Enter the company name.'}</p></div></div>
              <div className="add-fields">
                <Field className="add-field" label={<>{isIt ? 'Azienda' : 'Company'} <span className="add-required">*</span></>}>
                  <CompanyAutocomplete className={`input-field add-input ${errors.azienda ? 'border-red' : ''}`} placeholder={isIt ? 'Es. Spotify, Google, Apple' : 'e.g. Spotify, Google, Apple'} value={form.azienda} onChange={value => set('azienda', value)} onSelect={company => set('azienda', company.name)} />
                  {errors.azienda && <p className="text-red text-xs mt-1">{errors.azienda}</p>}
                </Field>
              </div>
            </section>}
            {step === 2 && <section className="add-section">
              <div className="add-section-heading"><span className="add-step">02</span><div><h3>{isIt ? 'Per quale posizione?' : 'Which position?'}</h3><p>{isIt ? 'Scrivi il ruolo per cui ti sei candidata.' : 'Enter the role you applied for.'}</p></div></div>
              <div className="add-fields">
                <Field className="add-field" label={<>{isIt ? 'Ruolo' : 'Role'} <span className="add-required">*</span></>}>
                  <RoleInput className={`input-field add-input ${errors.ruolo ? 'border-red' : ''}`} placeholder={isIt ? 'Es. Digital Marketing Specialist' : 'e.g. Product Designer'} value={form.ruolo} onChange={value => set('ruolo', value)} />
                  {errors.ruolo && <p className="text-red text-xs mt-1">{errors.ruolo}</p>}
                </Field>
              </div>
            </section>}
            {step === 3 && <section className="add-section">
              <div className="add-section-heading"><span className="add-step">03</span><div><h3>{isIt ? 'A che punto sei?' : 'What is the current status?'}</h3><p>{isIt ? 'Potrai aggiornarlo in qualsiasi momento.' : 'You can update it at any time.'}</p></div></div>
              <div className="add-fields">
                <label className="block text-xs text-muted">{isIt ? 'Stato candidatura' : 'Application status'}
                  <select aria-label={t('add.stato')} className="input-field add-input add-select mt-2" value={form.stato} onChange={e => set('stato', e.target.value)}>
                    {STATI.filter(s => s !== 'Archiviate').map(s => <option key={s} value={s}>{s==='Assunta' ? hiredLabel(t,profile?.genere) : t(`add.stati.${s}`, s)}</option>)}
                  </select>
                </label>
                <label className={`inline-flex items-center gap-2 self-start px-3 py-2 rounded-full border text-xs font-semibold cursor-pointer transition-colors ${form.spontanea ? 'border-purple/60 bg-purple/20 text-purple-soft' : 'border-border bg-surface text-muted'}`}>
                  <input type="checkbox" className="sr-only" checked={!!form.spontanea} onChange={e => set('spontanea', e.target.checked)} />
                  <span aria-hidden="true" className="text-sm">{form.spontanea ? '✦' : '＋'}</span><span>{isIt ? 'Candidatura spontanea' : 'Unsolicited application'}</span>
                </label>
                {statiConColloquio.includes(form.stato) && <div className="add-extra-panel"><p className="text-xs text-muted mb-3">{isIt ? 'Quando si terrà il prossimo incontro?' : 'When is the next meeting?'}</p><InterviewFields form={form} onChange={set}/></div>}
              </div>
            </section>}
          </>
        )}

        {!showDetails && step === 4 && (
          <section className="add-section">
            <div className="add-section-heading"><span className="add-step">✓</span><div><h3>{isIt ? 'Ecco il riepilogo' : 'Here is your summary'}</h3><p>{isIt ? 'Le informazioni essenziali sono pronte.' : 'The essential information is ready.'}</p></div></div>
            <div className="rounded-2xl border border-border bg-surface/50 p-4 space-y-3">
              <div><p className="text-xs text-muted">{isIt?'Azienda':'Company'}</p><p className="font-semibold text-txt">{form.azienda}</p></div>
              <div><p className="text-xs text-muted">{isIt?'Ruolo':'Role'}</p><p className="font-semibold text-txt">{form.ruolo}</p></div>
              <div><p className="text-xs text-muted">{isIt?'Stato':'Status'}</p><p className="font-semibold text-txt">{t(`add.stati.${form.stato}`,form.stato)}</p></div>
              {form.spontanea && <p className="text-xs text-purple-soft">✦ {isIt?'Candidatura spontanea':'Unsolicited application'}</p>}
              <div className="border-t border-border pt-3"><p className="text-xs text-muted">{isIt?'Data candidatura':'Application date'}</p><p className="text-sm text-txt">{form.data_invio}</p></div>
            </div>
            <p className="text-xs text-muted text-center">{isIt ? 'Puoi salvare adesso e completare il resto in seguito.' : 'Save now and fill in the rest later if you like.'}</p>
          </section>
        )}

        {showDetails && <section className="add-section">
          <div className="add-section-heading"><span className="add-step">＋</span><div><h3>{isIt ? 'Completa la candidatura' : 'Complete the application'}</h3><p>{isIt ? 'Aggiungi solo quello che sai già.' : 'Add only the details you already know.'}</p></div></div>
          <EssentialDetails form={form} onChange={set} onLocationSelect={setLocation} includeNotes/>
        </section>}
      </div>

      <footer className="add-footer px-5 pt-3 pb-4 flex-shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        {formError && <p role="alert" className="text-sm text-red mb-3">{formError}</p>}
        {showDetails ? (
          <button onClick={handleSubmit} disabled={loading} className="btn-primary add-submit w-full flex items-center justify-center gap-2">{loading ? <Spinner size={20}/> : <>{isIt?'Salva candidatura':'Save application'} <span>→</span></>}</button>
        ) : step < 4 ? (
          <button onClick={goNext} className="btn-primary add-submit w-full flex items-center justify-center gap-2">{isIt?'Continua':'Continue'} <span>→</span></button>
        ) : (
          <div className="space-y-2">
            <button onClick={handleSubmit} disabled={loading} className="btn-primary add-submit w-full flex items-center justify-center gap-2">{loading ? <Spinner size={20}/> : <>{isIt?'Salva':'Save'} <span>✓</span></>}</button>
            <button type="button" onClick={()=>setShowDetails(true)} className="w-full rounded-2xl border border-border bg-surface py-4 text-sm font-semibold text-txt">{isIt?'Aggiungi altri dettagli':'Add more details'} <span className="text-purple-soft">＋</span></button>
          </div>
        )}
        <p className="add-footer-hint">{isIt ? 'Potrai modificare tutto in qualsiasi momento.' : 'You can edit everything at any time.'}</p>
      </footer>
    </div>
  )
}
