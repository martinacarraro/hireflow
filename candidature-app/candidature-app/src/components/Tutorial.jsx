import { useState, useEffect } from 'react'

const STEPS = [
  {
    id: 'welcome',
    emoji: '👋',
    title: 'Benvenut*!',
    body: 'Questo breve tour ti mostra le funzioni principali. Puoi saltarlo in qualsiasi momento.',
    spotlight: null,
    tooltipPos: 'center',
  },
  {
    id: 'add',
    emoji: '➕',
    title: 'Aggiungi candidature',
    body: 'Premi questo tasto per aggiungere una nuova candidatura. Ci vogliono 30 secondi.',
    spotlight: { type: 'circle', anchorBottom: 62, size: 80 },
    tooltipPos: 'top',
    arrow: 'down',
  },
  {
    id: 'tabs',
    emoji: '📊',
    title: 'Le sezioni',
    body: '📅 Calendario → colloqui per data\n📊 Stats → grafici e insight\n👤 Profilo → livello, badge e impostazioni',
    spotlight: { type: 'rect', anchorBottom: 0, height: 88 },
    tooltipPos: 'top',
    arrow: 'down',
  },
  {
    id: 'home',
    emoji: '🏠',
    title: 'Le tue candidature',
    body: 'Qui vedi tutto in ordine. Tocca una candidatura per aprire i dettagli, aggiornarla e aggiungere note.',
    spotlight: { type: 'rect', anchorTop: 135, height: 200 },
    tooltipPos: 'bottom',
    arrow: 'up',
  },
  {
    id: 'excel',
    emoji: '📊',
    title: 'Hai già candidature?',
    body: 'Vai in Profilo → Importa Candidature: scarica il template Excel, compilalo con le tue candidature e caricalo. L\'app si completa da sola! 🚀',
    spotlight: null,
    tooltipPos: 'center',
  },
]

export default function Tutorial({ onDone }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(t)
  }, [])

  const cur = STEPS[step]
  const isLast = step === STEPS.length - 1

  const next = () => {
    if (isLast) { setVisible(false); setTimeout(onDone, 250) }
    else setStep(s => s + 1)
  }
  const skip = () => { setVisible(false); setTimeout(onDone, 250) }

  // Spotlight geometry
  const sp = cur.spotlight
  const spotlightCss = sp ? (() => {
    const pad = 8
    if (sp.type === 'circle') {
      const d = sp.size + pad * 2
      return {
        position: 'absolute',
        width: d, height: d, borderRadius: '50%',
        bottom: sp.anchorBottom - pad,
        left: '50%', transform: 'translateX(-50%)',
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.80)',
        border: '2px solid rgba(123,47,255,0.7)',
        zIndex: 1, pointerEvents: 'none',
        animation: 'tut-pulse 1.6s ease-in-out infinite',
      }
    }
    if (sp.type === 'rect') {
      const base = {
        position: 'absolute',
        left: 12, right: 12,
        height: sp.height + pad * 2,
        borderRadius: 16,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.80)',
        border: '2px solid rgba(123,47,255,0.6)',
        zIndex: 1, pointerEvents: 'none',
        animation: 'tut-pulse 1.6s ease-in-out infinite',
      }
      if (sp.anchorBottom !== undefined) return { ...base, bottom: sp.anchorBottom - pad }
      if (sp.anchorTop !== undefined) return { ...base, top: sp.anchorTop - pad }
      return base
    }
    return {}
  })() : null

  // Arrow position
  const arrowEl = (() => {
    if (!cur.arrow || !sp) return null
    const base = { position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 2, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }
    if (cur.arrow === 'down') {
      const btm = sp.type === 'circle'
        ? sp.anchorBottom + sp.size + 20
        : (sp.anchorBottom !== undefined ? sp.anchorBottom + sp.height + 20 : 100)
      return (
        <div style={{ ...base, bottom: btm }}>
          <div style={{ width: 2, height: 26, background: 'linear-gradient(to bottom, #7B2FFF, rgba(123,47,255,0))', borderRadius: 2 }} />
          <div style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '9px solid #7B2FFF', marginTop: -3 }} />
        </div>
      )
    }
    if (cur.arrow === 'up') {
      const t = sp.anchorTop !== undefined ? sp.anchorTop - 46 : 150
      return (
        <div style={{ ...base, top: t }}>
          <div style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '9px solid #7B2FFF' }} />
          <div style={{ width: 2, height: 26, background: 'linear-gradient(to top, rgba(123,47,255,0), #7B2FFF)', borderRadius: 2 }} />
        </div>
      )
    }
    return null
  })()

  // Tooltip position
  const tooltipStyle = (() => {
    const base = { position: 'absolute', width: 'calc(100% - 32px)', maxWidth: 340, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }
    if (!sp || cur.tooltipPos === 'center') return { ...base, top: '50%', transform: 'translate(-50%,-50%)' }
    if (cur.tooltipPos === 'top') {
      const btm = sp.type === 'circle'
        ? sp.anchorBottom + sp.size + 60
        : (sp.anchorBottom !== undefined ? sp.anchorBottom + sp.height + 50 : 120)
      return { ...base, bottom: btm }
    }
    if (cur.tooltipPos === 'bottom') {
      const t = sp.anchorTop !== undefined ? sp.anchorTop + sp.height + 50 : 300
      return { ...base, top: t }
    }
    return base
  })()

  return (
    <>
      <style>{`@keyframes tut-pulse { 0%,100%{border-color:rgba(123,47,255,.7)} 50%{border-color:rgba(255,45,139,.9)} }`}</style>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998, overflow: 'hidden', opacity: visible ? 1 : 0, transition: 'opacity 0.3s' }}
        onClick={next}
      >
        {/* Background dim only when no spotlight */}
        {!sp && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)' }} />}

        {/* Spotlight cutout */}
        {sp && <div style={spotlightCss} />}

        {/* Arrow */}
        {arrowEl}

        {/* Tooltip */}
        <div style={tooltipStyle} onClick={e => e.stopPropagation()}>
          <div style={{
            background: '#16162a',
            border: '1px solid rgba(123,47,255,0.35)',
            borderRadius: 20,
            padding: '18px 20px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(123,47,255,0.12)',
            transition: 'transform 0.3s',
            transform: visible ? 'scale(1)' : 'scale(0.95)',
          }}>
            {/* Progress bar */}
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