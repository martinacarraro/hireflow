import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { Field, ChoicePicker, Spinner, SectionLabel } from '../components/UI'
import { STATI, PRIORITA, FONTI } from '../lib/utils'
import { useTranslation } from 'react-i18next'
import CompanyAutocomplete from '../components/CompanyAutocomplete'
import JobFields, { RoleInput } from '../components/JobFields'
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

        <div data-application-fields className="text-xs text-muted mb-3">{isIt ? '1. A quale opportunità ti candidi?' : '1. Which opportunity are you applying for?'}</div>

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

        <p className="text-xs text-muted pt-3 pb-2">{isIt ? '2. A che punto sei?' : '2. Where are you in the process?'}</p>
        <Field label={t('add.stato')}>
          <select aria-label={t('add.stato')} className="input-field" value={form.stato} onChange={e => set('stato', e.target.value)}>
            {STATI.filter(s => s !== 'Archiviate').map(s => <option key={s} value={s}>{t(`add.stati.${s}`, s)}</option>)}
          </select>
        </Field>

        <Field label={isIt ? 'Tipo di candidatura' : 'Application type'}>
          <select className="input-field" value={form.tipo_candidatura} onChange={e=>set('tipo_candidatura',e.target.value)}>
            <option value="annuncio">{isIt?'Risposta a un annuncio':'Job posting'}</option>
            <option value="spontanea">{isIt?'Candidatura spontanea':'Unsolicited application'}</option>
          </select>
        </Field>
        <Field label={t('add.dataCandidatura')}>
          <input className="input-field" type="date"
            value={form.data_invio} onChange={e => set('data_invio', e.target.value)} />
        </Field>

        {(statiConColloquio.includes(form.stato) || form.interviews.length > 0) && (
          <div className="card my-4"><InterviewFields form={form} onChange={set}/></div>
        )}
        {form.stato === 'In attesa risposta' && <Field label={isIt?'In attesa dal · facoltativo':'Waiting since · optional'}>
          <input className="input-field" type="date" value={form.attesa_dal} onChange={e=>set('attesa_dal',e.target.value)}/>
        </Field>}
        <details className="card mt-4">
          <summary className="cursor-pointer font-semibold text-purple-soft py-1">{isIt ? 'Altri dettagli · facoltativi' : 'More details · optional'}</summary>
          <p className="text-xs text-muted mt-2 mb-4">{isIt ? 'Luogo, link, stipendio e appunti: aggiungi solo ciò che ti serve.' : 'Location, link, salary and notes: add only what you need.'}</p>
        <SectionLabel>{t('add.dove')}</SectionLabel>
        <JobFields form={form} onChange={set} />
        <div className="flex gap-3">
          <Field label={t('add.sede')}>
            <input className="input-field" placeholder={t('add.sedePlaceholder')}
              value={form.sede} onChange={e => set('sede', e.target.value)} />
          </Field>
          <Field label={t('add.paese')}>
            <input className="input-field" placeholder="Italia"
              value={form.paese} onChange={e => set('paese', e.target.value)} />
          </Field>
        </div>

        <SectionLabel>{t('add.dettagli')}</SectionLabel>

        <Field label={t('add.fonte')}>
          <select aria-label={t('add.fonte')} className="input-field" value={form.fonte} onChange={e => set('fonte', e.target.value)}>
            <option value="">{isIt ? 'Non specificata' : 'Not specified'}</option>
            {FONTI.map(f => <option key={f} value={f}>{t(`add.fonti.${f}`, f)}</option>)}
          </select>
        </Field>

        <Field label={t('add.linkAnnuncio')}>
          <div className="flex gap-2">
            <input className="input-field flex-1 text-sm" type="url"
              placeholder={t('add.linkPlaceholder')}
              value={form.link_annuncio} onChange={e => set('link_annuncio', e.target.value)} />
            {form.link_annuncio && (
              <a href={form.link_annuncio} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 px-3 py-2 rounded-xl border border-border text-muted text-sm active:scale-95 transition-all">↗</a>
            )}
          </div>
        </Field>

        <Field label={t('add.prioritaLabel', t('detail.priorita'))}>
          <ChoicePicker value={form.priorita} options={PRIORITA} onChange={v => set('priorita', v)}
  labelFn={v => t(`add.priorita.${v}`, v)} />
        </Field>

        <Field label={isIt ? 'RAL annua lorda · euro' : 'Gross annual salary · euros'}>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
              <input aria-label={isIt ? 'Stipendio minimo in euro' : 'Minimum salary in euros'} className="input-field pl-7" type="number" placeholder="28000"
                value={form.stipendio_min} onChange={e => set('stipendio_min', e.target.value)} />
            </div>
            <span className="text-muted">–</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
              <input aria-label={isIt ? 'Stipendio massimo in euro' : 'Maximum salary in euros'} className="input-field pl-7" type="number" placeholder="35000"
                value={form.stipendio_max} onChange={e => set('stipendio_max', e.target.value)} />
            </div>
          </div>
        </Field>

        <SectionLabel>{t('add.primeImpressioni')}</SectionLabel>
        <Field>
          <textarea className="input-field resize-none" rows={3}
            placeholder={t('add.notePlaceholder')}
            value={form.note} onChange={e => set('note', e.target.value)} />
        </Field>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-txt">🔔 {isIt?'Avvisi dentro l’app':'In-app reminders'}</p>
            <p className="text-xs text-muted">{isIt?'Visibili nella campanella quando apri l’app.':'Shown in the notification bell when you open the app.'}</p>
          </div>
          <button onClick={() => set('notifiche_push', !form.notifiche_push)}
            className={`w-12 h-6 rounded-full transition-all duration-200 relative ${form.notifiche_push ? 'bg-purple' : 'bg-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form.notifiche_push ? 'left-[26px]' : 'left-0.5'}`} />
          </button>
        </div>

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
