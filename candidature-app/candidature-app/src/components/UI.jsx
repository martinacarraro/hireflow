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
export function CompanyAvatar({ name = '?', size = 40 }) {
  const letter = name.trim().charAt(0).toUpperCase() || '?'
  const s = { width: size, height: size, minWidth: size }
  return (
    <div className="flex items-center justify-center rounded-full bg-purple text-white font-bold shadow-glow"
      style={{ ...s, fontSize: size * 0.45 }}>
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
export function XpBar({ xp = 0 }) {
  const lv = getLevel(xp)
  const pct = getXpProgress(xp)
  const next = lv.max === 99999 ? '∞' : lv.max
  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>{lv.emoji} Lv.{lv.lv} — {lv.name}</span>
        <span>{xp} / {next} XP</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full bg-purple rounded-full xp-fill transition-all"
          style={{ width: `${pct}%` }} />
      </div>
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
    { id: 'home',    icon: '🏠', label: 'Home' },
    { id: 'add',     icon: '➕', label: 'Aggiungi', special: true },
    { id: 'stats',   icon: '📊', label: 'Stats' },
    { id: 'profile', icon: '👤', label: 'Profilo' },
  ]
  return (
    <div className="bg-surface border-t border-border tab-safe-padding flex-shrink-0">
      <div className="flex items-center">
        {tabs.map(t => (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-all active:scale-95
              ${active === t.id ? 'text-purple' : 'text-disabled'}`}>
            {t.special ? (
              <span className={`flex items-center justify-center w-10 h-10 rounded-full text-lg
                ${active === t.id ? 'bg-purple text-white shadow-btn' : 'bg-border text-muted'}`}>
                {t.icon}
              </span>
            ) : (
              <span className="text-xl leading-none relative">
                {t.icon}
                {t.id === 'profile' && unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red text-white text-[9px] 
                    rounded-full flex items-center justify-center font-bold">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </span>
            )}
            {!t.special && <span className="text-[10px] font-medium">{t.label}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── INPUT WRAPPER ────────────────────────────────────────────────
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
