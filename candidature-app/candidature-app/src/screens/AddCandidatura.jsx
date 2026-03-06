import { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { Field, ChoicePicker, Spinner, SectionLabel } from '../components/UI'
import { STATI, PRIORITA, FONTI, STATUS_CONFIG } from '../lib/utils'

const TODAY = new Date().toISOString().split('T')[0]

export default function AddCandidatura({ onBack, onDone }) {
  const { addCandidatura } = useApp()
  const [form, setForm] = useState({
    azienda: '', ruolo: '', stato: 'Inviata', priorita: 'Media',
    sede: '', paese: 'Italia', link_annuncio: '', fonte: 'Altro',
    stipendio_min: '', stipendio_max: '',
    note: '', notifiche_push: true, data_invio: TODAY, data_colloquio: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const statiConColloquio = ['Prima call','Colloquio','Secondo colloquio']
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.azienda.trim()) e.azienda = 'Campo obbligatorio'
    if (!form.ruolo.trim()) e.ruolo = 'Campo obbligatorio'
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
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
        <button onClick={onBack} className="text-muted text-lg active:scale-90 transition-transform">
          ←
        </button>
        <div>
          <h2 className="font-bold text-txt text-base">Nuova candidatura ✍️</h2>
          <p className="text-xs text-muted italic">Compila i campi per aggiungere una candidatura.</p>
        </div>
      </div>

      <div className="flex-1 scrollable px-5 py-4 space-y-1">

        {/* FONDAMENTALI */}
        <SectionLabel>I FONDAMENTALI ✱</SectionLabel>

        <Field label="🏢 Azienda">
          <input className={`input-field ${errors.azienda ? 'border-red' : ''}`}
            placeholder="Es: Spotify, Ferrero, Studio Rossi..."
            value={form.azienda} onChange={e => set('azienda', e.target.value)} />
          {errors.azienda && <p className="text-red text-xs mt-1">{errors.azienda}</p>}
        </Field>

        <Field label="💼 Ruolo">
          <input className={`input-field ${errors.ruolo ? 'border-red' : ''}`}
            placeholder="Es: UX Designer, Data Analyst, PM..."
            value={form.ruolo} onChange={e => set('ruolo', e.target.value)} />
          {errors.ruolo && <p className="text-red text-xs mt-1">{errors.ruolo}</p>}
        </Field>

        <Field label="📋 Stato">
          <ChoicePicker value={form.stato} options={STATI}
            onChange={v => set('stato', v)} colorFn={statusColor} />
        </Field>

        {/* DATE */}
        <Field label="📅 Data candidatura">
          <input className="input-field" type="date"
            value={form.data_invio} onChange={e => set('data_invio', e.target.value)} />
        </Field>

        {statiConColloquio.includes(form.stato) && (
          <Field label="🗓️ Data colloquio">
            <input className="input-field" type="date"
              value={form.data_colloquio} onChange={e => set('data_colloquio', e.target.value)} />
          </Field>
        )}

        {/* SEDE */}
        <SectionLabel>DOVE?</SectionLabel>
        <div className="flex gap-3">
          <Field label="📍 Sede">
            <input className="input-field" placeholder="Milano, Roma..."
              value={form.sede} onChange={e => set('sede', e.target.value)} />
          </Field>
          <Field label="🌍 Paese">
            <input className="input-field" placeholder="Italia"
              value={form.paese} onChange={e => set('paese', e.target.value)} />
          </Field>
        </div>

        {/* DETAILS */}
        <SectionLabel>I DETTAGLI</SectionLabel>

        <Field label="📣 Fonte">
          <ChoicePicker value={form.fonte} options={FONTI}
            onChange={v => set('fonte', v)} />
        </Field>

        <Field label="⚡ Priorità">
          <ChoicePicker value={form.priorita} options={PRIORITA}
            onChange={v => set('priorita', v)} />
        </Field>

        <Field label="💰 Stipendio indicativo">
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

        {/* NOTES */}
        <SectionLabel>PRIME IMPRESSIONI</SectionLabel>
        <Field>
          <textarea className="input-field resize-none" rows={3}
            placeholder="Cosa ti ha convinto a candidarti? Prime sensazioni..."
            value={form.note} onChange={e => set('note', e.target.value)} />
        </Field>

        {/* NOTIFICATIONS */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-txt">🔔 Notifiche push</p>
            <p className="text-xs text-muted">Promemoria per questa candidatura</p>
          </div>
          <button onClick={() => set('notifiche_push', !form.notifiche_push)}
            className={`w-12 h-6 rounded-full transition-all duration-200 relative
              ${form.notifiche_push ? 'bg-purple' : 'bg-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200
              ${form.notifiche_push ? 'left-6.5' : 'left-0.5'}`} />
          </button>
        </div>

        {/* SUBMIT */}
        <div className="pt-4 pb-6">
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2">
            {loading ? <Spinner size={20} /> : 'Aggiungi candidatura 🚀'}
          </button>
        </div>
      </div>
    </div>
  )
}
