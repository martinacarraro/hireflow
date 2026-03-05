import { useState } from 'react'
import { useApp } from '../contexts/AppContext'

const SLIDES = [
  {
    emoji: '🗂️',
    title: 'Tutto in un posto',
    body: 'Aggiungi ogni candidatura in secondi. Azienda, ruolo, stato, link all\'annuncio — tutto organizzato e cercabile. Niente più post-it o tab dimenticati.',
  },
  {
    emoji: '🔗',
    title: 'Incolla un link, facciamo il resto',
    body: 'Copia il link dell\'annuncio da LinkedIn, Indeed o qualsiasi sito — l\'app estrae in automatico azienda e ruolo. Tu controlla, noi compiliamo. 🤖',
  },
  {
    emoji: '🔔',
    title: 'Notifiche che lavorano per te',
    body: 'Ti avvisiamo la sera prima del colloquio, quando un\'azienda tace da troppo, e se sparisce nel nulla dopo 30 giorni. Tutto sul telefono. 📱',
  },
  {
    emoji: '🏆',
    title: 'È un gioco. E puoi vincerlo.',
    body: 'Guadagna XP, sblocca badge, mantieni lo streak. Ogni candidatura è un livello. L\'offerta ricevuta è la vittoria finale. 🎉',
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
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4">
        {/* Dot indicators */}
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

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Purple glow */}
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

      {/* Bottom */}
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
