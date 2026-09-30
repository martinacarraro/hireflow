import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { Field, ChoicePicker, Spinner, SectionLabel } from '../components/UI'
import { STATI, PRIORITA, FONTI, STATUS_CONFIG } from '../lib/utils'
import { useTranslation } from 'react-i18next'
import CompanyAutocomplete from '../components/CompanyAutocomplete'
import { parseJobText } from '../lib/jobText'

const TODAY = new Date().toISOString().split('T')[0]

export default function AddCandidatura({ onBack, onDone }) {
  const { addCandidatura } = useApp()
  const { t, i18n } = useTranslation()
  const isIt = i18n.language !== 'en'
  const [importText, setImportText] = useState('')
  const [importLink, setImportLink] = useState('')
  const [proposal, setProposal] = useState(null)
  const [importMessage, setImportMessage] = useState('')
  const importLabels = { azienda: isIt ? 'Azienda' : 'Company', ruolo: isIt ? 'Ruolo' : 'Role', sede: isIt ? 'Sede' : 'Location', stipendio_min: isIt ? 'RAL minima (€)' : 'Minimum annual gross (€)', stipendio_max: isIt ? 'RAL massima (€)' : 'Maximum annual gross (€)', link_annuncio: 'Link', fonte: isIt ? 'Fonte' : 'Source' }
  const [form, setForm] = useState({
    azienda: '', ruolo: '', stato: 'Inviata', priorita: 'Media',
    sede: '', paese: 'Italia', link_annuncio: '', fonte: '',
    stipendio_min: '', stipendio_max: '',
    note: '', notifiche_push: true, data_invio: TODAY, data_colloquio: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const statiConColloquio = ['Prima call','Colloquio','Secondo colloquio']
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.azienda.trim()) e.azienda = t('add.campoObbligatorio')
    if (!form.ruolo.trim()) e.ruolo = t('add.campoObbligatorio')
    if (!form.fonte) e.fonte = t('add.selezionaFonte')
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    const payload = {
      ...form,
      stipendio_min: form.stipendio_min ? parseInt(form.stipendio_min) : null,
      stipendio_max: form.stipendio_max ? parseInt(form.stipendio_max) : null,
      data_colloquio: form.data_colloquio || null,
    }
    const result = await addCandidatura(payload)
    setLoading(false)
    if (result) onDone?.()
  }

  const statusColor = (s) => STATUS_CONFIG[s]?.color

  return (
    <div className="screen">
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
        <button onClick={onBack} className="text-muted text-lg active:scale-90 transition-transform">←</button>
        <div>
          <h2 className="font-bold text-txt text-base">{t('add.titolo')}</h2>
          <p className="text-xs text-muted italic">{t('add.sottotitolo')}</p>
        </div>
      </div>

      <div className="flex-1 scrollable px-5 py-4 space-y-1">

        <details className="card mb-4">
          <summary className="font-semibold text-purple-soft cursor-pointer">{isIt ? '📋 Compila da un annuncio' : '📋 Fill from a job posting'}</summary>
          <p className="text-xs text-muted my-3">{isIt ? 'Incolla il testo: viene analizzato sul dispositivo. Controlla i suggerimenti prima di applicarli; alcuni dati potrebbero non essere riconosciuti.' : 'Paste the text: it is processed on your device. Review suggestions before applying them; some details may not be recognized.'}</p>
          <textarea aria-label={isIt ? 'Testo annuncio' : 'Job posting text'} className="input-field w-full" rows={6} maxLength={30000} value={importText} onChange={e => { setImportText(e.target.value); setProposal(null) }} placeholder={isIt ? 'Incolla qui il testo completo dell’offerta…' : 'Paste the complete job posting here…'} />
          <input aria-label={isIt ? 'Link annuncio facoltativo' : 'Optional posting URL'} className="input-field w-full mt-2" type="url" value={importLink} onChange={e => { setImportLink(e.target.value); setProposal(null) }} placeholder={isIt ? 'Link facoltativo (non viene aperto)' : 'Optional URL (will not be opened)'} />
          <button type="button" disabled={!importText.trim()} className="btn-primary w-full mt-3 disabled:opacity-50" onClick={() => { setProposal(parseJobText(importText, importLink)); setImportMessage('') }}>{isIt ? 'Trova i dati' : 'Find details'}</button>
          {proposal && <div className="mt-3 space-y-2">
            <p className="text-xs text-muted">{Object.keys(proposal).length ? (isIt ? 'Correggi i valori proposti. Verranno applicati solo ai campi ancora vuoti.' : 'Edit the proposed values. They will only fill empty fields.') : (isIt ? 'Non ho riconosciuto dati con sufficiente certezza. Puoi compilare il modulo qui sotto.' : 'No details could be recognized confidently. Complete the form below.')}</p>
            {Object.entries(proposal).map(([key, value]) => <label key={key} className="block text-xs text-muted">{importLabels[key]}<input className="input-field w-full mt-1" value={value} onChange={e => setProposal(p => ({ ...p, [key]: e.target.value }))} /></label>)}
            {Object.keys(proposal).length > 0 && <button type="button" className="btn-primary w-full" onClick={() => {
              setForm(current => { const next = { ...current }; for (const [key, value] of Object.entries(proposal)) if (!String(current[key] || '').trim() && value.trim()) next[key] = value.trim(); return next })
              setProposal(null)
              setImportMessage(isIt ? 'Dati applicati ai campi vuoti. Controlla il modulo e completa ciò che manca prima di salvare.' : 'Empty fields filled. Review the form and complete missing details before saving.')
            }}>{isIt ? 'Applica ai campi vuoti' : 'Fill empty fields'}</button>}
          </div>}
          {importMessage && <p role="status" className="text-xs text-purple-soft mt-3">{importMessage}</p>}
        </details>

        <SectionLabel>{t('add.fondamentali')}</SectionLabel>

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
          <input className={`input-field ${errors.ruolo ? 'border-red' : ''}`}
            placeholder={t('add.ruoloPlaceholder')}
            value={form.ruolo} onChange={e => set('ruolo', e.target.value)} />
          {errors.ruolo && <p className="text-red text-xs mt-1">{errors.ruolo}</p>}
        </Field>

        <Field label={t('add.stato')}>
          <ChoicePicker 
  value={form.stato} 
  options={STATI.filter(s => s !== 'Archiviate')} 
  onChange={v => set('stato', v)} 
  colorFn={statusColor}
  labelFn={v => t(`add.stati.${v}`, v)} 
/>
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

        <SectionLabel>{t('add.dove')}</SectionLabel>
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
          <ChoicePicker value={form.fonte} options={FONTI} onChange={v => set('fonte', v)}
  labelFn={v => t(`add.fonti.${v}`, v)} />
          {(errors.fonte || (!form.fonte)) && <p className="text-red text-xs mt-1">{t('add.fonteAvviso')}</p>}
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
              <input className="input-field pl-7" type="number" placeholder="Min k"
                value={form.stipendio_min} onChange={e => set('stipendio_min', e.target.value)} />
            </div>
            <span className="text-muted">–</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
              <input className="input-field pl-7" type="number" placeholder="Max k"
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

        <div className="pt-4 pb-6">
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2">
            {loading ? <Spinner size={20} /> : t('add.aggiungi')}
          </button>
        </div>
      </div>
    </div>
  )
}
