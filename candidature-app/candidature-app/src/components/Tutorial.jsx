import { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'

const getSteps = (genere) => [
  {
    id: 'welcome',
    emoji: '👋',
    title: genere === 'f' ? 'Benvenuta!' : genere === 'm' ? 'Benvenuto!' : 'Benvenut*!',
    body: 'Questo breve tour ti mostra le funzioni principali.\nPuoi saltarlo in qualsiasi momento.',
    target: null,
    tooltipPos: 'center',
  },
  {
    id: 'add',
    emoji: '➕',
    title: 'Aggiungi candidature',
    body: 'Premi questo tasto per aggiungere una nuova candidatura. Ci vogliono 30 secondi.',
    target: '[data-tutorial="add-btn"]',
    pad: 12,
    shape: 'circle',
    tooltipPos: 'top',
    arrow: 'down',
  },
  {
    id: 'tabs',
    emoji: '📊',
    title: 'Le sezioni',
    body: '📅 Calendario → colloqui per data\n📊 Stats → grafici e insight\n👤 Profilo → livello, badge e impostazioni',
    target: '[data-tutorial="tabbar"]',
    pad: 6,
    shape: 'rect',
    tooltipPos: 'top',
    arrow: 'down',
  },
  {
    id: 'home',
    emoji: '🏠',
    title: 'Le tue candidature',
    body: 'Qui vedi tutto in ordine. Tocca una candidatura per aprirla, aggiornarla e aggiungere note.',
    target: '[data-tutorial="card-list"]',
    pad: 8,
    shape: 'rect',
    tooltipPos: 'bottom',
    arrow: 'up',
  },
  {
    id: 'excel',
    emoji: '📥',
    title: 'Hai già candidature?',
    body: "Vai in Profilo → Importa Candidature: scarica il template Excel, compilalo e caricalo. L'app si completa da sola! 🚀",
    target: null,
    tooltipPos: 'center',
  },
]

export default function Tutorial({ onDone }) {
  const { profile } = useApp()
  const STEPS = getSteps(profile?.genere)
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [spotRect, setSpotRect] = useState(null)

  const cur = STEPS[step]
  const isLast = step === STEPS.length - 1

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!cur.target) { setSpotRect(null); return }
    const el = document.querySelector(cur.target)
    if (!el) { setSpotRect(null); return }
    const r = el.getBoundingClientRect()
    setSpotRect({ top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right })
  }, [step])

  const next = () => {
    if (isLast) { setVisible(false); setTimeout(onDone, 250) }
    else setStep(s => s + 1)
  }
  const skip = () => { setVisible(false); setTimeout(onDone, 250) }

  const buildSpotlight = () => {
    if (!spotRect) return null
    const pad = cur.pad || 8
    const r = spotRect
    if (cur.shape === 'circle') {
      const size = Math.max(r.width, r.height) + pad * 2
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      return {
        position: 'fixed', width: size, height: size, borderRadius: '50%',
        left: cx - size / 2, top: cy - size / 2,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.82)',
        border: '2px solid rgba(123,47,255,0.8)',
        zIndex: 1, pointerEvents: 'none',
        animation: 'tut-pulse 1.6s ease-in-out infinite',
      }
    }
    return {
      position: 'fixed', left: r.left - pad, top: r.top - pad,
      width: r.width + pad * 2, height: r.height + pad * 2,
      borderRadius: 16,
      boxShadow: '0 0 0 9999px rgba(0,0,0,0.82)',
      border: '2px solid rgba(123,47,255,0.7)',
      zIndex: 1, pointerEvents: 'none',
      animation: 'tut-pulse 1.6s ease-in-out infinite',
    }
  }

  const buildArrow = () => {
    if (!cur.arrow || !spotRect) return null
    const pad = cur.pad || 8
    const r = spotRect
    if (cur.arrow === 'down') {
      return (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: window.innerHeight - r.top + pad + 10, zIndex: 2, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: 2, height: 26, background: 'linear-gradient(to bottom, #7B2FFF, rgba(123,47,255,0))', borderRadius: 2 }} />
          <div style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '9px solid #7B2FFF', marginTop: -3 }} />
        </div>
      )
    }
    if (cur.arrow === 'up') {
      return (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: r.bottom + pad + 10, zIndex: 2, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '9px solid #7B2FFF' }} />
          <div style={{ width: 2, height: 26, background: 'linear-gradient(to top, rgba(123,47,255,0), #7B2FFF)', borderRadius: 2 }} />
        </div>
      )
    }
    return null
  }

  const buildTooltipStyle = () => {
    const base = { position: 'fixed', width: 'calc(100% - 32px)', maxWidth: 340, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }
    if (!spotRect || cur.tooltipPos === 'center') return { ...base, top: '50%', transform: 'translate(-50%, -50%)' }
    const pad = cur.pad || 8
    const r = spotRect
    if (cur.tooltipPos === 'top') return { ...base, bottom: window.innerHeight - r.top + pad + 50 }
    if (cur.tooltipPos === 'bottom') return { ...base, top: r.bottom + pad + 50 }
    return base
  }

  const spotStyle = buildSpotlight()

  return (
    <>
      <style>{`
        @keyframes tut-pulse {
          0%,100% { border-color: rgba(123,47,255,.8); }
          50% { border-color: rgba(255,45,139,.9); }
        }
      `}</style>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998, overflow: 'hidden', opacity: visible ? 1 : 0, transition: 'opacity 0.3s' }}
        onClick={next}
      >
        {!spotRect && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)' }} />}
        {spotStyle && <div style={spotStyle} />}
        {buildArrow()}

        <div style={buildTooltipStyle()} onClick={e => e.stopPropagation()}>
          <div style={{
            background: '#16162a', border: '1px solid rgba(123,47,255,0.35)', borderRadius: 20,
            padding: '18px 20px', boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(123,47,255,0.12)',
            transition: 'transform 0.3s', transform: visible ? 'scale(1)' : 'scale(0.95)',
          }}>
            <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  height: 4, flex: 1, borderRadius: 2,
                  background: i === step ? 'linear-gradient(90deg,#7B2FFF,#FF2D8B)' : i < step ? 'rgba(123,47,255,0.4)' : '#1e1e38',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
            <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 5 }}>{cur.emoji}</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', textAlign: 'center', marginBottom: 7 }}>{cur.title}</h3>
            <p style={{ fontSize: 12.5, color: '#999', lineHeight: 1.65, textAlign: 'center', whiteSpace: 'pre-line' }}>{cur.body}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={skip} style={{ flex: 1, padding: '9px 0', borderRadius: 12, background: 'transparent', border: '1px solid #1e1e38', color: '#555', fontSize: 12, cursor: 'pointer' }}>
                Salta
              </button>
              <button onClick={next} style={{ flex: 2, padding: '9px 0', borderRadius: 12, background: 'linear-gradient(135deg,#7B2FFF,#FF2D8B)', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {isLast ? '🚀 Inizia!' : 'Avanti →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}