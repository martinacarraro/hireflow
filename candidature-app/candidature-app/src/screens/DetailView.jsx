import { useState, useEffect, useRef } from 'react'
import { useApp } from '../contexts/AppContext'
import {
  StatusBadge, CompanyAvatar, SectionLabel, ConfirmDialog, Spinner
} from '../components/UI'
import {
  STATI, PRIORITA, FEELING_OPTIONS, STATUS_CONFIG, PRIORITA_CONFIG,
  TIPI_COLLOQUIO, FONTI, WELFARE_OPTIONS, daysSince, formatDate
} from '../lib/utils'
import { useTranslation } from 'react-i18next'

const STATI_CON_COLLOQUIO = ['Prima call','Colloquio','Secondo colloquio']
const STATI_CON_FEELING = ['In attesa risposta','Rifiutata','Non mi piace','GHOSTED']

export default function DetailView({ candidatura: c, onBack, onUpdate }) {
  const { updateCandidatura, deleteCandidatura, getChecklist, toggleChecklistItem, profile, triggerConfetti, showToast, addXP, checkBadges } = useApp()
  const { user } = useApp()
  const { t } = useTranslation()
  const trStatus = (status) => t(`add.stati.${status}`, status)
  const trPriority = (priority) => t(`add.priorita.${priority}`, priority)
  const trFonte = (fonte) => t(`add.fonti.${fonte}`, fonte)
  const interviewTypeKey = (tipo) => tipo === '📞 Telefonico' ? 'phone' : tipo === '💻 Video' ? 'video' : 'onsite'
  const trInterviewType = (tipo) => t(`detail.interviewTypes.${interviewTypeKey(tipo)}`, tipo)
  const trWelfare = (opt) => t(`detail.welfareOptions.${opt}`, opt)
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
  const [showReviewPrompt, setShowReviewPrompt] = useState(false)
  const [fbStep, setFbStep] = useState(0)
  const [fbUtilita, setFbUtilita] = useState(null)
  const [fbCosa, setFbCosa] = useState('')
  const [fbMigliorare, setFbMigliorare] = useState('')
  const [fbSending, setFbSending] = useState(false)
  const [editingDataInizio, setEditingDataInizio] = useState(false)
  const [savingDataInizio, setSavingDataInizio] = useState(false)

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

  useEffect(() => {
    if (!showAssuntaCelebration) return
    const timer = setTimeout(() => {
      setForm(f => ({ ...f, stato: 'Assunta', offerta_risposta: 'si' }))
      setShowAssuntaCelebration(false)
      setShowReviewPrompt(true)
    }, 2500)
    return () => clearTimeout(timer)
  }, [showAssuntaCelebration])

  const loadChecklist = async () => {
  setLoadingChecklist(true)
  const items = await getChecklist(c.id)
  
  // FILTRO ANTI-DUPLICATI:
  // Filtriamo gli items basandoci sul testo del 'task' per evitare doppioni visivi
  const uniqueItems = items.filter((item, index, self) =>
    index === self.findIndex((t) => t.task === item.task)
  )
  
  setChecklist(uniqueItems)
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
    setTimeout(() => setSaved(false), 2000)
  }

  const sendFeedback = async () => {
    setFbSending(true)
    try {
      await fetch('https://formspree.io/f/xpqydppa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject: '🏆 Feedback da utente assunto/a — Le faremo sapere',
          azienda: form.azienda, ruolo: form.ruolo,
          utilita: fbUtilita, cosa_e_piaciuto: fbCosa,
          cosa_migliorare: fbMigliorare,
          nome: profile?.nome || 'Anonimo', genere: profile?.genere || '-',
        })
      })
    } catch(e) {}
    setFbSending(false)
    setFbStep(1)
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

  const chiudiReview = () => {
    setShowReviewPrompt(false)
    setForm(f => ({ ...f, stato: 'Assunta', offerta_risposta: 'si' }))
    onUpdate?.()
  }

  const doneCount = checklist.filter(i => i.fatto).length
  const checklistPct = checklist.length ? (doneCount / checklist.length) * 100 : 0
  const cfg = STATUS_CONFIG[form.stato] || STATUS_CONFIG['Inviata']

  const CelebrationOverlay = showAssuntaCelebration ? (() => {
    const pieces = Array.from({ length: 60 }, (_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 1.5,
      dur: 1.8 + Math.random() * 1.2,
      color: ['#7B2FFF','#FF2D8B','#10B981','#FBBF24','#60A5FA','#F87171','#C4B5FD','#34D399'][i % 8],
      size: 7 + Math.random() * 8, rot: Math.random() * 360,
      shape: i % 3 === 0 ? 'circle' : 'rect',
    }))
    return (
      <div className="fixed inset-0 z-[9999] overflow-hidden" style={{ pointerEvents: 'auto', background: 'rgba(10,10,26,0.96)' }}>
        <style>{`
          @keyframes confettiFall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 80%{opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
          @keyframes celebPop { 0%{transform:scale(0.5) translateY(30px);opacity:0} 60%{transform:scale(1.08) translateY(0);opacity:1} 100%{transform:scale(1) translateY(0);opacity:1} }
        `}</style>
        {pieces.map(p => (
          <div key={p.id} style={{
            position:'absolute', left:p.left+'vw', top:-20,
            width:p.size, height:p.shape==='circle'?p.size:p.size*0.4,
            borderRadius:p.shape==='circle'?'50%':'2px',
            background:p.color, transform:`rotate(${p.rot}deg)`,
            animation:`confettiFall ${p.dur}s ${p.delay}s ease-in both`,
          }} />
        ))}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
          style={{ animation:'celebPop 0.6s 0.2s ease-out both' }}>
          <div style={{ fontSize:72, lineHeight:1, marginBottom:16 }}>🏆</div>
          <h1 style={{ fontSize:32, fontWeight:900, color:'white', lineHeight:1.1, textShadow:'0 0 40px rgba(123,47,255,0.9), 0 2px 8px rgba(0,0,0,0.8)', marginBottom:8 }}>
            {profile?.genere === 'f' ? t('detail.assuntaF') : profile?.genere === 'm' ? t('detail.assuntoM') : t('detail.assuntoNB')}
          </h1>
          <p style={{ fontSize:22, fontWeight:800, marginBottom:8, background:'linear-gradient(135deg,#10B981,#7B2FFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            {form.azienda} 🌟
          </p>
          <p style={{ color:'rgba(255,255,255,0.75)', fontSize:15, maxWidth:280, lineHeight:1.5 }}>
            {profile?.nome ? profile.nome + ', ' : ''}{t('detail.celebrazioneMsg')}
          </p>
          <div style={{ marginTop:16, fontSize:36 }}>🎉🥂✨</div>
        </div>
      </div>
    )
  })() : null

  const ReviewPrompt = showReviewPrompt ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
      style={{ background:'rgba(0,0,0,0.88)', backdropFilter:'blur(6px)' }}>
      <div className="card w-full max-w-sm space-y-4" style={{ borderColor:'rgba(123,47,255,0.4)', background:'linear-gradient(135deg, rgba(123,47,255,0.07), rgba(255,45,139,0.05))' }}>
        {fbStep === 0 ? (<>
          <div className="text-center">
            <div className="text-4xl mb-2">💜</div>
            <h3 className="text-lg font-bold text-txt">{t('detail.reviewTitolo')}</h3>
            <p className="text-xs text-muted mt-1">{t('detail.reviewDesc')}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{t('detail.reviewUtilita')}</p>
            <div className="flex gap-2">
              {[t('detail.reviewTantissimo'), t('detail.reviewAbbastanza'), t('detail.reviewPoco')].map(opt => (
                <button key={opt} onClick={() => setFbUtilita(opt)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95"
                  style={{
                    background: fbUtilita === opt ? 'rgba(123,47,255,0.25)' : 'transparent',
                    borderColor: fbUtilita === opt ? 'rgba(123,47,255,0.6)' : 'rgba(255,255,255,0.08)',
                    color: fbUtilita === opt ? '#c4b5fd' : 'rgba(240,240,255,0.5)',
                  }}>{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">{t('detail.reviewCosa')}</p>
            <input className="input-field text-sm" placeholder={t('detail.reviewCosaPlaceholder')}
              value={fbCosa} onChange={e => setFbCosa(e.target.value)} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">{t('detail.reviewMigliorare')}</p>
            <input className="input-field text-sm" placeholder={t('detail.reviewMigliorarePlaceholder')}
              value={fbMigliorare} onChange={e => setFbMigliorare(e.target.value)} />
          </div>
          <button onClick={sendFeedback} disabled={fbSending || !fbUtilita}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white active:scale-95 transition-all"
            style={{ background:'linear-gradient(135deg, #7B2FFF, #FF2D8B)', opacity:(!fbUtilita||fbSending)?0.5:1 }}>
            {fbSending ? t('detail.invio') : t('detail.inviaFeedback')}
          </button>
          <button onClick={chiudiReview} className="text-xs text-disabled py-1 w-full text-center">{t('detail.salta')}</button>
        </>) : (
          <div className="text-center space-y-3 py-4">
            <div className="text-5xl">🙏</div>
            <h3 className="text-lg font-bold text-txt">{t('detail.grazieMille')}</h3>
            <p className="text-sm text-muted">{t('detail.grazieDesc')}</p>
            <button onClick={chiudiReview} className="btn-primary w-full py-3 text-sm font-bold mt-2">🚀 {t('detail.vai')}</button>
          </div>
        )}
      </div>
    </div>
  ) : null

  if (interviewMode) return (
    <div className="screen" style={{ background:'#0a0a1a' }}>
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-4 flex-shrink-0">
        <button onClick={() => setInterviewMode(false)} className="text-muted text-lg">←</button>
        <p className="text-sm font-bold text-purple-soft">🎙️ {t('detail.modalitaIntervista')}</p>
        <div />
      </div>
      <div className="flex-1 scrollable px-5 py-4 space-y-4">
        <div className="text-center py-4">
          <p className="text-5xl mb-3">🎙️</p>
          <h2 className="text-2xl font-bold text-txt">{form.azienda}</h2>
          <p className="text-muted text-sm mt-1">{form.ruolo}</p>
          {form.ora_colloquio && <p className="text-purple-soft font-bold text-lg mt-2">⏰ {form.ora_colloquio.slice(0,5)}</p>}
        </div>
        {checklist.length > 0 && (
  <div className="card" style={{ borderColor:'rgba(139,92,246,0.3)' }}>
    <p className="text-xs font-bold text-purple-soft mb-3 uppercase tracking-wider">✅ {t('detail.checklistPre')}</p>
    <div className="space-y-2">
      {checklist.map(item => (
        <button key={item.id} onClick={() => handleToggleChecklist(item)}
          className="w-full flex items-center gap-3 py-2 text-left active:scale-95 transition-all">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.fatto ? 'bg-green-500 border-green-500' : 'border-border'}`}>
            {item.fatto && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span className={`text-sm ${item.fatto ? 'line-through text-muted' : 'text-txt'}`}>{item.task}</span>
        </button>
      ))}
    </div>
  </div>
)}
          
        {form.domande_mie && (
          <div className="card" style={{ borderColor:'rgba(34,197,94,0.3)' }}>
            <p className="text-xs font-bold text-green-400 mb-2 uppercase tracking-wider">🙋 {t('detail.mieDomande')}</p>
            <p className="text-sm text-txt leading-relaxed whitespace-pre-wrap">{form.domande_mie}</p>
          </div>
        )}
        {form.note && (
          <div className="card">
            <p className="text-xs font-bold text-muted mb-2 uppercase tracking-wider">📝 {t('detail.mieNote')}</p>
            <p className="text-sm text-txt leading-relaxed whitespace-pre-wrap">{form.note}</p>
          </div>
        )}
        {form.contatto_hr && (
          <div className="card">
            <p className="text-xs font-bold text-muted mb-2 uppercase tracking-wider">👤 {t('detail.nomeReferente')}</p>
            <p className="text-sm text-txt font-semibold">{form.contatto_hr}</p>
          </div>
        )}
        {form.sede && (
          <a href={profile?.indirizzo_home
              ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(profile.indirizzo_home)}&destination=${encodeURIComponent(form.sede)}&travelmode=transit`
              : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(form.sede)}&travelmode=transit`}
            target="_blank" rel="noopener noreferrer"
            className="card flex items-center gap-3 active:scale-95 transition-all">
            <span className="text-2xl">🗺️</span>
            <p className="text-sm font-semibold text-txt">{t('detail.scopriTragitto')}</p>
            <span className="ml-auto text-muted">→</span>
          </a>
        )}
        <div className="pb-8">
          <p className="text-center text-xs text-muted">💜 {t('detail.respira')} {profile?.genere === 'f' ? t('detail.prontaF') : profile?.genere === 'm' ? t('detail.prontoM') : t('detail.prontoNB')}. {t('detail.inBoccaLupo')}</p>
        </div>
      </div>
      {CelebrationOverlay}
      {ReviewPrompt}
    </div>
  )

  if (form.stato === 'Offerta ricevuta') {
    const welfareList = Array.isArray(form.welfare) ? form.welfare : []
    const toggleWelfare = (opt) => {
      const updated = welfareList.includes(opt) ? welfareList.filter(w => w !== opt) : [...welfareList, opt]
      set('welfare', updated)
    }
    const FEELING_OFFERTA = [
      { v: '🤩', label: t('detail.feelingNonVedo') },
      { v: '😊', label: t('detail.feelingContento') },
      { v: '🤔', label: t('detail.feelingCiPenso') },
      { v: '😬', label: t('detail.feelingDubbi') },
      { v: '😕', label: t('detail.feelingNonConvince') },
    ]
    return (
      <div className="screen" style={{ background:'#0E0E1A' }}>
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 flex-shrink-0">
          <button onClick={async () => {
            if (isDirty) {
              const choice = window.confirm(t('detail.modificheNonSalvate'))
              if (choice) await handleSave()
            }
            setIsDirty(false); onBack()
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
          <div className="rounded-3xl p-6 text-center" style={{ background:'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(16,185,129,0.1))', border:'1px solid rgba(245,158,11,0.3)' }}>
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-2xl font-bold mb-1" style={{ background:'linear-gradient(135deg,#F59E0B,#10B981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              {t('detail.offertaRicevuta')}
            </h2>
            <p className="text-muted text-sm">{t('detail.offertaDesc')}</p>
          </div>
          <div className="card space-y-3">
            <p className="text-xs font-bold text-muted uppercase tracking-wider">🫀 {t('detail.comeTiSenti')}</p>
            <div className="flex gap-2 flex-wrap">
              {FEELING_OFFERTA.map(f => (
                <button key={f.v} onClick={() => set('offerta_feeling', form.offerta_feeling === f.v ? null : f.v)}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all active:scale-95"
                  style={{ background:form.offerta_feeling===f.v?'rgba(123,47,255,0.2)':'transparent', borderColor:form.offerta_feeling===f.v?'rgba(123,47,255,0.6)':'rgba(255,255,255,0.08)' }}>
                  <span className="text-2xl">{f.v}</span>
                  <span className="text-xs text-muted" style={{ fontSize:'10px', whiteSpace:'nowrap' }}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="card space-y-3" style={{ borderColor:'rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.03)' }}>
            <p className="text-sm font-bold text-txt text-center">🤝 {t('detail.accettiOfferta')}</p>
            <p className="text-xs text-muted text-center">{t('detail.accettiDesc')}</p>
            <div className="flex gap-3">
              <button onClick={async () => {
                triggerConfetti(); setShowAssuntaCelebration(true)
                try {
                  await updateCandidatura(c.id, { stato:'Assunta', offerta_risposta:'si', offerta_ral:form.offerta_ral?parseInt(form.offerta_ral):null, offerta_scadenza:form.offerta_scadenza||null, offerta_note:form.offerta_note||null, offerta_feeling:form.offerta_feeling||null, data_inizio:form.data_inizio||null, welfare:welfareList, welfare_note:form.welfare_note||null })
                  setIsDirty(false); await addXP(50); await checkBadges()
                } catch(e) {}
              }} className="flex-1 py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all border"
                style={{ background:'transparent', borderColor:'rgba(16,185,129,0.5)', color:'#10B981' }}>
                ✅ {t('detail.si')}
              </button>
              <button onClick={async () => {
                setForm(f => ({ ...f, offerta_risposta:'no' }))
                await updateCandidatura(c.id, { offerta_risposta:'no', welfare:welfareList })
                setIsDirty(false); showToast(t('detail.rispostaSalvata'), 'success')
              }} className="flex-1 py-4 rounded-2xl font-bold text-sm active:scale-95 transition-all border"
                style={{ background:'transparent', borderColor:'rgba(255,71,87,0.5)', color:'#FF4757' }}>
                ❌ {t('detail.no')}
              </button>
            </div>
          </div>
          <div className="card space-y-3" style={{ borderColor:'rgba(16,185,129,0.2)' }}>
            <p className="text-xs font-bold text-green-400 uppercase tracking-wider">💰 {t('detail.dettagliOfferta')}</p>
            <div>
              <p className="text-xs text-muted mb-1">{t('detail.ralOfferta')}</p>
              <input className="input-field text-sm" type="number" placeholder="Es: 35000"
                value={form.offerta_ral||''} onChange={e => set('offerta_ral', e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted mb-1">⏰ {t('detail.risponderEntro')}</p>
              <input className="input-field text-sm" type="date"
                value={form.offerta_scadenza||''} onChange={e => set('offerta_scadenza', e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted mb-1">📅 {t('detail.dataInizio')}</p>
              <input className="input-field text-sm" type="date"
                value={form.data_inizio||''} onChange={e => set('data_inizio', e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted mb-1">📋 {t('detail.noteOfferta')}</p>
              <textarea className="input-field text-sm" rows={3}
                placeholder={t('detail.noteOffertaPlaceholder')}
                value={form.offerta_note||''} onChange={e => set('offerta_note', e.target.value)} />
            </div>
          </div>
          <div className="card space-y-3">
            <p className="text-xs font-bold text-muted uppercase tracking-wider">🎁 {t('detail.benefit')}</p>
            <div className="flex flex-wrap gap-2">
              {WELFARE_OPTIONS.map(opt => {
                const active = welfareList.includes(opt)
                return (
                  <button key={opt} onClick={() => toggleWelfare(opt)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95"
                    style={{ background:active?'rgba(123,47,255,0.2)':'transparent', borderColor:active?'rgba(123,47,255,0.6)':'rgba(255,255,255,0.08)', color:active?'#c4b5fd':'rgba(240,240,255,0.4)' }}>
                    {active?'✓ ':''}{trWelfare(opt)}
                  </button>
                )
              })}
            </div>
            <div>
              <p className="text-xs text-muted mb-1">{t('detail.benefitPersonalizzati')}</p>
              <input className="input-field text-sm" type="text"
                placeholder={t('detail.benefitPlaceholder')}
                value={form.welfare_note||''} onChange={e => set('welfare_note', e.target.value)} />
            </div>
          </div>
          {form.note && (
            <div className="card">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">📝 {t('detail.mieNote')}</p>
              <p className="text-sm text-txt leading-relaxed whitespace-pre-wrap">{form.note}</p>
            </div>
          )}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-95 transition-all"
            style={{ background:'linear-gradient(135deg, #7B2FFF, #FF2D8B)', opacity:saving?0.6:1 }}>
            {saving ? t('detail.salvataggio') : saved ? t('detail.salvato') : t('detail.salvaOfferta')}
          </button>
        </div>
        {CelebrationOverlay}
        {ReviewPrompt}
      </div>
    )
  }

  if (form.stato === 'Assunta') {
    const colloquiCount = [form.data_colloquio, form.data_secondo_colloquio].filter(Boolean).length
    return (
      <div className="screen" style={{ background:'#0E0E1A' }}>
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 flex-shrink-0">
          <button onClick={onBack} className="text-muted text-lg active:scale-90 transition-transform">←</button>
        </div>
        <div className="flex-1 scrollable px-4 pb-8 space-y-4">
          <div className="rounded-3xl p-6 text-center" style={{ background:'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(123,47,255,0.15))', border:'1px solid rgba(16,185,129,0.3)' }}>
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-2xl font-bold mb-1" style={{ color:'#34D399' }}>{t('detail.celaHaiFatta')}</h2>
            <p className="text-muted text-sm">{t('detail.accettatoDesc')}</p>
          </div>
          <div className="card flex items-center gap-4">
            <CompanyAvatar name={form.azienda} size={52} domain={form.azienda_domain} />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-txt text-lg truncate">{form.azienda}</h3>
              <p className="text-muted text-sm truncate">{form.ruolo}</p>
              <div className="mt-1"><StatusBadge stato="Assunta" size="sm" genere={profile?.genere} /></div>
            </div>
          </div>
          <div className="card space-y-0">
            <p className="text-xs font-bold text-muted uppercase tracking-wider mb-3">{t('detail.dettagli')}</p>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-sm text-muted">📅 {t('detail.dataInizio')}</span>
              {editingDataInizio ? (
                <div className="flex items-center gap-2">
                  <input type="date" className="input-field text-sm py-1 px-2 w-36"
                    value={form.data_inizio||''} onChange={e => set('data_inizio', e.target.value)} autoFocus />
                  <button onClick={async () => {
                    setSavingDataInizio(true)
                    await updateCandidatura(c.id, { data_inizio:form.data_inizio||null })
                    setSavingDataInizio(false); setEditingDataInizio(false)
                  }} className="text-green-400 font-bold text-sm active:scale-90">
                    {savingDataInizio ? '...' : '✓'}
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingDataInizio(true)} className="text-right active:scale-95">
                  {form.data_inizio
                    ? <span className="text-sm font-semibold text-purple-soft">{new Date(form.data_inizio+'T00:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'})}</span>
                    : <span className="text-sm text-purple underline">+ {t('detail.aggiungiData')}</span>
                  }
                </button>
              )}
            </div>
            {form.sede && (
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted">📍 {t('detail.sede')}</span>
                <span className="text-sm font-semibold text-txt">{form.sede}</span>
              </div>
            )}
            {(form.offerta_ral || form.stipendio_min) && (
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted">💰 {t('detail.stipendio')}</span>
                <span className="text-sm font-bold" style={{ color:'#10B981' }}>
                  €{parseInt(form.offerta_ral||form.stipendio_min).toLocaleString('it-IT')}
                </span>
              </div>
            )}
            {colloquiCount > 0 && (
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-muted">🎙️ {t('detail.colloquiSuperati')}</span>
                <span className="text-sm font-semibold text-txt">{colloquiCount} su {colloquiCount}</span>
              </div>
            )}
          </div>
          {form.note && (
            <div className="card">
              <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">📝 {t('detail.mieNote')}</p>
              <p className="text-sm text-txt leading-relaxed whitespace-pre-wrap">{form.note}</p>
            </div>
          )}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-95 transition-all"
            style={{ background:saved?'linear-gradient(135deg, #10B981, #059669)':'linear-gradient(135deg, #7B2FFF, #FF2D8B)', opacity:saving?0.6:1 }}>
            {saving ? t('detail.salvataggio') : saved ? t('detail.salvato') : t('detail.salva')}
          </button>
        </div>
        {ReviewPrompt}
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="flex-shrink-0" style={{ background:'linear-gradient(180deg, #1F1F38 0%, #0E0E1A 100%)' }}>
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-2">
          <button onClick={async () => {
            if (isDirty) {
              const choice = window.confirm(t('detail.modificheNonSalvate'))
              if (choice) { await handleSave() }
            }
            setIsDirty(false); onBack()
          }} className="text-muted text-lg active:scale-90 transition-transform">←</button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CompanyAvatar name={form.azienda} size={44} domain={form.azienda_domain} />
              <div className="min-w-0 flex-1">
                {editingAzienda ? (
                  <div className="relative">
                    <input className="input-field text-sm font-bold py-1" value={form.azienda} autoFocus autoComplete="off"
                      onChange={e => { set('azienda', e.target.value); set('azienda_domain', '') }}
                      onBlur={() => setTimeout(() => { setShowAziendaSugg(false); setEditingAzienda(false) }, 150)} />
                    {(showAziendaSugg || form.azienda.trim().length > 1) && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border overflow-hidden shadow-xl" style={{ background:'#1A1A2E' }}>
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
                        <button onMouseDown={() => { set('azienda_domain',''); setShowAziendaSugg(false); setEditingAzienda(false) }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface">
                          <div className="w-7 h-7 rounded-lg bg-purple/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-soft">+</span>
                          </div>
                          <p className="text-xs text-muted">{t('add.usaNomePersonalizzato', { nome: form.azienda })}</p>
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
              style={{ background:'linear-gradient(135deg, #7B2FFF, #FF2D8B)', color:'white' }}>
              🎙️ {t('detail.modalitaIntervista')}
            </button>
          )}
          {form.priorita && <span className="text-sm">{PRIORITA_CONFIG[form.priorita]?.emoji}</span>}
          <span className="text-xs text-muted ml-auto">{days}{t('home.ggFa')}</span>
          {form.fonte && <span className="text-xs bg-surface border border-border px-2 py-0.5 rounded-full text-muted">{form.fonte}</span>}
        </div>
      </div>

      <div className="flex-1 scrollable px-4 py-4 space-y-4">
        <Section label={`📋 ${t('detail.aggiornaStato')}`}>
          <select value={form.stato}
            onChange={async e => {
              const nuovoStato = e.target.value
              set('stato', nuovoStato)
              try { await updateCandidatura(c.id, { stato:nuovoStato, welfare:Array.isArray(form.welfare)?form.welfare:[] }); setIsDirty(false) } catch(e) {}
            }}
            className="input-field" style={{ color:cfg.color }}>
            {STATI.map(s => { const sc = STATUS_CONFIG[s]; return <option key={s} value={s}>{sc.emoji} {trStatus(s)}</option> })}
          </select>
        </Section>

        <Section label={`⚡ ${t('detail.priorita')}`}>
          <div className="flex gap-2">
            {PRIORITA.map(p => {
              const pc = PRIORITA_CONFIG[p]; const active = form.priorita === p
              return (
                <button key={p} onClick={() => set('priorita', p)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${active?'text-white border-transparent bg-purple':'text-muted border-border'}`}>
                  {pc.emoji} {trPriority(p)}
                </button>
              )
            })}
          </div>
        </Section>

        {form.stato !== 'Offerta ricevuta' && (
          <Section label={`🎙️ ${t('detail.dettagliColloquio')}`}>
            <div className="space-y-3">
              <p className="text-xs text-disabled font-semibold uppercase tracking-wide">{t('detail.primoColloquio')}</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted mb-1">{t('detail.data')}</p>
                  <input className="input-field text-sm" type="date" value={form.data_colloquio||''} onChange={e => set('data_colloquio', e.target.value)} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted mb-1">{t('detail.ora')}</p>
                  <input className="input-field text-sm" type="time" value={form.ora_colloquio||''} onChange={e => set('ora_colloquio', e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-disabled font-semibold uppercase tracking-wide mt-2">{t('detail.secondoColloquio')}</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted mb-1">{t('detail.data')}</p>
                  <input className="input-field text-sm" type="date" value={form.data_secondo_colloquio||''} onChange={e => set('data_secondo_colloquio', e.target.value)} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted mb-1">{t('detail.ora')}</p>
                  <input className="input-field text-sm" type="time" value={form.ora_secondo_colloquio||''} onChange={e => set('ora_secondo_colloquio', e.target.value)} />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">{t('detail.tipo')}</p>
                <div className="flex gap-2 flex-wrap">
                  {TIPI_COLLOQUIO.map(tipo => (
                    <button key={trInterviewType(tipo)} onClick={() => set('tipo_colloquio', tipo)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all active:scale-95 ${form.tipo_colloquio===tipo?'bg-purple border-purple text-white':'border-border text-muted'}`}>
                      {trInterviewType(tipo)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">👤 {t('detail.nomeReferente')}</p>
                <input className="input-field text-sm" placeholder="Es: Mario, Giulia..."
                  value={form.contatto_hr||''} onChange={e => set('contatto_hr', e.target.value)} />
              </div>
            </div>
          </Section>
        )}

        {form.stato !== 'Offerta ricevuta' && (
          <Section label={`⏰ ${t('detail.promemoria')}`}>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input className="input-field text-sm flex-1" type="date" value={form.reminder_date||''} onChange={e => set('reminder_date', e.target.value)} />
                <input className="input-field text-sm w-24" type="time" value={form.reminder_time||''} onChange={e => set('reminder_time', e.target.value)} />
              </div>
              <input className="input-field text-sm w-full" placeholder={t('detail.promemoriaNota')}
                value={form.reminder_note||''} onChange={e => set('reminder_note', e.target.value)} />
              {form.reminder_date && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background:'rgba(123,47,255,0.1)' }}>
                  <span className="text-sm">⏰</span>
                  <p className="text-xs text-purple-soft">
                    {t('detail.promemoriImpostato')} {form.reminder_date}
                    {form.reminder_time ? ` ${t('detail.alle')} ${form.reminder_time}` : ''}
                    {form.reminder_note ? ` — ${form.reminder_note}` : ''}
                  </p>
                  <button onClick={() => { set('reminder_date',null); set('reminder_time',null); set('reminder_note','') }}
                    className="ml-auto text-muted text-xs active:scale-90">✕</button>
                </div>
              )}
            </div>
          </Section>
        )}

        {STATI_CON_COLLOQUIO.includes(form.stato) && (
          <Section label={`✅ ${t('detail.checklistPre')}`}>
            {loadingChecklist ? <div className="flex justify-center py-4"><Spinner /></div> : (
              <>
                {checklist.length > 0 && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted">{doneCount}/{checklist.length} {t('detail.completati')}</span>
                    <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-green rounded-full transition-all" style={{ width:`${checklistPct}%` }} />
                    </div>
                  </div>
                )}
                {checklist.length === 0 && (
                  <div className="text-center py-3">
                    <p className="text-sm text-muted mb-2">{t('detail.nessunChecklist')}</p>
                    <p className="text-xs text-muted">{t('detail.nessunChecklistDesc')}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {checklist.map(item => (
                    <button key={item.id} onClick={() => handleToggleChecklist(item)}
                      className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl bg-surface border border-border active:scale-[0.98] transition-all text-left">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.fatto?'bg-green border-green':'border-border'}`}>
                        {item.fatto && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <span className={`text-sm ${item.fatto?'line-through text-muted':'text-txt'}`}>{item.task}</span>
                    </button>
                  ))}
                </div>
                {checklist.length > 0 && checklistPct === 100 && (
                  <div className="mt-3 p-3 bg-green/10 border border-green/20 rounded-xl text-center">
                    <span className="text-green text-sm font-semibold">🎉 {t('detail.tuttoProonto')}</span>
                  </div>
                )}
              </>
            )}
          </Section>
        )}

        <Section label={`📍 ${t('detail.sede')}`}>
          <div className="space-y-2">
            <input className="input-field text-sm" placeholder={t('detail.sedePlaceholder')}
              value={form.sede||''} onChange={e => set('sede', e.target.value)} />
            {form.sede && (
              <a href={profile?.indirizzo_home
                  ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(profile.indirizzo_home)}&destination=${encodeURIComponent(form.sede)}&travelmode=transit`
                  : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(form.sede)}&travelmode=transit`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs text-txt border border-border px-3 py-2.5 rounded-xl active:scale-95 w-full">
                🗺️ {t('detail.scopriTragitto')}
              </a>
            )}
          </div>
        </Section>

        {form.stato !== 'Offerta ricevuta' && (
          <Section label={`💰 ${t('detail.stipendio')}`}>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
                <input className="input-field pl-7 text-sm" type="number" placeholder="Min k"
                  value={form.stipendio_min||''} onChange={e => set('stipendio_min', e.target.value?parseInt(e.target.value):null)} />
              </div>
              <span className="text-muted">–</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
                <input className="input-field pl-7 text-sm" type="number" placeholder="Max k"
                  value={form.stipendio_max||''} onChange={e => set('stipendio_max', e.target.value?parseInt(e.target.value):null)} />
              </div>
            </div>
          </Section>
        )}

        <Section label={`🎁 ${t('detail.benefitWelfare')}`}>
          <div className="flex flex-wrap gap-2 mb-3">
            {WELFARE_OPTIONS.map(opt => {
              const selected = (form.welfare||[]).includes(opt)
              return (
                <button key={opt}
                  onClick={() => { const cur=form.welfare||[]; set('welfare', selected?cur.filter(w=>w!==opt):[...cur,opt]) }}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-all active:scale-95 ${selected?'bg-green-500/20 border-green-500/60 text-green-400':'border-border text-muted'}`}>
                  {selected?'✓ ':''}{trWelfare(opt)}
                </button>
              )
            })}
          </div>
          <input className="input-field text-sm" placeholder={t('detail.altriBenefit')}
            value={form.welfare_note||''} onChange={e => set('welfare_note', e.target.value)} />
        </Section>

        {STATI_CON_FEELING.includes(form.stato) && (
          <Section label={`😊 ${t('detail.comEAndata')}`}>
            <div className="flex justify-around py-1">
              {FEELING_OPTIONS.map(f => (
                <button key={f} onClick={() => set('feeling', f)}
                  className={`text-3xl transition-all active:scale-110 ${form.feeling===f?'scale-125':'opacity-40'}`}
                  style={form.feeling===f?{ filter:'drop-shadow(0 0 8px rgba(139,92,246,0.6))' }:{}}>
                  {f}
                </button>
              ))}
            </div>
          </Section>
        )}

        {form.stato !== 'Offerta ricevuta' && (
          <Section label={`📅 ${t('detail.entroQuandoRisposta')}`}>
            <input className="input-field" type="date"
              value={form.data_scadenza_responso||''} onChange={e => set('data_scadenza_responso', e.target.value)} />
            <p className="text-[10px] text-disabled mt-1">{t('detail.entroQuandoDesc')}</p>
          </Section>
        )}

        <Section label={`📝 ${t('detail.mieNote')}`}>
          <textarea className="input-field resize-none" rows={4}
            placeholder={t('detail.notePlaceholder')}
            value={form.note||''} onChange={e => set('note', e.target.value)} />
        </Section>

        {form.stato !== 'Offerta ricevuta' && (
          <Section label={`❓ ${t('detail.domandeFatte')}`}>
            <textarea className="input-field resize-none" rows={3}
              placeholder={t('detail.domandeFattePlaceholder')}
              value={form.domande_fatte||''} onChange={e => set('domande_fatte', e.target.value)} />
          </Section>
        )}

        {form.stato !== 'Offerta ricevuta' && (
          <Section label={`🙋 ${t('detail.domandeMie')}`}>
            <textarea className="input-field resize-none" rows={3}
              placeholder={t('detail.domandeMiePlaceholder')}
              value={form.domande_mie||''} onChange={e => set('domande_mie', e.target.value)} />
          </Section>
        )}

        <Section label={`📌 ${t('detail.fontELink')}`}>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted mb-1">{t('detail.doveTrovato')}</p>
              <div className="flex flex-wrap gap-2">
                {FONTI.map(f => (
                  <button key={f} onPointerDown={e => { e.preventDefault(); set('fonte', f) }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 ${form.fonte===f?'bg-purple border-purple text-white':'bg-surface border-border text-muted'}`}>
                    {trFonte(f)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">{t('detail.linkAnnuncio')}</p>
              <input className="input-field text-sm" placeholder="https://..."
                value={form.link_annuncio||''} onChange={e => set('link_annuncio', e.target.value)} />
              {form.link_annuncio && (
                <a href={form.link_annuncio} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs text-purple-soft border border-purple/30 px-3 py-2 rounded-xl mt-1 active:scale-95">
                  🔗 {t('detail.apriAnnuncio')}
                </a>
              )}
            </div>
          </div>
        </Section>

        <div className="flex items-center justify-between card">
          <div>
            <p className="text-sm font-medium text-txt">🔔 {t('add.notifiche')}</p>
            <p className="text-xs text-muted">{t('detail.notificheDesc')}</p>
          </div>
          <button onClick={() => set('notifiche_push', !form.notifiche_push)}
            className={`w-12 h-6 rounded-full transition-all duration-200 relative ${form.notifiche_push?'bg-purple':'bg-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form.notifiche_push?'left-[26px]':'left-0.5'}`} />
          </button>
        </div>

        <div className="pt-2">
          <button onClick={handleSave} disabled={saving}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
            {saving ? <><Spinner size={20} /> {t('detail.salvataggio')}</> : saved ? t('detail.salvato') : t('detail.salvaModifiche')}
          </button>
        </div>

        <div className="pb-8">
          <button onClick={() => setConfirmDelete(true)} className="btn-danger w-full py-3">
            🗑️ {t('detail.eliminaCandidatura')}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        title={t('detail.eliminaTitolo')}
        message={t('detail.eliminaMessaggio', { azienda: c.azienda })}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        danger
      />
      {CelebrationOverlay}
      {ReviewPrompt}
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