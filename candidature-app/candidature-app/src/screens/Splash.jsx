import { useEffect, useState } from 'react'
import { LOADING_TIPS, randomInt } from '../lib/utils'

export default function Splash({ onDone }) {
  const [tip] = useState(() => LOADING_TIPS[randomInt(0, LOADING_TIPS.length - 1)])
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
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center px-8 w-full max-w-sm">
        {/* Logo */}
        <div className="text-6xl mb-3 animate-pulse-soft">🚀</div>
        <h1 className="text-2xl font-bold text-txt tracking-tight mb-1">Le mie Candidature</h1>
        <p className="text-sm text-muted italic mb-10">Il job tracker che ti capisce davvero.</p>

        {/* Progress bar */}
        <div className="w-full h-0.5 bg-border rounded-full overflow-hidden mb-8">
          <div className="h-full bg-purple rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }} />
        </div>

        {/* Tip card */}
        <div className="w-full card border-l-[3px] border-l-purple">
          <p className="section-label mb-1">{tip.cat}</p>
          <p className="text-sm text-purple-soft italic leading-relaxed">"{tip.text}"</p>
        </div>
      </div>
    </div>
  )
}
