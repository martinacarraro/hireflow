import { useMemo, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { STATUS_CONFIG, daysSince } from '../lib/utils'
import { useTranslation } from 'react-i18next'

export default function Stats({ onOpenCandidatura }) {
  const { candidature, unreadCount, notifications, markAllNotificationsRead, profile } = useApp()
  const { t } = useTranslation()
  const [showNotifs, setShowNotifs] = useState(false)
  const [expandedAzienda, setExpandedAzienda] = useState(null)

  if (showNotifs) return (
    <div className="screen">
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
        <button onClick={() => { setShowNotifs(false); markAllNotificationsRead() }} className="text-muted text-lg">←</button>
        <h2 className="font-bold text-txt">{t('home.notifiche')}</h2>
      </div>
      <div className="flex-1 scrollable px-4 py-4">
        {notifications.length === 0
          ? <div className="text-center py-16 text-muted text-sm">🔕 {t('home.nessunaNotifica')}</div>
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
const colloqui = candidature.filter(c => 
  !c.archiviata && // <-- AGGIUNGI QUESTO: conta solo se NON è archiviata
  ['Prima call', 'Colloquio', 'Secondo colloquio'].includes(c.stato)
).length
    const ghosted = byStato('GHOSTED')
    const STATI_ORDER = ['Inviata','Vista','Prima call','Colloquio','Secondo colloquio','In attesa risposta','Rifiutata','GHOSTED','Offerta ricevuta', 'Archiviate']
    const statoDistrib = STATI_ORDER.map(s => ({ stato: s, count: byStato(s) })).filter(s => s.count > 0)
    const offerte = byStato('Offerta ricevuta')
    const tasso = total > 0 ? Math.round((colloqui / total) * 100) : 0
    const inAttesa = candidature.filter(c => c.stato === 'In attesa risposta')
    const avgAttesa = inAttesa.length
      ? Math.round(inAttesa.reduce((s, c) => s + daysSince(c.data_invio), 0) / inAttesa.length)
      : 0

    const fonteMap = {}
    candidature.forEach(c => {
      if (c.fonte) {
        if (!fonteMap[c.fonte]) fonteMap[c.fonte] = { total: 0, colloqui: 0 }
        fonteMap[c.fonte].total++
        if (['Prima call','Colloquio','Secondo colloquio','In attesa risposta','Non mi piace','Rifiutata','GHOSTED','Offerta ricevuta'].includes(c.stato))
          fonteMap[c.fonte].colloqui++
      }
    })

    const weeks = []
    for (let i = 7; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - i * 7 - 6)
      const end = new Date(); end.setDate(end.getDate() - i * 7)
      start.setHours(0,0,0,0); end.setHours(23,59,59,999)
      const count = candidature.filter(c => {
        const d = new Date(c.data_invio || c.created_at)
        return d >= start && d <= end
      }).length
      weeks.push({ label: i === 0 ? 'W0' : `W-${i}`, count, i })
    }

    const ghostedList = candidature
      .filter(c => c.stato === 'GHOSTED')
      .map(c => ({ ...c, giorni: daysSince(c.data_invio) }))
      .sort((a, b) => b.giorni - a.giorni)

    const sentimentMap = {}
    const FEELING_SCORES = { '😍': 5, '😊': 4, '😐': 3, '😟': 2, '😭': 1 }
    candidature.forEach(c => {
      if (!c.feeling) return
      const score = FEELING_SCORES[c.feeling]
      if (!score) return
      const d = new Date(c.data_invio || c.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      if (!sentimentMap[key]) sentimentMap[key] = { total: 0, sum: 0 }
      sentimentMap[key].total++
      sentimentMap[key].sum += score
    })
    const sentimentByMonth = Object.entries(sentimentMap)
      .sort((a,b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, val]) => ({
        label: key.slice(5) + '/' + key.slice(2,4),
        avg: Math.round((val.sum / val.total) * 10) / 10
      }))

    const aziendaMap = {}
    candidature.forEach(c => {
      if (!c.azienda) return
      if (!aziendaMap[c.azienda]) aziendaMap[c.azienda] = { count: 0, cands: [] }
      if (['Colloquio','Prima call','Secondo colloquio','In attesa risposta','Non mi piace','Rifiutata','GHOSTED','Offerta ricevuta','Assunta'].includes(c.stato)) {
        aziendaMap[c.azienda].count++
        aziendaMap[c.azienda].cands.push(c)
      }
    })
    const topAziende = Object.entries(aziendaMap).sort((a,b) => b[1].count-a[1].count).slice(0,3)

    return { total, colloqui, ghosted, offerte, tasso, avgAttesa, fonteMap, weeks, ghostedList, sentimentByMonth, topAziende, statoDistrib }
  }, [candidature])

  const kpis = [
    { emoji: '📤', label: t('stats.totaleInviate'), value: stats.total,           color: '#60A5FA' },
    { emoji: '🎙️', label: t('stats.colloqui'),      value: stats.colloqui,        color: '#34D399' },
    { emoji: '📈', label: t('stats.tassoRisposta'), value: `${stats.tasso}%`,      color: '#8B5CF6' },
    { emoji: '⏱️', label: t('stats.mediaAttesa'),   value: `${stats.avgAttesa}${t('home.ggFa').replace(' ago','').replace(' fa','')}`, color: '#FBBF24' },
  ]

  const maxWeek = Math.max(...stats.weeks.map(w => w.count), 1)
  const maxFonte = Math.max(...Object.values(stats.fonteMap).map(v => v.colloqui), 1)

  return (
    <div className="screen">
      <div className="px-5 pt-safe pt-4 pb-3 flex items-start justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-txt">{t('stats.titolo')}</h2>
          <p className="text-sm text-muted italic">{t('stats.sottotitolo')}</p>
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
            <p className="text-muted text-sm">{t('stats.nessunaDato')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {kpis.map(k => (
                <div key={k.label} className="card flex flex-col gap-1">
                  <span className="text-2xl">{k.emoji}</span>
                  <span className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</span>
                  <span className="text-xs text-muted">{k.label}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <p className="section-label">{t('stats.distribuzione')}</p>
              <div className="space-y-2.5">
                {Object.entries(STATUS_CONFIG).map(([stato, cfg]) => {
                  const count = candidature.filter(c => c.stato === stato).length
                  if (!count) return null
                  const pct = Math.round((count / candidature.length) * 100)
                  return (
                    <div key={stato}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: cfg.color }}>{cfg.emoji} {t(`home.statiLabel.${stato}`, stato)}</span>
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

            {stats.statoDistrib.length > 0 && (
              <div className="card">
                <p className="section-label">{t('stats.distribuzione')}</p>
                {(() => {
                  const maxCount = Math.max(...stats.statoDistrib.map(s => s.count), 1)
                  return (
                    <div className="flex items-end gap-1.5 mt-3" style={{ height: '100px' }}>
                      {stats.statoDistrib.map(({ stato, count }) => {
                        const cfg = STATUS_CONFIG[stato] || {}
                        const pct = (count / maxCount) * 84
                        return (
                          <div key={stato} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[9px] font-bold" style={{ color: cfg.color || '#aaa' }}>{count}</span>
                            <div className="w-full rounded-t-md transition-all"
                              style={{ height: `${pct}px`, minHeight: count ? 4 : 0, background: cfg.color ? cfg.color + '55' : 'rgba(139,92,246,0.3)', borderTop: `2px solid ${cfg.color || '#8B5CF6'}` }} />
                            <span className="text-[8px] text-muted text-center leading-tight" style={{ maxWidth: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                              {cfg.emoji} {t(`home.statiLabel.${stato}`, stato)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}

            <div className="card">
              <p className="section-label">{t('stats.perSettimana')}</p>
              <div className="flex items-end gap-1.5 h-24 mt-2">
                {stats.weeks.map((w, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${(w.count / maxWeek) * 80}px`,
                        background: i === 7 ? '#8B5CF6' : 'rgba(139,92,246,0.35)',
                        minHeight: w.count ? 4 : 0,
                      }} />
                    <span className="text-[9px] text-muted">{i === 7 ? t('stats.questa') : `${7-i}w`}</span>
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(stats.fonteMap).length > 0 && (
              <div className="card">
                <p className="section-label">{t('stats.fonteEfficace')}</p>
                <div className="space-y-2.5 mt-2">
                  {Object.entries(stats.fonteMap)
                    .sort((a, b) => b[1].colloqui - a[1].colloqui)
                    .map(([fonte, data]) => (
                    <div key={fonte}>
                      <div className="flex justify-between text-xs mb-1">
                        {/* MODIFICA QUI: Traduciamo il nome della fonte */}
                        <span className="text-txt">{t(`fonti.${fonte}`, fonte)}</span>
                        <span className="text-muted">{data.colloqui} {t('stats.colloquiLabel')} / {data.total} {t('stats.invLabel')}</span>
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

            <div className="card border-l-[3px] border-l-purple">
              <p className="section-label">💡 {t('stats.insights')}</p>
              <div className="space-y-2 text-sm text-purple-soft">
                {stats.tasso >= 15 && <p>🔥 {t('stats.tassoAlto', { tasso: stats.tasso })}</p>}
                {stats.tasso < 10 && stats.total > 5 && <p>💪 {t('stats.tassoBasso', { tasso: stats.tasso })}</p>}
                {stats.avgAttesa > 14 && <p>⏳ {t('stats.attesaLunga', { giorni: stats.avgAttesa })}</p>}
                {stats.ghosted >= 3 && <p>👻 {t('stats.ghostedMsg', { count: stats.ghosted })}</p>}
                {stats.offerte >= 1 && <p>🏆 {t('stats.offertaMsg', { count: stats.offerte })}</p>}
                {stats.total > 0 && stats.colloqui === 0 && <p>🎯 {t('stats.nessunoColloquio')}</p>}
              </div>
            </div>

            {stats.sentimentByMonth.length >= 2 && (
              <div className="card">
                <p className="section-label">😊 {t('stats.feelingTitolo')}</p>
                <p className="text-xs text-muted mb-3">{t('stats.feelingDesc')}</p>
                <div className="flex items-end gap-2 h-20 mt-2">
                  {stats.sentimentByMonth.map((m, i) => {
                    const pct = (m.avg / 5) * 100
                    const col = m.avg >= 4 ? '#22C55E' : m.avg >= 3 ? '#FBBF24' : '#F87171'
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold" style={{ color: col }}>{m.avg}</span>
                        <div className="w-full rounded-t-md transition-all"
                          style={{ height: `${pct * 0.6}px`, background: col, minHeight: 4 }} />
                        <span className="text-[9px] text-muted">{m.label}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-muted mt-2 italic">
                  {stats.sentimentByMonth.length >= 2 &&
                    stats.sentimentByMonth[stats.sentimentByMonth.length-1].avg > stats.sentimentByMonth[0].avg
                    ? t('stats.feelingMigliorato')
                    : stats.sentimentByMonth[stats.sentimentByMonth.length-1].avg < stats.sentimentByMonth[0].avg
                    ? t('stats.feelingPeggiorato')
                    : t('stats.feelingStabile')}
                </p>
              </div>
            )}

            {stats.topAziende.length > 0 && (
              <div className="card">
                <p className="section-label">🏢 {t('stats.aziendeAttive')}</p>
                <p className="text-xs text-muted mb-3">{t('stats.aziendeAttiveDesc')}</p>
                <div className="space-y-2">
                  {stats.topAziende.map(([nome, data], i) => (
                    <div key={nome}>
                      <button onClick={() => {
                        if (data.cands.length === 1 && onOpenCandidatura) {
                          onOpenCandidatura(data.cands[0])
                        } else {
                          setExpandedAzienda(expandedAzienda === nome ? null : nome)
                        }
                      }} className="flex items-center gap-3 py-1 w-full active:opacity-70">
                        <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                        <span className="flex-1 text-sm font-medium text-txt truncate text-left">{nome}</span>
                        <span className="text-xs text-purple-soft font-semibold">{data.count} {t('stats.avanzamenti')}</span>
                        {data.cands.length > 1 && <span className="text-muted text-xs">{expandedAzienda === nome ? '▲' : '▼'}</span>}
                      </button>
                      {expandedAzienda === nome && data.cands.length > 1 && (
                        <div className="ml-8 space-y-1 pb-1">
                          {data.cands.map(cand => (
                            <button key={cand.id} onClick={() => onOpenCandidatura && onOpenCandidatura(cand)}
                              className="flex items-center justify-between w-full text-left py-1 active:opacity-70">
                              <span className="text-xs text-muted truncate flex-1">{cand.ruolo}</span>
                              <span className="text-xs text-purple-soft ml-2">{t(`home.statiLabel.${cand.stato}`, cand.stato)} →</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.ghostedList.length > 0 && (
              <div className="card">
                <p className="section-label">👻 {t('stats.hallOfShame')}</p>
                <p className="text-xs text-muted mb-3 italic">{t('stats.hallOfShameDesc')}</p>
                <div className="space-y-2">
                  {stats.ghostedList.slice(0, 5).map(cand => (
                    <button key={cand.id} onClick={() => onOpenCandidatura && onOpenCandidatura(cand)}
                      className="flex items-center justify-between py-1.5 w-full text-left border-b border-border last:border-0 active:opacity-70">
                      <div>
                        <p className="text-sm font-medium text-txt">{cand.azienda}</p>
                        <p className="text-xs text-muted">{cand.ruolo}</p>
                      </div>
                      <span className="text-xs text-red font-medium">
                        {cand.giorni}{t('stats.ggSilenzio')} →
                      </span>
                    </button>
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