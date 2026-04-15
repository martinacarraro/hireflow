// ─── STATUS SYSTEM ───────────────────────────────────────────────

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

export const STATUS_GROUP_ORDER = ['Assunta','Offerta ricevuta','Secondo colloquio','Colloquio','Prima call','In attesa risposta','Vista','Inviata','Spontanea','Non mi piace','Rifiutata','GHOSTED', 'Archiviate']

// ─── SMART URL PARSER ────────────────────────────────────────────

export function parseJobUrl(url) {
  if (!url) return {}
  const lower = url.toLowerCase()
  let fonte = 'Altro'
  if (lower.includes('linkedin.com'))   fonte = 'LinkedIn'
  else if (lower.includes('indeed.'))   fonte = 'Indeed'
  else if (lower.includes('infojobs.')) fonte = 'InfoJobs'
  else if (lower.includes('glassdoor.'))fonte = 'Glassdoor'
  else if (lower.includes('monster.'))  fonte = 'Monster'
  else if (lower.includes('jobteaser.'))fonte = 'JobTeaser'
  else if (lower.includes('welcometothejungle.')) fonte = 'Welcome to the Jungle'
  else fonte = 'Sito aziendale'
  return { fonte }
}

export async function fetchJobDataFromUrl(url) {
  const proxies = [
    async (u) => {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, { signal: AbortSignal.timeout(6000) })
      const data = await res.json()
      return data.contents || ''
    },
    async (u) => {
      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(u)}`, { signal: AbortSignal.timeout(6000) })
      return await res.text()
    },
    async (u) => {
      const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, { signal: AbortSignal.timeout(6000) })
      return await res.text()
    },
  ]

  let html = ''
  for (const proxy of proxies) {
    try {
      html = await proxy(url)
      if (html && html.length > 100) break
    } catch { /* try next */ }
  }

  if (!html) return { fonte: parseJobUrl(url).fonte, success: false }

  try {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const rawTitle = titleMatch ? titleMatch[1].trim() : ''
    const ogMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
    const ogTitle = ogMatch ? ogMatch[1].trim() : ''
    const title = ogTitle || rawTitle
    let azienda = '', ruolo = ''
    const lower = url.toLowerCase()

    if (lower.includes('linkedin.com')) {
      const parts = title.replace(/\s*\|\s*LinkedIn.*$/i, '').split(/ at /i)
      ruolo = parts[0]?.trim() || ''
      azienda = parts[1]?.trim() || ''
    } else if (lower.includes('indeed.')) {
      const clean = title.replace(/\s*[-–]\s*Indeed.*$/i, '')
      const parts = clean.split(/\s*[-–]\s/)
      ruolo = parts[0]?.trim() || ''
      azienda = parts[1]?.trim() || ''
    } else {
      const parts = title.split(/\s*[-|–]\s/)
      ruolo = parts[0]?.trim() || ''
      azienda = parts[1]?.trim() || ''
    }
    return { azienda, ruolo, fonte: parseJobUrl(url).fonte, success: !!(azienda || ruolo) }
  } catch {
    return { fonte: parseJobUrl(url).fonte, success: false }
  }
}

// ─── DATE HELPERS ────────────────────────────────────────────────

export function daysSince(dateStr) {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - d) / 86400000)
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

export function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return ''
  const d = formatDate(dateStr)
  return timeStr ? `${d} alle ${timeStr.slice(0,5)}` : d
}

export function isToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.toDateString() === now.toDateString()
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

// ─── XP & GAMIFICATION ───────────────────────────────────────────

export const XP_EVENTS = {
  FIRST_CANDIDATURA: 10,
  ADD_CANDIDATURA:   5,
  GOT_COLLOQUIO:     15,
  CHECKLIST_ITEM:    5,
  CHECKLIST_FULL:    10,
  OFFERTA:           20,
  FEELING_ADDED:     3,
  NOTE_ADDED:        3,
  SMART_PARSE:       2,
}

export function g(profile, f, m, nb) {
  const gen = profile?.genere
  if (gen === 'f') return f
  if (gen === 'm') return m
  return nb
}

export const LEVELS = [
  { lv: 1, min: 0,   max: 99,   name: 'novizio', emoji: '👶' },
  { lv: 2, min: 100, max: 299,  name: 'apprendista', emoji: '📜' },
  { lv: 3, min: 300, max: 599,  name: 'esploratore', emoji: '🗺️' },
  { lv: 4, min: 600, max: 999,  name: 'cacciatore', emoji: '🎯' },
  { lv: 5, min: 1000, max: 1999, name: 'esperto', emoji: '🎯' },
];

export function getLevel(xp = 0) {
  return LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0]
}

export function getXpProgress(xp = 0) {
  const level = getLevel(xp)
  const range = level.max - level.min
  const progress = xp - level.min
  return Math.min((progress / range) * 100, 100)
}

export const BADGES = [
  { id: 'first', emoji: '🚀', name: 'Prima Candidatura', check: (s) => s.total >= 1 },
  { id: 'ten', emoji: '🎯', name: 'Cecchin*', check: (s) => s.total >= 10 },
  { id: 'twentyfive', emoji: '💫', name: 'Instancabile', check: (s) => s.total >= 25 },
  { id: 'fifty', emoji: '👑', name: 'Leggenda', check: (s) => s.total >= 50 },
  { id: 'colloquio1', emoji: '🎙️', name: 'In the Game', check: (s) => s.colloqui >= 1 },
  { id: 'fire', emoji: '🔥', name: 'On Fire', check: (s) => s.colloquiThisMonth >= 3 },
  { id: 'resilient', emoji: '💜', name: 'Resiliente', check: (s) => s.ghosted >= 3 && s.total > s.ghosted },
  { id: 'offer', emoji: '🏆', name: 'Ce l\'hai fatta!', check: (s) => s.offerte >= 1 },
  { id: 'assunta', emoji: '🌟', name: 'Ce l\'hai fatta davvero!', check: (s) => s.assunta >= 1 },
  { id: 'ghosthunter', emoji: '👻', name: 'Ghost Hunter', check: (s) => s.ghosted >= 5 },
  { id: 'writer', emoji: '✍️', name: 'Scrittor*', check: (s) => s.withNotes >= 10 },
  { id: 'dates', emoji: '📅', name: 'Puntuale', check: (s) => s.withDates >= 5 },
  { id: 'world', emoji: '🌍', name: 'Cosmopolita', check: (s) => s.countries >= 3 },
  { id: 'checklist', emoji: '📋', name: 'Organizzat*', check: (s) => s.checklistComplete >= 1 },
  { id: 'hundred', emoji: '💯', name: 'Centurione', check: (s) => s.total >= 100 },
  { id: 'speed', emoji: '⚡', name: 'Speed Runner', check: (s) => s.todayCount >= 5 },
  { id: 'linked', emoji: '🔗', name: 'Link Master', check: (s) => s.smartParsed >= 5 },
  { id: 'streak3', emoji: '🗓️', name: 'Costante', check: (s) => s.weekStreak >= 3 },
  { id: 'secondcol', emoji: '🎙️🎙️', name: 'Finalista', check: (s) => s.secondi >= 1 },
  { id: 'pioneer', emoji: '🌱', name: 'Pioneer*', check: (s) => s.spontanee >= 1 },
]

// ─── LOADING TIPS ───────────────────────────────────────────────

export const LOADING_TIPS = [
  "Prepara una 'elevator pitch' di 30 secondi.",
  "Personalizza sempre la lettera di presentazione.",
  "Ricerca l'azienda prima di ogni colloquio.",
  "Tieni traccia di ogni contatto HR.",
  "Il 'no' fa parte del processo, non arrenderti.",
  "Controlla il tuo profilo LinkedIn regolarmente.",
  "Ogni colloquio è un'opportunità di networking.",
  "Prepara 2-3 domande intelligenti per l'intervistatore."
]

export const LOADING_TIPS_EN = [
  "Prepare a 30-second elevator pitch.",
  "Always customize your cover letter.",
  "Research the company before every interview.",
  "Keep track of every HR contact.",
  "A 'no' is part of the process, don't give up.",
  "Check your LinkedIn profile regularly.",
  "Every interview is a networking opportunity.",
  "Prepare 2-3 smart questions for the interviewer."
]

// ─── MOTIVATIONAL PHRASES ────────────────────────────────────────

export const MOTTOS_MATTINO = [
  'Buona giornata. Ogni candidatura inviata oggi è un passo avanti. 🌅',
  'Il mattino ha l\'oro in bocca — e tu hai il CV pronto. 💛',
  'Una nuova giornata, nuove opportunità da non lasciarsi sfuggire. 🚀',
]
export const MOTTOS_POMERIGGIO = [
  'Stai costruendo qualcosa, candidatura dopo candidatura. 🧱',
  'Ogni no ti avvicina al sì giusto. ✨',
]
export const MOTTOS_SERA = [
  'Brava giornata. Domani si ricomincia, più forti di oggi. 🌙',
  'Riposati. Meriti una pausa. 💜',
]

export const MOTTOS_MATTINO_EN = [
  'Good morning. Every application is a step forward. 🌅',
  'The early bird catches the worm — and you have your CV ready. 💛',
]
export const MOTTOS_POMERIGGIO_EN = [
  'You are building something, application by application. 🧱',
]
export const MOTTOS_SERA_EN = [
  'Good day. Tomorrow we start again. 🌙',
]

export function getMotto(lang = 'it') {
  const h = new Date().getHours()
  const day = new Date().getDate()
  if (lang === 'en') {
    if (h >= 5 && h < 12) return MOTTOS_MATTINO_EN[day % MOTTOS_MATTINO_EN.length]
    if (h >= 12 && h < 18) return MOTTOS_POMERIGGIO_EN[day % MOTTOS_POMERIGGIO_EN.length]
    return MOTTOS_SERA_EN[day % MOTTOS_SERA_EN.length]
  }
  if (h >= 5 && h < 12) return MOTTOS_MATTINO[day % MOTTOS_MATTINO.length]
  if (h >= 12 && h < 18) return MOTTOS_POMERIGGIO[day % MOTTOS_POMERIGGIO.length]
  return MOTTOS_SERA[day % MOTTOS_SERA.length]
}

export const MOTTOS = [...MOTTOS_MATTINO, ...MOTTOS_POMERIGGIO, ...MOTTOS_SERA]

// ─── HELPERS ─────────────────────────────────────────────────────

export function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const DEFAULT_CHECKLIST = [
  { id: '1', text: 'Rileggere l\'annuncio e i requisiti', completed: false },
  { id: '2', text: 'Preparare una breve presentazione di sé', completed: false },
  { id: '3', text: 'Ricercare l\'azienda e i suoi valori', completed: false },
  { id: '4', text: 'Preparare almeno due domande da fare', completed: false },
  { id: '5', text: 'Controllare connessione/microfono o indirizzo', completed: false },
];