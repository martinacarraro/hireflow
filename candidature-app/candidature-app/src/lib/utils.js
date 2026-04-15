// ─── STATUS & CONFIG ─────────────────────────────────────────────

export const STATI = ['Inviata','Spontanea','Vista','Prima call','Colloquio','Secondo colloquio','In attesa risposta','Non mi piace','Rifiutata','GHOSTED','Offerta ricevuta']
export const PRIORITA = ['Alta','Media','Bassa']
export const FONTI = ['LinkedIn','Indeed','InfoJobs','Glassdoor','Email','Referral','Sito aziendale','Spontanea','Altro']

export const WELFARE_OPTIONS = [
  'Smart working', 'Smart working parziale', 'Mensa aziendale', 'Ticket restaurant',
  'Assicurazione sanitaria', 'Welfare aziendale', 'Formazione continua', 'Auto aziendale',
  'Stock options', 'Bonus performance', 'Asilo nido', 'Palestra', 'Flessibilità oraria',
  'Settimana corta', 'Telefono aziendale', 'PC aziendale', 'Budget formazione',
]
export const TIPI_COLLOQUIO = ['📞 Telefonico','💻 Video','🏢 In presenza']
export const FEELING_OPTIONS = ['😍','🙂','😐','😬','🤷']

export const STATUS_CONFIG = {
  'Offerta ricevuta':   { color: '#10B981', bg: 'rgba(16,185,129,0.15)',  emoji: '🏆', label: 'Offerta' },
  'Assunta':            { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  emoji: '🌟', label: 'Assunta', labelM: 'Assunto', labelNB: 'Assunt*' },
  'Spontanea':          { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)', emoji: '💡', label: 'Spontanea' },
  'Inviata':            { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)',  emoji: '📤', label: 'Inviata' },
  'Vista':              { color: '#F97316', bg: 'rgba(249,115,22,0.15)',  emoji: '👀', label: 'Vista' },
  'Prima call':         { color: '#A855F7', bg: 'rgba(168,85,247,0.15)',  emoji: '📞', label: 'Prima call' },
  'Colloquio':          { color: '#22C55E', bg: 'rgba(34,197,94,0.15)',   emoji: '🎙️', label: 'Colloquio' },
  'In attesa risposta': { color: '#EAB308', bg: 'rgba(234,179,8,0.15)',   emoji: '⏳', label: 'In attesa' },
  'Secondo colloquio':  { color: '#16A34A', bg: 'rgba(22,163,74,0.15)',   emoji: '🎙️🎙️', label: '2° Colloquio' },
  'Rifiutata':          { color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   emoji: '❌', label: 'Rifiutata' },
  'Non mi piace':       { color: '#6D28D9', bg: 'rgba(109,40,217,0.15)',  emoji: '😕', label: 'Non mi piace' },
  'GHOSTED':            { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', emoji: '👻', label: 'GHOSTED' },
  'Archiviate':         { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', emoji: '📁', label: 'Archiviate' },
}

export const PRIORITA_CONFIG = {
  'Alta':  { emoji: '🔥', color: '#F87171' },
  'Media': { emoji: '⚡', color: '#FBBF24' },
  'Bassa': { emoji: '🌱', color: '#34D399' },
}

// ─── DATE HELPERS (Richiesti dal tuo import) ─────────────────────

export function daysSince(dateStr) {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - d) / 86400000)
}

export function isToday(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

export function isTomorrow(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return d.toDateString() === tomorrow.toDateString()
}

export function isYesterday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return d.toDateString() === yesterday.toDateString()
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

// ─── XP & GAMIFICATION ───────────────────────────────────────────

export const XP_EVENTS = {
  FIRST_CANDIDATURA: 10, ADD_CANDIDATURA: 5, GOT_COLLOQUIO: 15,
  CHECKLIST_ITEM: 5, CHECKLIST_FULL: 10, OFFERTA: 20,
  FEELING_ADDED: 3, NOTE_ADDED: 3, SMART_PARSE: 2,
}

export const LEVELS = [
  { lv: 1, min: 0,    max: 99,   name: 'novizio', emoji: '👶' },
  { lv: 2, min: 100,  max: 299,  name: 'apprendista', emoji: '📜' },
  { lv: 3, min: 300,  max: 599,  name: 'esploratore', emoji: '🗺️' },
  { lv: 4, min: 600,  max: 999,  name: 'cacciatore', emoji: '🎯' },
  { lv: 5, min: 1000, max: 9999, name: 'esperto', emoji: '🏆' },
]

export function getLevel(xp = 0) {
  return LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0]
}

export function getXpProgress(xp = 0) {
  const level = getLevel(xp)
  return Math.min(((xp - level.min) / (level.max - level.min)) * 100, 100)
}

// BADGES semplificati per il build
export const BADGES = [
  { id: 'first', emoji: '🚀', name: 'Prima Candidatura', check: (s) => s.total >= 1 },
  { id: 'ten', emoji: '🎯', name: 'Cecchin*', check: (s) => s.total >= 10 },
  { id: 'offer', emoji: '🏆', name: 'Ce l\'hai fatta!', check: (s) => s.offerte >= 1 }
]

// ─── UTILS ───────────────────────────────────────────────────────

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const DEFAULT_CHECKLIST = [
  { id: '1', text: 'Rileggere l\'annuncio e i requisiti', completed: false },
  { id: '2', text: 'Preparare una breve presentazione di sé', completed: false },
  { id: '3', text: 'Ricercare l\'azienda e i suoi valori', completed: false },
]

// ─── URL PARSER (Necessario per le funzioni smart) ───────────────

export function parseJobUrl(url) {
  if (!url) return { fonte: 'Altro' }
  const lower = url.toLowerCase()
  if (lower.includes('linkedin.com')) return { fonte: 'LinkedIn' }
  if (lower.includes('indeed.')) return { fonte: 'Indeed' }
  return { fonte: 'Sito aziendale' }
}

export function getGreeting(lang = 'it') {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Buongiorno';
  if (h >= 12 && h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export const LOADING_TIPS = ["Prepara un pitch! ⏱️", "Personalizza il CV! ✍️", "In bocca al lupo! 💪"];

export function getRandomTip(lang = 'it') {
  return LOADING_TIPS[randomInt(0, LOADING_TIPS.length - 1)];
}