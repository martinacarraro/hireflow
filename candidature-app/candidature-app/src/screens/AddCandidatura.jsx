import { useState, useEffect, useRef } from 'react'
import { useApp } from '../contexts/AppContext'
import { Field, ChoicePicker, Spinner, SectionLabel } from '../components/UI'
import { STATI, PRIORITA, FONTI, STATUS_CONFIG } from '../lib/utils'
import { useTranslation } from 'react-i18next'

const TODAY = new Date().toISOString().split('T')[0]

export default function AddCandidatura({ onBack, onDone }) {
  const { addCandidatura } = useApp()
  const { t } = useTranslation()
  const [form, setForm] = useState({
    azienda: '', ruolo: '', stato: 'Inviata', priorita: 'Media',
    sede: '', paese: 'Italia', link_annuncio: '', fonte: '',
    stipendio_min: '', stipendio_max: '',
    note: '', notifiche_push: true, data_invio: TODAY, data_colloquio: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [suggestions, setSuggestions] = useState([])
  const [showSugg, setShowSugg] = useState(false)
  const [companyDomain, setCompanyDomain] = useState('')
  const [importing, setImporting] = useState(false)
  const [importNote, setImportNote] = useState('')
  const searchTimer = useRef(null)

  useEffect(() => {
    const q = form.azienda.trim()
    if (q.length < 2) { setSuggestions([]); setShowSugg(false); return }
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(q)}`,
          { mode: 'cors' }
        )
        if (!res.ok) throw new Error('no results')
        const data = await res.json()
        setSuggestions(data.slice(0, 6))
      } catch {
        setSuggestions([])
      }
      setShowSugg(true)
    }, 350)
  }, [form.azienda])

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
      azienda_domain: companyDomain,
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

        <SectionLabel>{t('add.fondamentali')}</SectionLabel>

        <Field label={t('add.azienda')}>
          <div className="relative">
            <input className={`input-field ${errors.azienda ? 'border-red' : ''}`}
              placeholder={t('add.aziendaPlaceholder')}
              value={form.azienda}
              onChange={e => { set('azienda', e.target.value); setCompanyDomain(''); setShowSugg(false) }}
              onBlur={() => setTimeout(() => setShowSugg(false), 200)}
              onFocus={() => { if (form.azienda.trim().length > 1) setShowSugg(true) }}
              autoComplete="off" />
            {showSugg && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border overflow-hidden shadow-xl"
                style={{ background: '#1A1A2E' }}>
                {suggestions.map(s => (
                  <button key={s.domain} type="button"
                    onPointerDown={e => {
                      e.preventDefault()
                      set('azienda', s.name)
                      setCompanyDomain(s.domain)
                      set('azienda_domain', s.domain)
                      setShowSugg(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-purple/20 hover:bg-surface transition-colors border-b border-border/50 last:border-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                      <img src={`https://logo.clearbit.com/${s.domain}`} alt={s.name}
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
                        className="w-7 h-7 object-contain" />
                      <span className="text-sm font-bold hidden" style={{ color: '#8B5CF6' }}>{s.name.charAt(0)}</span>
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-txt truncate">{s.name}</p>
                      <p className="text-xs text-disabled truncate">{s.domain}</p>
                    </div>
                  </button>
                ))}
                <button onPointerDown={e => { e.preventDefault(); setShowSugg(false); setCompanyDomain(''); set('azienda_domain', '') }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-purple/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-soft text-lg">+</span>
                  </div>
                  <p className="text-sm text-muted">{t('add.usaNomePersonalizzato', { nome: form.azienda })}</p>
                </button>
              </div>
            )}
          </div>
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
          {form.link_annuncio && (
            <button
              onClick={async () => {
                setImporting(true); setImportNote('')
                try {
                  const jinaUrl = `https://r.jina.ai/${form.link_annuncio}`
                  const res = await fetch(jinaUrl, { headers: { 'Accept': 'text/plain' } })
                  const text = await res.text()
                  const snippet = text.slice(0, 4000)
                  const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      model: 'claude-sonnet-4-20250514',
                      max_tokens: 500,
                      messages: [{
                        role: 'user',
                        content: `Estrai da questo testo di un annuncio di lavoro i seguenti campi in JSON. Rispondi SOLO con JSON puro, nessun altro testo:
{"azienda": "nome azienda", "ruolo": "titolo posizione", "sede": "città o Remote", "descrizione": "max 200 caratteri descrizione ruolo"}

Testo annuncio:
${snippet}`
                      }]
                    })
                  })
                  const data = await apiRes.json()
                  const raw = data.content?.[0]?.text || '{}'
                  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
                  if (parsed.azienda) set('azienda', parsed.azienda)
                  if (parsed.ruolo) set('ruolo', parsed.ruolo)
                  if (parsed.sede) set('sede', parsed.sede)
                  if (parsed.descrizione) set('note', parsed.descrizione)
                  setImportNote(t('add.importOk'))
                } catch(e) {
                  setImportNote(t('add.importErrore'))
                }
                setImporting(false)
              }}
              disabled={importing}
              className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold border border-purple/40 text-purple-soft active:scale-95 transition-all flex items-center justify-center gap-2"
              style={{ background: 'rgba(123,47,255,0.1)' }}>
              {importing ? <><span className="animate-spin">⏳</span> {t('add.importando')}</> : <>✨ {t('add.importaAuto')}</>}
            </button>
          )}
          {importNote && <p className="text-xs mt-1" style={{ color: importNote.startsWith('✅') ? '#34D399' : '#FBBF24' }}>{importNote}</p>}
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