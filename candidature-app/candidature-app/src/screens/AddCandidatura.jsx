import { useState, useRef } from 'react'
import { useApp } from '../contexts/AppContext'
import { Field, ChoicePicker, Spinner, SectionLabel } from '../components/UI'
import { STATI, PRIORITA, FONTI, STATUS_CONFIG, fetchJobDataFromUrl, parseJobUrl } from '../lib/utils'

const TODAY = new Date().toISOString().split('T')[0]

async function parseWithAI(text) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Estrai i dati da questo annuncio di lavoro e rispondi SOLO con un JSON valido, senza testo aggiuntivo:
{
  "azienda": "nome azienda o stringa vuota",
  "ruolo": "titolo del ruolo o stringa vuota",
  "sede": "città o stringa vuota",
  "paese": "paese o Italia come default",
  "stipendio_min": numero intero in migliaia di euro o null,
  "stipendio_max": numero intero in migliaia di euro o null,
  "fonte": "LinkedIn o Indeed o InfoJobs o Glassdoor o Sito aziendale o Altro"
}

Annuncio:
${text.slice(0, 3000)}`
      }]
    })
  })
  const data = await response.json()
  const raw = data.content?.[0]?.text || ''
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export default function AddCandidatura({ onBack, onDone }) {
  const { addCandidatura } = useApp()
  const [form, setForm] = useState({
    azienda: '', ruolo: '', stato: 'Inviata', priorita: 'Media',
    sede: '', paese: 'Italia', link_annuncio: '', fonte: 'Altro',
    stipendio_min: '', stipendio_max: '',
    note: '', notifiche_push: true, data_invio: TODAY, data_colloquio: '',
  })
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState(false)
  const [parseFailed, setParseFailed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showTextPaste, setShowTextPaste] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [aiParsing, setAiParsing] = useState(false)
  const [aiParsed, setAiParsed] = useState(false)
  const parseTimer = useRef(null)

  const statiConColloquio = ['Call conoscitiva','Colloquio','Secondo colloquio']
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleUrlChange = (url) => {
    set('link_annuncio', url)
    setParsed(false); setParseFailed(false)
    if (!url || url.length < 15) return
    clearTimeout(parseTimer.current)
    parseTimer.current = setTimeout(async () => {
      setParsing(true)
      const result = await fetchJobDataFromUrl(url)
      setParsing(false)
      if (result.success) {
        setForm(f => ({
          ...f,
          azienda: result.azienda || f.azienda,
          ruolo: result.ruolo || f.ruolo,
          fonte: result.fonte || f.fonte,
        }))
        setParsed(true)
      } else {
        const { fonte } = parseJobUrl(url)
        set('fonte', fonte)
        if (url.length > 15) setParseFailed(true)
      }
    }, 800)
  }

  const handleAIParse = async () => {
    if (!pastedText.trim()) return
    setAiParsing(true)
    setAiParsed(false)
    try {
      const result = await parseWithAI(pastedText)
      setForm(f => ({
        ...f,
        azienda: result.azienda || f.azienda,
        ruolo: result.ruolo || f.ruolo,
        sede: result.sede || f.sede,
        paese: result.paese || f.paese,
        fonte: result.fonte || f.fonte,
        stipendio_min: result.stipendio_min ?? f.stipendio_min,
        stipendio_max: result.stipendio_max ?? f.stipendio_max,
      }))
      setAiParsed(true)
      setShowTextPaste(false)
    } catch {
      alert('Errore AI — riprova o compila manualmente.')
    }
    setAiParsing(false)
  }

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
          <p className="text-xs text-muted italic">Incolla il link o il testo dell'annuncio.</p>
        </div>
      </div>

      <div className="flex-1 scrollable px-5 py-4 space-y-1">

        {/* SMART LINK SECTION */}
        <div className="card mb-3 border-purple/30">
          <SectionLabel>🔗 LINK ANNUNCIO</SectionLabel>
          <div className="relative">
            <input
              className="input-field pr-10"
              placeholder="Incolla il link da LinkedIn, Indeed, InfoJobs..."
              value={form.link_annuncio}
              onChange={e => handleUrlChange(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {parsing && <Spinner size={16} />}
              {!parsing && parsed && <span className="text-green text-sm">✓</span>}
            </div>
          </div>
          {parsed && (
            <div className="mt-2 p-2.5 bg-green/10 border border-green/20 rounded-xl text-xs text-green">
              ✅ Dati estratti dall'annuncio — controlla e modifica se necessario!
            </div>
          )}
          {parseFailed && (
            <p className="text-xs text-muted mt-1.5">
              Non riesco ad estrarre i dati dal link 😕
            </p>
          )}
        </div>

        {/* AI TEXT PASTE */}
        <div className="card mb-5 border-purple/30">
          <div className="flex items-center justify-between">
            <SectionLabel>🤖 INCOLLA TESTO ANNUNCIO (AI)</SectionLabel>
            <button
              onClick={() => setShowTextPaste(v => !v)}
              className="text-xs text-purple-soft font-medium mb-2"
            >
              {showTextPaste ? 'Chiudi ↑' : 'Apri ↓'}
            </button>
          </div>

          {!showTextPaste && aiParsed && (
            <div className="p-2.5 bg-green/10 border border-green/20 rounded-xl text-xs text-green">
              ✅ Dati estratti dall'AI — controlla e modifica se necessario!
            </div>
          )}

          {showTextPaste && (
            <div className="space-y-2">
              <textarea
                className="input-field resize-none text-xs"
                rows={6}
                placeholder="Copia e incolla qui il testo completo dell'annuncio di lavoro (da LinkedIn, Indeed, email, PDF...)&#10;&#10;L'AI estrarrà automaticamente: azienda, ruolo, sede, stipendio..."
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
              />
              <button
                onClick={handleAIParse}
                disabled={aiParsing || !pastedText.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm"
              >
                {aiParsing ? <><Spinner size={16} /> Analisi in corso...</> : '✨ Estrai dati con AI'}
              </button>
            </div>
          )}
        </div>

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
