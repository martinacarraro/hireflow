import { useState, useEffect, useRef } from 'react'
import { useApp } from '../contexts/AppContext'
import {
  StatusBadge, CompanyAvatar, SectionLabel, ConfirmDialog, Spinner
} from '../components/UI'
import {
  STATI, PRIORITA, STATUS_CONFIG, PRIORITA_CONFIG, daysSince
} from '../lib/utils'

const STATI_CON_COLLOQUIO = ['Prima call', 'Colloquio', 'Secondo colloquio']

export default function DetailView({ candidatura: c, onBack, onUpdate }) {
  const { updateCandidatura, deleteCandidatura, getChecklist, toggleChecklistItem, profile, triggerConfetti, showToast, addXP } = useApp()
  const [form, setForm] = useState({ ...c })
  const [isDirty, setIsDirty] = useState(false)
  const [checklist, setChecklist] = useState([])
  const [loadingChecklist, setLoadingChecklist] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingAzienda, setEditingAzienda] = useState(false)
  const [aziendaSugg, setAziendaSugg] = useState([])
  const [showAziendaSugg, setShowAziendaSugg] = useState(false)
  const aziendaTimer = useRef(null)
  const [saving, setSaving] = useState(false)
  const [interviewMode, setInterviewMode] = useState(false)

  const isVittoria = form.stato === 'Assunto' || form.stato === 'Assunta' || form.stato === 'Assunt*'

  useEffect(() => {
    if (!editingAzienda) return
    const q = form.azienda.trim()
    if (q.length < 2) { setAziendaSugg([]); setShowAziendaSugg(false); return }
    clearTimeout(aziendaTimer.current)
    aziendaTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(q)}`)
        const data = await res.json()
        setAziendaSugg(data.slice(0, 6))
        setShowAziendaSugg(data.length > 0)
      } catch {
        setShowAziendaSugg(false)
      }
    }, 350)
  }, [form.azienda, editingAzienda])

  const days = daysSince(c.data_invio)
  const isColloquioOggi = form.data_colloquio && (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const d = new Date(form.data_colloquio); d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  })()

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setIsDirty(true) }

  useEffect(() => {
    if (STATI_CON_COLLOQUIO.includes(form.stato)) loadChecklist()
  }, [form.stato])

  const loadChecklist = async () => {
    setLoadingChecklist(true)
    const items = await getChecklist(c.id)
    setChecklist(items || [])
    setLoadingChecklist(false)
  }

  const handleSave = async (specificForm = null) => {
    setSaving(true)
    const dataToSave = specificForm || form
    await updateCandidatura(c.id, dataToSave)
    setSaving(false)
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

  const cfg = STATUS_CONFIG[form.stato] || STATUS_CONFIG['Inviata']

  if (isVittoria) {
    return (
      <div className="screen animate-in fade-in duration-500 bg-[#0a0a1a]">
        <div className="flex items-center px-5 pt-10 pb-4">
          <button onClick={onBack} className="text-muted text-lg active:scale-90">←</button>
        </div>
        <div className="flex-1 scrollable px-5 pb-10">
          <div className="flex flex-col items-center text-center py-6">
            <div className="relative mb-6">
               <div className="absolute inset-0 bg-purple/20 blur-3xl rounded-full" />
               <span className="text-8xl block animate-bounce relative z-10">🏆</span>
            </div>
            <h2 className="text-3xl font-black text-white">CE L'HAI FATTA!</h2>
            <p className="text-purple-400 font-bold uppercase tracking-widest text-sm mt-1">Offerta Accettata</p>
          </div>
          <div className="card bg-white/5 backdrop-blur-xl border-white/10 p-6 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <CompanyAvatar name={form.azienda} size={56} domain={form.azienda_domain} />
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-white truncate">{form.azienda}</h3>
                <p className="text-gray-400 text-sm">{form.ruolo}</p>
              </div>
            </div>
            <div className="space-y-4 border-t border-white/10 pt-5">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs font-bold uppercase">💰 Stipendio RAL</span>
                <span className="text-green-400 font-bold text-lg">€{form.offerta_ral || 'N/D'}</span>
              </div>
            </div>
          </div>
          <button onClick={onBack} className="w-full mt-8 py-4 bg-purple-600 rounded-2xl font-bold text-white shadow-lg">
            Torna alla Dashboard 🏠
          </button>
        </div>
      </div>
    )
  }

  if (interviewMode) {
    return (
      <div className="screen bg-[#0E0E1A]">
        <div className="flex items-center justify-between px-5 pt-10 pb-4">
          <button onClick={() => setInterviewMode(false)} className="text-gray-400 text-lg">← Esci</button>
          <p className="text-sm font-bold text-purple-400 uppercase tracking-widest">🎙️ Live Interview</p>
          <div className="w-8" />
        </div>
        <div className="flex-1 scrollable px-5 space-y-4">
          <div className="text-center py-6">
            <h2 className="text-2xl font-black text-white">{form.azienda}</h2>
            <p className="text-gray-400">{form.ruolo}</p>
          </div>
          {checklist.length > 0 && (
            <div className="card bg-white/5 p-4 border-white/10">
              <p className="text-[10px] font-bold text-purple-400 mb-3 uppercase">Checklist</p>
              {checklist.map(item => (
                <button key={item.id} onClick={() => handleToggleChecklist(item)} className="w-full flex items-center gap-3 py-2 text-left">
                  <div className={`w-5 h-5 rounded-full border-2 ${item.fatto ? 'bg-green-500 border-green-500' : 'border-gray-600'}`} />
                  <span className={`text-sm ${item.fatto ? 'line-through text-gray-500' : 'text-white'}`}>{item.task}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="flex-shrink-0 bg-[#1F1F38] pb-4">
        <div className="flex items-center gap-3 px-5 pt-10 pb-2">
          <button onClick={() => onBack()} className="text-gray-400 text-lg active:scale-90">←</button>
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <CompanyAvatar name={form.azienda} size={44} domain={form.azienda_domain} />
            <div className="min-w-0 flex-1">
              {editingAzienda ? (
                <input className="bg-transparent text-white font-bold outline-none border-b border-purple-500" value={form.azienda} autoFocus onChange={e => set('azienda', e.target.value)} onBlur={() => setEditingAzienda(false)} />
              ) : (
                <button onClick={() => setEditingAzienda(true)} className="text-left"><h2 className="font-bold text-white text-lg truncate">{form.azienda} ✏️</h2></button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-5">
          <StatusBadge stato={form.stato} size="lg" />
          {isColloquioOggi && (
            <button onClick={() => setInterviewMode(true)} className="ml-auto bg-purple-600 text-white text-[10px] font-bold py-1.5 px-3 rounded-full shadow-lg shadow-purple-500/20">🎙️ MODALITÀ INTERVISTA</button>
          )}
        </div>
      </div>

      <div className="flex-1 scrollable px-4 py-6 space-y-6">
        <Section label="📋 AGGIORNA STATO">
          <select value={form.stato} onChange={e => set('stato', e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none">
            {STATI.map(s => <option key={s} value={s} className="bg-[#1a1a2e]">{s}</option>)}
          </select>
          {form.stato === 'Offerta ricevuta' && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl animate-in zoom-in-95">
              <p className="text-xs font-bold text-green-400 mb-3 uppercase">💰 RAL Offerta (€)</p>
              <input className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white mb-4" type="number" value={form.offerta_ral || ''} onChange={e => set('offerta_ral', e.target.value)} />
              <button onClick={async () => {
                const statoVittoria = profile?.genere === 'f' ? 'Assunta' : 'Assunto'
                const updated = { ...form, stato: statoVittoria }
                setForm(updated)
                await handleSave(updated)
                await addXP(100)
                triggerConfetti()
                showToast("VITTORIA! 🏆", "success")
              }} className="w-full py-4 bg-green-500 rounded-xl font-black text-white shadow-lg">✅ ACCETTO LA PROPOSTA!</button>
            </div>
          )}
        </Section>

        <Section label="📝 NOTE">
          <textarea className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none resize-none" rows={4} value={form.note || ''} onChange={e => set('note', e.target.value)} placeholder="Scrivi qui..." />
        </Section>

        <button onClick={() => setConfirmDelete(true)} className="w-full py-4 text-[10px] font-bold text-red-500/40 uppercase tracking-widest">🗑️ Elimina</button>
      </div>

      {isDirty && (
        <div className="absolute bottom-6 left-6 right-6">
          <button onClick={() => handleSave()} disabled={saving} className="w-full py-4 bg-purple-600 rounded-2xl font-bold text-white shadow-2xl">
            {saving ? 'SALVATAGGIO...' : '💾 SALVA MODIFICHE'}
          </button>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog title="Sei sicuro?" onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} danger />
      )}
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{label}</p>
      {children}
    </div>
  )
}