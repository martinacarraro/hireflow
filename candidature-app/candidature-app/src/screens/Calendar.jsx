import { useMemo, useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { CompanyAvatar, StatusBadge } from '../components/UI'
import { STATUS_CONFIG, formatDate } from '../lib/utils'

const MESI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']
const MESI_FULL = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
const STATI_COLLOQUIO = ['Call conoscitiva','Colloquio','Secondo colloquio']

export default function Calendar({ onDetail }) {
  const { candidature } = useApp()
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  // All events (candidature with colloquio date OR data_invio)
  const eventi = useMemo(() => {
    return candidature
      .filter(c => STATI_COLLOQUIO.includes(c.stato) && c.data_colloquio)
      .map(c => ({
        ...c,
        _date: new Date(c.data_colloquio),
        _month: new Date(c.data_colloquio).getMonth(),
        _year: new Date(c.data_colloquio).getFullYear(),
      }))
      .sort((a, b) => a._date - b._date)
  }, [candidature])

  // Stats per month (last 6 months)
  const monthStats = useMemo(() => {
    const stats = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.getMonth(), y = d.getFullYear()
      const count = eventi.filter(e => e._month === m && e._year === y).length
      stats.push({ m, y, label: MESI[m], count, isSelected: m === selectedMonth && y === selectedYear })
    }
    return stats
  }, [eventi, selectedMonth, selectedYear])

  const maxCount = Math.max(...monthStats.map(s => s.count), 1)

  const eventiMese = useMemo(() =>
    eventi.filter(e => e._month === selectedMonth && e._year === selectedYear),
    [eventi, selectedMonth, selectedYear]
  )

  // Upcoming (next 30 days)
  const upcoming = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0)
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30)
    return eventi.filter(e => e._date >= today && e._date <= in30)
  }, [eventi])

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }

  return (
    <div className="screen">
      <div className="px-5 pt-safe pt-4 pb-3 flex-shrink-0">
        <h2 className="text-xl font-bold text-txt">Calendario 📅</h2>
        <p className="text-xs text-muted mt-0.5">Colloqui e call organizzati per mese</p>
      </div>

      <div className="flex-1 scrollable px-4 pb-6 space-y-4">

        {/* Prossimi appuntamenti */}
        {upcoming.length > 0 && (
          <div className="card border-l-[3px] border-l-green">
            <p className="text-xs uppercase tracking-widest font-semibold text-green mb-3">
              🔜 Prossimi 30 giorni
            </p>
            <div className="space-y-2">
              {upcoming.map(c => (
                <UpcomingCard key={c.id} c={c} onPress={() => onDetail(c)} />
              ))}
            </div>
          </div>
        )}

        {upcoming.length === 0 && (
          <div className="card text-center py-4">
            <p className="text-2xl mb-1">📭</p>
            <p className="text-sm text-muted">Nessun colloquio nei prossimi 30 giorni</p>
          </div>
        )}

        {/* Bar chart ultimi 6 mesi */}
        <div className="card">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted mb-4">
            📊 Colloqui per mese
          </p>
          <div className="flex items-end justify-between gap-1.5 h-20">
            {monthStats.map(s => (
              <button key={`${s.m}-${s.y}`}
                onClick={() => { setSelectedMonth(s.m); setSelectedYear(s.y) }}
                className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold" style={{ color: s.isSelected ? '#8B5CF6' : '#34D399' }}>
                  {s.count || ''}
                </span>
                <div className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max((s.count / maxCount) * 56, s.count > 0 ? 8 : 3)}px`,
                    background: s.isSelected ? '#8B5CF6' : s.count > 0 ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.05)',
                  }} />
                <span className="text-[10px]" style={{ color: s.isSelected ? '#8B5CF6' : '#6B7280' }}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigator mese selezionato */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="text-muted px-2 py-1 active:scale-90 transition-transform">‹</button>
          <h3 className="text-base font-bold text-txt">
            {MESI_FULL[selectedMonth]} {selectedYear}
            <span className="text-xs text-muted font-normal ml-2">{eventiMese.length} eventi</span>
          </h3>
          <button onClick={nextMonth} className="text-muted px-2 py-1 active:scale-90 transition-transform">›</button>
        </div>

        {/* Lista eventi mese */}
        {eventiMese.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🗓️</p>
            <p className="text-sm text-muted">Nessun colloquio in questo mese</p>
          </div>
        ) : (
          <div className="space-y-2">
            {eventiMese.map(c => (
              <EventCard key={c.id} c={c} onPress={() => onDetail(c)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function UpcomingCard({ c, onPress }) {
  const cfg = STATUS_CONFIG[c.stato] || STATUS_CONFIG['Colloquio']
  const date = new Date(c.data_colloquio)
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.round((date - today) / 86400000)
  const label = diff === 0 ? 'Oggi! 🔥' : diff === 1 ? 'Domani ⚡' : `Fra ${diff} giorni`
  return (
    <button onClick={onPress} className="w-full flex items-center gap-3 text-left active:scale-[0.98] transition-transform">
      <CompanyAvatar name={c.azienda} size={36} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-txt truncate">{c.azienda}</p>
        <p className="text-xs text-muted truncate">{c.ruolo}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold" style={{ color: cfg.color }}>{label}</p>
        <p className="text-[10px] text-muted">{c.ora_colloquio || formatDate(c.data_colloquio)}</p>
      </div>
    </button>
  )
}

function EventCard({ c, onPress }) {
  const cfg = STATUS_CONFIG[c.stato] || STATUS_CONFIG['Colloquio']
  const date = new Date(c.data_colloquio)
  const day = date.getDate()
  const dayName = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'][date.getDay()]
  return (
    <button onClick={onPress}
      className="w-full card flex items-center gap-3 text-left active:scale-[0.98] transition-transform p-3">
      <div className="w-10 flex-shrink-0 flex flex-col items-center">
        <span className="text-[10px] text-muted uppercase">{dayName}</span>
        <span className="text-lg font-bold text-txt leading-tight">{day}</span>
      </div>
      <div className="w-px h-8 bg-border flex-shrink-0" />
      <CompanyAvatar name={c.azienda} size={32} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-txt truncate">{c.azienda}</p>
        <p className="text-xs text-muted truncate">{c.ruolo}</p>
      </div>
      <div className="flex-shrink-0">
        <StatusBadge stato={c.stato} />
        {c.ora_colloquio && <p className="text-[10px] text-muted text-right mt-0.5">{c.ora_colloquio}</p>}
      </div>
    </button>
  )
}
