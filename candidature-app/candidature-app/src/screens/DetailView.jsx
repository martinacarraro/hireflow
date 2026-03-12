import { useState, useEffect, useRef } from 'react'
import { useApp } from '../contexts/AppContext'
import {
  StatusBadge, CompanyAvatar, SectionLabel, ConfirmDialog, Spinner
} from '../components/UI'
import {
  STATI, PRIORITA, FEELING_OPTIONS, STATUS_CONFIG, PRIORITA_CONFIG,
  TIPI_COLLOQUIO, FONTI, WELFARE_OPTIONS, daysSince, formatDate
} from '../lib/utils'

const STATI_CON_COLLOQUIO = ['Prima call','Colloquio','Secondo colloquio']
const STATI_CON_FEELING = ['In attesa risposta','Rifiutata','Non mi piace','GHOSTED']

export default function DetailView({ candidatura: c, onBack, onUpdate }) {
  const { updateCandidatura, deleteCandidatura, getChecklist, toggleChecklistItem, profile, triggerConfetti, showToast, addXP } = useApp()
  const { user } = useApp()
  const [form, setForm] = useState({ ...c })
  const [isDirty, setIsDirty] = useState(false)
  const [checklist, setChecklist] = useState([])
  const [loadingChecklist, setLoadingChecklist] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingAzienda, setEditingAzienda] = useState(false)
  const [aziendaSugg, setAziendaSugg] = useState([])
  const [showAziendaSugg, setShowAziendaSugg] = useState(false)
  const aziendaTimer = useRef(null)

  useEffect(() => {
    if (!editingAzienda) return
    const q = form.azienda.trim()
    if (q.length < 2) { setAziendaSugg([]); setShowAziendaSugg(false); return }
    clearTimeout(aziendaTimer.current)
    aziendaTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(q)}`,
          { mode: 'cors' }
        )
        if (!res.ok) throw new Error('no results')
        const data = await res.json()
        setAziendaSugg(data.slice(0, 6))
        setShowAziendaSugg(data.length > 0)
      } catch {
        const domain = q.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
        setAziendaSugg([{ name: q, domain, logo: `https://logo.clearbit.com/${domain}` }])
        setShowAziendaSugg(true)
      }
    }, 350)
  }, [form.azienda, editingAzienda])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [interviewMode, setInterviewMode] = useState(false)
  const [showAssuntaCelebration, setShowAssuntaCelebration] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackStep, setFeedbackStep] = useState(0)
  const [feedbackAnswers, setFeedbackAnswers] = useState({})

  const days = daysSince(c.data_invio)
  const isColloquioOggi = form.data_colloquio && (() => {
    const today = new Date(); today.setHours(0,0,0,0)
    const d = new Date(form.data_colloquio); d.setHours(0,0,0,0)
    return d.getTime() === today.getTime()
  })()

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); setIsDirty(true) }

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
      stato: form.stato,
      data_colloquio: form.data_colloquio || null,
      ora_colloquio: form.ora_colloquio || null,
      data_secondo_colloquio: form.data_secondo_colloquio || null,
      ora_secondo_colloquio: form.ora_secondo_colloquio || null,
      offerta_ral: form.offerta_ral ? parseInt(form.offerta_ral) : null,
      offerta_scadenza: form.offerta_scadenza || null,
      offerta_note: form.offerta_note || null,
      offerta_risposta: form.offerta_risposta || null,
      data_inizio: form.data_inizio || null,
      welfare: Array.isArray(form.welfare) ? form.welfare : [],
      welfare_note: form.welfare_note || null,
      offerta_feeling: form.offerta_feeling || null,
    })
    setSaving(false)
    setSaved(true)
    setIsDirty(false)
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

  // ── MODALITÀ INTERVISTA ────────────────────────────────────────
  if (interviewMode) return (
    <div className="screen" style={{ background: '#0a0a1a' }}>
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-4 flex-shrink-0">
        <button onClick={() => setInterviewMode(false)} className="text-muted text-lg">←</button>
        <p className="text-sm font-bold text-purple-soft">🎙️ Modalità Intervista</p>
        <div />
      </div>
      <div className="flex-1 scrollable px-5 py-4 space-y-4">
        {/* Azienda + orario */}
        <div className="text-center py-4">
          <p className="text-5xl mb-3">🎙️</p>
          <h2 className="text-2xl font-bold text-txt">{form.azienda}</h2>
          <p className="text-muted text-sm mt-1">{form.ruolo}</p>
          {form.ora_colloquio && (
            <p className="text-purple-soft font-bold text-lg mt-2">⏰ {form.ora_colloquio.slice(0,5)}</p>
          )}
        </div>

        {/* Checklist rapida */}
        {checklist.length > 0 && (
          <div className="card" style={{ borderColor: 'rgba(139,92,246,0.3)' }}>
            <p className="text-xs font-bold text-purple-soft mb-3 uppercase tracking-wider">✅ Checklist pre-colloquio</p>
            <div className="space-y-2">
              {checklist.map(item => (
                <button key={item.id} onClick={() => handleToggleChecklist(item)}
                  className="w-full flex items-center gap-3 py-2 text-left active:scale-95 transition-all">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${item.fatto ? 'bg-green-500 border-green-500' : 'border-border'}`}>
                    {item.fatto && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className={`text-sm ${item.fatto ? 'line-through text-muted' : 'text-txt'}`}>{item.task}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Domande da fare */}
        {form.domande_mie && (
          <div className="card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
            <p className="text-xs font-bold text-green-400 mb-2 uppercase tracking-wider">🙋 Le mie domande</p>
            <p className="text-sm text-txt leading-relaxed whitespace-pre-wrap">{form.domande_mie}</p>
          </div>
        )}

        {/* Note */}
        {form.note && (
          <div className="card">
            <p className="text-xs font-bold text-muted mb-2 uppercase tracking-wider">📝 Le mie note</p>
            <p className="text-sm text-txt leading-relaxed whitespace-pre-wrap">{form.note}</p>
          </div>
        )}

        {/* Contatto HR */}
        {form.contatto_hr && (
          <div className="card">
            <p className="text-xs font-bold text-muted mb-2 uppercase tracking-wider">👤 Nome referente</p>
            <p className="text-sm text-txt font-semibold">{form.contatto_hr}</p>
          </div>
        )}

        {/* Sede / come arrivare */}
        {form.sede && (
          <a href={profile?.indirizzo_home
              ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(profile.indirizzo_home)}&destination=${encodeURIComponent(form.sede)}&travelmode=transit`
              : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(form.sede)}&travelmode=transit`}
            target="_blank" rel="noopener noreferrer"
            className="card flex items-center gap-3 active:scale-95 transition-all">
            <span className="text-2xl">🗺️</span>
            <p className="text-sm font-semibold text-txt">Scopri il tragitto in Google Maps</p>
            <span className="ml-auto text-muted">→</span>
          </a>
        )}

        {/* OFFERTA RICEVUTA - view mode */}
        {form.stato === 'Offerta ricevuta' && (
          <div className="card" style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.04)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🏆</span>
              <p className="text-sm font-bold text-green-400 uppercase tracking-wider">Dettagli Offerta</p>
            </div>
            {form.offerta_ral && <div className="flex justify-between py-1.5 border-b border-border"><span className="text-xs text-muted">💰 RAL offerta</span><span className="text-sm font-semibold text-green-400">€{parseInt(form.offerta_ral).toLocaleString('it-IT')}</span></div>}
            {form.offerta_scadenza && <div className="flex justify-between py-1.5 border-b border-border"><span className="text-xs text-muted">⏰ Rispondere entro</span><span className="text-sm font-semibold text-txt">{new Date(form.offerta_scadenza).toLocaleDateString('it-IT', {day:'numeric',month:'long',year:'numeric'})}</span></div>}
            {form.offerta_note && <div className="mt-2"><p className="text-xs text-muted mb-1">📋 Note offerta</p><p className="text-sm text-txt leading-relaxed">{form.offerta_note}</p></div>}
            {!form.offerta_risposta && (
              <div className="mt-4">
                <p className="text-xs text-muted text-center mb-3">Hai deciso?</p>
                <div className="flex gap-3">
                  <button onClick={async () => {
                    const newForm = { ...form, stato: 'Assunta', offerta_risposta: 'si' }
                    setForm(newForm)
                    setSaving(true)
                    await updateCandidatura(c.id, {
                      stato: 'Assunta',
                      offerta_risposta: 'si',
                      offerta_ral: newForm.offerta_ral || null,
                      offerta_scadenza: newForm.offerta_scadenza || null,
                      offerta_note: newForm.offerta_note || null,
                    })
                    setSaving(false)
                    await addXP(50)
                    triggerConfetti()
                    setShowAssuntaCelebration(true)
                  }} className="flex-1 py-3 rounded-xl font-bold text-sm text-white active:scale-95 transition-all"
                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                    ✅ Sì, accetto!
                  </button>
                  <button onClick={async () => {
                    const newForm = { ...form, offerta_risposta: 'no', stato: 'Rifiutata' }
                    setForm(newForm)
                    setSaving(true)
                    await updateCandidatura(c.id, {
                      stato: 'Rifiutata',
                      offerta_risposta: 'no',
                    })
                    setSaving(false)
                    setIsDirty(false)
                    onBack()
                  }} className="flex-1 py-3 rounded-xl font-bold text-sm border border-border text-muted active:scale-95 transition-all">
                    ❌ No, declino
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pb-8">
          <p className="text-center text-xs text-muted">💜 Respira. {profile?.genere === 'f' ? 'Sei prontissima' : profile?.genere === 'm' ? 'Sei prontissimo' : 'Sei prontissim*'}. In bocca al lupo!</p>
        </div>
      </div>
    </div>
  )


  // ── VISTA OFFERTA RICEVUTA ────────────────────────────────────────
  if (form.stato === 'Offerta ricevuta') {
    const welfareList = Array.isArray(form.welfare) ? form.welfare : []
    const toggleWelfare = (opt) => {
      const updated = welfareList.includes(opt)
        ? welfareList.filter(w => w !== opt)
        : [...welfareList, opt]
      set('welfare', updated)
    }
    const FEELING_OFFERTA = [
      { v: '🤩', label: "Non vedo l'ora!" },
      { v: '😊', label: 'Contenta/o' },
      { v: '🤔', label: 'Ci devo pensare' },
      { v: '😬', label: 'Qualche dubbio' },
      { v: '😕', label: 'Non mi convince' },
    ]
    return (
      <div className="screen" style={{ background: '#0E0E1A' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 flex-shrink-0">
          <button onClick={async () => {
            if (isDirty) {
              const choice = window.confirm('Hai modifiche non salvate.\n\nPremi OK per salvare, Annulla per uscire senza salvare.')
              if (choice) await handleSave()
            }
            setIsDirty(false)
            onBack()
          }} className="text-muted text-lg active:scale-90 transition-transform">←</button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CompanyAvatar name={form.azienda} size={36} domain={form.azienda_domain} />
              <div className="min-w-0">
                <p className="font-bold text-txt text-sm truncate">{form.azienda}</p>
                <p className="text-muted text-xs truncate">{form.ruolo}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 scrollable px-4 pb-10 space-y-4">

          {/* Trophy hero */}
          <div className="rounded-3xl p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(16,185,129,0.1))', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading, sans-serif)', background: 'linear-gradient(135deg,#F59E0B,#10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Offerta ricevuta!
            </h2>
            <p className="text-muted text-sm">Meritata. Ora decidi con calma. 💜</p>
          </div>

          {/* COME TI SENTI? */}
          <div className="card space-y-3">
            <p className="text-xs font-bold text-muted uppercase tracking-wider">🫀 Come ti senti riguardo a questa offerta?</p>
            <div className="flex gap-2 flex-wrap">
              {FEELING_OFFERTA.map(f => (
                <button key={f.v} onClick={() => set('offerta_feeling', form.offerta_feeling === f.v ? null : f.v)}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all active:scale-95"
                  style={{
                    background: form.offerta_feeling === f.v ? 'rgba(123,47,255,0.2)' : 'transparent',
                    borderColor: form.offerta_feeling === f.v ? 'rgba(123,47,255,0.6)' : 'rgba(255,255,255,0.08)',
                  }}>
                  <span className="text-2xl">{f.v}</span>
                  <span className="text-xs text-muted" style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* HAI ACCETTATO? */}
          {!form.offerta_risposta && (
            <div className="card space-y-3" style={{ borderColor: 'rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.05)' }}>
              <p className="text-sm font-bold text-txt text-center">🤝 Hai già deciso?</p>
              <div className="flex gap-3">
                <button onClick={async () => {
                  const updated = { ...form, offerta_risposta: 'si', stato: 'Assunta', welfare: welfareList }
                  setForm(updated)
                  setSaving(true)
                  await updateCandidatura(c.id, {
                    stato: 'Assunta',
                    offerta_risposta: 'si',
                    offerta_ral: form.offerta_ral ? parseInt(form.offerta_ral) : null,
                    offerta_scadenza: form.offerta_scadenza || null,
                    offerta_note: form.offerta_note || null,
                    offerta_feeling: form.offerta_feeling || null,
                    data_inizio: form.data_inizio || null,
                    welfare: welfareList,
                    welfare_note: form.welfare_note || null,
                  })
                  setSaving(false)
                  setIsDirty(false)
                  await addXP(50)
                  triggerConfetti()
                  setShowAssuntaCelebration(true)
                }} className="flex-1 py-3 rounded-xl font-bold text-sm text-white active:scale-95 transition-all"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                  ✅ Sì, ho accettato!
                </button>
                <button onClick={async () => {
                  setForm(f => ({ ...f, offerta_risposta: 'no', stato: 'Rifiutata' }))
                  await updateCandidatura(c.id, {
                    stato: 'Rifiutata',
                    offerta_risposta: 'no',
                    welfare: welfareList,
                  })
                  setIsDirty(false)
                  onBack()
                }} className="flex-1 py-3 rounded-xl font-bold text-sm border border-border text-muted active:scale-95 transition-all">
                  ❌ No, declino
                </button>
              </div>
            </div>
          )}

          {/* Dettagli offerta */}
          <div className="card space-y-3" style={{ borderColor: 'rgba(16,185,129,0.2)' }}>
            <p className="text-xs font-bold text-green-400 uppercase tracking-wider">💰 Dettagli offerta</p>
            <div>
              <p className="text-xs text-muted mb-1">RAL offerta (€)</p>
              <input className="input-field text-sm" type="number" placeholder="Es: 35000"
                value={form.offerta_ral || ''} onChange={e => set('offerta_ral', e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted mb-1">⏰ Rispondere entro</p>
              <input className="input-field text-sm" type="date"
                value={form.offerta_scadenza || ''} onChange={e => set('offerta_scadenza', e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted mb-1">📅 Data inizio lavoro</p>
              <input className="input-field text-sm" type="date"
                value={form.data_inizio || ''} onChange={e => set('data_inizio', e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted mb-1">📋 Note offerta (condizioni, impressioni...)</p>
              <textarea className="input-field text-sm" rows={3}
                placeholder="Es: ottimo team, possibilità crescita..."
                value={form.offerta_note || ''} onChange={e => set('offerta_note', e.target.value)} />
            </div>
          </div>

          {/* BENEFIT / WELFARE */}
          <div className="card space-y-3">
            <p className="text-xs font-bold text-muted uppercase tracking-wider">🎁 Benefit inclusi</p>
            <div className="flex flex-wrap gap-2">
              {WELFARE_OPTIONS.map(opt => {
                const active = welfareList.includes(opt)
                return (
                  <button key={opt} onClick={() => toggleWelfare(opt)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95"
                    style={{
                      background: active ? 'rgba(123,47,255,0.2)' : 'transparent',
                      borderColor: active ? 'rgba(123,47,255,0.6)' : 'rgba(255,255,255,0.08)',
                      color: active ? '#c4b5fd' : 'rgba(240,240,255,0.4)',
                    }}>
                    {active ? '✓ ' : ''}{opt}
                  </button>
                )
              })}
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Aggiungi benefit personalizzati</p>
              <input className="input-field text-sm" type="text"
                placeholder="Es: auto aziendale, asilo nido..."
                value={form.welfare_note || ''} onChange={e => set('welfare_note', e.target.value)} />
            </div>
          </div>

          {/* Note generali */}
          {form.note && (
            <div className="card">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">📝 Le mie note</p>
              <p className="text-sm text-txt leading-relaxed whitespace-pre-wrap">{form.note}</p>
            </div>
          )}

          {/* Salva */}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #7B2FFF, #FF2D8B)', opacity: saving ? 0.6 : 1 }}>
            {saving ? '⏳ Salvataggio...' : saved ? '✅ Salvato!' : '💾 Salva dettagli offerta'}
          </button>

        </div>

        {/* Celebration overlay */}
        {showAssuntaCelebration && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
            <div className="card w-full max-w-sm text-center" style={{ borderColor: 'rgba(245,158,11,0.4)', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(123,47,255,0.08))' }}>
              <div className="text-6xl mb-3">🎉</div>
              <h2 className="text-xl font-bold text-txt mb-1">
                {profile?.genere === 'f' ? 'Sei stata assunta!' : profile?.genere === 'm' ? 'Sei stato assunto!' : 'Sei stat* assunt*!'}
              </h2>
              <p className="text-2xl font-bold mb-2" style={{ background: 'linear-gradient(135deg,#10B981,#7B2FFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {form.azienda} 🌟
              </p>
              <p className="text-sm text-muted leading-relaxed mb-4">
                {profile?.nome ? `${profile.nome}, ce` : 'Ce'} l'hai fatta davvero. Ogni candidatura, ogni ghosting, ogni attesa — ne valeva la pena. 💜
              </p>
              <div className="text-xs text-muted mb-4 bg-surface rounded-xl p-3">🔥 +50 XP guadagnati!</div>
              <button onClick={() => { setShowAssuntaCelebration(false); onUpdate?.() }}
                className="btn-primary w-full py-3 text-sm font-bold">
                🚀 Perfetto!
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── VISTA ASSUNTA (read-only, solo info rilevanti) ─────────────
  if (form.stato === 'Assunta') {
    const colloquiCount = [form.data_colloquio, form.data_secondo_colloquio].filter(Boolean).length
    const [editingDataInizio, setEditingDataInizio] = useState(false)
    const [savingDataInizio, setSavingDataInizio] = useState(false)
    return (
      <div className="screen" style={{ background: '#0E0E1A' }}>
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 flex-shrink-0">
          <button onClick={onBack} className="text-muted text-lg active:scale-90 transition-transform">←</button>
        </div>
        <div className="flex-1 scrollable px-4 pb-8 space-y-4">

          {/* Trophy card */}
          <div className="rounded-3xl p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(123,47,255,0.15))', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-2xl font-bold mb-1" style={{ background: 'linear-gradient(135deg,#10B981,#7B2FFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Ce l'hai fatta!
            </h2>
            <p className="text-muted text-sm">
              {profile?.genere === 'f' ? 'Hai ricevuto un\'offerta.' : profile?.genere === 'm' ? 'Hai ricevuto un\'offerta.' : 'Hai ricevuto un\'offerta.'} Meritata. 🎉
            </p>
          </div>

          {/* Azienda card */}
          <div className="card flex items-center gap-4">
            <CompanyAvatar name={form.azienda} size={52} domain={form.azienda_domain} />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-txt text-lg truncate">{form.azienda}</h3>
              <p className="text-muted text-sm truncate">{form.ruolo}</p>
              <div className="mt-1"><StatusBadge stato="Assunta" size="sm" genere={profile?.genere} /></div>
            </div>
          </div>

          {/* Dettagli */}
          <div className="card space-y-0">
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">DETTAGLI</p>

            {/* Data inizio — editabile inline */}
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-sm text-muted">📅 Data inizio</span>
              {editingDataInizio ? (
                <div className="flex items-center gap-2">
                  <input type="date" className="input-field text-sm py-1 px-2 w-36"
                    value={form.data_inizio || ''}
                    onChange={e => set('data_inizio', e.target.value)}
                    autoFocus
                  />
                  <button onClick={async () => {
                    setSavingDataInizio(true)
                    await updateCandidatura(c.id, { data_inizio: form.data_inizio || null })
                    setSavingDataInizio(false)
                    setEditingDataInizio(false)
                  }} className="text-green-400 font-bold text-sm active:scale-90">
                    {savingDataInizio ? '...' : '✓'}
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingDataInizio(true)} className="text-right active:scale-95">
                  {form.data_inizio
                    ? <span className="text-sm font-semibold text-purple-soft">{new Date(form.data_inizio + 'T00:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'})}</span>
                    : <span className="text-sm text-purple underline">+ Aggiungi data</span>
                  }
                </button>
              )}
            </div>

            {form.sede && (
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted">📍 Sede</span>
                <span className="text-sm font-semibold text-txt">{form.sede}</span>
              </div>
            )}
            {(form.offerta_ral || form.stipendio_min) && (
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted">💰 Stipendio</span>
                <span className="text-sm font-bold" style={{ color: '#10B981' }}>
                  €{parseInt(form.offerta_ral || form.stipendio_min).toLocaleString('it-IT')}
                </span>
              </div>
            )}
            {colloquiCount > 0 && (
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-muted">🎙️ Colloqui superati</span>
                <span className="text-sm font-semibold text-txt">{colloquiCount} su {colloquiCount}</span>
              </div>
            )}
          </div>

          {/* Note */}
          {form.note && (
            <div className="card">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">📝 Le mie note</p>
              <p className="text-sm text-txt leading-relaxed whitespace-pre-wrap">{form.note}</p>
            </div>
          )}

          {/* Salva pulsante */}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #7B2FFF, #FF2D8B)', opacity: saving ? 0.6 : 1 }}>
            {saving ? '⏳ Salvataggio...' : '💾 Salva'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: 'linear-gradient(180deg, #1F1F38 0%, #0E0E1A 100%)' }}>
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-2">
          <button onClick={async () => {
            if (isDirty) {
              const choice = window.confirm('Hai modifiche non salvate.\n\nPremi OK per salvare, Annulla per uscire senza salvare.')
              if (choice) {
                await handleSave()
              }
            }
            setIsDirty(false)
            onBack()
          }} className="text-muted text-lg active:scale-90 transition-transform">←</button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CompanyAvatar name={form.azienda} size={44} domain={form.azienda_domain} />
              <div className="min-w-0 flex-1">
                {editingAzienda ? (
                  <div className="relative">
                    <input
                      className="input-field text-sm font-bold py-1"
                      value={form.azienda}
                      autoFocus
                      autoComplete="off"
                      onChange={e => { set('azienda', e.target.value); set('azienda_domain', '') }}
                      onBlur={() => setTimeout(() => { setShowAziendaSugg(false); setEditingAzienda(false) }, 150)}
                    />
                    {(showAziendaSugg || form.azienda.trim().length > 1) && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border overflow-hidden shadow-xl" style={{ background: '#1A1A2E' }}>
                        {aziendaSugg.map(s => (
                          <button key={s.domain} type="button"
                            onMouseDown={() => { set('azienda', s.name); set('azienda_domain', s.domain); setShowAziendaSugg(false); setEditingAzienda(false) }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface transition-colors border-b border-border/50 last:border-0">
                            <div className="w-7 h-7 rounded-lg overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                              <img src={`https://logo.clearbit.com/${s.domain}`} alt={s.name} className="w-6 h-6 object-contain" onError={e => e.target.style.display='none'} />
                            </div>
                            <div className="text-left min-w-0">
                              <p className="text-sm font-medium text-txt truncate">{s.name}</p>
                              <p className="text-xs text-disabled truncate">{s.domain}</p>
                            </div>
                          </button>
                        ))}
                        <button onMouseDown={() => { set('azienda_domain', ''); setShowAziendaSugg(false); setEditingAzienda(false) }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface">
                          <div className="w-7 h-7 rounded-lg bg-purple/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-soft">+</span>
                          </div>
                          <p className="text-xs text-muted">Usa "{form.azienda}"</p>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => setEditingAzienda(true)} className="text-left w-full">
                    <h2 className="font-bold text-txt text-lg truncate">{form.azienda} <span className="text-xs text-muted">✏️</span></h2>
                  </button>
                )}
                <p className="text-muted text-sm truncate">{form.ruolo}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-5 pb-4">
          <StatusBadge stato={form.stato} size="lg" genere={profile?.genere} />
          {isColloquioOggi && (
            <button onClick={() => setInterviewMode(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #7B2FFF, #FF2D8B)', color: 'white' }}>
              🎙️ Modalità Intervista
            </button>
          )}
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
            onChange={async e => {
              const nuovoStato = e.target.value
              set('stato', nuovoStato)
              // Auto-salva stato subito (silenzioso)
              try {
                await updateCandidatura(c.id, {
                  stato: nuovoStato,
                  welfare: Array.isArray(form.welfare) ? form.welfare : [],
                })
                setIsDirty(false)
              } catch(e) {}
            }}
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
        {form.stato !== 'Offerta ricevuta' && (
          <Section label="🎙️ DETTAGLI COLLOQUIO">
            <div className="space-y-3">
              <p className="text-xs text-disabled font-semibold uppercase tracking-wide">1° Colloquio</p>
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
              {(
                <>
                  <p className="text-xs text-disabled font-semibold uppercase tracking-wide mt-2">2° Colloquio</p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-muted mb-1">Data</p>
                      <input className="input-field text-sm" type="date"
                        value={form.data_secondo_colloquio || ''} onChange={e => set('data_secondo_colloquio', e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted mb-1">Ora</p>
                      <input className="input-field text-sm" type="time"
                        value={form.ora_secondo_colloquio || ''} onChange={e => set('ora_secondo_colloquio', e.target.value)} />
                    </div>
                  </div>
                </>
              )}
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
                <p className="text-xs text-muted mb-1">👤 Nome referente</p>
                <input className="input-field text-sm" placeholder="Es: Mario, Giulia..."
                  value={form.contatto_hr || ''} onChange={e => set('contatto_hr', e.target.value)} />
              </div>

            </div>
          </Section>
        )}

        {/* PROMEMORIA PERSONALIZZATO */}
        {form.stato !== 'Offerta ricevuta' && <Section label="⏰ PROMEMORIA">
          <div className="space-y-2">
            <div className="flex gap-2">
              <input className="input-field text-sm flex-1" type="date"
                value={form.reminder_date || ''}
                onChange={e => set('reminder_date', e.target.value)} />
              <input className="input-field text-sm w-24" type="time"
                value={form.reminder_time || ''}
                onChange={e => set('reminder_time', e.target.value)} />
            </div>
            <input className="input-field text-sm w-full" placeholder="Es: Ricontatta HR, Invia portfolio..."
              value={form.reminder_note || ''}
              onChange={e => set('reminder_note', e.target.value)} />
            {form.reminder_date && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(123,47,255,0.1)' }}>
                <span className="text-sm">⏰</span>
                <p className="text-xs text-purple-soft">
                  Promemoria impostato per il {form.reminder_date}
                  {form.reminder_time ? ` alle ${form.reminder_time}` : ''}
                  {form.reminder_note ? ` — ${form.reminder_note}` : ''}
                </p>
                <button onClick={() => { set('reminder_date', null); set('reminder_time', null); set('reminder_note', '') }}
                  className="ml-auto text-muted text-xs active:scale-90">✕</button>
              </div>
            )}
          </div>
        </Section>}

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
                    <p className="text-xs text-muted">La checklist si crea automaticamente quando imposti lo stato a "Colloquio". Salva le modifiche prima.</p>
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

        {/* OFFERTA RICEVUTA - edit mode */}
        {form.stato === 'Offerta ricevuta' && (
          <Section label="🏆 DETTAGLI OFFERTA">
            <div className="space-y-3">

              {/* HAI ACCETTATO? */}
              {!form.offerta_risposta && (
                <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <p className="text-sm font-bold text-txt text-center">🤝 Hai accettato l'offerta?</p>
                  <div className="flex gap-3">
                    <button onClick={async () => {
                      setForm(f => ({ ...f, offerta_risposta: 'si', stato: 'Assunta' }))
                      setSaving(true)
                      await updateCandidatura(c.id, {
                        stato: 'Assunta',
                        offerta_risposta: 'si',
                        offerta_ral: form.offerta_ral || null,
                        offerta_scadenza: form.offerta_scadenza || null,
                        offerta_note: form.offerta_note || null,
                      })
                      setSaving(false)
                      await addXP(50)
                      triggerConfetti()
                      setShowAssuntaCelebration(true)
                    }} className="flex-1 py-3 rounded-xl font-bold text-sm text-white active:scale-95 transition-all"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                      ✅ Sì, ho accettato!
                    </button>
                    <button onClick={async () => {
                      setForm(f => ({ ...f, offerta_risposta: 'no', stato: 'Rifiutata' }))
                      setSaving(true)
                      await updateCandidatura(c.id, { stato: 'Rifiutata', offerta_risposta: 'no' })
                      setSaving(false)
                      setIsDirty(false)
                      onBack()
                    }} className="flex-1 py-3 rounded-xl font-bold text-sm border border-border text-muted active:scale-95 transition-all">
                      ❌ No, declino
                    </button>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-muted mb-1">💰 RAL offerta (€)</p>
                <input className="input-field text-sm" type="number" placeholder="Es: 35000"
                  value={form.offerta_ral || ''} onChange={e => set('offerta_ral', e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-muted mb-1">⏰ Rispondere entro</p>
                <input className="input-field text-sm" type="date"
                  value={form.offerta_scadenza || ''} onChange={e => set('offerta_scadenza', e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-muted mb-1">📋 Note offerta (smart working, benefit, ecc.)</p>
                <textarea className="input-field text-sm" rows={3}
                  placeholder="Es: 2 giorni da casa, ticket restaurant, 25 gg ferie..."
                  value={form.offerta_note || ''} onChange={e => set('offerta_note', e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-muted mb-1">📅 Data inizio lavoro</p>
                <input className="input-field text-sm" type="date"
                  value={form.data_inizio || ''} onChange={e => set('data_inizio', e.target.value)} />
              </div>
            </div>
          </Section>
        )}

        {/* SEDE */}
        <Section label="📍 SEDE">
          <div className="space-y-2">
            <input className="input-field text-sm" placeholder="Indirizzo (es: Via Roma 1, Milano)"
              value={form.sede || ''} onChange={e => set('sede', e.target.value)} />
            {form.sede && (
              <a href={profile?.indirizzo_home
                  ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(profile.indirizzo_home)}&destination=${encodeURIComponent(form.sede)}&travelmode=transit`
                  : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(form.sede)}&travelmode=transit`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs text-txt border border-border px-3 py-2.5 rounded-xl active:scale-95 w-full">
                🗺️ Scopri il tragitto in Google Maps
              </a>
            )}
          </div>
        </Section>

        {/* STIPENDIO */}
        {form.stato !== 'Offerta ricevuta' && <Section label="💰 STIPENDIO INDICATIVO">
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
        </Section>}

        {/* WELFARE / BENEFIT */}
        <Section label="🎁 BENEFIT E WELFARE">
          <div className="flex flex-wrap gap-2 mb-3">
            {WELFARE_OPTIONS.map(opt => {
              const selected = (form.welfare || []).includes(opt)
              return (
                <button key={opt}
                  onClick={() => {
                    const cur = form.welfare || []
                    set('welfare', selected ? cur.filter(w => w !== opt) : [...cur, opt])
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-all active:scale-95
                    ${selected ? 'bg-green-500/20 border-green-500/60 text-green-400' : 'border-border text-muted'}`}>
                  {selected ? '✓ ' : ''}{opt}
                </button>
              )
            })}
          </div>
          <input className="input-field text-sm" placeholder="Altri benefit (es: auto aziendale, bonus firma...)"
            value={form.welfare_note || ''} onChange={e => set('welfare_note', e.target.value)} />
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



        {/* SCADENZA RESPONSO */}
        {form.stato !== 'Offerta ricevuta' && <Section label="📅 ENTRO QUANDO DANNO RISPOSTA">
          <input className="input-field" type="date"
            value={form.data_scadenza_responso || ''} onChange={e => set('data_scadenza_responso', e.target.value)} />
          <p className="text-[10px] text-disabled mt-1">Se ti hanno detto entro quando faranno sapere, salvalo qui</p>
        </Section>}

        {/* NOTES */}
        <Section label="📝 LE TUE NOTE">
          <textarea className="input-field resize-none" rows={4}
            placeholder="Com'è andato? Domande strane? Scrivi tutto finché è fresco. 🧠"
            value={form.note || ''} onChange={e => set('note', e.target.value)} />
        </Section>

        {form.stato !== 'Offerta ricevuta' && <Section label="❓ DOMANDE CHE MI HANNO FATTO">
          <textarea className="input-field resize-none" rows={3}
            placeholder="Utile per prepararsi ai prossimi colloqui..."
            value={form.domande_fatte || ''} onChange={e => set('domande_fatte', e.target.value)} />
        </Section>}

        {form.stato !== 'Offerta ricevuta' && <Section label="🙋 DOMANDE CHE VOGLIO FARE A LORO">
          <textarea className="input-field resize-none" rows={3}
            placeholder="Es: smart working? crescita? cultura aziendale?"
            value={form.domande_mie || ''} onChange={e => set('domande_mie', e.target.value)} />
        </Section>}

        {/* FONTE + LINK ANNUNCIO */}
        <Section label="📌 FONTE E LINK">
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted mb-1">Dove hai trovato l'offerta</p>
              <div className="flex flex-wrap gap-2">
                {FONTI.map(f => (
                  <button key={f}
                    onPointerDown={e => { e.preventDefault(); set('fonte', f) }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95
                      ${form.fonte === f ? 'bg-purple border-purple text-white' : 'bg-surface border-border text-muted'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Link all'annuncio</p>
              <input className="input-field text-sm" placeholder="https://..."
                value={form.link_annuncio || ''} onChange={e => set('link_annuncio', e.target.value)} />
              {form.link_annuncio && (
                <a href={form.link_annuncio} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs text-purple-soft border border-purple/30 px-3 py-2 rounded-xl mt-1 active:scale-95">
                  🔗 Apri annuncio originale
                </a>
              )}
            </div>
          </div>
        </Section>

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

      {/* 🌟 ASSUNTA CELEBRATION MODAL */}
      {showAssuntaCelebration && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
          <div className="card w-full max-w-sm text-center" style={{ borderColor: 'rgba(245,158,11,0.4)', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(123,47,255,0.08))' }}>
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-txt mb-1" style={{ fontFamily: 'var(--font-heading, sans-serif)' }}>
              {profile?.genere === 'f' ? 'Sei stata assunta!' : profile?.genere === 'm' ? 'Sei stato assunto!' : 'Sei stat* assunt*!'}
            </h2>
            <p className="text-2xl font-bold mb-2" style={{ background: 'linear-gradient(135deg,#10B981,#7B2FFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              {form.azienda} 🌟
            </p>
            <p className="text-sm text-muted leading-relaxed mb-4">
              {profile?.nome ? `${profile.nome}, ce` : 'Ce'} l'hai fatta davvero. Ogni candidatura, ogni ghosting, ogni attesa — ne valeva la pena. Ora vai e fai cose grandi. 💜
            </p>
            <div className="text-xs text-muted mb-4 bg-surface rounded-xl p-3">
              🔥 +50 XP guadagnati · Badge "Ce l'hai fatta!" sbloccato
            </div>
            <button onClick={() => { setShowAssuntaCelebration(false); setShowFeedback(true) }}
              className="btn-primary w-full py-3 text-sm font-bold mb-2">
              🚀 Grazie! Un ultimo passo →
            </button>
            <button onClick={() => setShowAssuntaCelebration(false)}
              className="text-xs text-muted py-1">
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* 📋 FEEDBACK SURVEY */}
      {showFeedback && (() => {
        const QUESTIONS = [
          { id: 'utilità', q: "Quanto ti ha aiutato l'app nella ricerca lavoro?", opts: ['🤩 Tantissimo', '😊 Abbastanza', '😐 Poco', '😕 Per niente'] },
          { id: 'prima', q: 'Tenevi già traccia delle candidature prima?', opts: ['📊 Sì, su Excel', '📝 Sì, su note/agenda', '🧠 Solo a memoria', '🆕 Prima volta'] },
          { id: 'funzione', q: 'La funzione che hai usato di più?', opts: ['📋 Tracciare candidature', '📅 Calendario', '🔔 Notifiche', '📊 Statistiche'] },
          { id: 'consiglieresti', q: 'La consiglieresti a chi cerca lavoro?', opts: ['💯 Assolutamente sì', '👍 Probabilmente sì', '🤔 Non sono sicur*', '👎 No'] },
        ]
        const isLastQ = feedbackStep >= QUESTIONS.length
        const q = QUESTIONS[feedbackStep]
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
            <div className="card w-full max-w-sm" style={{ borderColor: 'rgba(123,47,255,0.3)' }}>
              {!isLastQ ? (
                <>
                  {/* progress */}
                  <div className="flex gap-1.5 mb-4">
                    {QUESTIONS.map((_, i) => (
                      <div key={i} className="h-1 flex-1 rounded-full"
                        style={{ background: i <= feedbackStep ? '#7B2FFF' : '#1e1e38', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <p className="text-xs text-muted text-center mb-1">{feedbackStep + 1} / {QUESTIONS.length}</p>
                  <h3 className="text-base font-bold text-txt text-center mb-4 leading-snug">{q.q}</h3>
                  <div className="space-y-2">
                    {q.opts.map(opt => (
                      <button key={opt} onClick={() => {
                        setFeedbackAnswers(prev => ({ ...prev, [q.id]: opt }))
                        setFeedbackStep(s => s + 1)
                      }} className="w-full text-left px-4 py-3 rounded-xl text-sm border border-border text-txt active:bg-purple/10 active:border-purple/40 transition-all">
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowFeedback(false)} className="text-xs text-muted text-center w-full mt-3 py-1">
                    Salta feedback
                  </button>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">💜</div>
                  <h3 className="text-lg font-bold text-txt mb-2">Grazie mille!</h3>
                  <p className="text-sm text-muted leading-relaxed mb-5">
                    Il tuo feedback ci aiuta a migliorare l'app per chi verrà dopo. Ora vai — hai un lavoro da iniziare! 🚀
                  </p>
                  <button onClick={() => setShowFeedback(false)} className="btn-primary w-full py-3 text-sm font-bold">
                    Chiudi e festeggia! 🎉
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}

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