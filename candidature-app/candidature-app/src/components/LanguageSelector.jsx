import { useTranslation } from 'react-i18next'

export default function LanguageSelector({ onSelect }) {
  const { i18n } = useTranslation()

  const scegli = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('lingua', lang)
    onSelect()
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-8" style={{ background: '#0E0E1A' }}>
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">👻</div>
        <h1 className="text-4xl font-black text-white mb-2">Le faremo sapere</h1>
        <p className="text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>Scegli la tua lingua / Choose your language</p>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button onClick={() => scegli('it')} className="flex items-center gap-4 w-full px-6 py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all" style={{ background: 'linear-gradient(135deg, #7B2FFF, #FF2D8B)', color: 'white', border: 'none' }}>
          <span className="text-2xl">🇮🇹</span>
          <span>Italiano</span>
        </button>
        <button onClick={() => scegli('en')} className="flex items-center gap-4 w-full px-6 py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all" style={{ background: 'rgba(255,255,255,0.07)', color: 'white', border: '1.5px solid rgba(255,255,255,0.15)' }}>
          <span className="text-2xl">🇬🇧</span>
          <span>English</span>
        </button>
      </div>
      <p className="mt-8 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Puoi cambiare lingua dal profilo</p>
    </div>
  )
}