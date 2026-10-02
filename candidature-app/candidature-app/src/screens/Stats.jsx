import { hiredLabel } from '../lib/utils'
import { useMemo, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { averageWaitingDays, flowStats, hasResponse, waitingSince, elapsedDays, countedInterviews, upcomingInterviews, hasOffer } from '../lib/applicationFlow'
import { STATUS_CONFIG } from '../lib/utils'
import { useTranslation } from 'react-i18next'

export default function Stats({ onOpenCandidatura }) {
  const { profile, candidature = [], unreadCount, notifications, markAllNotificationsRead } = useApp()
  const { t, i18n } = useTranslation()
  const en = i18n.language === 'en'
  const [selectedCount, setSelectedCount] = useState(null)
  const [showNotifs, setShowNotifs] = useState(false)
  const [expandedAzienda, setExpandedAzienda] = useState(null)

  const stats = useMemo(() => {
    // 1. Totale ASSOLUTO (Tutte quelle nel DB)
    const total = candidature.length
    
    // Helper per contare stati (ignorando logicamente 'Archiviate' come stato)
    const byStato = (s) => candidature.filter(c => c && c.stato === s).length

    const summary = flowStats(candidature)
    const colloqui = summary.colloqui
    const ghosted = summary.ghosted
    const offerte = summary.offerte
    const tasso = total ? Math.round(summary.risposte / total * 100) : 0
    const avgAttesa = averageWaitingDays(candidature)

    // Distribuzione (Mostriamo solo gli stati REALI, non la cartella 'Archiviate')
    const STATI_ORDER = ['Inviata', 'Spontanea', 'Vista', 'Prima call', 'Colloquio', 'Secondo colloquio', 'In attesa risposta', 'Rifiutata', 'Non mi piace', 'GHOSTED', 'Offerta ricevuta', 'Offerta rifiutata', 'Assunta']
    const statoDistrib = STATI_ORDER.map(s => ({ stato: s, count: byStato(s) })).filter(s => s.count > 0)

    // Ghosted List
    const ghostedList = candidature
      .filter(c => c && c.stato === 'GHOSTED')
      .map(c => ({ ...c, giorni: elapsedDays(waitingSince(c)) }))
      .sort((a, b) => b.giorni - a.giorni)

    // Top Aziende
    const aziendaMap = {}
    candidature.forEach(c => {
      if (!c || !c.azienda) return
      if (!aziendaMap[c.azienda]) aziendaMap[c.azienda] = { count: 0, cands: [] }
      // Contiamo solo i contatti reali
      if (hasResponse(c)) {
        aziendaMap[c.azienda].count++
        aziendaMap[c.azienda].cands.push(c)
      }
    })
    const topAziende = Object.entries(aziendaMap)
      .filter(([_, data]) => data.count > 0)
      .sort((a,b) => b[1].count - a[1].count)
      .slice(0, 3)

    return { ...summary, total, colloqui, ghosted, offerte, tasso, avgAttesa, statoDistrib, ghostedList, topAziende }
  }, [candidature])

  const kpis = [
    { id: 'total', emoji: '📤', label: t('stats.totaleInviate'), value: stats.total, color: '#60A5FA' },
    { id: 'interviews', emoji: '🎙️', label: en?'Completed interviews':'Colloqui svolti', value: stats.colloqui, color: '#34D399' },
    { id: 'responses', emoji: '📈', label: t('stats.tassoRisposta'), value: `${stats.tasso}%`, color: '#8B5CF6' },
    { id: 'waiting', emoji: '⏱️', label: en?'Average current wait':'Attesa media attuale', value: stats.avgAttesa === null ? '—' : `${stats.avgAttesa} ${en?'days':'gg'}`, color: '#FBBF24' },
    { id: 'scheduled', emoji: '📅', label: en?'Scheduled meetings':'Incontri programmati', value:stats.programmati,color:'#34D399' },
    { id: 'offers', emoji: '🏆', label: en?'Offers received':'Offerte ricevute', value:stats.offerte,color:'#FFD700' },
  ]

  if (selectedCount) {
    const selected = kpis.find(k => k.id === selectedCount)
    const rows = candidature.map(c => {
      let detail = ''
      let included = true
      if (selectedCount === 'interviews' || selectedCount === 'scheduled') {
        const count = selectedCount === 'interviews' ? countedInterviews(c).length : upcomingInterviews(c, new Date(), 36500).length
        included = count > 0
        detail = `${count} ${en ? 'interview(s)' : 'colloqui'}`
      } else if (selectedCount === 'responses') included = hasResponse(c)
      else if (selectedCount === 'offers') included = hasOffer(c)
      else if (selectedCount === 'waiting') {
        const days = averageWaitingDays([c])
        included = days !== null
        detail = `${days} ${en ? 'days' : 'gg'}`
      } else if (selectedCount.startsWith('state:')) included = c.stato === selectedCount.slice(6)
      return included ? { c, detail } : null
    }).filter(Boolean)
    const title = selected?.label || t('add.stati.' + selectedCount.slice(6), selectedCount.slice(6))
    return <div className="screen">
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border">
        <button className="nav-arrow" onClick={() => setSelectedCount(null)} aria-label={t('common.indietro', 'Indietro / Back')}>←</button>
        <div><h2 className="font-bold text-txt">{title}</h2>
          <p className="text-sm text-muted">{selectedCount === 'responses' ? `${rows.length} / ${stats.total} · ${selected.value}` : `${rows.length} ${en ? 'applications' : 'candidature'}`}</p>
        </div>
      </div>
      <div className="flex-1 scrollable px-4 py-4 space-y-3">
        {rows.length === 0 && <p className="text-center text-muted py-12">{en ? 'No applications counted.' : 'Nessuna candidatura conteggiata.'}</p>}
        {rows.map(({c, detail}) => <button key={c.id} onClick={() => onOpenCandidatura(c)} className="card w-full text-left flex items-center gap-3 min-h-[64px]">
          <div className="flex-1 min-w-0"><p className="font-bold text-txt break-words">{c.azienda}</p><p className="text-sm text-muted break-words">{c.ruolo}</p>
            {c.archiviata && <span className="text-xs text-muted">{en ? 'Archived' : 'Archiviata'}</span>}
          </div>
          {detail && <span className="text-sm text-purple-soft shrink-0">{detail}</span>}
          <span aria-hidden="true" className="text-xl">›</span>
        </button>)}
      </div>
    </div>
  }

  // Gestione Notifiche (Invariata)
  if (showNotifs) return (
    <div className="screen">
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
        <button onClick={() => { setShowNotifs(false); markAllNotificationsRead() }} className="nav-arrow" aria-label={t('common.indietro', 'Indietro / Back')}>←</button>
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

  return (
    <div className="screen">
      <div className="px-5 pt-safe pt-4 pb-3 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-txt">{t('stats.titolo')}</h2>
          <p className="text-sm text-muted italic">{t('stats.sottotitolo')}</p>
        </div>
        <button onClick={() => setShowNotifs(true)} className="relative p-2">
          <span className="text-2xl">🔔</span>
          {unreadCount > 0 && <span className="absolute top-0 right-0 bg-red text-white text-xs rounded-full px-1">{unreadCount}</span>}
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
                <button key={k.id} onClick={() => setSelectedCount(k.id)} className="card flex flex-col items-center text-center gap-2 active:scale-95 transition-transform" aria-label={`${k.label}: ${k.value}. ${en ? 'View applications' : 'Vedi candidature'}`}>
                  <span aria-hidden="true" className="h-9 w-9 flex items-center justify-center text-2xl leading-none">{k.emoji}</span>
                  <span className="text-2xl font-bold leading-none tabular-nums" style={{ color: k.color }}>{k.value}</span>
                  <span className="text-xs text-muted leading-snug">{k.label}</span>
                </button>
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
                    <button className="block w-full text-left min-h-[44px]" key={item.stato} onClick={() => setSelectedCount(`state:${item.stato}`)}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: cfg.color }}>{cfg.emoji} {item.stato==='Assunta' ? hiredLabel(t,profile?.genere) : t('add.stati.'+item.stato,item.stato)}</span>
                        <span className="text-muted">{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full transition-all" style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* AZIENDE ATTIVE */}
            {stats.topAziende.length > 0 && (
              <div className="card">
                <p className="section-label">🏢 {en?'Companies that replied':'Aziende che hanno risposto'}</p>
                <div className="space-y-2 mt-2">
                  {stats.topAziende.map(([nome, data], i) => (
                    <div key={nome}>
                      <button onClick={() => setExpandedAzienda(expandedAzienda === nome ? null : nome)} className="flex items-center gap-3 py-1 w-full text-left">
                        <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                        <span className="flex-1 text-sm font-medium text-txt">{nome}</span>
                        <span className="text-xs text-purple-soft font-semibold">{data.count} {en?'candidatures':'candidature'}</span>
                      </button>
                      {expandedAzienda === nome && <div className="pl-8">{data.cands.map(c=><button key={c.id} className="block text-sm text-purple-soft py-2" onClick={()=>onOpenCandidatura(c)}>{c.ruolo}</button>)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HALL OF SHAME (GHOSTED) */}
            {stats.ghostedList.length > 0 && (
              <div className="card">
                <p className="section-label">👻 {en?'Marked as no response':'Segnate senza risposta'}</p>
                <div className="space-y-2 mt-2">
                  {stats.ghostedList.slice(0, 5).map(cand => (
                    <div key={cand.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-txt">{cand.azienda}</p>
                        <p className="text-xs text-muted">{cand.ruolo}</p>
                      </div>
                      <span className="text-xs text-red font-bold">{cand.giorni} {en?'days since last contact':'gg dall’ultimo contatto'}</span>
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
