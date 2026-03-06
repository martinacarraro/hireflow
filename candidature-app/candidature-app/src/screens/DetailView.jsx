import { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import {
  StatusBadge, CompanyAvatar, SectionLabel, ConfirmDialog, Spinner
} from '../components/UI'
import {
  STATI, PRIORITA, FEELING_OPTIONS, STATUS_CONFIG, PRIORITA_CONFIG,
  TIPI_COLLOQUIO, FONTI, daysSince, formatDate
} from '../lib/utils'

const STATI_CON_COLLOQUIO = ['Prima call','Colloquio','Secondo colloquio']
const STATI_CON_FEELING = ['In attesa risposta','Rifiutata','Non mi piace','GHOSTED']

export default function DetailView({ candidatura: c, onBack, onUpdate }) {
  const { updateCandidatura, deleteCandidatura, getChecklist, toggleChecklistItem } = useApp()
  const { user } = useApp()
  const [form, setForm] = useState({ ...c })
  const [checklist, setChecklist] = useState([])
  const [loadingChecklist, setLoadingChecklist] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const days = daysSince(c.data_invio)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }

  useEffect(() => {
    if (STATI_CON_COLLOQUIO.includes(form.stato)) loadChecklist()
  }, [form.stato])

  const loadChecklist = async () => {
    setLoadingChecklist(true)
    const items = await getChecklist(c.id)
    setChecklist(items)
    setLoadingChecklist(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await updateCandidatura(c.id, {
      ...form,
      data_colloquio: form.data_colloquio || null,
      ora_colloquio: form.ora_colloquio || null,
    })
    setSaving(false)
    setSaved(true)
    onUpdate?.()
  }

  const handleToggleChecklist = async (item) => {
    const newFatto = !item.fatto
    setChecklist(list => list.map(i => i.id === item.id ? { ...i, fatto: newFatto } : i))
    await toggleChecklistItem(item.id, newFatto)
  }

  const handleDelete = async () => {
    await deleteCandidatura(c.id)
    onBack()
  }

  const doneCount = checklist.filter(i => i.fatto).length
  const checklistPct = checklist.length ? (doneCount / checklist.length) * 100 : 0
  const cfg = STATUS_CONFIG[form.stato] || STATUS_CONFIG['Inviata']

  return (
    <div className="screen">
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(180deg, #1F1F38 0%, #0E0E1A 100%)' }}>
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-2">
          <button onClick={onBack} className="text-muted text-lg active:scale-90 transition-transform">←</button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CompanyAvatar name={form.azienda} size={44} />
              <div className="min-w-0">
                <h2 className="font-bold text-txt text-lg truncate">{form.azienda}</h2>
                <p className="text-muted text-sm truncate">{form.ruolo}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-5 pb-4">
          <StatusBadge stato={form.stato} size="lg" />
          {form.priorita && <span className="text-sm">{PRIORITA_CONFIG[form.priorita]?.emoji}</span>}
          <span className="text-xs text-muted ml-auto">{days}gg fa</span>
          {form.fonte && (
            <span className="text-xs bg-surface border border-border px-2 py-0.5 rounded-full text-muted">{form.fonte}</span>
          )}
        </div>
      </div>

      <div className="flex-1 scrollable px-4 py-4 space-y-4">

        {/* STATO - dropdown */}
        <Section label="📋 AGGIORNA STATO">
          <select
            value={form.stato}
            onChange={e => set('stato', e.target.value)}
            className="input-field"
            style={{ color: cfg.color }}>
            {STATI.map(s => {
              const sc = STATUS_CONFIG[s]
              return <option key={s} value={s}>{sc.emoji} {s}</option>
            })}
          </select>
        </Section>

        {/* PRIORITÀ */}
        <Section label="⚡ PRIORITÀ">
          <div className="flex gap-2">
            {PRIORITA.map(p => {
              const pc = PRIORITA_CONFIG[p]
              const active = form.priorita === p
              return (
                <button key={p} onClick={() => set('priorita', p)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95
                    ${active ? 'text-white border-transparent bg-purple' : 'text-muted border-border'}`}>
                  {pc.emoji} {p}
                </button>
              )
            })}
          </div>
        </Section>

        {/* COLLOQUIO */}
        {STATI_CON_COLLOQUIO.includes(form.stato) && (
          <Section label="🎙️ DETTAGLI COLLOQUIO">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted mb-1">Data</p>
                  <input className="input-field text-sm" type="date"
                    value={form.data_colloquio || ''} onChange={e => set('data_colloquio', e.target.value)} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted mb-1">Ora</p>
                  <input className="input-field text-sm" type="time"
                    value={form.ora_colloquio || ''} onChange={e => set('ora_colloquio', e.target.value)} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Tipo</p>
                <div className="flex gap-2 flex-wrap">
                  {TIPI_COLLOQUIO.map(t => (
                    <button key={t} onClick={() => set('tipo_colloquio', t)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all active:scale-95
                        ${form.tipo_colloquio === t ? 'bg-purple border-purple text-white' : 'border-border text-muted'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">👤 HR / Recruiter</p>
                <input className="input-field text-sm" placeholder="Nome del contatto"
                  value={form.contatto_hr || ''} onChange={e => set('contatto_hr', e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-muted mb-1">📧 Email HR</p>
                <input className="input-field text-sm" type="email" placeholder="email@azienda.com"
                  value={form.email_hr || ''} onChange={e => set('email_hr', e.target.value)} />
              </div>
            </div>
          </Section>
        )}

        {/* CHECKLIST */}
        {STATI_CON_COLLOQUIO.includes(form.stato) && (
          <Section label="✅ CHECKLIST PRE-COLLOQUIO">
            {loadingChecklist ? <div className="flex justify-center py-4"><Spinner /></div> : (
              <>
                {checklist.length > 0 && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted">{doneCount}/{checklist.length} completati</span>
                    <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-green rounded-full transition-all" style={{ width: `${checklistPct}%` }} />
                    </div>
                  </div>
                )}
                {checklist.length === 0 && (
                  <div className="text-center py-3">
                    <p className="text-sm text-muted mb-2">Nessuna checklist trovata</p>
                    <p className="text-xs text-disabled">La checklist si crea automaticamente quando imposti lo stato a "Colloquio". Salva le modifiche prima.</p>
                  </div>
                )}
                <div className="space-y-2">
                  {checklist.map(item => (
                    <button key={item.id} onClick={() => handleToggleChecklist(item)}
                      className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl bg-surface border border-border active:scale-[0.98] transition-all text-left">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${item.fatto ? 'bg-green border-green' : 'border-border'}`}>
                        {item.fatto && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <span className={`text-sm ${item.fatto ? 'line-through text-muted' : 'text-txt'}`}>{item.task}</span>
                    </button>
                  ))}
                </div>
                {checklist.length > 0 && checklistPct === 100 && (
                  <div className="mt-3 p-3 bg-green/10 border border-green/20 rounded-xl text-center">
                    <span className="text-green text-sm font-semibold">🎉 Tutto pronto! +10 XP guadagnati!</span>
                  </div>
                )}
              </>
            )}
          </Section>
        )}

        {/* SEDE */}
        <Section label="📍 SEDE">
          <div className="space-y-2">
            <input className="input-field text-sm" placeholder="Indirizzo (es: Via Roma 1, Milano)"
              value={form.sede || ''} onChange={e => set('sede', e.target.value)} />
            {form.sede && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(form.sede + (form.paese ? ', ' + form.paese : ''))}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs text-purple-soft border border-purple/30 px-3 py-2 rounded-xl active:scale-95">
                📍 Apri in Google Maps
              </a>
            )}
          </div>
        </Section>

        {/* STIPENDIO */}
        <Section label="💰 STIPENDIO INDICATIVO">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
              <input className="input-field pl-7 text-sm" type="number" placeholder="Min k"
                value={form.stipendio_min || ''} onChange={e => set('stipendio_min', e.target.value ? parseInt(e.target.value) : null)} />
            </div>
            <span className="text-muted">–</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
              <input className="input-field pl-7 text-sm" type="number" placeholder="Max k"
                value={form.stipendio_max || ''} onChange={e => set('stipendio_max', e.target.value ? parseInt(e.target.value) : null)} />
            </div>
          </div>
        </Section>

        {/* FEELING */}
        {STATI_CON_FEELING.includes(form.stato) && (
          <Section label="😊 COM'È ANDATA?">
            <div className="flex justify-around py-1">
              {FEELING_OPTIONS.map(f => (
                <button key={f} onClick={() => set('feeling', f)}
                  className={`text-3xl transition-all active:scale-110 ${form.feeling === f ? 'scale-125' : 'opacity-40'}`}
                  style={form.feeling === f ? { filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.6))' } : {}}>
                  {f}
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* NOTES */}
        <Section label="📝 LE TUE NOTE">
          <textarea className="input-field resize-none" rows={4}
            placeholder="Com'è andato? Domande strane? Scrivi tutto finché è fresco. 🧠"
            value={form.note || ''} onChange={e => set('note', e.target.value)} />
        </Section>

        <Section label="❓ DOMANDE CHE MI HANNO FATTO">
          <textarea className="input-field resize-none" rows={3}
            placeholder="Utile per prepararsi ai prossimi colloqui..."
            value={form.domande_fatte || ''} onChange={e => set('domande_fatte', e.target.value)} />
        </Section>

        <Section label="🙋 DOMANDE CHE VOGLIO FARE A LORO">
          <textarea className="input-field resize-none" rows={3}
            placeholder="Es: smart working? crescita? cultura aziendale?"
            value={form.domande_mie || ''} onChange={e => set('domande_mie', e.target.value)} />
        </Section>

        {c.link_annuncio && (
          <Section label="🔗 ANNUNCIO">
            <a href={c.link_annuncio} target="_blank" rel="noopener noreferrer"
              className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
              🔗 Apri annuncio originale
            </a>
          </Section>
        )}

        {/* NOTIFICHE */}
        <div className="flex items-center justify-between card">
          <div>
            <p className="text-sm font-medium text-txt">🔔 Notifiche push</p>
            <p className="text-xs text-muted">Per questa candidatura</p>
          </div>
          <button onClick={() => set('notifiche_push', !form.notifiche_push)}
            className={`w-12 h-6 rounded-full transition-all duration-200 relative ${form.notifiche_push ? 'bg-purple' : 'bg-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form.notifiche_push ? 'left-[26px]' : 'left-0.5'}`} />
          </button>
        </div>

        {/* SALVA */}
        <div className="pt-2">
          <button onClick={handleSave} disabled={saving}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
            {saving ? <><Spinner size={20} /> Salvataggio...</> : saved ? '✅ Salvato!' : '💾 Salva modifiche'}
          </button>
        </div>

        {/* DELETE */}
        <div className="pb-8">
          <button onClick={() => setConfirmDelete(true)} className="btn-danger w-full py-3">
            🗑️ Elimina candidatura
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Elimina candidatura"
        message={`Sicuro/a di voler eliminare "${c.azienda}"? Non è reversibile.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        danger
      />
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div className="card">
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  )
}
