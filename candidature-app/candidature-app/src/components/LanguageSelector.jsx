import { useTranslation } from 'react-i18next'

export default function LanguageSelector({ onSelect }) {
  const { i18n } = useTranslation()

  const scegli = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('lingua', lang)
    onSelect()
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">Scegli la lingua / Choose language</h1>
      <div className="flex gap-4">
        <button onClick={() => scegli('it')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl text-lg hover:bg-blue-700">
          🇮🇹 Italiano
        </button>
        <button onClick={() => scegli('en')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl text-lg hover:bg-blue-700">
          🇬🇧 English
        </button>
      </div>
    </div>
  )
}