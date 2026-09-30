import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { Field, ChoicePicker, Spinner, SectionLabel } from '../components/UI'
import { STATI, PRIORITA, FONTI } from '../lib/utils'
import { useTranslation } from 'react-i18next'
import CompanyAutocomplete from '../components/CompanyAutocomplete'
import JobFields, { RoleInput } from '../components/JobFields'

const TODAY = new Date().toISOString().split('T')[0]

export default function AddCandidatura({ onBack, onDone }) {
  const { addCandidatura, showToast } = useApp()
  const { t, i18n } = useTranslation()
  const isIt = i18n.language !== 'en'
  const [form, setForm] = useState({
    azienda: '', ruolo: '', stato: 'Inviata', priorita: 'Media',
    sede: '', paese: 'Italia', link_annuncio: '', fonte: '',
    stipendio_min: '', stipendio_max: '',
    note: '', notifiche_push: true, data_invio: TODAY, data_colloquio: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const statiConColloquio = ['Prima call','Colloquio','Secondo colloquio']
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.azienda.trim()) e.azienda = t('add.campoObbligatorio')
    if (!form.ruolo.trim()) e.ruolo = t('add.campoObbligatorio')
    setErrors(e)
    return !Object.keys(e).length
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
    if (result) onDone?.()
    } catch {
      showToast(isIt ? 'Salvataggio non riuscito. Riprova: i campi sono ancora qui.' : 'Could not save. Try again: your entries are still here.', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="screen">
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
        <button onClick={onBack} className="text-muted text-lg active:scale-90 transition-transform">←</button>
        <div>
          <h2 className="font-bold text-txt text-base">{t('add.titolo')}</h2>
          <p className="text-xs text-muted">{isIt ? 'Bastano azienda e ruolo. Il resto puoi aggiungerlo dopo.' : 'Company and role are enough. Add the rest later.'}</p>
        </div>
      </div>

      <div className="flex-1 scrollable px-5 py-4 space-y-1">

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

        <Field label={t('add.dataCandidatura')}>
          <input className="input-field" type="date"
            value={form.data_invio} onChange={e => set('data_invio', e.target.value)} />
        </Field>

        {statiConColloquio.includes(form.stato) && (
          <Field label={t('add.dataColloquio')}>
            <input className="input-field" type="date"
              value={form.data_colloquio} onChange={e => set('data_colloquio', e.target.value)} />
          </Field>
        )}

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

        <Field label={t('add.stipendio')}>
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
            <p className="text-sm font-medium text-txt">🔔 {t('add.notifiche')}</p>
            <p className="text-xs text-muted">{t('add.notificheDesc')}</p>
          </div>
          <button onClick={() => set('notifiche_push', !form.notifiche_push)}
            className={`w-12 h-6 rounded-full transition-all duration-200 relative ${form.notifiche_push ? 'bg-purple' : 'bg-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form.notifiche_push ? 'left-6.5' : 'left-0.5'}`} />
          </button>
        </div>

        </details>
      </div>
        <div className="px-5 pt-3 pb-4 border-t border-border bg-surface flex-shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2">
            {loading ? <Spinner size={20} /> : (isIt ? 'Salva candidatura' : 'Save application')}
          </button>
        </div>
    </div>
  )
}
