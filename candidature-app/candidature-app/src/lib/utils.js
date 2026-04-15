// ─── STATUS SYSTEM ───────────────────────────────────────────────

export const STATI = ['Inviata','Spontanea','Vista','Prima call','Colloquio','Secondo colloquio','In attesa risposta','Non mi piace','Rifiutata','GHOSTED','Offerta ricevuta']
// NOTA: 'Assunta' è escluso da STATI — viene impostato automaticamente quando si accetta un'offerta
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
  'Archiviate': {   color: '#6B7280',   bg: 'rgba(107,114,128,0.15)',   emoji: '📁',   label: 'Archiviate' },
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

    // Try og:title as fallback (more reliable on many job sites)
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
    } else if (lower.includes('infojobs.')) {
      const parts = title.split(/\s+en\s+/i)
      ruolo = parts[0]?.trim() || ''
      azienda = parts[1]?.replace(/\s*[-|].*$/, '').trim() || ''
    } else if (lower.includes('glassdoor.')) {
      const parts = title.replace(/ jobs?/i, '').split(/\s+at\s+/i)
      ruolo = parts[0]?.trim() || ''
      azienda = parts[1]?.replace(/\s*[-|].*$/, '').trim() || ''
    } else if (lower.includes('monster.')) {
      const parts = title.split(/\s*[-–|]\s/)
      ruolo = parts[0]?.trim() || ''
      azienda = parts[1]?.trim() || ''
    } else if (lower.includes('welcometothejungle.')) {
      const parts = title.split(/\s*[-–|]\s/)
      ruolo = parts[0]?.trim() || ''
      azienda = parts[1]?.trim() || ''
    } else {
      // Generic: prende le prime due parti divise da - o |
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

// Helper per testo gendered
export function g(profile, f, m, nb) {
  const gen = profile?.genere
  if (gen === 'f') return f
  if (gen === 'm') return m
  return nb // nb o non specificato
}

export const LEVELS = [
  { lv: 1, min: 0,   max: 99,   name: 'novizio', emoji: '👶' },
  { lv: 2, min: 100, max: 299,  name: 'apprendista', emoji: '📜' },
  { lv: 3, min: 300, max: 599,  name: 'esploratore', emoji: '🗺️' },
  { lv: 4, min: 600, max: 999,  name: 'cacciatore', emoji: '🎯' }, // Il tuo "Cacciatore di Offerte"
  { lv: 5, min: 1000, max: 1999, name: 'esperto', emoji: '🎯' },     // Il tuo "Pro della Ricerca"
  // ... e così via per gli altri livelli
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
  {
    id: 'first', emoji: '🚀', name: 'Prima Candidatura',
    desc: 'Hai aggiunto la tua prima candidatura!',
    shareText: 'Ho appena mandato la mia prima candidatura e la sto tracciando su Le faremo sapere 🚀 Il mio viaggio nella ricerca lavoro inizia qui.',
    color: '#7B2FFF', bg: '#1a0a3a',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#7B2FFF"/><path d="M32 12C32 12 22 24 22 34a10 10 0 0020 0C42 24 32 12 32 12z" fill="white" opacity="0.9"/><circle cx="32" cy="34" r="4" fill="#7B2FFF"/><path d="M24 44l-4 6M40 44l4 6" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>',
    check: (s) => s.total >= 1
  },
  {
    id: 'ten', emoji: '🎯', name: 'Cecchin*', nameF: 'Cecchina', nameM: 'Cecchino',
    desc: '10 candidature inviate — mira che non erra.',
    shareText: 'Ho inviato 10 candidature e le sto tracciando tutte su Le faremo sapere 🎯 Organizzazione è metà della battaglia.',
    color: '#EF4444', bg: '#2a0a0a',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#EF4444"/><circle cx="32" cy="32" r="18" stroke="white" stroke-width="2.5" fill="none"/><circle cx="32" cy="32" r="10" stroke="white" stroke-width="2.5" fill="none"/><circle cx="32" cy="32" r="4" fill="white"/><line x1="32" y1="10" x2="32" y2="16" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="48" x2="32" y2="54" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="10" y1="32" x2="16" y2="32" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="48" y1="32" x2="54" y2="32" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>',
    check: (s) => s.total >= 10
  },
  {
    id: 'twentyfive', emoji: '💫', name: 'Instancabile',
    desc: '25 candidature — non ti ferma nessuno.',
    shareText: 'Quota 25 candidature raggiunta! 💫 Uso Le faremo sapere per non perdere il filo della mia ricerca lavoro. Funziona.',
    color: '#F59E0B', bg: '#2a1a00',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#F59E0B"/><polygon points="32,10 36,26 52,26 39,36 43,52 32,42 21,52 25,36 12,26 28,26" fill="white"/></svg>',
    check: (s) => s.total >= 25
  },
  {
    id: 'fifty', emoji: '👑', name: 'Leggenda',
    desc: '50 candidature — sei inarrestabile.',
    shareText: '50 candidature. Cinquanta. 👑 Sì, le sto tracciando tutte su Le faremo sapere. Perché "le faremo sapere" non è una risposta.',
    color: '#FFD700', bg: '#1a1500',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#B8860B"/><path d="M12 42h40v4H12z" fill="#FFD700"/><path d="M12 42L20 24l12 12 12-16 8 22z" fill="#FFD700"/><circle cx="20" cy="24" r="3" fill="white"/><circle cx="32" cy="36" r="3" fill="white"/><circle cx="44" cy="20" r="3" fill="white"/></svg>',
    check: (s) => s.total >= 50
  },
  {
    id: 'colloquio1', emoji: '🎙️', name: 'In the Game',
    desc: 'Hai ottenuto il tuo primo colloquio!',
    shareText: 'Primo colloquio ottenuto! 🎙️ Lo sto tracciando su Le faremo sapere — l\'app che mi aiuta a gestire la ricerca lavoro senza impazzire.',
    color: '#22C55E', bg: '#0a2a0a',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#22C55E"/><rect x="26" y="14" width="12" height="22" rx="6" fill="white"/><path d="M20 34c0 6.627 5.373 12 12 12s12-5.373 12-12" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/><line x1="32" y1="46" x2="32" y2="52" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="26" y1="52" x2="38" y2="52" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>',
    check: (s) => s.colloqui >= 1
  },
  {
    id: 'fire', emoji: '🔥', name: 'On Fire',
    desc: '3+ colloqui in un mese — sei caldissim*.',
    descF: '3+ colloqui in un mese — sei caldissima.',
    descM: '3+ colloqui in un mese — sei caldissimo.',
    shareText: '3 colloqui in un mese 🔥 La mia ricerca lavoro è in modalità turbo. Gestisco tutto con Le faremo sapere.',
    color: '#F97316', bg: '#2a1000',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#F97316"/><path d="M32 52C22 52 16 44 16 36c0-6 3-10 6-13 0 4 2 6 4 6-1-4 1-10 6-16 1 6 4 9 7 11-1-3 0-6 2-8 3 4 5 9 5 14 0 10-6 22-14 22z" fill="white" opacity="0.95"/><path d="M32 46c-4 0-8-4-8-9 0-3 2-5 3-6 0 2 1 4 3 4 0-2 1-5 3-7 1 3 3 5 3 8 2-1 2-3 2-4 2 2 3 5 3 7 0 5-5 7-9 7z" fill="#F97316"/></svg>',
    check: (s) => s.colloquiThisMonth >= 3
  },
  {
    id: 'resilient', emoji: '💜', name: 'Resiliente',
    desc: 'Ghostat* 3 volte e hai continuato. Rispetto.',
    descF: 'Ghostata 3 volte e hai continuato. Rispetto.',
    descM: 'Ghostato 3 volte e hai continuato. Rispetto.',
    shareText: 'Tre ghosting. Ho continuato lo stesso. 💜 Chi usa Le faremo sapere sa che i no fanno parte del gioco — e li traccia pure quelli.',
    color: '#A855F7', bg: '#1a0a2a',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#A855F7"/><path d="M32 48l-14-14a10 10 0 0114-14 10 10 0 0114 14z" fill="white"/><circle cx="26" cy="28" r="2" fill="#A855F7"/><circle cx="38" cy="28" r="2" fill="#A855F7"/><path d="M28 38c0 0 2 2 4 2s4-2 4-2" stroke="#A855F7" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>',
    check: (s) => s.ghosted >= 3 && s.total > s.ghosted
  },
  {
    id: 'offer', emoji: '🏆', name: 'Ce l\'hai fatta!',
    desc: 'Hai ricevuto un\'offerta. Meritata. 🎉',
    shareText: 'Offerta ricevuta! 🏆 Ho tracciato ogni candidatura, ogni colloquio, ogni ghosting su Le faremo sapere. Ne è valsa la pena.',
    color: '#FFD700', bg: '#1a1200',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#B8860B"/><path d="M20 18h24l-4 16H24z" fill="#FFD700"/><path d="M18 18h28v4H18z" fill="white" opacity="0.9"/><rect x="27" y="34" width="10" height="4" fill="#FFD700"/><rect x="22" y="38" width="20" height="4" rx="1" fill="white" opacity="0.9"/><circle cx="32" cy="14" r="3" fill="white"/></svg>',
    check: (s) => s.offerte >= 1
  },
  {
    id: 'assunta', emoji: '🌟',
    name: 'Ce l\'hai fatta davvero!',
    nameF: 'Ce l\'hai fatta davvero!',
    nameM: 'Ce l\'hai fatto davvero!',
    desc: 'Hai accettato un\'offerta. Finisce qui, inizia tutto. 💜',
    descF: 'Hai accettato un\'offerta. Finisce qui, inizia tutto. 💜',
    descM: 'Hai accettato un\'offerta. Finisce qui, inizia tutto. 💜',
    shareText: 'Ho trovato lavoro! 🌟 Ho tracciato ogni candidatura, ogni colloquio, ogni ghosting su Le faremo sapere. Ne è valsa la pena.',
    color: '#FFD700', bg: '#1a1500',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#10B981"/><path d="M20 34l8 8 16-18" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="32" cy="32" r="18" stroke="white" stroke-width="2" fill="none" opacity="0.4"/><path d="M32 10 L34 18 L32 16 L30 18 Z" fill="white" opacity="0.6"/><path d="M32 54 L34 46 L32 48 L30 46 Z" fill="white" opacity="0.6"/><path d="M10 32 L18 30 L16 32 L18 34 Z" fill="white" opacity="0.6"/><path d="M54 32 L46 30 L48 32 L46 34 Z" fill="white" opacity="0.6"/></svg>',
    check: (s) => s.assunta >= 1
  },
  {
    id: 'ghosthunter', emoji: '👻', name: 'Ghost Hunter',
    desc: '5 aziende marchiate GHOSTED. Classici.',
    shareText: '5 ghost. Cinque. 👻 Le ho segnate tutte su Le faremo sapere. Il silenzio dice tanto quanto una risposta.',
    color: '#6B7280', bg: '#111827',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#374151"/><path d="M20 48V30a12 12 0 0124 0v18l-4-4-4 4-4-4-4 4-4-4-4 4z" fill="white" opacity="0.9"/><circle cx="27" cy="30" r="3" fill="#374151"/><circle cx="37" cy="30" r="3" fill="#374151"/><circle cx="28.5" cy="29" r="1" fill="white"/><circle cx="38.5" cy="29" r="1" fill="white"/></svg>',
    check: (s) => s.ghosted >= 5
  },
  {
    id: 'writer', emoji: '✍️', name: 'Scrittor*', nameF: 'Scrittrice', nameM: 'Scrittore',
    desc: 'Note aggiunte a 10 candidature. Dettaglio è tutto.',
    shareText: 'Note su tutte le mie candidature 📝 Su Le faremo sapere tengo traccia di ogni dettaglio — HR, colloqui, sensazioni. È un\'altra cosa.',
    color: '#06B6D4', bg: '#0a1a2a',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#06B6D4"/><rect x="18" y="18" width="28" height="34" rx="3" fill="white" opacity="0.9"/><line x1="24" y1="26" x2="40" y2="26" stroke="#06B6D4" stroke-width="2" stroke-linecap="round"/><line x1="24" y1="32" x2="40" y2="32" stroke="#06B6D4" stroke-width="2" stroke-linecap="round"/><line x1="24" y1="38" x2="34" y2="38" stroke="#06B6D4" stroke-width="2" stroke-linecap="round"/><path d="M36 44l8-8-3-3-8 8v3h3z" fill="#06B6D4"/></svg>',
    check: (s) => s.withNotes >= 10
  },
  {
    id: 'dates', emoji: '📅', name: 'Puntuale',
    desc: 'Data aggiunta a 5 colloqui. Mai in ritardo.',
    shareText: 'Mai perso un colloquio per disorganizzazione 📅 Uso Le faremo sapere per tenere tutte le date sotto controllo.',
    color: '#3B82F6', bg: '#0a1020',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#3B82F6"/><rect x="16" y="20" width="32" height="28" rx="4" fill="white" opacity="0.9"/><rect x="16" y="20" width="32" height="8" rx="4" fill="#3B82F6"/><line x1="24" y1="16" x2="24" y2="24" stroke="white" stroke-width="2.5" stroke-linecap="round"/><line x1="40" y1="16" x2="40" y2="24" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M24 36l5 5 11-9" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    check: (s) => s.withDates >= 5
  },
  {
    id: 'world', emoji: '🌍', name: 'Cosmopolita',
    desc: 'Candidature in 3+ paesi. Il mondo è il tuo ufficio.',
    shareText: 'Sto cercando lavoro in più paesi 🌍 Con Le faremo sapere gestisco tutto in un posto solo — Italia, Europa e oltre.',
    color: '#10B981', bg: '#0a1a10',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#10B981"/><circle cx="32" cy="32" r="16" fill="white" opacity="0.15" stroke="white" stroke-width="1.5"/><ellipse cx="32" cy="32" rx="8" ry="16" stroke="white" stroke-width="1.5" fill="none"/><line x1="16" y1="32" x2="48" y2="32" stroke="white" stroke-width="1.5"/><line x1="18" y1="24" x2="46" y2="24" stroke="white" stroke-width="1.5"/><line x1="18" y1="40" x2="46" y2="40" stroke="white" stroke-width="1.5"/></svg>',
    check: (s) => s.countries >= 3
  },
  {
    id: 'checklist', emoji: '📋', name: 'Organizzat*', nameF: 'Organizzata', nameM: 'Organizzato',
    desc: 'Checklist completa prima di un colloquio.',
    shareText: 'Nessun colloquio senza preparazione ✅ Con Le faremo sapere ho la checklist sempre pronta. Dettaglio che fa la differenza.',
    color: '#8B5CF6', bg: '#1a0a2a',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#8B5CF6"/><rect x="18" y="16" width="28" height="34" rx="3" fill="white" opacity="0.9"/><path d="M24 26l3 3 6-6" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M24 34l3 3 6-6" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="24" y1="44" x2="36" y2="44" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round"/></svg>',
    check: (s) => s.checklistComplete >= 1
  },
  {
    id: 'hundred', emoji: '💯', name: 'Centurione',
    desc: '100 candidature. Sei una macchina da guerra.',
    shareText: '100 candidature inviate 💯 Se cercare lavoro fosse uno sport, avrei già vinto. Traccio tutto su Le faremo sapere.',
    color: '#FF2D8B', bg: '#2a0015',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#FF2D8B"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="22" font-weight="bold" font-family="Arial">100</text></svg>',
    check: (s) => s.total >= 100
  },
  {
    id: 'speed', emoji: '⚡', name: 'Speed Runner',
    desc: '5 candidature in un giorno solo. Impressionante.',
    shareText: '5 candidature in un giorno ⚡ Quando ci si mette, ci si mette. Gestisco la mia ricerca lavoro su Le faremo sapere.',
    color: '#FBBF24', bg: '#1a1500',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#FBBF24"/><path d="M36 12L20 34h14l-6 18 20-26H34z" fill="white"/></svg>',
    check: (s) => s.todayCount >= 5
  },
  {
    id: 'linked', emoji: '🔗', name: 'Link Master',
    desc: 'Link annuncio aggiunto a 5 candidature.',
    shareText: 'Organizzo ogni candidatura col link all\'annuncio 🔗 Su Le faremo sapere tengo traccia di tutto — non perdo mai un dettaglio.',
    color: '#0EA5E9', bg: '#0a1520',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#0EA5E9"/><path d="M26 38l12-12" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M30 26l4-4a6 6 0 018.5 8.5l-4 4" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/><path d="M34 38l-4 4a6 6 0 01-8.5-8.5l4-4" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>',
    check: (s) => s.smartParsed >= 5
  },
  {
    id: 'streak3', emoji: '🗓️', name: 'Costante',
    desc: '3 settimane consecutive con almeno 1 candidatura.',
    shareText: '3 settimane di ricerca lavoro consecutive 🗓️ La costanza paga. Lo traccio tutto su Le faremo sapere.',
    color: '#34D399', bg: '#0a1a10',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#34D399"/><rect x="16" y="18" width="32" height="30" rx="4" fill="white" opacity="0.9"/><rect x="16" y="18" width="32" height="8" rx="4" fill="#34D399"/><circle cx="24" cy="34" r="3" fill="#34D399"/><circle cx="32" cy="34" r="3" fill="#34D399"/><circle cx="40" cy="34" r="3" fill="#22C55E"/><circle cx="24" cy="42" r="3" fill="#34D399"/><circle cx="32" cy="42" r="3" fill="#22C55E"/></svg>',
    check: (s) => s.weekStreak >= 3
  },
  {
    id: 'secondcol', emoji: '🎙️🎙️', name: 'Finalista',
    desc: 'Hai raggiunto il secondo colloquio. Sei in lizza.',
    shareText: 'Secondo colloquio raggiunto 🎙️🎙️ Ci siamo quasi. Gestisco la mia ricerca lavoro su Le faremo sapere — ogni passo conta.',
    color: '#16A34A', bg: '#0a1a08',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#16A34A"/><rect x="20" y="14" width="10" height="20" rx="5" fill="white"/><rect x="34" y="20" width="10" height="20" rx="5" fill="white" opacity="0.7"/><path d="M16 38c0 5 4 9 9 9" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M30 43c0 4 4 7 9 7" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/></svg>',
    check: (s) => s.secondi >= 1
  },
  {
    id: 'pioneer', emoji: '🌱', name: 'Pioneer*', nameF: 'Pioniera', nameM: 'Pioniere',
    desc: 'Prima candidatura spontanea inviata.',
    shareText: 'Ho inviato la mia prima candidatura spontanea 🌱 A volte bisogna creare le opportunità, non aspettarle. Su Le faremo sapere traccio anche queste.',
    color: '#84CC16', bg: '#0f1a00',
    svg: '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="#84CC16"/><path d="M32 50V32" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M32 32C32 32 24 26 22 18c6 0 10 4 10 4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M32 38C32 38 40 32 42 24c-6 0-10 4-10 4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    check: (s) => s.spontanee >= 1
  },

]

// ─── MOTIVATIONAL PHRASES ────────────────────────────────────────

// --- MOTIVATIONAL PHRASES ---

export const MOTTOS_MATTINO = [
  'Buona giornata. Ogni candidatura inviata oggi è un passo avanti. 🌅',
  'Il mattino ha l\'oro in bocca — e tu hai il CV pronto. 💛',
  'Una nuova giornata, nuove opportunità da non lasciarsi sfuggire. 🚀',
  'Inizia la giornata con un obiettivo: una candidatura in più. 🎯',
  'Il mercato del lavoro non dorme — e nemmeno tu. Dai! ☀️',
  'Ogni mattina è un nuovo capitolo. Scrivilo bene. ✍️',
]

export const MOTTOS_POMERIGGIO = [
  'Stai costruendo qualcosa, candidatura dopo candidatura. 🧱',
  '"Le faremo sapere." — E tu tieni il conto. 📬',
  'Ogni no ti avvicina al sì giusto. ✨',
  'Non aspettare che facciano sapere — anticipa. 📞',
  'Organizzazione è metà della battaglia. L\'altra metà sei tu. 💜',
  'Il tuo prossimo lavoro esiste già. Lo stai trovando. 💡',
  'Ogni colloquio è pratica per il colloquio giusto. 🎙️',
  '"Valuteremo il tuo profilo." — Intanto tu vai avanti. 🚀',
]

export const MOTTOS_SERA = [
  'Brava giornata. Domani si ricomincia, più forti di oggi. 🌙',
  'Il silenzio delle aziende non è mai la parola fine. 🤐',
  'Resisti. Il mercato non sa ancora cosa si perde. 💪',
  'Ogni giorno che passa sei più vicin* alla risposta giusta. 🌟',
  'Riposati. Chi cerca lavoro con testa e cuore merita anche una pausa. 💜',
  'La ricerca di lavoro è una maratona, non uno sprint. Ottimo passo oggi. 🏃',
  'Ghostat*? Capita ai migliori. Vai avant*. 👻',
]

export const MOTTOS_MATTINO_EN = [
  'Good morning. Every application you send today is a step forward. 🌅',
  'The early bird catches the worm — and you have your CV ready. 💛',
  'A new day, new opportunities not to be missed. 🚀',
  'Start the day with a goal: one more application. 🎯',
  'The job market doesn\'t sleep — and neither do you. Go! ☀️',
  'Every morning is a new chapter. Write it well. ✍️',
]

export const MOTTOS_POMERIGGIO_EN = [
  'You are building something, application by application. 🧱',
  '"We\'ll let you know." — And you keep track. 📬',
  'Every no brings you closer to the right yes. ✨',
  'Don\'t wait for them to let you know — reach out first. 📞',
  'Organization is half the battle. You are the other half. 💜',
  'Your next job already exists. You are finding it. 💡',
  'Every interview is practice for the right one. 🎙️',
  '"We are evaluating your profile." — Meanwhile, you move forward. 🚀',
]

export const MOTTOS_SERA_EN = [
  'Good day. Tomorrow we start again, stronger than today. 🌙',
  'Company silence is never the final word. 🤐',
  'Hold on. The market doesn\'t know what it\'s missing yet. 💪',
  'Every passing day, you are closer to the right answer. 🌟',
  'Rest up. Those who job hunt with heart and soul deserve a break too. 💜',
  'Job hunting is a marathon, not a sprint. Great pace today. 🏃',
  'Ghosted? It happens to the best of us. Keep going. 👻',
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