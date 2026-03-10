import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'

const SETTORI = [
  'Marketing', 'Comunicazione', 'Tech/IT', 'Design/UX', 'HR/Recruiting',
  'Finance/Contabilità', 'Commerciale/Vendite', 'Legale', 'Sanità/Pharma',
  'Istruzione/Formazione', 'Moda/Retail', 'Logistica/Operations',
  'Giornalismo/Media', 'Architettura/Ingegneria', 'Arte/Cultura',
  'Turismo/Hospitality', 'Agricoltura/Ambiente', 'Altro',
]

const FONTI = ['Instagram', 'LinkedIn', 'Passaparola', 'Google/Ricerca', 'TikTok', 'Altro']

const GENERI = [
  { value: 'f', label: 'Donna', emoji: '👩' },
  { value: 'm', label: 'Uomo', emoji: '👨' },
  { value: 'nb', label: 'Non binario/a', emoji: '🧑' },
  { value: 'x', label: 'Preferisco non dirlo', emoji: '🤍' },
]

export default function Onboarding() {
  const { markOnboarded, updateProfile, requestNotificationPermission, triggerConfetti, profile } = useApp()

  const [step, setStep] = useState(0)
  const [slide, setSlide] = useState(0)
  const [loading, setLoading] = useState(false)

  const [nome, setNome] = useState(profile?.nome || '')
  const [genere, setGenere] = useState('')
  const [eta, setEta] = useState('')
  const [settore, setSettore] = useState('')
  const [settoreCustom, setSettoreCustom] = useState('')
  const [fonte, setFonte] = useState('')
  const [fonteCustom, setFonteCustom] = useState('')
  const [citta, setCitta] = useState('')
  const [notifDone, setNotifDone] = useState(false)

  // CONTROLLO: Se l'utente ha già completato l'onboarding nel database, non mostrare nulla
  if (profile?.has_seen_onboarding === true) {
    return null
  }

  const SLIDES = [
    { emoji: '📬', title: '"Le faremo sapere."', body: 'Lo dicono tutti. Ma tu tieni traccia di chi lo ha detto davvero — e di chi invece è sparito nel nulla.' },
    { emoji: '📅', title: 'Ogni colloquio, ogni risposta', body: 'Calendario, notifiche e scadenze. Sai sempre chi ti deve ancora rispondere e da quanti giorni.' },
    { emoji: '👻', title: 'Ghosting rilevato.', body: "Se un'azienda sparisce per 60 giorni, lo sappiamo. Archiviamo in automatico e tu vai avanti." },
    { emoji: '🏆', title: 'La ricerca è una gara.', body: "Ogni candidatura vale XP. Ogni colloquio sblocca badge. L'offerta è il boss finale — e stavolta ce la fai. 🎉" },
    { emoji: '📊', title: 'Hai già candidature?', body: 'Nessun problema — scarica il nostro template Excel dal Profilo, compilalo con le tue candidature e caricalo. L\'app si completa da sola in pochi secondi! 🚀' },
  ]

  const finish = async () => {
    setLoading(true)
    const finalSettore = settore === 'Altro' ? (settoreCustom || 'Altro') : settore
    const finalFonte = fonte === 'Altro' ? (fonteCustom || 'Altro') : fonte
    
    // Aggiorniamo il profilo su Supabase
    await updateProfile({
      nome: nome.trim() || profile?.nome,
      genere,
      eta: eta ? parseInt(eta) : null,
      settore: finalSettore,
      come_conosciuto: finalFonte,
      indirizzo_home: citta.trim() || null,
      has_seen_onboarding: true, // Salviamo che l'onboarding è stato visto
    })
    
    triggerConfetti()
    await markOnboarded()
    localStorage.setItem('lfs_onboarding_done', '1')
    setLoading(false)
  }

  if (step === 0) {
    const s = SLIDES[slide]
    const isLast = slide === SLIDES.length - 1
    return (
      <div className="screen purple-glow-bg relative">
        <div className="flex items-center justify-between px-5 pt-safe pt-4">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? 'w-6 bg-purple' : 'w-1.5 bg-border'}`} />
            ))}
          </div>
          <button onClick={() => setStep(1)} className="text-sm text-muted active:text-txt">Salta →</button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-48 h-48 rounded-full mb-2" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)' }} />
          <div className="text-7xl mb-6 -mt-40" key={`emoji-${slide}`}>{s.emoji}</div>
          <h2 className="text-2xl font-bold text-txt mb-4" key={`title-${slide}`}>{s.title}</h2>
          <p className="text-base text-muted leading-relaxed" key={`body-${slide}`}>{s.body}</p>
        </div>
        <div className="px-6 pb-10 space-y-3">
          {isLast ? (
            <button onClick={() => setStep(1)} className="btn-primary w-full text-base py-4">Iniziamo! 🚀</button>
          ) : (
            <>
              <button onClick={() => setSlide(s => s + 1)} className="btn-primary w-full text-base py-4">Avanti →</button>
              <p className="text-center text-xs text-disabled">{slide + 1} di {SLIDES.length}</p>
            </>
          )}
        </div>
      </div>
    )
  }

  if (step === 1) return (
    <StepWrapper title="Come ti chiami?" emoji="👋" step={1} total={7}
      onNext={() => setStep(2)} canNext={nome.trim().length > 0} nextLabel="Avanti →">
      <input className="input-field text-lg text-center font-semibold"
        placeholder="Il tuo nome" value={nome} onChange={e => setNome(e.target.value)}
        autoFocus onKeyDown={e => e.key === 'Enter' && nome.trim() && setStep(2)} />
      <p className="text-xs text-muted text-center mt-2">Ti chiameremo così nell'app 💜</p>
    </StepWrapper>
  )

  if (step === 2) return (
    <StepWrapper title="Sei:" emoji="🌈" step={2} total={7}
      onNext={() => setStep(3)} canNext={genere !== ''}
      onSkip={() => { setGenere('x'); setStep(3) }} nextLabel="Avanti →">
      <div className="grid grid-cols-2 gap-3">
        {GENERI.map(g => (
          <button key={g.value} onClick={() => setGenere(g.value)}
            className={`py-4 rounded-2xl text-sm font-semibold border transition-all active:scale-95 flex flex-col items-center gap-1
              ${genere === g.value ? 'border-purple bg-purple/20 text-purple-soft' : 'border-border text-muted bg-surface'}`}>
            <span className="text-2xl">{g.emoji}</span>
            <span>{g.label}</span>
          </button>
        ))}
      </div>
    </StepWrapper>
  )

  if (step === 3) {
    const etaNum = parseInt(eta)
    const etaInvalid = eta !== '' && (isNaN(etaNum) || etaNum < 16 || etaNum > 100)
    return (
      <StepWrapper title="Quanti anni hai?" emoji="🎂" step={3} total={7}
        onNext={() => setStep(4)} canNext={!etaInvalid}
        onSkip={() => setStep(4)} nextLabel="Avanti →">
        <input className="input-field text-lg text-center font-semibold"
          placeholder="Es: 26" type="number" min="16" max="100"
          value={eta} onChange={e => setEta(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !etaInvalid && setStep(4)} />
      </StepWrapper>
    )
  }

  if (step === 4) return (
    <StepWrapper title="In che settore cerchi?" emoji="💼" step={4} total={7}
      onNext={() => setStep(5)} canNext={settore !== ''}
      onSkip={() => { setSettore('Altro'); setStep(5) }} nextLabel="Avanti →">
      <div className="flex flex-wrap gap-2 justify-center">
        {SETTORI.map(s => (
          <button key={s} onClick={() => setSettore(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95
              ${settore === s ? 'bg-purple border-purple text-white' : 'border-border text-muted bg-surface'}`}>
            {s}
          </button>
        ))}
      </div>
      {settore === 'Altro' && (
        <input className="input-field text-sm mt-3" placeholder="Scrivi il tuo settore..."
          value={settoreCustom} onChange={e => setSettoreCustom(e.target.value)} autoFocus />
      )}
    </StepWrapper>
  )

  if (step === 5) return (
    <StepWrapper title="Come ci hai trovato?" emoji="🔍" step={5} total={7}
      onNext={() => setStep(6)} canNext={fonte !== ''}
      onSkip={() => setStep(6)} nextLabel="Avanti →">
      <div className="grid grid-cols-2 gap-3">
        {FONTI.map(f => (
          <button key={f} onClick={() => setFonte(f)}
            className={`py-3 rounded-2xl text-sm font-semibold border transition-all active:scale-95
              ${fonte === f ? 'border-purple bg-purple/20 text-purple-soft' : 'border-border text-muted bg-surface'}`}>
            {f}
          </button>
        ))}
      </div>
    </StepWrapper>
  )

  if (step === 6) return (
    <StepWrapper title="Dove vivi?" emoji="📍" step={6} total={7}
      onNext={() => setStep(7)} canNext={true}
      onSkip={() => setStep(7)} nextLabel="Avanti →">
      <input className="input-field text-base text-center"
        placeholder="Es: Milano, Roma..."
        value={citta} onChange={e => setCitta(e.target.value)}
        autoFocus onKeyDown={e => e.key === 'Enter' && setStep(7)} />
    </StepWrapper>
  )

  if (step === 7) return (
    <div className="screen purple-glow-bg">
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-7xl mb-6">🔔</div>
        <h2 className="text-2xl font-bold text-txt mb-3">Vuoi ricevere notifiche?</h2>
        <p className="text-base text-muted leading-relaxed mb-8">
          Ti avvisiamo quando si avvicina un colloquio o quando un'azienda non risponde da troppo tempo. 💜
        </p>
        <button onClick={async () => {
          setLoading(true)
          await requestNotificationPermission()
          await finish()
        }} disabled={loading} className="btn-primary w-full py-4 text-base mb-3">
          {loading ? '⏳ Un attimo...' : '🔔 Sì, attiva le notifiche'}
        </button>
        <button onClick={async () => {
          setLoading(true)
          await finish()
        }} disabled={loading} className="text-sm text-muted py-2 active:text-txt">
          No grazie, le attiverò dopo
        </button>
      </div>
    </div>
  )

  return null
}

function StepWrapper({ title, emoji, step, total, children, onNext, canNext, onSkip, nextLabel, loading }) {
  return (
    <div className="screen purple-glow-bg">
      <div className="flex items-center gap-2 px-5 pt-safe pt-4">
        <div className="flex gap-1.5 flex-1">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${i < step ? 'bg-purple' : 'bg-border'}`} />
          ))}
        </div>
        {onSkip && <button onClick={onSkip} className="text-xs text-muted ml-2 active:text-txt">Salta</button>}
      </div>
      <div className="flex-1 flex flex-col px-6 pt-8">
        <div className="text-center mb-8">
          <p className="text-5xl mb-4">{emoji}</p>
          <h2 className="text-2xl font-bold text-txt">{title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
      <div className="px-6 pb-10 pt-4">
        <button onClick={onNext} disabled={!canNext || loading}
          className="btn-primary w-full py-4 text-base transition-opacity"
          style={{ opacity: canNext && !loading ? 1 : 0.4 }}>
          {loading ? '⏳ Un attimo...' : nextLabel}
        </button>
      </div>
    </div>
  )
}