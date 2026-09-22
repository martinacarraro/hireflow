import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import it from './it.json'
import en from './en.json'

// "lingua" was the original storage key. Prefer it once during migration,
 // then keep both keys aligned so the splash screen and the rest of the app
 // always use the same language.
const savedLang = localStorage.getItem('lingua') || localStorage.getItem('lfs_lang') || 'it'
localStorage.setItem('lfs_lang', savedLang)
localStorage.setItem('lingua', savedLang)

i18n.use(initReactI18next).init({
  resources: { it: { translation: it }, en: { translation: en } },
  lng: savedLang,
  fallbackLng: 'it',
  interpolation: { escapeValue: false }
})

export default i18n