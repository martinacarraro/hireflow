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
  azienda: '', ruolo: '', stato: 'Inviata', priorita: 'Media',
  sede: '', paese: 'Italia', link_annuncio: '', fonte: '',
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
  const { addCandidatura, showToast } = useApp()
  const { t, i18n } = useTranslation()
  const isIt = i18n.language !== 'en'
  const [form, setForm] = useState(readDraft)
  const [draftStatus, setDraftStatus] = useState(() => {
    try { return localStorage.getItem(DRAFT_KEY) ? 'saved' : '' } catch { return '' }
  })
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const statiConColloquio = ['Prima call','Colloquio','Secondo colloquio']
  const set = (k, v) => {
    const next = { ...form, [k]: v }
    if(k === 'stato') next.interviews = ensureStageInterview(next,v)
    setFormError('')
    setForm(next)
    setErrors(e => ({ ...e, [k]: '' }))
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
    <div className="screen">
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
        <button onClick={onBack} className="nav-arrow" aria-label={t('common.indietro', 'Indietro / Back')}>←</button>
        <div>
          <h2 className="font-bold text-txt text-base">{t('add.titolo')}</h2>
          <p className="text-xs text-muted">{isIt ? 'Bastano azienda e ruolo. Il resto puoi aggiungerlo dopo.' : 'Company and role are enough. Add the rest later.'}</p>
        </div>
      </div>

      <div className="flex-1 scrollable px-5 py-4 space-y-1">
        {draftStatus && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 mb-4">
            <p role="status" className="text-xs text-muted">
              {draftStatus === 'saved'
                ? (isIt ? 'Bozza salvata su questo dispositivo' : 'Draft saved on this device')
                : (isIt ? 'Bozza non salvata: tieni aperta questa schermata.' : 'Draft not saved: keep this screen open.')}
            </p>
            <button type="button" disabled={loading} onClick={clearDraft} className="text-xs text-purple-soft font-semibold py-2">
              {isIt ? 'Ricomincia' : 'Start over'}
            </button>
          </div>
        )}

        <div data-application-fields />

        <Field label={t('add.azienda')}>
          <CompanyAutocomplete
            className={`input-field ${errors.azienda ? 'border-red' : ''}`}
            placeholder={t('add.aziendaPlaceholder')}
            value={form.azienda}
            onChange={value => set('azienda', value)}
            onSelect={company => set('azienda', company.name)}
          />
          {errors.azienda && <p className="text-red text-xs mt-1">{errors.azienda}</p>}
        </Field>

        <Field label={t('add.ruolo')}>
          <RoleInput className={`input-field ${errors.ruolo ? 'border-red' : ''}`}
            placeholder={t('add.ruoloPlaceholder')}
            value={form.ruolo} onChange={value => set('ruolo', value)} />
          {errors.ruolo && <p className="text-red text-xs mt-1">{errors.ruolo}</p>}
        </Field>

        <Field label={t('add.stato')}>
          <select aria-label={t('add.stato')} className="input-field" value={form.stato} onChange={e => set('stato', e.target.value)}>
            {STATI.filter(s => s !== 'Archiviate').map(s => <option key={s} value={s}>{t(`add.stati.${s}`, s)}</option>)}
          </select>
        </Field>

        {statiConColloquio.includes(form.stato) && <div className="py-3"><InterviewFields form={form} onChange={set}/></div>}
        <details className="card mt-4">
          <summary>{isIt?'Altri dettagli · facoltativi':'More details · optional'}</summary>
          <EssentialDetails form={form} onChange={set} includeNotes/>
        </details>
      </div>
        <div className="px-5 pt-3 pb-4 border-t border-border bg-surface flex-shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          {formError && <p role="alert" className="text-sm text-red mb-3">{formError}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2">
            {loading ? <Spinner size={20} /> : (isIt ? 'Salva candidatura' : 'Save application')}
          </button>
        </div>
    </div>
  )
}
