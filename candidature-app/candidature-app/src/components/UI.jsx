import React from 'react'
import { STATUS_CONFIG, PRIORITA_CONFIG, getLevel, getXpProgress } from '../lib/utils'

// ─── STATUS BADGE ─────────────────────────────────────────────────
export function StatusBadge({ stato, size = 'sm' }) {
  const cfg = STATUS_CONFIG[stato] || STATUS_CONFIG['Inviata']
  const p = size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs'
  return (
    <span className={`status-badge ${p} font-semibold`}
      style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.emoji} {cfg.label}
    </span>
  )
}

// ─── PRIORITY BADGE ───────────────────────────────────────────────
export function PriorityBadge({ priorita }) {
  const cfg = PRIORITA_CONFIG[priorita] || PRIORITA_CONFIG['Media']
  return <span className="text-sm">{cfg.emoji}</span>
}

// ─── COMPANY AVATAR ───────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#EF4444','#fee2e2'], // A B C
  ['#F97316','#ffedd5'], // D E F
  ['#EAB308','#fef9c3'], // G H I
  ['#22C55E','#dcfce7'], // J K L
  ['#14B8A6','#ccfbf1'], // M N O
  ['#3B82F6','#dbeafe'], // P Q R
  ['#8B5CF6','#ede9fe'], // S T U
  ['#EC4899','#fce7f3'], // V W X
  ['#6366F1','#e0e7ff'], // Y Z
]

function getAvatarColor(letter) {
  const idx = Math.max(0, letter.charCodeAt(0) - 65)
  return AVATAR_COLORS[Math.min(Math.floor(idx / 3), AVATAR_COLORS.length - 1)]
}

// Indovina dominio dal nome azienda
function guessDomain(name) {
  const clean = name.trim().toLowerCase()
    .replace(/\s+(s\.?r\.?l|s\.?p\.?a|s\.?n\.?c|group|italia|holding|spa|srl)\.?$/i, '')
    .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9]/g, '')
  return clean + '.com'
}

export function CompanyAvatar({ name = '?', size = 40, domain: domainProp }) {
  const [status, setStatus] = React.useState('loading')
  const letter = name.trim().charAt(0).toUpperCase() || '?'
  const [bg, text] = getAvatarColor(letter)

  // Use saved domain if available, otherwise guess it
  const domain = domainProp || guessDomain(name)
  const logoUrl = `https://logo.clearbit.com/${domain}`

  if (status !== 'fail') {
    return (
      <div className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size, minWidth: size, background: '#fff' }}>
        <img
          src={logoUrl}
          alt={name}
          onLoad={() => setStatus('ok')}
          onError={() => setStatus('fail')}
          style={{ width: size, height: size, objectFit: 'contain' }}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
      style={{ width: size, height: size, minWidth: size, fontSize: size * 0.42, background: bg, color: text }}>
      {letter}
    </div>
  )
}

// ─── LEVEL BADGE ─────────────────────────────────────────────────
export function LevelBadge({ xp = 0 }) {
  const lv = getLevel(xp)
  return (
    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple text-white">
      {lv.emoji} Lv.{lv.lv} {lv.name}
    </span>
  )
}

// ─── XP BAR ──────────────────────────────────────────────────────
const XP_LOG_KEY = 'hireflow_xp_log'

export function logXpEvent(label, amount) {
  try {
    const log = JSON.parse(sessionStorage.getItem(XP_LOG_KEY) || '[]')
    log.unshift({ label, amount, time: new Date().toISOString() })
    sessionStorage.setItem(XP_LOG_KEY, JSON.stringify(log.slice(0, 20)))
  } catch {}
}

export function XpBar({ xp = 0 }) {
  const lv = getLevel(xp)
  const pct = getXpProgress(xp)
  const next = lv.max === 99999 ? '∞' : lv.max
  const [showLog, setShowLog] = React.useState(false)
  let log = []
  try { log = JSON.parse(sessionStorage.getItem(XP_LOG_KEY) || '[]') } catch {}

  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>{lv.emoji} Lv.{lv.lv} — {lv.name}</span>
        <button onClick={() => setShowLog(v => !v)} className="text-purple-soft font-medium">
          {xp} / {next} XP {showLog ? '▴' : '▾'}
        </button>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden mb-2">
        <div className="h-full bg-purple rounded-full xp-fill transition-all"
          style={{ width: `${pct}%` }} />
      </div>
      {showLog && (
        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
          {log.length === 0 ? (
            <p className="text-xs text-disabled text-center py-1">Nessun XP guadagnato ancora</p>
          ) : log.map((e, i) => (
            <div key={i} className="flex justify-between items-center text-xs py-0.5">
              <span className="text-muted">{e.label}</span>
              <span className="text-green font-semibold">+{e.amount} XP</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TOAST ───────────────────────────────────────────────────────
export function Toast({ toast }) {
  if (!toast) return null
  const colors = {
    success: 'border-green/30 text-green',
    error:   'border-red/30 text-red',
    info:    'border-muted/30 text-muted',
    badge:   'border-gold/30 text-gold',
  }
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50
      bg-raised border rounded-full px-5 py-2.5 text-sm font-medium
      shadow-glow-lg animate-pop whitespace-nowrap max-w-xs text-center
      ${colors[toast.type] || colors.success}`}>
      {toast.message}
    </div>
  )
}

// ─── CONFETTI ────────────────────────────────────────────────────
export function Confetti({ active }) {
  if (!active) return null
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}vw`,
    delay: `${Math.random() * 0.8}s`,
    color: ['#8B5CF6','#C4B5FD','#34D399','#FBBF24','#60A5FA','#F87171'][i % 6],
    size: `${6 + Math.random() * 8}px`,
    rotate: `${Math.random() * 360}deg`,
  }))
  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece"
          style={{ left: p.left, animationDelay: p.delay,
            background: p.color, width: p.size, height: p.size,
            transform: `rotate(${p.rotate})`,
            top: '-20px', position: 'absolute' }} />
      ))}
    </div>
  )
}

