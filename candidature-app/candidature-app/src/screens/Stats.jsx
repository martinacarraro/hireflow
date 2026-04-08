import { useMemo, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { STATUS_CONFIG, daysSince } from '../lib/utils'
import { useTranslation } from 'react-i18next'

export default function Stats({ onOpenCandidatura }) {
  const { candidature = [], unreadCount, notifications, markAllNotificationsRead } = useApp()
  const { t } = useTranslation()
  const [showNotifs, setShowNotifs] = useState(false)
  const [expandedAzienda, setExpandedAzienda] = useState(null)

  // Gestione Notifiche (Invariata)
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
    // 1. Totale ASSOLUTO (Tutte quelle nel DB)
    const total = candidature.length
    
    // Helper per contare stati (ignorando logicamente 'Archiviate' come stato)
    const byStato = (s) => candidature.filter(c => c && c.stato === s).length

    // 2. Logica Colloqui: Stato avanzato O data compilata (anche se archiviata/rifiutata)
    const colloqui = candidature.filter(c => {
      if (!c) return false
      const haData = c.data_colloquio || c.data_secondo_colloquio
      const statoAvanzato = ['Prima call', 'Colloquio', 'Secondo colloquio', 'In attesa risposta', 'Offerta ricevuta', 'Assunta'].includes(c.stato)
      return haData || statoAvanzato
    }).length

    const ghosted = byStato('GHOSTED')
    const offerte = candidature.filter(c => c && (c.stato === 'Offerta ricevuta' || c.stato === 'Assunta')).length
    const tasso = total > 0 ? Math.round((colloqui / total) * 100) : 0
    
    const inAttesa = candidature.filter(c => c && c.stato === 'In attesa risposta')
    const avgAttesa = inAttesa.length
      ? Math.round(inAttesa.reduce((s, c) => s + (daysSince(c.data_invio) || 0), 0) / inAttesa.length)
      : 0

    // Distribuzione (Mostriamo solo gli stati REALI, non la cartella 'Archiviate')
    const STATI_ORDER = ['Inviata', 'Spontanea', 'Vista', 'Prima call', 'Colloquio', 'Secondo colloquio', 'In attesa risposta', 'Rifiutata', 'Non mi piace', 'GHOSTED', 'Offerta ricevuta']
    const statoDistrib = STATI_ORDER.map(s => ({ stato: s, count: byStato(s) })).filter(s => s.count > 0)

    // Ghosted List
    const ghostedList = candidature
      .filter(c => c && c.stato === 'GHOSTED')
      .map(c => ({ ...c, giorni: daysSince(c.data_invio) || 0 }))
      .sort((a, b) => b.giorni - a.giorni)

    // Top Aziende
    const aziendaMap = {}
    candidature.forEach(c => {
      if (!c || !c.azienda) return
      if (!aziendaMap[c.azienda]) aziendaMap[c.azienda] = { count: 0, cands: [] }
      // Contiamo solo i contatti reali
      if (c.data_colloquio || ['Colloquio','Prima call','Secondo colloquio','In attesa risposta','Offerta ricevuta','Assunta'].includes(c.stato)) {
        aziendaMap[c.azienda].count++
        aziendaMap[c.azienda].cands.push(c)
      }
    })
    const topAziende = Object.entries(aziendaMap)
      .filter(([_, data]) => data.count > 0)
      .sort((a,b) => b[1].count - a[1].count)
      .slice(0, 3)

    return { total, colloqui, ghosted, offerte, tasso, avgAttesa, statoDistrib, ghostedList, topAziende }
  }, [candidature])

  const kpis = [
    { emoji: '📤', label: t('stats.totaleInviate'), value: stats.total, color: '#60A5FA' },
    { emoji: '🎙️', label: t('stats.colloqui'), value: stats.colloqui, color: '#34D399' },
    { emoji: '📈', label: t('stats.tassoRisposta'), value: `${stats.tasso}%`, color: '#8B5CF6' },
    { emoji: '⏱️', label: t('stats.mediaAttesa'), value: `${stats.avgAttesa} gg`, color: '#FBBF24' },
  ]

  return (
    <div className="screen">
      <div className="px-5 pt-safe pt-4 pb-3 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-txt">{t('stats.titolo')}</h2>
          <p className="text-sm text-muted italic">{t('stats.sottotitolo')}</p>
        </div>
        <button onClick={() => setShowNotifs(true)} className="relative p-2">
          <span className="text-2xl">🔔</span>
          {unreadCount > 0 && <span className="absolute top-0 right-0 bg-red text-white text-[9px] rounded-full px-1">{unreadCount}</span>}
        </button>
      </div>

      <div className="flex-1 scrollable px-4 pb-6 space-y-4">
        {stats.total === 0 ? (
          <div className="text-center py-16 text-muted">{t('stats.nessunaDato')}</div>
        ) : (
          <>
            {/* KPI GRID */}
            <div className="grid grid-cols-2 gap-3">
              {kpis.map(k => (
                <div key={k.label} className="card flex flex-col gap-1">
                  <span className="text-2xl">{k.emoji}</span>
                  <span className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</span>
                  <span className="text-xs text-muted">{k.label}</span>
                </div>
              ))}
            </div>

            {/* DISTRIBUZIONE */}
            <div className="card">
              <p className="section-label">{t('stats.distribuzione')}</p>
              <div className="space-y-3 mt-2">
                {stats.statoDistrib.map(item => {
                  const cfg = STATUS_CONFIG[item.stato] || { color: '#8B5CF6', emoji: '📝' }
                  const pct = Math.round((item.count / stats.total) * 100)
                  return (
                    <div key={item.stato}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: cfg.color }}>{cfg.emoji} {item.stato}</span>
                        <span className="text-muted">{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full transition-all" style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* AZIENDE ATTIVE */}
            {stats.topAziende.length > 0 && (
              <div className="card">
                <p className="section-label">🏢 {t('stats.aziendeAttive')}</p>
                <div className="space-y-2 mt-2">
                  {stats.topAziende.map(([nome, data], i) => (
                    <div key={nome}>
                      <button onClick={() => setExpandedAzienda(expandedAzienda === nome ? null : nome)} className="flex items-center gap-3 py-1 w-full text-left">
                        <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                        <span className="flex-1 text-sm font-medium text-txt">{nome}</span>
                        <span className="text-xs text-purple-soft font-semibold">{data.count} step</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HALL OF SHAME (GHOSTED) */}
            {stats.ghostedList.length > 0 && (
              <div className="card">
                <p className="section-label">👻 Hall of Shame</p>
                <div className="space-y-2 mt-2">
                  {stats.ghostedList.slice(0, 5).map(cand => (
                    <div key={cand.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-txt">{cand.azienda}</p>
                        <p className="text-xs text-muted">{cand.ruolo}</p>
                      </div>
                      <span className="text-xs text-red font-bold">{cand.giorni} gg silenzio</span>
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