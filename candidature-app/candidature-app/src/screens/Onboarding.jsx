import { useState } from 'react'
import { useApp } from '../contexts/AppContext'

const SLIDES = [
  {
    emoji: '📬',
    title: '"Le faremo sapere."',
    body: 'Lo dicono tutti. Ma tu tieni traccia di chi lo ha detto davvero — e di chi invece è sparito nel nulla. Benvenuta in Le faremo sapere.',
  },
  {
    emoji: '📅',
    title: 'Ogni colloquio, ogni risposta',
    body: 'Calendario, notifiche e scadenze. Sai sempre chi ti deve ancora rispondere, da quanti giorni, e quando è ora di ricontattarli.',
  },
  {
    emoji: '👻',
    title: 'Ghosting rilevato.',
    body: 'Se un\'azienda sparisce per 60 giorni, lo sappiamo. Archiviamo in automatico e tu puoi andare avanti senza pensarci.',
  },
  {
    emoji: '🏆',
    title: 'La ricerca è una gara. Vincila.',
    body: 'Ogni candidatura vale XP. Ogni colloquio sblocca badge. Mantieni lo streak. L\'offerta è il boss finale — e stavolta ce la fai. 🎉',
  },
]

export default function Onboarding() {
  const { markOnboarded, requestNotificationPermission, triggerConfetti } = useApp()
  const [slide, setSlide] = useState(0)
  const [loading, setLoading] = useState(false)

  const next = () => {
    if (slide < SLIDES.length - 1) setSlide(s => s + 1)
  }

  const finish = async () => {
    setLoading(true)
    await requestNotificationPermission()
    triggerConfetti()
    await markOnboarded()
    setLoading(false)
  }

  const s = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  return (
    <div className="screen purple-glow-bg relative">
      <div className="flex items-center justify-between px-5 pt-safe pt-4">
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <div key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === slide ? 'w-6 bg-purple' : 'w-1.5 bg-border'
              }`} />
          ))}
        </div>
        <button onClick={finish} className="text-sm text-muted active:text-txt transition-colors">
          Salta →
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-48 h-48 rounded-full mb-2"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)' }} />
        <div className="text-7xl mb-6 -mt-40 animate-fade-in" key={`emoji-${slide}`}>
          {s.emoji}
        </div>
        <h2 className="text-2xl font-bold text-txt mb-4 animate-fade-in" key={`title-${slide}`}>
          {s.title}
        </h2>
        <p className="text-base text-muted leading-relaxed animate-fade-in" key={`body-${slide}`}>
          {s.body}
        </p>
      </div>

      <div className="px-6 pb-10 space-y-3">
        {isLast ? (
          <button onClick={finish} disabled={loading}
            className="btn-primary w-full text-base py-4">
            {loading ? '...' : 'Iniziamo! 🚀'}
          </button>
        ) : (
          <>
            <button onClick={next} className="btn-primary w-full text-base py-4">
              Avanti →
            </button>
            <p className="text-center text-xs text-disabled">
              {slide + 1} di {SLIDES.length}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