// ─── SECTION HEADER ───────────────────────────────────────────────
export function SectionLabel({ children }) {
  return <p className="section-label">{children}</p>
}

// ─── LOADING SPINNER ─────────────────────────────────────────────
export function Spinner({ size = 24 }) {
  return (
    <div className="flex items-center justify-center">
      <div className="rounded-full border-2 border-border border-t-purple animate-spin"
        style={{ width: size, height: size }} />
    </div>
  )
}

// ─── EMPTY STATE ─────────────────────────────────────────────────
export function EmptyState({ emoji, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4 animate-pulse-soft">{emoji}</div>
      <h3 className="text-txt font-semibold text-lg mb-2">{title}</h3>
      {subtitle && <p className="text-muted text-sm mb-6 leading-relaxed">{subtitle}</p>}
      {action}
    </div>
  )
}

// ─── MODAL / BOTTOM SHEET ─────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-raised rounded-t-3xl max-h-[90vh] overflow-y-auto sheet-enter"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <h3 className="font-bold text-txt text-base">{title}</h3>
          <button onClick={onClose} className="text-muted text-xl leading-none active:scale-95 transition-transform">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────
export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, danger = false }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-raised border border-border rounded-2xl p-6 w-full max-w-sm animate-pop shadow-glow-lg">
        <h3 className="font-bold text-txt text-base mb-2">{title}</h3>
        <p className="text-muted text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-secondary text-sm py-2.5">Annulla</button>
          <button onClick={onConfirm}
            className={`flex-1 text-sm py-2.5 font-semibold rounded-2xl active:scale-95 transition-all
              ${danger ? 'bg-red text-white' : 'btn-primary'}`}>
            Conferma
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TAB BAR ─────────────────────────────────────────────────────
export function TabBar({ active, onChange, unread = 0 }) {
  const tabs = [
    { id: 'home',     icon: '🏠', label: 'Home' },
    { id: 'calendar', icon: '📅', label: 'Calendario' },
    { id: 'add',      icon: '+',  label: 'Aggiungi', special: true },
    { id: 'stats',    icon: '📊', label: 'Stats' },
    { id: 'profile',  icon: '👤', label: 'Profilo' },
  ]
  return (
    <div className="bg-surface border-t border-border flex-shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-end h-16">
        {tabs.map(t => (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={`flex-1 flex flex-col items-center justify-end pb-2 gap-0.5 transition-all active:scale-95
              ${active === t.id && !t.special ? 'text-purple' : 'text-disabled'}`}>
            {t.special ? (
              <div className="flex flex-col items-center" style={{ marginBottom: '4px' }}>
                <span className="flex items-center justify-center w-14 h-14 rounded-full text-2xl font-bold bg-purple text-white shadow-btn"
                  style={{ marginTop: '-28px', boxShadow: '0 0 0 4px #0E0E1A, 0 4px 20px rgba(139,92,246,0.5)' }}>
                  {t.icon}
                </span>
              </div>
            ) : (
              <>
                <span className="text-xl leading-none relative">
                  {t.icon}
                  {t.id === 'profile' && unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red text-white text-[8px] rounded-full flex items-center justify-center font-bold px-1">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </span>
                <span className="text-[10px] leading-none">{t.label}</span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}


export function Field({ label, children, hint }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-txt mb-1.5">{label}</label>}
      {children}
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  )
}

// ─── CHOICE PICKER (pills) ────────────────────────────────────────
export function ChoicePicker({ value, options, onChange, colorFn }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = value === opt
        const color = colorFn?.(opt)
        return (
          <button key={opt} onClick={() => onChange(opt)}
            className={`pill-btn transition-all active:scale-95 ${
              active
                ? 'text-white border-transparent'
                : 'text-muted border-border bg-transparent'
            }`}
            style={active ? { background: color || '#8B5CF6', borderColor: color || '#8B5CF6' }
                          : {}}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}
