import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LOADING_TIPS, LOADING_TIPS_EN, randomInt } from '../lib/utils'

export default function Splash({ onDone }) {
  const { t, i18n } = useTranslation()
  const lang = localStorage.getItem('lfs_lang') || i18n.language || 'it'
const tips = lang === 'en' ? LOADING_TIPS_EN : LOADING_TIPS
const [tip] = useState(() => tips[randomInt(0, tips.length - 1)])
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100 }
        return p + 2
      })
    }, 40)
    const timer = setTimeout(onDone, 2200)
    return () => { clearInterval(interval); clearTimeout(timer) }
  }, [onDone])

  return (
    <div className="screen items-center justify-center purple-glow-bg relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
      </div>
      <div className="relative z-10 flex flex-col items-center px-8 w-full max-w-sm">
        <div className="text-6xl mb-3 animate-pulse-soft">🚀</div>
        <h1 className="text-2xl font-bold text-txt tracking-tight mb-1">Le faremo sapere</h1>
        <p className="text-sm text-muted italic mb-10">{t('splash.tagline')}</p>
        <div className="w-full h-0.5 bg-border rounded-full overflow-hidden mb-8">
          <div className="h-full bg-purple rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }} />
        </div>
        <div className="w-full card border-l-[3px] border-l-purple">
          <p className="section-label mb-1">{tip.cat}</p>
          <p className="text-sm text-purple-soft italic leading-relaxed">"{tip.text}"</p>
        </div>
      </div>
    </div>
  )
}