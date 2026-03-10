import { useState, useEffect } from 'react'

const STEPS = [
  {
    id: 'home',
    emoji: '🏠',
    title: 'La tua Home',
    body: 'Qui vedi tutte le candidature attive, le KPI principali e la frase del giorno. Scorri per trovare quella che cerchi.',
    arrow: null, // no arrow, just centered card
    highlight: null,
    position: 'center',
  },
  {
    id: 'add',
    emoji: '➕',
    title: 'Aggiungi una candidatura',
    body: 'Premi il tasto + per aggiungere una nuova candidatura. Inserisci azienda, ruolo, stato e fonte — in pochi secondi è tutto tracciato.',
    arrow: 'bottom-center',
    position: 'top',
    targetStyle: { bottom: '72px', left: '50%', transform: 'translateX(-50%)' },
  },
  {
    id: 'tabs',
    emoji: '📊',
    title: 'Le sezioni',
    body: '📅 Calendario — vedi i tuoi colloqui per data.\n📊 Stats — analizza la tua ricerca con grafici e insight.\n👤 Profilo — livello XP, badge sbloccati e impostazioni.',
    arrow: 'bottom',
    position: 'top',
    targetStyle: { bottom: '60px', left: '0', right: '0' },
  },
  {
    id: 'card',
    emoji: '👆',
    title: 'Tocca una candidatura',
    body: 'Tocca una candidatura per aprirla e vedere tutti i dettagli: colloqui, note, promemoria, referente e molto altro. Puoi modificare tutto in tempo reale.',
    arrow: 'top',
    position: 'bottom',
    targetStyle: { top: '200px', left: '16px', right: '16px' },
  },
  {
    id: 'excel',
    emoji: '📊',
    title: 'Hai già candidature?',
    body: 'Vai in Profilo → Importa Candidature. Scarica il template Excel, compilalo con le tue candidature esistenti e caricalo — l\'app si completa da sola in secondi! 🚀',
    arrow: null,
    position: 'center',
  },
  {
    id: 'done',
    emoji: '🚀',
    title: 'Sei pront*!',
    body: 'Il mercato del lavoro non aspetta — ma tu ora sei organizzat*. In bocca al lupo! 💜',
    arrow: null,
    position: 'center',
    isLast: true,
  },
]

export default function Tutorial({ onDone }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const next = () => {
    if (isLast) {
      setVisible(false)
      setTimeout(onDone, 300)
    } else {
      setStep(s => s + 1)
    }
  }

  const skip = () => {
    setVisible(false)
    setTimeout(onDone, 300)
  }

  // Arrow component
  const Arrow = ({ dir }) => {
    const styles = {
      'bottom-center': {
        wrapper: { position: 'absolute', bottom: '82px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
        line: { width: 2, height: 40, background: 'linear-gradient(to bottom, rgba(123,47,255,0), #7B2FFF)', borderRadius: 2 },
        tip: { width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid #7B2FFF' },
      },
      'bottom': {
        wrapper: { position: 'absolute', bottom: '78px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
        line: { width: 2, height: 30, background: 'linear-gradient(to bottom, rgba(123,47,255,0), #7B2FFF)', borderRadius: 2 },
        tip: { width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid #7B2FFF' },
      },
      'top': {
        wrapper: { position: 'absolute', top: '185px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' },
        line: { width: 2, height: 30, background: 'linear-gradient(to top, rgba(123,47,255,0), #7B2FFF)', borderRadius: 2, order: 2 },
        tip: { width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '10px solid #7B2FFF', order: 1 },
      },
    }
    const s = styles[dir]
    if (!s) return null
    return (
      <div style={s.wrapper}>
        <div style={s.tip} />
        <div style={s.line} />
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(2px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s',
        display: 'flex',
        alignItems: current.position === 'top' ? 'flex-start'
          : current.position === 'bottom' ? 'flex-end'
          : 'center',
        justifyContent: 'center',
        padding: current.position === 'top' ? '110px 20px 0' : current.position === 'bottom' ? '0 20px 130px' : '20px',
      }}
      onClick={next}
    >
      {/* Arrows */}
      {current.arrow && <Arrow dir={current.arrow} />}

      {/* Card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#16162a',
          border: '1px solid rgba(123,47,255,0.3)',
          borderRadius: 20,
          padding: '20px 22px',
          maxWidth: 320,
          width: '100%',
          boxShadow: '0 0 40px rgba(123,47,255,0.2)',
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'transform 0.3s',
        }}
      >
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 14, justifyContent: 'center' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === step ? '#7B2FFF' : i < step ? 'rgba(123,47,255,0.4)' : '#1e1e38',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>{current.emoji}</div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'white', textAlign: 'center', marginBottom: 8 }}>
          {current.title}
        </h3>
        <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6, textAlign: 'center', whiteSpace: 'pre-line' }}>
          {current.body}
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button
            onClick={skip}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 12,
              background: 'transparent', border: '1px solid #1e1e38',
              color: '#555', fontSize: 13, cursor: 'pointer',
            }}
          >
            Salta
          </button>
          <button
            onClick={next}
            style={{
              flex: 2, padding: '10px 0', borderRadius: 12,
              background: 'linear-gradient(135deg, #7B2FFF, #FF2D8B)',
              border: 'none', color: 'white', fontSize: 13,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            {isLast ? 'Inizia! 🚀' : 'Avanti →'}
          </button>
        </div>
      </div>
    </div>
  )
}