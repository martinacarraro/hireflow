import { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import {
  StatusBadge, CompanyAvatar, SectionLabel, ConfirmDialog, Spinner
} from '../components/UI'
import {
  STATI, PRIORITA, FEELING_OPTIONS, STATUS_CONFIG, PRIORITA_CONFIG,
  TIPI_COLLOQUIO, daysSince, formatDate, formatDateTime
} from '../lib/utils'

export default function DetailView({ candidatura: c, onBack, onUpdate }) {
  const { updateCandidatura, deleteCandidatura, getChecklist, toggleChecklistItem } = useApp()
  const [checklist, setChecklist] = useState([])
  const [loadingChecklist, setLoadingChecklist] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState({})
  const [expanded, setExpanded] = useState({
    colloquio: c.stato === 'Colloquio',
    checklist: c.stato === 'Colloquio',
    details: true,
    notes: true,
  })

  const days = daysSince(c.data_invio)
  const cfg = STATUS_CONFIG[c.stato]

  useEffect(() => {
    if (c.stato === 'Colloquio') loadChecklist()
  }, [c.id, c.stato])

  const loadChecklist = async () => {
    setLoadingChecklist(true)
    const items = await getChecklist(c.id)
    setChecklist(items)
    setLoadingChecklist(false)
  }

  const update = async (field, value) => {
    setSaving(s => ({ ...s, [field]: true }))
    await updateCandidatura(c.id, { [field]: value })
    setSaving(s => ({ ...s, [field]: false }))
  }

  const handleToggleChecklist = async (item) => {
    const newFatto = !item.fatto
    setChecklist(list => list.map(i => i.id === item.id ? { ...i, fatto: newFatto } : i))
    await toggleChecklistItem(item.id, newFatto)
    const updated = checklist.map(i => i.id === item.id ? { ...i, fatto: newFatto } : i)
    if (updated.every(i => i.fatto)) {
      // All done!
    }
  }

  const handleDelete = async () => {
    await deleteCandidatura(c.id)
    onBack()
  }

  const doneCount = checklist.filter(i => i.fatto).length
  const checklistPct = checklist.length ? (doneCount / checklist.length) * 100 : 0

  return (
    <div className="screen">
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(180deg, #1F1F38 0%, #0E0E1A 100%)' }}>
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-2">
          <button onClick={onBack}
            className="text-muted text-lg active:scale-90 transition-transform">←</button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CompanyAvatar name={c.azienda} size={44} />
              <div className="min-w-0">
                <h2 className="font-bold text-txt text-lg truncate">{c.azienda}</h2>
                <p className="text-muted text-sm truncate">{c.ruolo}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 pb-4">
          <StatusBadge stato={c.stato} size="lg" />
          {c.priorita && (
            <span className="text-sm">{PRIORITA_CONFIG[c.priorita]?.emoji}</span>
          )}
          <span className="text-xs text-muted ml-auto">{days}gg fa</span>
          {c.fonte && (
            <span className="text-xs bg-surface border border-border px-2 py-0.5 rounded-full text-muted">
              {c.fonte}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 scrollable px-4 py-4 space-y-4">

        {/* STATO */}
        <Section label="📋 AGGIORNA STATO">
          <div className="grid grid-cols-3 gap-2">
            {STATI.map(s => {
              const sc = STATUS_CONFIG[s]
              const active = c.stato === s
              return (
                <button key={s} onClick={() => update('stato', s)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all active:scale-95
                    flex items-center justify-center gap-1
                    ${active ? 'text-white border-transparent' : 'text-muted border-border'}`}
                  style={active ? { background: sc.color, borderColor: sc.color } : {}}>
                  <span>{sc.emoji}</span>
                  <span className="truncate">{sc.label}</span>
                </button>
              )
            })}
          </div>
        </Section>

        {/* PRIORITÀ */}
        <Section label="⚡ PRIORITÀ">
          <div className="flex gap-2">
            {PRIORITA.map(p => {
              const pc = PRIORITA_CONFIG[p]
              const active = c.priorita === p
              return (
                <button key={p} onClick={() => update('priorita', p)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95
                    ${active ? 'text-white border-transparent bg-purple' : 'text-muted border-border'}`}>
                  {pc.emoji} {p}
                </button>
              )
            })}
          </div>
        </Section>

        {/* COLLOQUIO DETAILS */}
        {c.stato === 'Colloquio' && (
          <Section label="🎙️ DETTAGLI COLLOQUIO" collapsible
            expanded={expanded.colloquio}
            onToggle={() => setExpanded(e => ({ ...e, colloquio: !e.colloquio }))}>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted mb-1">Data</p>
                  <input className="input-field text-sm" type="date"
                    defaultValue={c.data_colloquio || ''}
                    onBlur={e => update('data_colloquio', e.target.value)} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted mb-1">Ora</p>
                  <input className="input-field text-sm" type="time"
                    defaultValue={c.ora_colloquio || ''}
                    onBlur={e => update('ora_colloquio', e.target.value)} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Tipo</p>
                <div className="flex gap-2 flex-wrap">
                  {TIPI_COLLOQUIO.map(t => (
                    <button key={t} onClick={() => update('tipo_colloquio', t)}
                      className={`pill-btn text-xs ${c.tipo_colloquio === t
                        ? 'bg-purple border-purple text-white'
                        : 'border-border text-muted'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">👤 HR / Recruiter</p>
                <input className="input-field text-sm" placeholder="Nome del contatto"
                  defaultValue={c.contatto_hr || ''}
                  onBlur={e => update('contatto_hr', e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-muted mb-1">📧 Email HR</p>
                <input className="input-field text-sm" type="email" placeholder="email@azienda.com"
                  defaultValue={c.email_hr || ''}
                  onBlur={e => update('email_hr', e.target.value)} />
              </div>
            </div>
          </Section>
        )}

        {/* CHECKLIST */}
        {c.stato === 'Colloquio' && (
          <Section label="✅ CHECKLIST PRE-COLLOQUIO" collapsible
            expanded={expanded.checklist}
            onToggle={() => setExpanded(e => ({ ...e, checklist: !e.checklist }))}>
            {loadingChecklist ? <Spinner /> : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted">{doneCount}/{checklist.length} completati</span>
                  <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-green rounded-full transition-all"
                      style={{ width: `${checklistPct}%` }} />
                  </div>
                </div>
                {checklist.length === 0 && (
                  <p className="text-sm text-muted text-center py-2">
                    Checklist generata automaticamente 🎯
                  </p>
                )}
                <div className="space-y-2">
                  {checklist.map(item => (
                    <button key={item.id} onClick={() => handleToggleChecklist(item)}
                      className="w-full flex items-center gap-3 py-2 px-3 rounded-xl
                        bg-surface border border-border active:scale-98 transition-all text-left">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${item.fatto ? 'bg-green border-green' : 'border-border'}`}>
                        {item.fatto && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={`text-sm ${item.fatto ? 'line-through text-muted' : 'text-txt'}`}>
                        {item.task}
                      </span>
                    </button>
                  ))}
                </div>
                {checklist.length > 0 && checklistPct === 100 && (
                  <div className="mt-3 p-3 bg-green/10 border border-green/20 rounded-xl text-center">
                    <span className="text-green text-sm font-semibold">🎉 Sei pronta! +10 XP guadagnati!</span>
                  </div>
                )}
              </>
            )}
          </Section>
        )}

        {/* MAP & LINK */}
        {(c.sede || c.paese) && (
          <Section label="📍 SEDE">
            <div className="flex items-center justify-between">
              <p className="text-sm text-txt">{[c.sede, c.paese].filter(Boolean).join(', ')}</p>
              <a href={`https://maps.google.com/?q=${encodeURIComponent([c.sede, c.paese].filter(Boolean).join(', '))}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-purple-soft border border-purple/30 px-3 py-1.5 rounded-full active:scale-95">
                📍 Apri in Maps
              </a>
            </div>
          </Section>
        )}

        {c.link_annuncio && (
          <Section label="🔗 ANNUNCIO">
            <a href={c.link_annuncio} target="_blank" rel="noopener noreferrer"
              className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
              🔗 Apri annuncio originale
            </a>
          </Section>
        )}

        {/* STIPENDIO */}
        <Section label="💰 STIPENDIO INDICATIVO">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
              <input className="input-field pl-7 text-sm" type="number" placeholder="Min k"
                defaultValue={c.stipendio_min || ''}
                onBlur={e => update('stipendio_min', e.target.value ? parseInt(e.target.value) : null)} />
            </div>
            <span className="text-muted">–</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
              <input className="input-field pl-7 text-sm" type="number" placeholder="Max k"
                defaultValue={c.stipendio_max || ''}
                onBlur={e => update('stipendio_max', e.target.value ? parseInt(e.target.value) : null)} />
            </div>
          </div>
        </Section>

        {/* FEELING */}
        <Section label="😊 COM'È ANDATA?">
          <div className="flex justify-around py-1">
            {FEELING_OPTIONS.map(f => (
              <button key={f} onClick={() => update('feeling', f)}
                className={`text-3xl transition-all active:scale-110 ${
                  c.feeling === f ? 'scale-125 drop-shadow-lg' : 'opacity-50'
                }`}
                style={c.feeling === f ? { filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.6))' } : {}}>
                {f}
              </button>
            ))}
          </div>
        </Section>

        {/* NOTES */}
        <Section label="📝 LE TUE NOTE">
          <textarea className="input-field resize-none" rows={4}
            placeholder="Com'è andato? Che feeling hai avuto? Domande strane che ti hanno fatto? Scrivi tutto finché è fresco. 🧠"
            defaultValue={c.note || ''}
            onBlur={e => update('note', e.target.value)} />
        </Section>

        {/* DOMANDE */}
        <Section label="❓ DOMANDE CHE MI HANNO FATTO">
          <textarea className="input-field resize-none" rows={3}
            placeholder="Utile per prepararsi ai prossimi colloqui..."
            defaultValue={c.domande_fatte || ''}
            onBlur={e => update('domande_fatte', e.target.value)} />
        </Section>

        <Section label="🙋 DOMANDE CHE VOGLIO FARE A LORO">
          <textarea className="input-field resize-none" rows={3}
            placeholder="Es: com'è la cultura aziendale? smart working? crescita?"
            defaultValue={c.domande_mie || ''}
            onBlur={e => update('domande_mie', e.target.value)} />
        </Section>

        {/* NOTIFICATIONS */}
        <div className="flex items-center justify-between card">
          <div>
            <p className="text-sm font-medium text-txt">🔔 Notifiche push</p>
            <p className="text-xs text-muted">Per questa candidatura</p>
          </div>
          <button onClick={() => update('notifiche_push', !c.notifiche_push)}
            className={`w-12 h-6 rounded-full transition-all duration-200 relative
              ${c.notifiche_push ? 'bg-purple' : 'bg-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200
              ${c.notifiche_push ? 'left-[26px]' : 'left-0.5'}`} />
          </button>
        </div>

        {/* DELETE */}
        <div className="pt-2 pb-8">
          <button onClick={() => setConfirmDelete(true)} className="btn-danger w-full py-3">
            🗑️ Elimina candidatura
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Elimina candidatura"
        message={`Sicura di voler eliminare "${c.azienda}"? Non è reversibile.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        danger
      />
    </div>
  )
}

function Section({ label, children, collapsible, expanded, onToggle }) {
  return (
    <div className="card">
      {collapsible ? (
        <button onClick={onToggle} className="w-full flex items-center justify-between mb-3">
          <span className="section-label mb-0">{label}</span>
          <span className="text-muted text-sm transition-transform"
            style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▾</span>
        </button>
      ) : (
        <SectionLabel>{label}</SectionLabel>
      )}
      {(!collapsible || expanded) && children}
    </div>
  )
}
