import { useMemo, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { STATUS_CONFIG, daysSince } from '../lib/utils'

export default function Stats() {
  const { candidature, unreadCount, notifications, markAllNotificationsRead } = useApp()
  const [showNotifs, setShowNotifs] = useState(false)

  if (showNotifs) return (
    <div className="screen">
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
        <button onClick={() => { setShowNotifs(false); markAllNotificationsRead() }} className="text-muted text-lg">←</button>
        <h2 className="font-bold text-txt">Notifiche 🔔</h2>
      </div>
      <div className="flex-1 scrollable px-4 py-4">
        {notifications.length === 0
          ? <div className="text-center py-16 text-muted text-sm">🔕 Nessuna notifica ancora</div>
          : notifications.map(n => (
            <div key={n.id} className={`card mb-2 flex items-start gap-3 ${!n.read ? 'border-purple/30' : ''}`}>
              {!n.read && <div className="w-2 h-2 rounded-full bg-purple mt-1.5 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.read ? 'text-muted' : 'text-txt'}`}>{n.title}</p>
                <p className="text-xs text-muted mt-0.5">{n.body}</p>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )

  const stats = useMemo(() => {
    const total = candidature.length
    const byStato = (s) => candidature.filter(c => c.stato === s).length
    const colloqui = byStato('Colloquio') + byStato('In attesa') + byStato('Offerta ricevuta')
    const ghosted = byStato('GHOSTED')
    const offerte = byStato('Offerta ricevuta')
    const tasso = total > 0 ? Math.round((colloqui / total) * 100) : 0
    const inAttesa = candidature.filter(c => c.stato === 'In attesa')
    const avgAttesa = inAttesa.length
      ? Math.round(inAttesa.reduce((s, c) => s + daysSince(c.data_invio), 0) / inAttesa.length)
      : 0

    // By fonte
    const fonteMap = {}
    candidature.forEach(c => {
      if (c.fonte) {
        if (!fonteMap[c.fonte]) fonteMap[c.fonte] = { total: 0, colloqui: 0 }
        fonteMap[c.fonte].total++
        if (['Colloquio','In attesa','Offerta ricevuta'].includes(c.stato))
          fonteMap[c.fonte].colloqui++
      }
    })

    // By week (last 8 weeks)
    const weeks = []
    for (let i = 7; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - i * 7 - 6)
      const end = new Date(); end.setDate(end.getDate() - i * 7)
      start.setHours(0,0,0,0); end.setHours(23,59,59,999)
      const count = candidature.filter(c => {
        const d = new Date(c.created_at)
        return d >= start && d <= end
      }).length
      const label = `W-${i}`
      weeks.push({ label: i === 0 ? 'Questa' : `${i}w fa`, count })
    }

    // GHOSTED hall of shame
    const ghostedList = candidature
      .filter(c => c.stato === 'GHOSTED')
      .map(c => ({ ...c, giorni: daysSince(c.data_invio) }))
      .sort((a, b) => b.giorni - a.giorni)

    return { total, colloqui, ghosted, offerte, tasso, avgAttesa, fonteMap, weeks, ghostedList }
  }, [candidature])

  const kpis = [
    { emoji: '📤', label: 'Totale inviate',   value: stats.total,    color: '#60A5FA' },
    { emoji: '🎙️', label: 'Colloqui',          value: stats.colloqui, color: '#34D399' },
    { emoji: '📈', label: 'Tasso risposta',   value: `${stats.tasso}%`, color: '#8B5CF6' },
    { emoji: '⏱️', label: 'Media attesa',      value: `${stats.avgAttesa}gg`, color: '#FBBF24' },
  ]

  const maxWeek = Math.max(...stats.weeks.map(w => w.count), 1)
  const maxFonte = Math.max(...Object.values(stats.fonteMap).map(v => v.colloqui), 1)

  return (
    <div className="screen">
      <div className="px-5 pt-safe pt-4 pb-3 flex items-start justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-txt">Le tue stats 📊</h2>
          <p className="text-sm text-muted italic">Perché i numeri non mentono.</p>
        </div>
        <button onClick={() => setShowNotifs(true)} className="relative p-2 active:scale-90 transition-transform">
          <span className="text-2xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red text-white text-[9px] rounded-full flex items-center justify-center font-bold px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 scrollable px-4 pb-6 space-y-4">
        {candidature.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-muted text-sm">Aggiungi candidature per vedere le statistiche!</p>
          </div>
        ) : (
          <>
            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-3">
              {kpis.map(k => (
                <div key={k.label} className="card flex flex-col gap-1">
                  <span className="text-2xl">{k.emoji}</span>
                  <span className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</span>
                  <span className="text-xs text-muted">{k.label}</span>
                </div>
              ))}
            </div>

            {/* Donut / State breakdown */}
            <div className="card">
              <p className="section-label">DISTRIBUZIONE PER STATO</p>
              <div className="space-y-2.5">
                {Object.entries(STATUS_CONFIG).map(([stato, cfg]) => {
                  const count = candidature.filter(c => c.stato === stato).length
                  if (!count) return null
                  const pct = Math.round((count / candidature.length) * 100)
                  return (
                    <div key={stato}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: cfg.color }}>{cfg.emoji} {stato}</span>
                        <span className="text-muted">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Candidature per settimana */}
            <div className="card">
              <p className="section-label">CANDIDATURE PER SETTIMANA</p>
              <div className="flex items-end gap-1.5 h-24 mt-2">
                {stats.weeks.map((w, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${(w.count / maxWeek) * 80}px`,
                        background: i === 7 ? '#8B5CF6' : 'rgba(139,92,246,0.35)',
                        minHeight: w.count ? 4 : 0,
                      }} />
                    <span className="text-[9px] text-muted">{w.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fonte più efficace */}
            {Object.keys(stats.fonteMap).length > 0 && (
              <div className="card">
                <p className="section-label">FONTE PIÙ EFFICACE</p>
                <div className="space-y-2.5 mt-2">
                  {Object.entries(stats.fonteMap)
                    .sort((a, b) => b[1].colloqui - a[1].colloqui)
                    .map(([fonte, data]) => (
                    <div key={fonte}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-txt">{fonte}</span>
                        <span className="text-muted">{data.colloqui} colloqui / {data.total} inv.</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-green rounded-full"
                          style={{ width: `${(data.colloqui / maxFonte) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            <div className="card border-l-[3px] border-l-purple">
              <p className="section-label">💡 INSIGHTS</p>
              <div className="space-y-2 text-sm text-purple-soft">
                {stats.tasso >= 15 && <p>🔥 Tasso di risposta {stats.tasso}% — sopra la media. Stai facendo benissimo!</p>}
                {stats.tasso < 10 && stats.total > 5 && <p>💪 Tasso {stats.tasso}%  — la media è ~10%. Prova a personalizzare di più il CV.</p>}
                {stats.avgAttesa > 14 && <p>⏳ Attesa media di {stats.avgAttesa} giorni — considera dei follow-up!</p>}
                {stats.ghosted >= 3 && <p>👻 {stats.ghosted} aziende ti hanno ghostata. Il problema è loro, non tu. 💜</p>}
                {stats.offerte >= 1 && <p>🏆 {stats.offerte} offerta ricevuta. Ce l'hai fatta!</p>}
                {stats.total > 0 && stats.colloqui === 0 && <p>🎯 Ancora nessun colloquio — prova a personalizzare le candidature.</p>}
              </div>
            </div>

            {/* Hall of Shame */}
            {stats.ghostedList.length > 0 && (
              <div className="card">
                <p className="section-label">👻 HALL OF SHAME</p>
                <p className="text-xs text-muted mb-3 italic">Le aziende che sono sparite nel nulla.</p>
                <div className="space-y-2">
                  {stats.ghostedList.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center justify-between py-1.5
                      border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-txt">{c.azienda}</p>
                        <p className="text-xs text-muted">{c.ruolo}</p>
                      </div>
                      <span className="text-xs text-red font-medium">
                        {c.giorni}gg di silenzio
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
